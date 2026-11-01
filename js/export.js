import { computeLeaderboard, formatDiff } from './ranking.js';
import { tr } from './i18n.js';

const CSV_MIME = 'text/csv;charset=utf-8';
// Lets Excel detect UTF-8, so names with non-ASCII characters stay intact.
const BOM = String.fromCharCode(0xfeff);

function csvCell(value) {
  if (typeof value !== 'string') return String(value);
  // Spreadsheets would run a name such as "=1+1" as a formula, so it is forced to text.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  return BOM + rows.map((row) => row.map(csvCell).join(';')).join('\r\n') + '\r\n';
}

export function leaderboardCsv(tournament) {
  const isTeam = tournament.format === 'team';
  const header = [
    tr('csv.rank'),
    tr(isTeam ? 'common.team' : 'common.player'),
    isTeam ? tr('csv.members') : null,
    tr('csv.wins'),
    tr('csv.ties'),
    tr('csv.losses'),
    tr('csv.points'),
    tr('csv.diff'),
  ];
  const rows = computeLeaderboard(tournament).map((r) => [
    r.rank,
    r.name,
    isTeam ? r.members.join(' & ') : null,
    r.wins,
    r.ties,
    r.losses,
    r.wonPoints,
    r.diff,
  ]);
  return toCsv([header, ...rows].map((row) => row.filter((cell) => cell !== null)));
}

export function matchesCsv(tournament) {
  const isTeam = tournament.format === 'team';
  const playerNames = new Map(tournament.players.map((p) => [p.id, p.name]));
  const teamNames = new Map(tournament.teams.map((t) => [t.id, t.name]));
  const players = (ids) => ids.map((id) => playerNames.get(id) || '?');

  const teamNumber = (number) => tr('common.teamNumber', { number });
  const teamPlayer = (team, player) => tr('csv.teamPlayer', { team, player });
  const header = [
    tr('csv.round'),
    tr('csv.match'),
    ...(isTeam ? [teamNumber(1)] : []),
    teamPlayer(1, 1),
    teamPlayer(1, 2),
    ...(isTeam ? [teamNumber(2)] : []),
    teamPlayer(2, 1),
    teamPlayer(2, 2),
    tr('csv.score', { number: 1 }),
    tr('csv.score', { number: 2 }),
  ];
  const rows = tournament.rounds.flatMap((round, r) =>
    round.map((match, m) => [
      r + 1,
      m + 1,
      ...(isTeam ? [teamNames.get(match.team1Id) || teamNumber(1)] : []),
      ...players(match.side1),
      ...(isTeam ? [teamNames.get(match.team2Id) || teamNumber(2)] : []),
      ...players(match.side2),
      match.score1,
      match.score2,
    ]),
  );
  return toCsv([header, ...rows]);
}

/**
 * Plain text for pasting into a messenger. Uses one line per entry instead of
 * aligned columns, because messengers use proportional fonts and wrap long lines.
 */
export function leaderboardText(tournament) {
  const lines = computeLeaderboard(tournament).map((r) => {
    const name = r.members.length > 0 ? `${r.name} (${r.members.join(' & ')})` : r.name;
    const points = tr('results.points', { count: r.wonPoints });
    const record = tr('results.record', { wins: r.wins, ties: r.ties, losses: r.losses });
    return `${r.rank}. ${name}: ${points}, ${record}, ${formatDiff(r.diff)}`;
  });
  return [tournament.title, '', ...lines].join('\n');
}

export function exportFileName(tournament, suffix) {
  const title = tournament.title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim() || tr('export.fileFallback');
  return `${title} - ${suffix}.csv`;
}

export function downloadCsv(fileName, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: CSV_MIME }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
