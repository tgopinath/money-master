import { describe, expect, it } from 'vitest';
import {
  alternativeCombinations,
  countPieces,
  expandParts,
  fewestPieces,
  greedyChange,
  sumParts,
  sumValues,
} from './currency';

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
    const ways = alternativeCombinations(100);
    expect(ways[0]).toEqual([{ value: 100, count: 1 }]);
    expect(ways).toContainEqual([{ value: 50, count: 2 }]);
    expect(ways).toContainEqual([{ value: 20, count: 5 }]);
    expect(ways).toContainEqual([{ value: 10, count: 10 }]);
  });

  it('never shows a way whose sum differs, and never repeats a way', () => {
    for (let total = 1; total <= 1200; total++) {
      const ways = alternativeCombinations(total);
      expect(ways.length).toBeGreaterThan(0);
      const keys = new Set(ways.map((w) => JSON.stringify(w)));
      expect(keys.size).toBe(ways.length);
      for (const w of ways) expect(sumParts(w)).toBe(total);
      expect(countPieces(ways[0])).toBe(countPieces(greedyChange(total)!));
    }
  });
});
