import type { Combination } from './currency';

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 × ₹10 + 1 × ₹50" */
export const describeParts = (parts: Combination) => parts.map((p) => `${p.count} × ${rupees(p.value)}`).join(' + ');

/** "₹10 + ₹10 + ₹50" for short lists, falls back to grouped form for long ones. */
export function equation(parts: Combination, maxTerms = 6) {
  const pieces = parts.reduce((n, p) => n + p.count, 0);
  if (pieces > maxTerms) return describeParts(parts);
  return parts.flatMap((p) => Array(p.count).fill(rupees(p.value))).join(' + ');
}
