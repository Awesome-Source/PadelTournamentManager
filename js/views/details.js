import { getTournament, saveTournament, deleteTournament } from '../storage.js';
import { h, iconButton, icon, titleBar, confirmDialog, navigate, FORMAT_LABELS } from '../ui.js';
import { computeLeaderboard, isFinished, isRoundComplete, hasScore } from '../ranking.js';

const RANK_LABELS = { points: 'Won points', wins: 'Number of wins', diff: 'Point difference' };

export function renderDetails(root, id, initialTab) {
  const t = getTournament(id);
  if (!t) {
    root.append(
      titleBar({ title: 'Tournament', left: iconButton('back', 'Back to tournaments', () => navigate('#/')) }),
      h('main', { class: 'content' },
        h('div', { class: 'empty-state' },
          h('p', { class: 'empty-title' }, 'Tournament not found'),
          h('button', { type: 'button', class: 'btn btn-primary', onClick: () => navigate('#/') }, 'Back to tournaments'),
        ),
      ),
    );
    return;
  }

  const save = () => saveTournament(t);
  const playerNames = new Map(t.players.map((p) => [p.id, p.name]));
  const teamNames = new Map(t.teams.map((tm) => [tm.id, tm.name]));
  const tabKeys = ['lb', ...t.rounds.map((_, i) => `r${i + 1}`)];
  let activeTab = tabKeys.includes(initialTab) ? initialTab : 'lb';

  const stateBadge = h('span', { class: 'badge' });
  const tabButtons = new Map();
  const content = h('main', { class: 'content' });

  root.append(
    titleBar({
      title: t.title,
      left: iconButton('back', 'Back to tournaments', () => navigate('#/')),
      right: [stateBadge, iconButton('trash', 'Delete tournament', remove, 'icon-btn-danger')],
    }),
    h('nav', { class: 'tab-bar', role: 'tablist' },
      h('div', { class: 'tab-bar-inner' },
        tabKeys.map((key, i) => {
          const button = h('button', {
            type: 'button',
            class: 'tab',
            role: 'tab',
            onClick: () => selectTab(key),
          },
            key === 'lb' ? 'Leaderboard' : `R${i}`,
            key === 'lb' ? null : h('span', { class: 'tab-check' }, icon('check')),
          );
          tabButtons.set(key, button);
          return button;
        }),
      ),
    ),
    content,
  );

  async function remove() {
    const confirmed = await confirmDialog({
      title: 'Delete tournament?',
      message: `"${t.title}" and all its results will be deleted permanently.`,
      okLabel: 'Delete',
    });
    if (confirmed) {
      deleteTournament(t.id);
      navigate('#/');
    }
  }

  function selectTab(key) {
    activeTab = key;
    history.replaceState(null, '', `#/t/${encodeURIComponent(t.id)}/${key}`);
    renderTab();
    window.scrollTo(0, 0);
  }

  function updateIndicators() {
    const finished = isFinished(t);
    stateBadge.textContent = finished ? 'Finished' : 'Open';
    stateBadge.className = `badge ${finished ? 'badge-finished' : 'badge-open'}`;
    t.rounds.forEach((round, i) => {
      tabButtons.get(`r${i + 1}`).classList.toggle('complete', isRoundComplete(round));
    });
  }

  function renderTab() {
    for (const [key, button] of tabButtons) {
      const active = key === activeTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    }
    tabButtons.get(activeTab).scrollIntoView({ block: 'nearest', inline: 'nearest' });

    content.replaceChildren();
    if (activeTab === 'lb') renderLeaderboard();
    else renderRound(Number(activeTab.slice(1)) - 1);
  }

  // ---------- Leaderboard ----------

  function renderLeaderboard() {
    const rows = computeLeaderboard(t);
    const isTeam = t.format === 'team';
    const pointsLabel = t.points.mode === 'wtl' ? 'Pts' : 'Won';
    const highlight = (key) => (t.rankMode === key ? 'col-highlight' : '');
    const formatDiff = (d) => (d > 0 ? `+${d}` : String(d));
    const played = t.rounds.flat().filter(hasScore).length;
    const total = t.rounds.flat().length;

    content.append(
      h('div', { class: 'leaderboard-meta' },
        h('span', {}, FORMAT_LABELS[t.format]),
        h('span', {}, `${played} / ${total} matches played`),
      ),
      h('div', { class: 'table-wrap card' },
        h('table', { class: 'table leaderboard' },
          h('thead', {},
            h('tr', {},
              h('th', { class: 'col-num' }, '#'),
              h('th', {}, isTeam ? 'Team' : 'Player'),
              h('th', { class: 'col-stat', title: 'Matches played' }, 'P'),
              h('th', { class: `col-stat ${highlight('wins')}`, title: 'Wins' }, 'W'),
              h('th', { class: 'col-stat', title: 'Ties' }, 'T'),
              h('th', { class: 'col-stat', title: 'Losses' }, 'L'),
              h('th', { class: `col-stat ${highlight('points')}`, title: t.points.mode === 'wtl' ? 'Points from wins / ties / losses' : 'Won points' }, pointsLabel),
              h('th', { class: `col-stat ${highlight('diff')}`, title: 'Point difference' }, '+/−'),
            ),
          ),
          h('tbody', {},
            rows.map((r) =>
              h('tr', { class: r.rank <= 3 && r.played > 0 ? `podium podium-${r.rank}` : '' },
                h('td', { class: 'col-num' }, h('span', { class: 'rank' }, String(r.rank))),
                h('td', {},
                  h('div', { class: 'lb-name' }, r.name),
                  isTeam ? h('div', { class: 'lb-members muted' }, r.members.join(' & ')) : null,
                ),
                h('td', { class: 'col-stat' }, String(r.played)),
                h('td', { class: `col-stat ${highlight('wins')}` }, String(r.wins)),
                h('td', { class: 'col-stat' }, String(r.ties)),
                h('td', { class: 'col-stat' }, String(r.losses)),
                h('td', { class: `col-stat ${highlight('points')}` }, String(r.wonPoints)),
                h('td', { class: `col-stat ${highlight('diff')}` }, formatDiff(r.diff)),
              ),
            ),
          ),
        ),
      ),
      h('p', { class: 'muted small leaderboard-note' },
        `Ranked by ${RANK_LABELS[t.rankMode]}, tie break: ${RANK_LABELS[t.tieBreak]}. `,
        t.points.mode === 'wtl'
          ? `Win ${t.points.win} · Tie ${t.points.tie} · Loss ${t.points.loss} points.`
          : `${t.points.perRound} points per round.`,
      ),
    );
  }

  // ---------- Rounds ----------

  function renderRound(index) {
    const round = t.rounds[index];
    content.append(
      h('div', { class: 'round-head' },
        h('h2', { class: 'section-title' }, `Round ${index + 1}`),
        h('span', { class: 'muted small' }, `${round.length} ${round.length === 1 ? 'match' : 'matches'}`),
      ),
      h('div', { class: 'card-list' }, round.map((match, i) => matchCard(match, i))),
    );
  }

  function matchCard(match, index) {
    const isTeam = t.format === 'team';
    const perRound = t.points.mode === 'perRound' ? t.points.perRound : null;
    const name1 = isTeam ? teamNames.get(match.team1Id) || 'Team 1' : 'Team 1';
    const name2 = isTeam ? teamNames.get(match.team2Id) || 'Team 2' : 'Team 2';

    const scoreInput = (key, label) =>
      h('input', {
        type: 'number',
        class: 'score-input',
        inputmode: 'numeric',
        min: '0',
        max: perRound !== null ? String(perRound) : '999',
        step: '1',
        placeholder: '-',
        'aria-label': label,
        value: Number.isInteger(match[key]) ? String(match[key]) : '',
        onFocus: (e) => e.target.select(),
        onInput: () => onScoreInput(key),
      });

    const input1 = scoreInput('score1', `Score ${name1}`);
    const input2 = scoreInput('score2', `Score ${name2}`);
    const card = h('article', { class: 'card match-card' });

    function onScoreInput(key) {
      const input = key === 'score1' ? input1 : input2;
      const other = key === 'score1' ? input2 : input1;
      const otherKey = key === 'score1' ? 'score2' : 'score1';
      const raw = input.value.trim();
      const parsed = /^\d+$/.test(raw) ? Number(raw) : NaN;

      if (Number.isNaN(parsed)) {
        match[key] = null;
        if (perRound !== null && raw === '') {
          match[otherKey] = null;
          other.value = '';
        }
      } else {
        let value = parsed;
        const max = perRound !== null ? perRound : 999;
        if (value > max) {
          value = max;
          input.value = String(value);
        }
        match[key] = value;
        if (perRound !== null) {
          match[otherKey] = perRound - value;
          other.value = String(perRound - value);
        }
      }

      save();
      updateCard();
      updateIndicators();
    }

    function updateCard() {
      const complete = hasScore(match);
      card.classList.toggle('complete', complete);
      side1Name.classList.toggle('winner', complete && match.score1 > match.score2);
      side2Name.classList.toggle('winner', complete && match.score2 > match.score1);
    }

    const playerList = (ids, align) =>
      h('div', { class: `match-players ${align}` }, ids.map((pid) => h('div', { class: 'match-player' }, playerNames.get(pid) || '?')));

    const side1Name = h('div', { class: 'match-team left' }, name1);
    const side2Name = h('div', { class: 'match-team right' }, name2);

    card.append(
      h('div', { class: 'match-label muted small' }, `Match ${index + 1}`),
      h('div', { class: 'match-header match-grid' },
        side1Name,
        h('div', { class: 'match-score' }, input1, h('span', { class: 'score-sep' }, ':'), input2),
        side2Name,
      ),
      h('div', { class: 'match-body match-grid' },
        playerList(match.side1, 'left'),
        h('div', { class: 'match-vs' }, 'VS'),
        playerList(match.side2, 'right'),
      ),
    );
    updateCard();
    return card;
  }

  updateIndicators();
  renderTab();
}
