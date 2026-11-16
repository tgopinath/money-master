import { describe, expect, it } from 'vitest';
import {
  DENOMINATIONS,
  alternativeCombinations,
  countPieces,
  expandParts,
  fewestPieces,
  findExchange,
  greedyChange,
  groupValues,
  sumParts,
  sumValues,
  type Denomination,
} from './currency';

const items = (values: Denomination[]) => values.map((value, i) => ({ id: `i${i}`, value }));

describe('greedyChange', () => {
  it('matches the examples from the brief', () => {
    expect(greedyChange(sumValues([10, 10]))).toEqual([{ value: 20, count: 1 }]);
    expect(greedyChange(sumValues([50, 50]))).toEqual([{ value: 100, count: 1 }]);
    expect(greedyChange(sumValues([100, 100, 100, 200]))).toEqual([{ value: 500, count: 1 }]);
  });

  it('uses every denomination when needed', () => {
    expect(expandParts(greedyChange(888)!)).toEqual([500, 200, 100, 50, 20, 10, 5, 2, 1]);
  });

  it('rejects amounts that cannot be made', () => {
    expect(greedyChange(-5)).toBeNull();
    expect(greedyChange(2.5)).toBeNull();
    expect(greedyChange(3, [2])).toBeNull();
  });
});

describe('fewestPieces', () => {
  it('beats greedy on restricted sets', () => {
    expect(fewestPieces(60, [20, 50])).toEqual([{ value: 20, count: 3 }]);
    expect(fewestPieces(30, [20, 50])).toBeNull();
  });
});

describe('alternativeCombinations', () => {
  it('lists the classic ways to make ₹100', () => {
    const ways = alternativeCombinations(100).map((w) => w.parts);
    expect(ways[0]).toEqual([{ value: 100, count: 1 }]);
    expect(ways).toContainEqual([{ value: 50, count: 2 }]);
    expect(ways).toContainEqual([{ value: 20, count: 5 }]);
    expect(ways).toContainEqual([{ value: 10, count: 10 }]);
  });

  it('never shows a way whose sum differs, and never repeats a way', () => {
    for (let total = 1; total <= 1200; total++) {
      const ways = alternativeCombinations(total);
      expect(ways.length).toBeGreaterThan(0);
      const keys = new Set(ways.map((w) => JSON.stringify(w.parts)));
      expect(keys.size).toBe(ways.length);
      for (const w of ways) expect(sumParts(w.parts)).toBe(total);
      expect(countPieces(ways[0].parts)).toBe(countPieces(greedyChange(total)!));
    }
  });
});

describe('findExchange', () => {
  it('swaps two ₹10 notes for one ₹20 note', () => {
    expect(findExchange(items([10, 10]))).toMatchObject({ ids: ['i0', 'i1'], to: [{ value: 20, count: 1 }] });
  });

  it('returns null when the money already uses the fewest pieces', () => {
    expect(findExchange(items([500, 200, 50]))).toBeNull();
    expect(findExchange([])).toBeNull();
  });

  it('handles awkward sets like ₹2 + ₹2 + ₹2', () => {
    const ex = findExchange(items([2, 2, 2]))!;
    expect(sumParts(ex.to)).toBe(6);
    expect(countPieces(ex.to)).toBe(2);
  });

  it('always keeps the total and ends at the fewest pieces', () => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let run = 0; run < 300; run++) {
      let pile = Array.from({ length: 1 + Math.floor(rand() * 14) }, (_, i) => ({
        id: `r${run}-${i}`,
        value: DENOMINATIONS[Math.floor(rand() * 7)],
      }));
      const total = sumValues(pile.map((p) => p.value));
      let next = 0;
      for (let ex = findExchange(pile); ex; ex = findExchange(pile)) {
        const before = pile.length;
        const step = ex;
        expect(sumParts(step.from)).toBe(sumParts(step.to));
        pile = pile.filter((p) => !step.ids.includes(p.id)).concat(expandParts(step.to).map((value) => ({ id: `n${next++}`, value })));
        expect(pile.length).toBeLessThan(before);
      }
      expect(sumValues(pile.map((p) => p.value))).toBe(total);
      expect(groupValues(pile.map((p) => p.value))).toEqual(greedyChange(total));
    }
  });
});
