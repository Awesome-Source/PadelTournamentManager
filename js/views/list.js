import { loadTournaments, loadTheme, saveTheme } from '../storage.js';
import { h, icon, iconButton, titleBar, navigate, applyTheme, FORMAT_LABELS } from '../ui.js';
import { allMatches, isFinished } from '../ranking.js';

export function renderList(root) {
  const themeButton = iconButton(loadTheme() === 'dark' ? 'sun' : 'moon', 'Toggle light / dark mode', () => {
    const next = loadTheme() === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next);
    themeButton.replaceChildren(icon(next === 'dark' ? 'sun' : 'moon'));
  });

  root.append(
    titleBar({
      title: 'Tournaments',
      right: [themeButton, iconButton('plus', 'Add tournament', () => navigate('#/new'), 'icon-btn-primary')],
    }),
  );

  const tournaments = loadTournaments().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const main = h('main', { class: 'content' });

  if (tournaments.length === 0) {
    main.append(
      h('div', { class: 'empty-state' },
        h('p', { class: 'empty-title' }, 'No tournaments yet'),
        h('p', { class: 'muted' }, 'Tap "+" to create your first tournament.'),
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
  return h('article', {
    class: 'card card-clickable tournament-card',
    tabindex: '0',
    role: 'button',
    onClick: open,
    onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
  },
    h('div', { class: 'tournament-card-head' },
      h('h2', { class: 'tournament-card-title' }, t.title),
      h('span', { class: `badge ${finished ? 'badge-finished' : 'badge-open'}` }, finished ? 'Finished' : 'Open'),
    ),
    h('div', { class: 'tournament-card-format' }, FORMAT_LABELS[t.format] || t.format),
    h('div', { class: 'tournament-card-stats' },
      h('span', {}, h('strong', {}, String(t.players.length)), ' players'),
      h('span', {}, h('strong', {}, String(allMatches(t).length)), ' matches'),
    ),
  );
}
