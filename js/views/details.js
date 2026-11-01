import { getTournament, saveTournament, deleteTournament } from '../storage.js';
import { tr } from '../i18n.js';
import { h, appendChildren, iconButton, icon, titleBar, confirmDialog, navigate } from '../ui.js';
import { computeLeaderboard, formatDiff, isFinished, isRoundComplete, hasScore } from '../ranking.js';
import { leaderboardCsv, matchesCsv, leaderboardText, exportFileName, downloadCsv } from '../export.js';

export function renderDetails(root, id, initialTab) {
  const t = getTournament(id);
  if (!t) {
    root.append(
      titleBar({ title: tr('details.fallbackTitle'), left: iconButton('back', tr('common.backToTournaments'), () => navigate('#/')) }),
      h('main', { class: 'content' },
        h('div', { class: 'empty-state' },
          h('p', { class: 'empty-title' }, tr('details.notFound')),
          h('button', { type: 'button', class: 'btn btn-primary', onClick: () => navigate('#/') }, tr('common.backToTournaments')),
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
      left: iconButton('back', tr('common.backToTournaments'), () => navigate('#/')),
      right: [stateBadge, iconButton('trash', tr('details.delete'), remove, 'icon-btn-danger')],
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
            key === 'lb' ? tr('details.leaderboardTab') : tr('details.roundTab', { number: i }),
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
      title: tr('details.deleteTitle'),
      message: tr('details.deleteMessage', { title: t.title }),
      okLabel: tr('details.deleteConfirm'),
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
    stateBadge.textContent = tr(finished ? 'status.finished' : 'status.open');
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
    const highlight = (key) => (t.rankMode === key ? 'col-highlight' : '');
    const played = t.rounds.flat().filter(hasScore).length;
    const total = t.rounds.flat().length;

    appendChildren(content, [
      isFinished(t) ? winnerBanner(rows) : null,
      h('div', { class: 'leaderboard-meta' },
        h('span', {}, tr(`format.${t.format}`)),
        h('span', {}, tr('details.matchesPlayed', { played, total })),
      ),
      h('div', { class: 'table-wrap card' },
        h('table', { class: 'table leaderboard' },
          h('thead', {},
            h('tr', {},
              h('th', { class: 'col-num' }, '#'),
              h('th', {}, tr(isTeam ? 'common.team' : 'common.player')),
              h('th', { class: `col-stat ${highlight('wins')}`, title: tr('details.columnRecordHint') }, tr('details.columnRecord')),
              h('th', { class: `col-stat ${highlight('points')}`, title: t.points.mode === 'wtl' ? tr('details.columnPointsWtlHint') : tr('rank.points') }, tr('details.columnPoints')),
              h('th', { class: `col-stat ${highlight('diff')}`, title: tr('rank.diff') }, tr('details.columnDiff')),
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
                h('td', { class: `col-stat ${highlight('wins')}` }, `${r.wins}/${r.ties}/${r.losses}`),
                h('td', { class: `col-stat ${highlight('points')}` }, String(r.wonPoints)),
                h('td', { class: `col-stat ${highlight('diff')}` }, formatDiff(r.diff)),
              ),
            ),
          ),
        ),
      ),
      h('p', { class: 'muted small leaderboard-note' },
        tr('details.rankingNote', { rank: tr(`rank.${t.rankMode}`), tieBreak: tr(`rank.${t.tieBreak}`) }),
        t.points.mode === 'wtl'
          ? tr('details.pointsNoteWtl', { win: t.points.win, tie: t.points.tie, loss: t.points.loss })
          : tr('details.pointsNotePerRound', { perRound: t.points.perRound }),
      ),
      isFinished(t) ? exportActions() : null,
    ]);
  }

  function winnerBanner(rows) {
    // Rows only share rank 1 if all ranking metrics are equal, so the stats hold for every winner.
    const winners = rows.filter((r) => r.rank === 1);
    const [{ wonPoints, wins, ties, losses }] = winners;
    const tied = winners.length > 1;

    return h('section', { class: 'winner-banner' },
      h('img', { class: 'winner-trophy', src: 'assets/trophy.svg', alt: '', width: 128, height: 128 }),
      h('p', { class: 'winner-label' }, tr(tied ? 'details.jointWinners' : 'details.winner')),
      h('h2', { class: 'winner-name' }, tr('details.congratulations', { names: winners.map((r) => r.name).join(' & ') })),
      t.format === 'team'
        ? winners.map((r) =>
            h('p', { class: 'muted small' }, `${tied ? `${r.name}: ` : ''}${r.members.join(' & ')}`))
        : null,
      h('p', { class: 'winner-stats' },
        `${tr('results.points', { count: wonPoints })} · ${tr('results.record', { wins, ties, losses })}`),
    );
  }

  function exportActions() {
    const actionButton = (iconName, label, onClick) =>
      h('button', { type: 'button', class: 'btn btn-secondary btn-small', onClick }, icon(iconName), label);

    const copyLabel = h('span', {}, tr('export.copy'));
    let resetTimer;
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(leaderboardText(t));
        copyLabel.textContent = tr('export.copied');
      } catch {
        copyLabel.textContent = tr('export.copyFailed');
      }
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { copyLabel.textContent = tr('export.copy'); }, 2000);
    };

    return h('div', { class: 'leaderboard-export' },
      actionButton('download', tr('export.leaderboardCsv'), () => downloadCsv(exportFileName(t, tr('export.fileLeaderboard')), leaderboardCsv(t))),
      actionButton('download', tr('export.matchesCsv'), () => downloadCsv(exportFileName(t, tr('export.fileMatches')), matchesCsv(t))),
      actionButton('copy', copyLabel, copy),
    );
  }

  // ---------- Rounds ----------

  function renderRound(index) {
    const round = t.rounds[index];
    content.append(
      h('div', { class: 'round-head' },
        h('h2', { class: 'section-title' }, tr('details.round', { number: index + 1 })),
        h('span', { class: 'muted small' }, tr('details.matchCount', { count: round.length })),
      ),
      h('div', { class: 'card-list' }, round.map((match, i) => matchCard(match, i))),
    );
  }

  function matchCard(match, index) {
    const isTeam = t.format === 'team';
    const perRound = t.points.mode === 'perRound' ? t.points.perRound : null;
    const fallback1 = tr('common.teamNumber', { number: 1 });
    const fallback2 = tr('common.teamNumber', { number: 2 });
    const name1 = isTeam ? teamNames.get(match.team1Id) || fallback1 : fallback1;
    const name2 = isTeam ? teamNames.get(match.team2Id) || fallback2 : fallback2;

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

    const input1 = scoreInput('score1', tr('details.scoreLabel', { name: name1 }));
    const input2 = scoreInput('score2', tr('details.scoreLabel', { name: name2 }));
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
      h('div', { class: 'match-label muted small' }, tr('details.match', { number: index + 1 })),
      h('div', { class: 'match-header match-grid' },
        side1Name,
        h('div', { class: 'match-score' }, input1, h('span', { class: 'score-sep' }, ':'), input2),
        side2Name,
      ),
      h('div', { class: 'match-body match-grid' },
        playerList(match.side1, 'left'),
        h('div', { class: 'match-vs' }, tr('details.versus')),
        playerList(match.side2, 'right'),
      ),
    );
    updateCard();
    return card;
  }

  updateIndicators();
  renderTab();
}
