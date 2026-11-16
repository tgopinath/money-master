import { useMemo, useReducer } from 'react';
import { DENOMINATIONS, expandParts, type Combination, type Denomination } from '../lib/currency';

export interface MoneyItem {
  id: string;
  value: Denomination;
  /** Centre position on the table, in % of its width/height. */
  x: number;
  y: number;
  tilt: number;
}

export interface Point {
  x: number;
  y: number;
}

interface MoneyState {
  items: MoneyItem[];
  past: MoneyItem[][];
}

type MoneyAction = { type: 'apply'; fn: (items: MoneyItem[]) => MoneyItem[] } | { type: 'undo' };

const HISTORY = 80;

function reducer(state: MoneyState, action: MoneyAction): MoneyState {
  if (action.type === 'undo') {
    if (!state.past.length) return state;
    return { items: state.past[state.past.length - 1], past: state.past.slice(0, -1) };
  }
  const next = action.fn(state.items);
  if (next === state.items) return state;
  return { items: next, past: [...state.past, state.items].slice(-HISTORY) };
}

let counter = 0;
const clampX = (x: number) => Math.min(91, Math.max(9, x));
const clampY = (y: number) => Math.min(88, Math.max(12, y));
const randomTilt = () => Math.round(Math.random() * 14 - 7);
const randomSpot = (): Point => ({ x: 14 + Math.random() * 72, y: 18 + Math.random() * 64 });

const newItem = (value: Denomination, at: Point): MoneyItem => ({
  id: `m${++counter}-${Math.random().toString(36).slice(2, 7)}`,
  value,
  x: clampX(at.x),
  y: clampY(at.y),
  tilt: randomTilt(),
});

/** Piles of each denomination laid out in a neat grid, biggest first. */
function tidyLayout(items: MoneyItem[]): MoneyItem[] {
  const groups = [...DENOMINATIONS].reverse().map((d) => items.filter((i) => i.value === d)).filter((g) => g.length);
  const cols = Math.min(3, groups.length);
  const rows = Math.ceil(groups.length / cols);
  return groups.flatMap((group, g) => {
    const cx = 12 + (76 * ((g % cols) + 0.5)) / cols;
    const cy = 16 + (68 * (Math.floor(g / cols) + 0.5)) / rows;
    const spread = Math.min(2.2, 16 / group.length);
    return group.map((item, i) => {
      const k = i - (group.length - 1) / 2;
      return { ...item, x: clampX(cx + k * spread), y: clampY(cy + k * spread * 0.7), tilt: i % 2 ? 3 : -3 };
    });
  });
}

export function useMoney() {
  const [state, dispatch] = useReducer(reducer, { items: [], past: [] });

  const api = useMemo(() => {
    const apply = (fn: (items: MoneyItem[]) => MoneyItem[]) => dispatch({ type: 'apply', fn });
    return {
      add(value: Denomination, at: Point = randomSpot()) {
        const item = newItem(value, at);
        apply((items) => [...items, item]);
      },
      /** Moves an item and brings it to the front. */
      move(id: string, at: Point) {
        apply((items) => {
          const item = items.find((i) => i.id === id);
          if (!item) return items;
          return [...items.filter((i) => i !== item), { ...item, x: clampX(at.x), y: clampY(at.y) }];
        });
      },
      remove(id: string) {
        apply((items) => (items.some((i) => i.id === id) ? items.filter((i) => i.id !== id) : items));
      },
      exchange(ids: string[], to: Combination, at: Point) {
        const values = expandParts(to);
        const fresh = values.map((v, k) => ({ ...newItem(v, { x: at.x + (k - (values.length - 1) / 2) * 16, y: at.y }), tilt: 0 }));
        apply((items) => [...items.filter((i) => !ids.includes(i.id)), ...fresh]);
      },
      tidy() {
        apply((items) => (items.length ? tidyLayout(items) : items));
      },
      reset() {
        apply((items) => (items.length ? [] : items));
      },
      undo() {
        dispatch({ type: 'undo' });
      },
    };
  }, []);

  return { items: state.items, canUndo: state.past.length > 0, ...api };
}
