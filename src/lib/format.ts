import type { Combination } from './currency';

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 × ₹10 + 1 × ₹50" */
export const describeParts = (parts: Combination) => parts.map((p) => `${p.count} × ${rupees(p.value)}`).join(' + ');
