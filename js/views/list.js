import { loadTournaments } from '../storage.js';
import { tr } from '../i18n.js';
import { h, iconButton, titleBar, navigate } from '../ui.js';
import { allMatches, isFinished } from '../ranking.js';

export function renderList(root) {
  root.append(
    titleBar({
      title: tr('list.title'),
      right: [
        iconButton('gear', tr('list.settings'), () => navigate('#/settings')),
        iconButton('plus', tr('list.addTournament'), () => navigate('#/new'), 'icon-btn-primary'),
      ],
    }),
  );

  const tournaments = loadTournaments().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const main = h('main', { class: 'content' });

  if (tournaments.length === 0) {
    main.append(
      h('div', { class: 'empty-state' },
        h('p', { class: 'empty-title' }, tr('list.emptyTitle')),
        h('p', { class: 'muted' }, tr('list.emptyHint')),
      ),
    );
  } else {
    main.append(h('div', { class: 'card-list' }, tournaments.map(tournamentCard)));
  }
  root.append(main);
}

function tournamentCard(t) {
  const finished = isFinished(t);
  const open = () => navigate(`#/t/${encodeURIComponent(t.id)}/lb`);
  const playerCount = t.players.length;
  const matchCount = allMatches(t).length;
  return h('article', {
    class: 'card card-clickable tournament-card',
    tabindex: '0',
    role: 'button',
    onClick: open,
    onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
  },
    h('div', { class: 'tournament-card-head' },
      h('h2', { class: 'tournament-card-title' }, t.title),
      h('span', { class: `badge ${finished ? 'badge-finished' : 'badge-open'}` }, tr(finished ? 'status.finished' : 'status.open')),
    ),
    h('div', { class: 'tournament-card-format' }, tr(`format.${t.format}`)),
    h('div', { class: 'tournament-card-stats' },
      h('span', {}, h('strong', {}, String(playerCount)), ' ', tr('list.players', { count: playerCount })),
      h('span', {}, h('strong', {}, String(matchCount)), ' ', tr('list.matches', { count: matchCount })),
    ),
  );
}
