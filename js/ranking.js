export function hasScore(match) {
  return Number.isInteger(match.score1) && Number.isInteger(match.score2);
}

export function allMatches(tournament) {
  return tournament.rounds.flat();
}

export function isRoundComplete(round) {
  return round.every(hasScore);
}

export function isFinished(tournament) {
  const matches = allMatches(tournament);
  return matches.length > 0 && matches.every(hasScore);
}

const METRIC_KEYS = {
  points: 'wonPoints',
  wins: 'wins',
  diff: 'diff',
};

/**
 * Live leaderboard. Rows are players for Classic Americano and teams for Team Americano.
 * Each row: { id, name, members, played, wins, ties, losses, scored, conceded, wonPoints, diff, rank }
 */
export function computeLeaderboard(tournament) {
  const isTeam = tournament.format === 'team';
  const playerNames = new Map(tournament.players.map((p) => [p.id, p.name]));

  const rows = new Map();
  const entities = isTeam
    ? tournament.teams.map((t) => ({ id: t.id, name: t.name, members: t.playerIds.map((id) => playerNames.get(id) || '?') }))
    : tournament.players.map((p) => ({ id: p.id, name: p.name, members: [] }));
  for (const e of entities) {
    rows.set(e.id, { ...e, played: 0, wins: 0, ties: 0, losses: 0, scored: 0, conceded: 0, wonPoints: 0, diff: 0 });
  }

  const { points } = tournament;
  const record = (id, scored, conceded) => {
    const row = rows.get(id);
    if (!row) return;
    row.played += 1;
    row.scored += scored;
    row.conceded += conceded;
    row.diff = row.scored - row.conceded;
    if (scored > conceded) row.wins += 1;
    else if (scored < conceded) row.losses += 1;
    else row.ties += 1;

    if (points.mode === 'wtl') {
      row.wonPoints += scored > conceded ? points.win : scored < conceded ? points.loss : points.tie;
    } else {
      row.wonPoints += scored;
    }
  };

  for (const match of allMatches(tournament)) {
    if (!hasScore(match)) continue;
    const side1 = isTeam ? [match.team1Id] : match.side1;
    const side2 = isTeam ? [match.team2Id] : match.side2;
    for (const id of side1) record(id, match.score1, match.score2);
    for (const id of side2) record(id, match.score2, match.score1);
  }

  const primary = METRIC_KEYS[tournament.rankMode] || 'wonPoints';
  const order = [primary, METRIC_KEYS[tournament.tieBreak] || 'diff', 'wonPoints', 'wins', 'diff'];
  const metrics = order.filter((key, i) => order.indexOf(key) === i);

  const compareMetrics = (a, b) => {
    for (const key of metrics) {
      if (a[key] !== b[key]) return b[key] - a[key];
    }
    return 0;
  };

  const sorted = [...rows.values()].sort((a, b) => compareMetrics(a, b) || a.name.localeCompare(b.name));
  sorted.forEach((row, i) => {
    row.rank = i > 0 && compareMetrics(row, sorted[i - 1]) === 0 ? sorted[i - 1].rank : i + 1;
  });
  return sorted;
}
