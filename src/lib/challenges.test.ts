import { describe, expect, it } from 'vitest';
import { challengeAt, HANDMADE_COUNT } from './challenges';
import { DENOMINATIONS, groupValues, signatureOf } from './currency';

const LEVELS = 2000;

describe('challengeAt', () => {
  it('starts with the handmade challenges', () => {
    expect(challengeAt(0).title).toBe('Make ₹20');
    expect(challengeAt(4).title).toBe('Make ₹50 in two different ways');
    expect(HANDMADE_COUNT).toBe(8);
  });

  it('never runs out, and a level always gives the same challenge', () => {
    const ids = new Set<string>();
    for (let i = 0; i < LEVELS; i++) {
      const c = challengeAt(i);
      expect(c.title.length).toBeGreaterThan(0);
      expect(challengeAt(i)).toBe(c);
      ids.add(c.id);
    }
    expect(ids.size).toBe(LEVELS);
  });

  it('generated challenges never copy a handmade one', () => {
    const handmade = new Set(Array.from({ length: HANDMADE_COUNT }, (_, i) => challengeAt(i).title));
    for (let i = HANDMADE_COUNT; i < LEVELS; i++) expect(handmade.has(challengeAt(i).title), challengeAt(i).title).toBe(false);
  });

  it('never repeats the exact same challenge back to back', () => {
    for (let i = 1; i < LEVELS; i++) expect(challengeAt(i).title).not.toBe(challengeAt(i - 1).title);
  });

  it('every challenge can be solved with real money, and an empty table never counts', () => {
    for (let i = 0; i < LEVELS; i++) {
      const c = challengeAt(i);
      expect(c.evaluate([], []).done, c.title).toBe(false);
      for (const answer of c.examples) for (const v of answer) expect(DENOMINATIONS).toContain(v);

      if (c.examples.length === 1) {
        expect(c.evaluate(c.examples[0], []).done, c.title).toBe(true);
      } else {
        // "Two different ways": the first way alone isn't enough, a second different way finishes it.
        const [first, second] = c.examples;
        const firstTry = c.evaluate(first, []);
        expect(firstTry.done, c.title).toBe(false);
        expect(firstTry.remember).toBe(signatureOf(groupValues(first)));
        expect(signatureOf(groupValues(second))).not.toBe(firstTry.remember);
        expect(c.evaluate(second, [firstTry.remember!]).done, c.title).toBe(true);
      }
    }
  });

  it('gets harder: later levels use bigger amounts', () => {
    const amount = (i: number) => Number(challengeAt(i).title.match(/₹([\d,]+)/)![1].replace(/,/g, ''));
    const avg = (from: number) => {
      let sum = 0;
      for (let i = from; i < from + 40; i++) sum += amount(i);
      return sum / 40;
    };
    expect(avg(200)).toBeGreaterThan(avg(8));
  });
});
