import {
  DENOMINATIONS,
  countPieces,
  expandParts,
  fewestPieces,
  greedyChange,
  groupValues,
  isCoin,
  signatureOf,
  sumValues,
  type Denomination,
} from './currency';
import { rupees } from './format';

export interface ChallengeStatus {
  done: boolean;
  message: string;
  /** Something the challenge wants remembered across attempts (used by "two different ways"). */
  remember?: string;
}

export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  evaluate(values: Denomination[], memory: readonly string[]): ChallengeStatus;
  /** Worked answers, in order. Never shown; the tests use them to prove every challenge can be solved. */
  examples: Denomination[][];
}

function towards(total: number, target: number): ChallengeStatus | null {
  if (total === 0) return { done: false, message: `Add some money to make ${rupees(target)}.` };
  if (total < target) return { done: false, message: `${rupees(total)} so far — ${rupees(target - total)} more to go!` };
  if (total > target) return { done: false, message: `Oops! That's ${rupees(total - target)} too much. Take some away.` };
  return null;
}

const COINS = DENOMINATIONS.filter((d) => isCoin(d));
const kind = (d: Denomination) => (isCoin(d) ? 'coins' : 'notes');
const fewest = (target: number) => greedyChange(target)!;

/* ---------- Challenge types. Each builds a challenge for one target amount. ---------- */

const anyAmount = (id: string, emoji: string, target: number, title = `Make ${rupees(target)}`, hint = 'Use any notes or coins you like.'): Challenge => ({
  id,
  emoji,
  title,
  hint,
  evaluate: (values) => towards(sumValues(values), target) ?? { done: true, message: `Yes! That's exactly ${rupees(target)}!` },
  examples: [expandParts(fewest(target))],
});

const fewestWay = (id: string, emoji: string, target: number, title = `Make ${rupees(target)} using the fewest pieces`): Challenge => {
  const best = countPieces(fewest(target));
  return {
    id,
    emoji,
    title,
    hint: 'Bigger money means fewer pieces!',
    evaluate(values) {
      const status = towards(sumValues(values), target);
      if (status) return status;
      return values.length === best
        ? { done: true, message: best === 1 ? 'Just one piece! That is the fewest possible.' : `${best} pieces! That is the fewest possible.` }
        : { done: false, message: `That's ${rupees(target)} with ${values.length} pieces. Can you do it with ${best}? Try bigger money!` };
    },
    examples: [expandParts(fewest(target))],
  };
};

const onlyOne = (id: string, emoji: string, d: Denomination, count: number): Challenge => {
  const target = d * count;
  return {
    id,
    emoji,
    title: `Make ${rupees(target)} using only ₹${d} ${kind(d)}`,
    hint: `How many ₹${d} ${kind(d)} make ${rupees(target)}?`,
    evaluate(values) {
      if (values.some((v) => v !== d)) return { done: false, message: `Only ₹${d} ${kind(d)} please! Take the others away.` };
      return towards(sumValues(values), target) ?? { done: true, message: `${count} × ₹${d} = ${rupees(target)}. Brilliant counting!` };
    },
    examples: [Array<Denomination>(count).fill(d)],
  };
};

/** Some way to make `target` with exactly `pieces` pieces, or null if there isn't one. */
function exactPieces(target: number, pieces: number): Denomination[] | null {
  // reach[c] maps an amount to one denomination that gets there in c pieces.
  const reach: Map<number, Denomination>[] = [new Map([[0, 1]])];
  for (let c = 1; c <= pieces; c++) {
    const next = new Map<number, Denomination>();
    for (const sum of reach[c - 1].keys()) {
      for (const d of DENOMINATIONS) if (sum + d <= target && !next.has(sum + d)) next.set(sum + d, d);
    }
    reach.push(next);
  }
  if (!reach[pieces].has(target)) return null;
  const out: Denomination[] = [];
  for (let c = pieces, sum = target; c > 0; c--) {
    const d = reach[c].get(sum)!;
    out.push(d);
    sum -= d;
  }
  return out;
}

const exactly = (id: string, emoji: string, target: number, pieces: number, answer: Denomination[], hint = 'Mix big and small money to get the count right.'): Challenge => ({
  id,
  emoji,
  title: `Make ${rupees(target)} with exactly ${pieces} pieces`,
  hint,
  evaluate(values) {
    const status = towards(sumValues(values), target);
    if (status) return status;
    return values.length === pieces
      ? { done: true, message: `${rupees(target)} in exactly ${pieces} pieces. Puzzle solved!` }
      : { done: false, message: `That's ${rupees(target)} with ${values.length} pieces. Can you use exactly ${pieces}?` };
  },
  examples: [answer],
});

const coinsOnly = (id: string, emoji: string, target: number): Challenge => ({
  id,
  emoji,
  title: `Make ${rupees(target)} using only coins`,
  hint: 'Use ₹1, ₹2 and ₹5 coins.',
  evaluate(values) {
    if (values.some((v) => !isCoin(v))) return { done: false, message: 'Coins only! Take the notes away.' };
    return towards(sumValues(values), target) ?? { done: true, message: `Jingle jingle! ${rupees(target)} in coins!` };
  },
  examples: [expandParts(greedyChange(target, COINS)!)],
});

const without = (id: string, emoji: string, target: number, banned: Denomination): Challenge => ({
  id,
  emoji,
  title: `Make ${rupees(target)} without any ₹${banned} ${kind(banned)}`,
  hint: `Find another way — no ₹${banned} allowed!`,
  evaluate(values) {
    if (values.includes(banned)) return { done: false, message: `No ₹${banned} ${kind(banned)} this time! Swap it for smaller money.` };
    return towards(sumValues(values), target) ?? { done: true, message: `${rupees(target)} without a single ₹${banned}. Clever!` };
  },
  examples: [expandParts(fewestPieces(target, DENOMINATIONS.filter((d) => d !== banned))!)],
});

const notesAndCoins = (id: string, emoji: string, target: number): Challenge => ({
  id,
  emoji,
  title: `Make ${rupees(target)} using notes and coins together`,
  hint: 'Use at least one note and at least one coin.',
  evaluate(values) {
    const status = towards(sumValues(values), target);
    if (status) return status;
    if (!values.some((v) => isCoin(v))) return { done: false, message: `That's ${rupees(target)}, but add a coin too! Swap a note for smaller money.` };
    if (!values.some((v) => !isCoin(v))) return { done: false, message: `That's ${rupees(target)}, but use a note too!` };
    return { done: true, message: 'Notes and coins working together!' };
  },
  examples: [mixedAnswer(target)],
});

/** Fewest pieces that include at least one note and one coin (target must be at least ₹11). */
function mixedAnswer(target: number): Denomination[] {
  const values = expandParts(fewest(target));
  if (values.some((v) => isCoin(v)) && values.some((v) => !isCoin(v))) return values;
  if (!values.some((v) => isCoin(v))) {
    // All notes: swap the smallest note for a ₹5 coin plus the rest in notes (₹20 → ₹10 + ₹5 + ₹5).
    const smallest = values.pop()!;
    return [...values, ...expandParts(fewest(smallest - 5)), 5 as Denomination].sort((a, b) => b - a);
  }
  // All coins: there is at least ₹11, so a ₹10 note fits.
  return [10, ...expandParts(fewest(target - 10))];
}

const twoWays = (id: string, emoji: string, target: number): Challenge => {
  const first = expandParts(fewest(target));
  const second = expandParts(fewestPieces(target, DENOMINATIONS.filter((d) => d < Math.max(...first)))!);
  return {
    id,
    emoji,
    title: `Make ${rupees(target)} in two different ways`,
    hint: `Make ${rupees(target)}, then press Reset and make it again differently.`,
    evaluate(values, memory) {
      const status = towards(sumValues(values), target);
      if (status) return memory.length ? { ...status, message: `Way 1 saved ✓  ${status.message}` } : status;
      const sig = signatureOf(groupValues(values));
      if (memory.some((m) => m !== sig)) return { done: true, remember: sig, message: `Two different ways to make ${rupees(target)}!` };
      return { done: false, remember: sig, message: `One way found! Now press Reset and make ${rupees(target)} a different way.` };
    },
    examples: [first, second],
  };
};

/* ---------- The first eight, made by hand. ---------- */

const HANDMADE: Challenge[] = [
  anyAmount('make-20', '🎈', 20),
  fewestWay('fewest-100', '🏆', 100, 'Make ₹100 using the fewest notes'),
  anyAmount('make-500', '🚀', 500, 'Can you make ₹500?', 'Any mix of money is fine.'),
  onlyOne('tens-100', '🔟', 10, 10),
  twoWays('fifty-two-ways', '✌️', 50),
  exactly('three-35', '🧩', 35, 3, [20, 10, 5], 'Think: a note, another note, and a coin…'),
  coinsOnly('coins-10', '🪙', 10),
  anyAmount('make-275', '🎁', 275, 'Make ₹275', 'Mix big notes with small ones.'),
];

/* ---------- Endless challenges after that, harder as the level goes up. ---------- */

/** Small deterministic random generator, so a level always gives the same challenge. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const between = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = <T,>(rand: Rand, list: readonly T[]) => list[Math.floor(rand() * list.length)];

/** A target that grows with the level: round tens at first, then fives, then any amount. */
function amountFor(rand: Rand, level: number, min = 11) {
  const hi = Math.min(2000, 40 + level * 15);
  const lo = Math.max(min, Math.min(hi - 10, 10 + level * 4));
  const step = level < 15 ? 10 : level < 35 ? 5 : 1;
  return Math.max(min, Math.round(between(rand, lo, hi) / step) * step);
}

type Kind = 'any' | 'fewest' | 'only' | 'exactly' | 'coins' | 'without' | 'mix' | 'two';
const KINDS: Kind[] = ['any', 'fewest', 'only', 'exactly', 'coins', 'without', 'mix', 'two'];
const EMOJI: Record<Kind, string[]> = {
  any: ['🎈', '🎁', '🍦', '🧸', '🪁'],
  fewest: ['🏆', '🥇', '💎'],
  only: ['🔢', '🎯', '📦'],
  exactly: ['🧩', '🔍', '🎲'],
  coins: ['🪙', '🐷', '🫙'],
  without: ['🚫', '🙈', '🔀'],
  mix: ['🤝', '🌈', '🎨'],
  two: ['✌️', '👯', '🔁'],
};

function shuffled(round: number): Kind[] {
  const order = [...KINDS];
  const rand = seeded(round * 7919 + 17);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The kinds for one round of eight: each kind once, never starting with the kind the last round ended on. */
function roundOrder(round: number): Kind[] {
  const order = shuffled(round);
  // Only the first two places ever swap, so the previous round's last kind is its plain shuffle's last.
  if (round > 0 && order[0] === shuffled(round - 1).at(-1)) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

const HANDMADE_TITLES = new Set(HANDMADE.map((c) => c.title));

/** A generated challenge, re-rolled until it isn't a copy of one of the handmade ones. */
function generate(index: number): Challenge {
  for (let attempt = 0; ; attempt++) {
    const challenge = build(index, attempt);
    if (!HANDMADE_TITLES.has(challenge.title)) return challenge;
  }
}

function build(index: number, attempt: number): Challenge {
  const level = index - HANDMADE.length;
  const kindOf = roundOrder(Math.floor(level / KINDS.length))[level % KINDS.length];
  const rand = seeded(index * 2654435761 + attempt * 97);
  const id = `level-${index}`;
  const emoji = pick(rand, EMOJI[kindOf]);

  switch (kindOf) {
    case 'any':
      return anyAmount(id, emoji, amountFor(rand, level));
    case 'fewest':
      return fewestWay(id, emoji, amountFor(rand, level));
    case 'only': {
      const choices: Denomination[] = level < 10 ? [1, 2, 5, 10, 20] : level < 30 ? [5, 10, 20, 50] : [10, 20, 50, 100, 200];
      return onlyOne(id, emoji, pick(rand, choices), between(rand, 3, Math.min(12, 5 + Math.floor(level / 4))));
    }
    case 'exactly': {
      const target = amountFor(rand, level);
      const least = countPieces(fewest(target));
      // A few more pieces than the fewest, so it takes some thinking.
      for (let extra = between(rand, 1, 3); extra >= 1; extra--) {
        const answer = exactPieces(target, least + extra);
        if (answer) return exactly(id, emoji, target, least + extra, answer);
      }
      return fewestWay(id, emoji, target);
    }
    case 'coins':
      return coinsOnly(id, emoji, between(rand, 6, Math.min(40, 12 + level)));
    case 'without': {
      const target = amountFor(rand, level, 15);
      const banned = Math.max(...expandParts(fewest(target))) as Denomination;
      return without(id, emoji, target, banned);
    }
    case 'mix':
      return notesAndCoins(id, emoji, amountFor(rand, level, 15) + between(rand, 1, 4));
    case 'two':
      return twoWays(id, emoji, amountFor(rand, level, 10));
  }
}

const cache = new Map<number, Challenge>();

/** Challenge number `index` (0-based). The first eight are handmade; after that they never run out. */
export function challengeAt(index: number): Challenge {
  const i = Math.max(0, Math.floor(index));
  if (i < HANDMADE.length) return HANDMADE[i];
  let challenge = cache.get(i);
  if (!challenge) {
    challenge = generate(i);
    cache.set(i, challenge);
  }
  return challenge;
}

export const HANDMADE_COUNT = HANDMADE.length;
