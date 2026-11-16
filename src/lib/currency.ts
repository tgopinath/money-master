export const DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100, 200, 500] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

const DESCENDING = [...DENOMINATIONS].reverse() as Denomination[];

interface BaseMeta {
  value: Denomination;
  words: string;
}

export interface CoinMeta extends BaseMeta {
  kind: 'coin';
  diameterMm: number;
}

export interface NoteMeta extends BaseMeta {
  kind: 'note';
  widthMm: number;
  heightMm: number;
}

export type CurrencyMeta = CoinMeta | NoteMeta;

// Sizes follow the real Mahatma Gandhi (New) Series and 2019 coin series, in millimetres.
export const CURRENCY: Record<Denomination, CurrencyMeta> = {
  1: { kind: 'coin', value: 1, words: 'One Rupee', diameterMm: 20 },
  2: { kind: 'coin', value: 2, words: 'Two Rupees', diameterMm: 23 },
  5: { kind: 'coin', value: 5, words: 'Five Rupees', diameterMm: 25 },
  10: { kind: 'note', value: 10, words: 'Ten Rupees', widthMm: 123, heightMm: 63 },
  20: { kind: 'note', value: 20, words: 'Twenty Rupees', widthMm: 129, heightMm: 63 },
  50: { kind: 'note', value: 50, words: 'Fifty Rupees', widthMm: 135, heightMm: 66 },
  100: { kind: 'note', value: 100, words: 'Hundred Rupees', widthMm: 142, heightMm: 66 },
  200: { kind: 'note', value: 200, words: 'Two Hundred Rupees', widthMm: 146, heightMm: 66 },
  500: { kind: 'note', value: 500, words: 'Five Hundred Rupees', widthMm: 150, heightMm: 66 },
};

export const isCoin = (value: Denomination) => CURRENCY[value].kind === 'coin';

/** `count` pieces of one denomination. A combination is a list of these, largest first. */
export interface Part {
  value: Denomination;
  count: number;
}
export type Combination = Part[];

export const sumValues = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0);
export const sumParts = (parts: Combination) => parts.reduce((sum, p) => sum + p.value * p.count, 0);
export const countPieces = (parts: Combination) => parts.reduce((sum, p) => sum + p.count, 0);
export const expandParts = (parts: Combination): Denomination[] =>
  parts.flatMap((p) => Array<Denomination>(p.count).fill(p.value));

/** Total = Σ (denomination × quantity), grouped largest first. */
export function groupValues(values: readonly Denomination[]): Combination {
  const counts = new Map<Denomination, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return DESCENDING.filter((d) => counts.has(d)).map((d) => ({ value: d, count: counts.get(d)! }));
}

export const signatureOf = (parts: Combination) => parts.map((p) => `${p.count}x${p.value}`).join('+');

/**
 * Minimum-piece representation using every denomination. The Indian set is canonical,
 * so the greedy answer is also the true minimum. Returns null for amounts that can't be made.
 */
export function greedyChange(total: number, allowed: readonly Denomination[] = DENOMINATIONS): Combination | null {
  if (!Number.isInteger(total) || total < 0) return null;
  let rest = total;
  const parts: Combination = [];
  for (const d of [...allowed].sort((a, b) => b - a)) {
    const count = Math.floor(rest / d);
    if (count > 0) {
      parts.push({ value: d, count });
      rest -= count * d;
    }
  }
  return rest === 0 ? parts : null;
}

/** Exact minimum pieces for any subset of denominations, where greedy can fail (e.g. ₹60 from {20, 50}). */
export function fewestPieces(total: number, allowed: readonly Denomination[]): Combination | null {
  if (!Number.isInteger(total) || total < 0 || allowed.length === 0) return null;
  if (total === 0) return [];
  const INF = Number.MAX_SAFE_INTEGER;
  const best = new Array<number>(total + 1).fill(INF);
  const pick = new Array<Denomination>(total + 1);
  best[0] = 0;
  for (let t = 1; t <= total; t++) {
    for (const d of allowed) {
      if (d <= t && best[t - d] !== INF && best[t - d] + 1 < best[t]) {
        best[t] = best[t - d] + 1;
        pick[t] = d;
      }
    }
  }
  if (best[total] === INF) return null;
  const values: Denomination[] = [];
  for (let t = total; t > 0; t -= pick[t]) values.push(pick[t]);
  return groupValues(values);
}

const mergeParts = (...lists: Combination[]) => groupValues(lists.flatMap(expandParts));

export interface Way {
  parts: Combination;
  label: string;
}

/**
 * Several different ways to make `total`, fewest pieces first. Every way is checked
 * to add up to exactly `total`; ways that would need too many pieces to show are skipped.
 */
export function alternativeCombinations(total: number, limit = 6, maxPieces = 20): Way[] {
  const fewest = greedyChange(total);
  if (!fewest || total === 0) return [];

  const candidates: Combination[] = [];
  for (const top of DESCENDING) {
    if (top > total) continue;
    const allowed = DENOMINATIONS.filter((d) => d <= top);
    const parts = fewestPieces(total, allowed);
    if (!parts) continue;
    candidates.push(parts);
    // A mixed way: break one of the biggest pieces into smaller money.
    const smaller = DENOMINATIONS.filter((d) => d < top);
    if (parts[0].count >= 2 && smaller.length) {
      const broken = fewestPieces(top, smaller);
      if (broken) candidates.push(mergeParts([{ value: top, count: parts[0].count - 1 }], parts.slice(1), broken));
    }
  }
  for (const d of DESCENDING) {
    if (total % d === 0) candidates.push([{ value: d, count: total / d }]);
  }

  const seen = new Set([signatureOf(fewest)]);
  const others = candidates
    .filter((parts) => {
      const key = signatureOf(parts);
      if (seen.has(key) || sumParts(parts) !== total || countPieces(parts) > maxPieces) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => countPieces(a) - countPieces(b));

  return [fewest, ...others].slice(0, limit).map((parts, i) => ({
    parts,
    label: i === 0 ? 'Fewest pieces' : parts.length === 1 ? `Only ₹${parts[0].value}` : 'A mix',
  }));
}

export interface Exchange {
  ids: string[];
  from: Combination;
  to: Combination;
}

/** Fewest items whose values add up to exactly `target` (0/1 subset sum). */
function fewestSubset<T extends { value: number }>(items: T[], target: number): T[] | null {
  const INF = Number.MAX_SAFE_INTEGER;
  let best = new Array<number>(target + 1).fill(INF);
  best[0] = 0;
  const took: Uint8Array[] = [];
  for (const item of items) {
    const next = best.slice();
    const mark = new Uint8Array(target + 1);
    for (let s = item.value; s <= target; s++) {
      if (best[s - item.value] !== INF && best[s - item.value] + 1 < next[s]) {
        next[s] = best[s - item.value] + 1;
        mark[s] = 1;
      }
    }
    took.push(mark);
    best = next;
  }
  if (best[target] === INF) return null;
  const chosen: T[] = [];
  for (let i = items.length - 1, s = target; i >= 0 && s > 0; i--) {
    if (took[i][s]) {
      chosen.push(items[i]);
      s -= items[i].value;
    }
  }
  return chosen;
}

/**
 * The next "swap smaller money for bigger money" step, or null when the
 * collection already uses the fewest possible pieces.
 *  1. Prefer an exact swap into ONE bigger note/coin (2 × ₹10 → ₹20), smallest target first.
 *  2. Otherwise swap the smallest handful of pieces for fewer pieces (₹2 + ₹2 + ₹2 → ₹5 + ₹1).
 */
export function findExchange<T extends { id: string; value: Denomination }>(items: readonly T[]): Exchange | null {
  const make = (chosen: T[], to: Combination): Exchange => ({
    ids: chosen.map((i) => i.id),
    from: groupValues(chosen.map((i) => i.value)),
    to,
  });

  for (const target of DENOMINATIONS) {
    const smaller = items.filter((i) => i.value < target);
    if (sumValues(smaller.map((i) => i.value)) < target) continue;
    for (const v of DESCENDING) {
      if (v >= target || target % v !== 0) continue;
      const same = smaller.filter((i) => i.value === v);
      const need = target / v;
      if (same.length >= need) return make(same.slice(0, need), [{ value: target, count: 1 }]);
    }
    const subset = fewestSubset([...smaller].sort((a, b) => b.value - a.value), target);
    if (subset) return make(subset, [{ value: target, count: 1 }]);
  }

  const ascending = [...items].sort((a, b) => a.value - b.value);
  let running = 0;
  for (let n = 1; n <= ascending.length; n++) {
    running += ascending[n - 1].value;
    const change = greedyChange(running)!;
    if (countPieces(change) < n) return make(ascending.slice(0, n), change);
  }
  return null;
}
