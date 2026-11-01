import { loadDraft, saveDraft, clearDraft, saveTournament, uid } from '../storage.js';
import { currentLanguage, tr } from '../i18n.js';
import { h, icon, iconButton, titleBar, confirmDialog, navigate, radioGroup } from '../ui.js';
import { generateClassicSchedule, generateTeamSchedule } from '../schedule.js';

const STEPS = ['wizard.stepFormat', 'wizard.stepPlayers', 'wizard.stepPoints', 'wizard.stepSettings'];

const RANK_MODES = ['points', 'wins', 'diff'];

const TIE_BREAKS = ['wins', 'diff'];

function newDraft() {
  return {
    step: 1,
    format: null,
    players: [],
    teams: [],
    points: { mode: 'perRound', perRound: '32', win: '3', tie: '1', loss: '0' },
    title: tr('wizard.defaultTitle', { date: new Date().toLocaleDateString(currentLanguage()) }),
    rankMode: 'points',
    tieBreak: 'diff',
  };
}

function parseIntStrict(value) {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) ? Number(text) : NaN;
}

export function renderWizard(root) {
  const draft = loadDraft() || newDraft();
  const persist = () => saveDraft(draft);
  persist();

  const stepper = h('ol', { class: 'stepper' });
  const body = h('main', { class: 'content wizard' });

  root.append(
    titleBar({
      title: tr('wizard.title'),
      right: [iconButton('close', tr('wizard.discard'), abort)],
    }),
    h('div', { class: 'stepper-wrap' }, stepper),
    body,
  );

  async function abort() {
    const confirmed = await confirmDialog({
      title: tr('wizard.discardTitle'),
      message: tr('wizard.discardMessage'),
      okLabel: tr('wizard.discardConfirm'),
    });
    if (confirmed) {
      clearDraft();
      navigate('#/');
    }
  }

  function goTo(step) {
    draft.step = step;
    persist();
    renderStep();
    window.scrollTo(0, 0);
  }

  function renderStepper() {
    stepper.replaceChildren(
      ...STEPS.map((key, i) => {
        const n = i + 1;
        const state = n < draft.step ? 'done' : n === draft.step ? 'active' : '';
        return h('li', { class: `step ${state}` },
          h('span', { class: 'step-dot' }, n < draft.step ? icon('check') : String(n)),
          h('span', { class: 'step-label' }, tr(key)),
        );
      }),
    );
  }

  function renderStep() {
    renderStepper();
    body.replaceChildren();
    if (draft.step === 2 && draft.format) renderPlayers();
    else if (draft.step === 3 && draft.format) renderPoints();
    else if (draft.step === 4 && draft.format) renderSettings();
    else renderFormat();
  }

  function navButtons({ onBack, nextLabel = tr('common.next'), onNext, nextEnabled = true, nextClass = 'btn-primary' }) {
    const next = h('button', { type: 'button', class: `btn ${nextClass}`, onClick: onNext, disabled: !nextEnabled }, nextLabel);
    const bar = h('div', { class: 'wizard-nav' },
      h('button', { type: 'button', class: 'btn btn-secondary', onClick: onBack }, tr('common.back')),
      next,
    );
    return { bar, next };
  }

  // ---------- Step 1: Format ----------

  function renderFormat() {
    draft.step = 1;
    const options = [
      { value: 'classic', description: tr('wizard.formatClassicDescription') },
      { value: 'team', description: tr('wizard.formatTeamDescription') },
    ];
    body.append(
      h('h2', { class: 'section-title' }, tr('wizard.formatTitle')),
      h('div', { class: 'choice-list' },
        options.map((o) =>
          h('button', {
            type: 'button',
            class: `choice-card ${draft.format === o.value ? 'selected' : ''}`,
            onClick: () => {
              if (draft.format !== o.value) draft.teams = [];
              draft.format = o.value;
              if (o.value === 'team') syncTeams();
              goTo(2);
            },
          },
            h('span', { class: 'choice-title' }, tr(`format.${o.value}`)),
            h('span', { class: 'choice-description' }, o.description),
          ),
        ),
      ),
    );
  }

  // ---------- Step 2: Players ----------

  function playersValid() {
    const n = draft.players.length;
    return n >= 4 && n % 4 === 0;
  }

  function teamsValid() {
    if (draft.format !== 'team') return true;
    const names = draft.teams.map((t) => t.name.trim().toLowerCase());
    return draft.teams.length === draft.players.length / 2
      && draft.teams.every((t) => t.name.trim() && t.playerIds[0] && t.playerIds[1])
      && new Set(names).size === names.length;
  }

  /** Keeps the team list in line with the player list (count and valid assignments). */
  function syncTeams() {
    const ids = new Set(draft.players.map((p) => p.id));
    const count = Math.floor(draft.players.length / 2);
    draft.teams = draft.teams.slice(0, count);
    while (draft.teams.length < count) {
      draft.teams.push({ id: uid(), name: tr('common.teamNumber', { number: draft.teams.length + 1 }), playerIds: [null, null] });
    }
    for (const team of draft.teams) {
      team.playerIds = team.playerIds.map((id) => (id && ids.has(id) ? id : null));
    }
  }

  function renderPlayers() {
    const nameInput = h('input', {
      type: 'text',
      class: 'input',
      placeholder: tr('wizard.playerName'),
      maxlength: '40',
      autocomplete: 'off',
      onKeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } },
      onInput: () => { error.textContent = ''; },
    });
    const error = h('p', { class: 'field-error' });
    const hint = h('p', { class: 'hint' });
    const tableWrap = h('div');
    const teamsWrap = h('div');

    function addPlayer() {
      const name = nameInput.value.trim();
      if (!name) {
        error.textContent = tr('wizard.nameRequired');
        return;
      }
      if (draft.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        error.textContent = tr('wizard.nameDuplicate', { name });
        return;
      }
      draft.players.push({ id: uid(), name });
      nameInput.value = '';
      error.textContent = '';
      refresh();
      nameInput.focus();
    }

    function removePlayer(id) {
      draft.players = draft.players.filter((p) => p.id !== id);
      refresh();
    }

    function refresh() {
      if (draft.format === 'team') syncTeams();
      persist();
      renderTable();
      renderTeams();
      updateState();
    }

    function updateState() {
      const n = draft.players.length;
      if (!playersValid()) {
        hint.textContent = tr('wizard.playerCountInvalid', { count: n });
        hint.className = 'hint hint-warning';
      } else if (!teamsValid()) {
        hint.textContent = tr('wizard.teamsInvalid');
        hint.className = 'hint hint-warning';
      } else {
        hint.textContent = draft.format === 'team'
          ? tr('wizard.readyTeam', { players: n, teams: n / 2 })
          : tr('wizard.readyClassic', { players: n });
        hint.className = 'hint hint-ok';
      }
      nav.next.disabled = !(playersValid() && teamsValid());
    }

    function renderTable() {
      if (draft.players.length === 0) {
        tableWrap.replaceChildren(h('p', { class: 'muted empty-inline' }, tr('wizard.noPlayers')));
        return;
      }
      tableWrap.replaceChildren(
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', { class: 'col-num' }, '#'), h('th', {}, tr('wizard.nameColumn')), h('th', { class: 'col-action' }, ''))),
          h('tbody', {},
            draft.players.map((p, i) =>
              h('tr', {},
                h('td', { class: 'col-num muted' }, String(i + 1)),
                h('td', {}, p.name),
                h('td', { class: 'col-action' }, iconButton('trash', tr('wizard.removePlayer', { name: p.name }), () => removePlayer(p.id), 'icon-btn-danger')),
              ),
            ),
          ),
        ),
      );
    }

    function renderTeams() {
      if (draft.format !== 'team') return;
      if (draft.teams.length === 0) {
        teamsWrap.replaceChildren();
        return;
      }
      const assigned = new Set(draft.teams.flatMap((t) => t.playerIds).filter(Boolean));

      const playerSelect = (team, slot) => {
        const current = team.playerIds[slot];
        const options = draft.players.filter((p) => p.id === current || !assigned.has(p.id));
        return h('select', {
          class: 'input select',
          'aria-label': tr('wizard.teamPlayerLabel', { team: team.name, number: slot + 1 }),
          onChange: (e) => {
            team.playerIds[slot] = e.target.value || null;
            persist();
            renderTeams();
            updateState();
          },
        },
          h('option', { value: '', selected: !current }, tr('wizard.selectPlayer')),
          options.map((p) => h('option', { value: p.id, selected: p.id === current }, p.name)),
        );
      };

      teamsWrap.replaceChildren(
        h('div', { class: 'section-head' },
          h('h2', { class: 'section-title' }, tr('wizard.teamsTitle')),
          h('button', { type: 'button', class: 'btn btn-secondary btn-small', onClick: randomPairing }, icon('shuffle'), tr('wizard.randomPairing')),
        ),
        h('div', { class: 'team-list' },
          draft.teams.map((team, i) =>
            h('div', { class: 'card team-row' },
              h('input', {
                type: 'text',
                class: 'input team-name',
                value: team.name,
                maxlength: '30',
                placeholder: tr('common.teamNumber', { number: i + 1 }),
                'aria-label': tr('wizard.teamNameLabel', { number: i + 1 }),
                onInput: (e) => {
                  team.name = e.target.value;
                  persist();
                  updateState();
                },
              }),
              h('div', { class: 'team-players' }, playerSelect(team, 0), playerSelect(team, 1)),
            ),
          ),
        ),
      );
    }

    function randomPairing() {
      const ids = draft.players.map((p) => p.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      draft.teams.forEach((team, i) => { team.playerIds = [ids[2 * i] || null, ids[2 * i + 1] || null]; });
      persist();
      renderTeams();
      updateState();
    }

    const nav = navButtons({
      onBack: () => goTo(1),
      onNext: () => { if (playersValid() && teamsValid()) goTo(3); },
    });

    body.append(
      h('h2', { class: 'section-title' }, tr('wizard.playersTitle')),
      h('div', { class: 'add-row' },
        nameInput,
        h('button', { type: 'button', class: 'btn btn-primary', onClick: addPlayer }, icon('plus'), tr('common.add')),
      ),
      error,
      tableWrap,
      hint,
      teamsWrap,
      nav.bar,
    );

    if (draft.format === 'team') syncTeams();
    renderTable();
    renderTeams();
    updateState();
    nameInput.focus();
  }

  // ---------- Step 3: Points ----------

  function pointsErrors() {
    const p = draft.points;
    if (p.mode === 'perRound') {
      const v = parseIntStrict(p.perRound);
      return Number.isInteger(v) && v >= 1 && v <= 999 ? [] : [tr('wizard.perRoundInvalid')];
    }
    const invalid = ['win', 'tie', 'loss'].filter((k) => {
      const v = parseIntStrict(p[k]);
      return !(Number.isInteger(v) && v <= 999);
    });
    return invalid.length ? [tr('wizard.wtlInvalid')] : [];
  }

  function renderPoints() {
    const error = h('p', { class: 'field-error' });
    const cards = {};

    const numberInput = (key, label, min) =>
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, label),
        h('input', {
          type: 'number',
          class: 'input',
          inputmode: 'numeric',
          min: String(min),
          max: '999',
          step: '1',
          value: draft.points[key],
          onFocus: () => selectMode(key === 'perRound' ? 'perRound' : 'wtl'),
          onInput: (e) => {
            draft.points[key] = e.target.value;
            persist();
            updateState();
          },
        }),
      );

    function selectMode(mode) {
      if (draft.points.mode === mode) return;
      draft.points.mode = mode;
      persist();
      for (const [m, card] of Object.entries(cards)) {
        card.classList.toggle('selected', m === mode);
        card.querySelector('input[type="radio"]').checked = m === mode;
      }
      updateState();
    }

    function updateState() {
      const errors = pointsErrors();
      error.textContent = errors.join(' ');
      nav.next.disabled = errors.length > 0;
    }

    const modeCard = (mode, title, description, inputs) => {
      cards[mode] = h('div', { class: `choice-card choice-card-static ${draft.points.mode === mode ? 'selected' : ''}`, onClick: () => selectMode(mode) },
        h('label', { class: 'radio-row' },
          h('input', { type: 'radio', name: 'points-mode', value: mode, checked: draft.points.mode === mode, onChange: () => selectMode(mode) }),
          h('span', { class: 'choice-title' }, title),
        ),
        h('span', { class: 'choice-description' }, description),
        h('div', { class: 'field-row' }, inputs),
      );
      return cards[mode];
    };

    const nav = navButtons({
      onBack: () => goTo(2),
      onNext: () => { if (pointsErrors().length === 0) goTo(4); },
    });

    body.append(
      h('h2', { class: 'section-title' }, tr('wizard.pointsTitle')),
      h('div', { class: 'choice-list' },
        modeCard('perRound', tr('wizard.perRoundTitle'), tr('wizard.perRoundDescription'), [
          numberInput('perRound', tr('wizard.perRoundInput'), 1),
        ]),
        modeCard('wtl', tr('wizard.wtlTitle'), tr('wizard.wtlDescription'), [
          numberInput('win', tr('wizard.win'), 0),
          numberInput('tie', tr('wizard.tie'), 0),
          numberInput('loss', tr('wizard.loss'), 0),
        ]),
      ),
      error,
      nav.bar,
    );
    updateState();
  }

  // ---------- Step 4: Settings ----------

  function renderSettings() {
    const error = h('p', { class: 'field-error' });

    const rankGroup = (name, legend, modes, key) =>
      radioGroup({
        name,
        legend,
        options: modes.map((value) => ({ value, label: tr(`rank.${value}`) })),
        value: draft[key],
        onChange: (value) => { draft[key] = value; persist(); },
      });

    const updateState = () => {
      const valid = draft.title.trim().length > 0;
      error.textContent = valid ? '' : tr('wizard.titleRequired');
      nav.next.disabled = !valid;
    };

    const nav = navButtons({
      onBack: () => goTo(3),
      nextLabel: tr('wizard.create'),
      onNext: create,
    });

    body.append(
      h('h2', { class: 'section-title' }, tr('wizard.settingsTitle')),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, tr('wizard.titleLabel')),
        h('input', {
          type: 'text',
          class: 'input',
          value: draft.title,
          maxlength: '60',
          placeholder: tr('wizard.titlePlaceholder'),
          onInput: (e) => { draft.title = e.target.value; persist(); updateState(); },
        }),
      ),
      error,
      rankGroup('rank-mode', tr('wizard.rankMode'), RANK_MODES, 'rankMode'),
      rankGroup('tie-break', tr('wizard.tieBreak'), TIE_BREAKS, 'tieBreak'),
      nav.bar,
    );
    updateState();
  }

  function create() {
    if (!draft.title.trim() || !playersValid() || !teamsValid() || pointsErrors().length) return;

    const p = draft.points;
    const points = p.mode === 'perRound'
      ? { mode: 'perRound', perRound: parseIntStrict(p.perRound) }
      : { mode: 'wtl', win: parseIntStrict(p.win), tie: parseIntStrict(p.tie), loss: parseIntStrict(p.loss) };

    const players = draft.players.map((pl) => ({ id: pl.id, name: pl.name }));
    let teams = [];
    let rounds;

    if (draft.format === 'team') {
      teams = draft.teams.map((t) => ({ id: t.id, name: t.name.trim(), playerIds: t.playerIds.slice() }));
      const teamById = new Map(teams.map((t) => [t.id, t]));
      rounds = generateTeamSchedule(teams.map((t) => t.id)).map((round) =>
        round.map((m) => ({
          id: uid(),
          team1Id: m.team1Id,
          team2Id: m.team2Id,
          side1: teamById.get(m.team1Id).playerIds.slice(),
          side2: teamById.get(m.team2Id).playerIds.slice(),
          score1: null,
          score2: null,
        })),
      );
    } else {
      rounds = generateClassicSchedule(players.map((pl) => pl.id)).map((round) =>
        round.map((m) => ({ id: uid(), side1: m.side1, side2: m.side2, score1: null, score2: null })),
      );
    }

    saveTournament({
      id: uid(),
      title: draft.title.trim(),
      createdAt: Date.now(),
      format: draft.format,
      players,
      teams,
      points,
      rankMode: draft.rankMode,
      tieBreak: draft.tieBreak,
      rounds,
    });
    clearDraft();
    navigate('#/');
  }

  renderStep();
}
