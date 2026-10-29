const TIME_BUDGET_MS = 300;
const ITERATIONS_PER_RESTART = 20000;
const TARGET_OPPONENT_COUNT = 2;

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Round-robin circle method: for an even number of items returns items.length - 1 rounds,
 * each containing items.length / 2 pairs. Every pair of items occurs exactly once.
 */
function circleRounds(items) {
  const n = items.length;
  const fixed = items[0];
  const rest = items.slice(1);
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [[fixed, rest[0]]];
    for (let i = 1; i < n / 2; i++) {
      pairs.push([rest[i], rest[rest.length - i]]);
    }
    rounds.push(pairs);
    rest.unshift(rest.pop());
  }
  return rounds;
}

/**
 * Team Americano: every team plays every other team exactly once.
 * Returns rounds of matches: [{ team1Id, team2Id }].
 */
export function generateTeamSchedule(teamIds) {
  return shuffle(circleRounds(shuffle(teamIds))).map((pairs) =>
    shuffle(pairs).map(([a, b]) => (Math.random() < 0.5 ? { team1Id: a, team2Id: b } : { team1Id: b, team2Id: a })),
  );
}

/**
 * Classic Americano: every player partners every other player exactly once and
 * opponents are spread as evenly as possible (ideally everyone faces everyone twice).
 * Returns rounds of matches: [{ side1: [a, b], side2: [c, d] }].
 */
export function generateClassicSchedule(playerIds) {
  const n = playerIds.length;
  const indices = playerIds.map((_, i) => i);
  const deadline = performance.now() + TIME_BUDGET_MS;

  let best = null;
  let bestCost = Infinity;
  do {
    const rounds = circleRounds(shuffle(indices)).map(shuffle);
    const cost = optimizeOpponents(rounds, n, deadline);
    if (cost < bestCost) {
      bestCost = cost;
      best = rounds.map((round) => round.map((pair) => pair.slice()));
    }
  } while (bestCost > 0 && performance.now() < deadline);

  return shuffle(best).map((pairs) => {
    const matches = [];
    for (let k = 0; k < pairs.length; k += 2) {
      matches.push({
        side1: pairs[k].map((i) => playerIds[i]),
        side2: pairs[k + 1].map((i) => playerIds[i]),
      });
    }
    return matches;
  });
}

/**
 * Each round is a list of partner pairs; pairs at positions 2k and 2k+1 form match k.
 * Swaps pairs between matches of the same round (simulated annealing) to minimise
 * the sum of squared deviations of opponent counts from the target. Mutates `rounds`
 * into the best arrangement found and returns its cost.
 */
function optimizeOpponents(rounds, n, deadline) {
  const pairsPerRound = rounds[0].length;
  const counts = Array.from({ length: n }, () => new Array(n).fill(0));

  const addMatch = (p, q, d) => {
    for (const a of p) {
      for (const b of q) {
        counts[a][b] += d;
        counts[b][a] += d;
      }
    }
  };
  // Cost change when the opponent count between every player of p and every player of q changes by d.
  const deltaFor = (p, q, d) => {
    let delta = 0;
    for (const a of p) {
      for (const b of q) delta += 2 * d * (counts[a][b] - TARGET_OPPONENT_COUNT) + 1;
    }
    return delta;
  };

  for (const round of rounds) {
    for (let k = 0; k < round.length; k += 2) addMatch(round[k], round[k + 1], 1);
  }
  let cost = 0;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) cost += (counts[a][b] - TARGET_OPPONENT_COUNT) ** 2;
  }

  // With a single match per round there is nothing to rearrange.
  if (pairsPerRound <= 2) return cost;

  let bestCost = cost;
  let bestRounds = rounds.map((round) => round.slice());

  for (let iter = 0; iter < ITERATIONS_PER_RESTART && cost > 0; iter++) {
    if ((iter & 1023) === 0 && performance.now() > deadline) break;

    const round = rounds[Math.floor(Math.random() * rounds.length)];
    const p = Math.floor(Math.random() * pairsPerRound);
    let q = Math.floor(Math.random() * (pairsPerRound - 2));
    // Pick q from a different match than p.
    const matchStart = p - (p % 2);
    if (q >= matchStart) q += 2;

    const P = round[p];
    const Pp = round[p ^ 1];
    const Q = round[q];
    const Qq = round[q ^ 1];

    // The four affected player groupings are disjoint, so the deltas can be summed.
    const delta =
      deltaFor(P, Pp, -1) + deltaFor(Q, Qq, -1) + deltaFor(P, Qq, 1) + deltaFor(Q, Pp, 1);

    const temperature = 1.5 * (1 - iter / ITERATIONS_PER_RESTART) + 0.05;
    if (delta <= 0 || Math.random() < Math.exp(-delta / temperature)) {
      addMatch(P, Pp, -1);
      addMatch(Q, Qq, -1);
      addMatch(P, Qq, 1);
      addMatch(Q, Pp, 1);
      round[p] = Q;
      round[q] = P;
      cost += delta;
      if (cost < bestCost) {
        bestCost = cost;
        bestRounds = rounds.map((r) => r.slice());
      }
    }
  }

  bestRounds.forEach((round, i) => { rounds[i] = round; });
  return bestCost;
}
