import { loadDraft, saveDraft, clearDraft, saveTournament, uid } from '../storage.js';
import { h, icon, iconButton, titleBar, confirmDialog, navigate, FORMAT_LABELS } from '../ui.js';
import { generateClassicSchedule, generateTeamSchedule } from '../schedule.js';

const STEPS = ['Format', 'Players', 'Points', 'Settings'];

const RANK_MODES = [
  { value: 'points', label: 'Won points' },
  { value: 'wins', label: 'Number of wins' },
  { value: 'diff', label: 'Point difference' },
];

const TIE_BREAKS = [
  { value: 'wins', label: 'Number of wins' },
  { value: 'diff', label: 'Point difference' },
];

function newDraft() {
  return {
    step: 1,
    format: null,
    players: [],
    teams: [],
    points: { mode: 'perRound', perRound: '24', win: '3', tie: '1', loss: '0' },
    title: `Americano ${new Date().toLocaleDateString()}`,
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
      title: 'Add Tournament',
      right: [iconButton('close', 'Discard tournament', abort)],
    }),
    h('div', { class: 'stepper-wrap' }, stepper),
    body,
  );

  async function abort() {
    const confirmed = await confirmDialog({
      title: 'Discard tournament?',
      message: 'Do you really want to throw away the configured tournament?',
      okLabel: 'Discard',
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
      ...STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < draft.step ? 'done' : n === draft.step ? 'active' : '';
        return h('li', { class: `step ${state}` },
          h('span', { class: 'step-dot' }, n < draft.step ? icon('check') : String(n)),
          h('span', { class: 'step-label' }, label),
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

  function navButtons({ onBack, nextLabel = 'Next', onNext, nextEnabled = true, nextClass = 'btn-primary' }) {
    const next = h('button', { type: 'button', class: `btn ${nextClass}`, onClick: onNext, disabled: !nextEnabled }, nextLabel);
    const bar = h('div', { class: 'wizard-nav' },
      h('button', { type: 'button', class: 'btn btn-secondary', onClick: onBack }, 'Back'),
      next,
    );
    return { bar, next };
  }

  // ---------- Step 1: Format ----------

  function renderFormat() {
    draft.step = 1;
    const options = [
      { value: 'classic', description: 'Everyone partners with every other player exactly once. Partners change every round.' },
      { value: 'team', description: 'Fixed teams of two. Every team plays once against every other team.' },
    ];
    body.append(
      h('h2', { class: 'section-title' }, 'Select the tournament format'),
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
            h('span', { class: 'choice-title' }, FORMAT_LABELS[o.value]),
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
      draft.teams.push({ id: uid(), name: `Team ${draft.teams.length + 1}`, playerIds: [null, null] });
    }
    for (const team of draft.teams) {
      team.playerIds = team.playerIds.map((id) => (id && ids.has(id) ? id : null));
    }
  }

  function renderPlayers() {
    const nameInput = h('input', {
      type: 'text',
      class: 'input',
      placeholder: 'Player name',
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
        error.textContent = 'Please enter a name.';
        return;
      }
      if (draft.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        error.textContent = `"${name}" has already been added.`;
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
        hint.textContent = `The player count has to be divisible by 4 and at least 4. Currently: ${n}`;
        hint.className = 'hint hint-warning';
      } else if (!teamsValid()) {
        hint.textContent = 'Assign two players and a unique name to every team.';
        hint.className = 'hint hint-warning';
      } else {
        hint.textContent = `${n} players${draft.format === 'team' ? `, ${n / 2} teams` : ''}. Ready to continue.`;
        hint.className = 'hint hint-ok';
      }
      nav.next.disabled = !(playersValid() && teamsValid());
    }

    function renderTable() {
      if (draft.players.length === 0) {
        tableWrap.replaceChildren(h('p', { class: 'muted empty-inline' }, 'No players added yet.'));
        return;
      }
      tableWrap.replaceChildren(
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', { class: 'col-num' }, '#'), h('th', {}, 'Name'), h('th', { class: 'col-action' }, ''))),
          h('tbody', {},
            draft.players.map((p, i) =>
              h('tr', {},
                h('td', { class: 'col-num muted' }, String(i + 1)),
                h('td', {}, p.name),
                h('td', { class: 'col-action' }, iconButton('trash', `Remove ${p.name}`, () => removePlayer(p.id), 'icon-btn-danger')),
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
          'aria-label': `${team.name} player ${slot + 1}`,
          onChange: (e) => {
            team.playerIds[slot] = e.target.value || null;
            persist();
            renderTeams();
            updateState();
          },
        },
          h('option', { value: '', selected: !current }, '— select player —'),
          options.map((p) => h('option', { value: p.id, selected: p.id === current }, p.name)),
        );
      };

      teamsWrap.replaceChildren(
        h('div', { class: 'section-head' },
          h('h2', { class: 'section-title' }, 'Teams'),
          h('button', { type: 'button', class: 'btn btn-secondary btn-small', onClick: randomPairing }, icon('shuffle'), 'Random pairing'),
        ),
        h('div', { class: 'team-list' },
          draft.teams.map((team, i) =>
            h('div', { class: 'card team-row' },
              h('input', {
                type: 'text',
                class: 'input team-name',
                value: team.name,
                maxlength: '30',
                placeholder: `Team ${i + 1}`,
                'aria-label': `Name of team ${i + 1}`,
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
      h('h2', { class: 'section-title' }, 'Players'),
      h('div', { class: 'add-row' },
        nameInput,
        h('button', { type: 'button', class: 'btn btn-primary', onClick: addPlayer }, icon('plus'), 'Add'),
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
      return Number.isInteger(v) && v >= 1 && v <= 999 ? [] : ['Points per round must be a whole number between 1 and 999.'];
    }
    const invalid = ['win', 'tie', 'loss'].filter((k) => {
      const v = parseIntStrict(p[k]);
      return !(Number.isInteger(v) && v <= 999);
    });
    return invalid.length ? ['Win, tie and loss points must be whole numbers between 0 and 999.'] : [];
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
      h('h2', { class: 'section-title' }, 'Points'),
      h('div', { class: 'choice-list' },
        modeCard('perRound', 'Points per round', 'Both scores of a match always add up to this number.', [
          numberInput('perRound', 'Points per round (1–999)', 1),
        ]),
        modeCard('wtl', 'Win / Tie / Loss Points', 'Points granted to each player for the result of a match.', [
          numberInput('win', 'Win', 0),
          numberInput('tie', 'Tie', 0),
          numberInput('loss', 'Loss', 0),
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

    const radioGroup = (name, legend, options, key) =>
      h('fieldset', { class: 'fieldset' },
        h('legend', { class: 'field-label' }, legend),
        h('div', { class: 'segmented' },
          options.map((o) =>
            h('label', { class: 'segment' },
              h('input', {
                type: 'radio',
                name,
                value: o.value,
                checked: draft[key] === o.value,
                onChange: () => { draft[key] = o.value; persist(); },
              }),
              h('span', {}, o.label),
            ),
          ),
        ),
      );

    const updateState = () => {
      const valid = draft.title.trim().length > 0;
      error.textContent = valid ? '' : 'Please enter a title.';
      nav.next.disabled = !valid;
    };

    const nav = navButtons({
      onBack: () => goTo(3),
      nextLabel: 'Create tournament',
      onNext: create,
    });

    body.append(
      h('h2', { class: 'section-title' }, 'Settings'),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, 'Title'),
        h('input', {
          type: 'text',
          class: 'input',
          value: draft.title,
          maxlength: '60',
          placeholder: 'Tournament title',
          onInput: (e) => { draft.title = e.target.value; persist(); updateState(); },
        }),
      ),
      error,
      radioGroup('rank-mode', 'Rank mode', RANK_MODES, 'rankMode'),
      radioGroup('tie-break', 'Tie break', TIE_BREAKS, 'tieBreak'),
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
