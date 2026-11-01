import { computeLeaderboard, formatDiff } from './ranking.js';

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
    'Rank',
    isTeam ? 'Team' : 'Player',
    isTeam ? 'Members' : null,
    'Wins',
    'Ties',
    'Losses',
    'Points',
    'Point difference',
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

  const header = isTeam
    ? ['Round', 'Match', 'Team 1', 'Team 1 Player 1', 'Team 1 Player 2', 'Team 2', 'Team 2 Player 1', 'Team 2 Player 2', 'Score 1', 'Score 2']
    : ['Round', 'Match', 'Team 1 Player 1', 'Team 1 Player 2', 'Team 2 Player 1', 'Team 2 Player 2', 'Score 1', 'Score 2'];
  const rows = tournament.rounds.flatMap((round, r) =>
    round.map((match, m) => [
      r + 1,
      m + 1,
      ...(isTeam ? [teamNames.get(match.team1Id) || 'Team 1'] : []),
      ...players(match.side1),
      ...(isTeam ? [teamNames.get(match.team2Id) || 'Team 2'] : []),
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
    const points = `${r.wonPoints} ${r.wonPoints === 1 ? 'point' : 'points'}`;
    return `${r.rank}. ${name}: ${points}, ${r.wins}W ${r.ties}T ${r.losses}L, ${formatDiff(r.diff)}`;
  });
  return [tournament.title, '', ...lines].join('\n');
}

export function exportFileName(tournament, suffix) {
  const title = tournament.title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim() || 'tournament';
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
