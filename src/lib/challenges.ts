import { greedyChange, countPieces, groupValues, isCoin, signatureOf, sumValues, type Denomination } from './currency';
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
}

function towards(total: number, target: number): ChallengeStatus | null {
  if (total === 0) return { done: false, message: `Add some money to make ${rupees(target)}.` };
  if (total < target) return { done: false, message: `${rupees(total)} so far — ${rupees(target - total)} more to go!` };
  if (total > target) return { done: false, message: `Oops! That's ${rupees(total - target)} too much. Take some away.` };
  return null;
}

const makeAmount = (id: string, emoji: string, target: number, title: string, hint: string): Challenge => ({
  id,
  emoji,
  title,
  hint,
  evaluate: (values) => towards(sumValues(values), target) ?? { done: true, message: `Yes! That's exactly ${rupees(target)}!` },
});

export const CHALLENGES: Challenge[] = [
  makeAmount('make-20', '🎈', 20, 'Make ₹20', 'Use any notes or coins you like.'),
  {
    id: 'fewest-100',
    emoji: '🏆',
    title: 'Make ₹100 using the fewest notes',
    hint: 'Bigger notes mean fewer pieces!',
    evaluate(values) {
      const status = towards(sumValues(values), 100);
      if (status) return status;
      const best = countPieces(greedyChange(100)!);
      return values.length === best
        ? { done: true, message: 'Just one note! That is the fewest possible.' }
        : { done: false, message: `That's ₹100 with ${values.length} pieces. Can you do it with ${best}? Try bigger notes!` };
    },
  },
  makeAmount('make-500', '🚀', 500, 'Can you make ₹500?', 'Any mix of money is fine.'),
  {
    id: 'tens-100',
    emoji: '🔟',
    title: 'Make ₹100 using only ₹10 notes',
    hint: 'How many ₹10 notes make ₹100?',
    evaluate(values) {
      if (values.some((v) => v !== 10)) return { done: false, message: 'Only ₹10 notes please! Drag the others away.' };
      return towards(sumValues(values), 100) ?? { done: true, message: '10 × ₹10 = ₹100. Brilliant counting!' };
    },
  },
  {
    id: 'fifty-two-ways',
    emoji: '✌️',
    title: 'Make ₹50 in two different ways',
    hint: 'Make ₹50, then clear the table and make it again differently.',
    evaluate(values, memory) {
      const status = towards(sumValues(values), 50);
      if (status) return memory.length ? { ...status, message: `Way 1 saved ✓  ${status.message}` } : status;
      const sig = signatureOf(groupValues(values));
      if (memory.some((m) => m !== sig)) return { done: true, remember: sig, message: 'Two different ways to make ₹50!' };
      return { done: false, remember: sig, message: 'One way found! Now press Reset and make ₹50 a different way.' };
    },
  },
  {
    id: 'three-35',
    emoji: '🧩',
    title: 'Make ₹35 with exactly 3 pieces',
    hint: 'Think: a note, another note, and a coin…',
    evaluate(values) {
      const status = towards(sumValues(values), 35);
      if (status) return status;
      return values.length === 3
        ? { done: true, message: '₹20 + ₹10 + ₹5 = ₹35. Puzzle solved!' }
        : { done: false, message: `That's ₹35 with ${values.length} pieces. Can you use exactly 3?` };
    },
  },
  {
    id: 'coins-10',
    emoji: '🪙',
    title: 'Make ₹10 using only coins',
    hint: 'Use ₹1, ₹2 and ₹5 coins.',
    evaluate(values) {
      if (values.some((v) => !isCoin(v))) return { done: false, message: 'Coins only! Take the notes away.' };
      return towards(sumValues(values), 10) ?? { done: true, message: 'Jingle jingle! ₹10 in coins!' };
    },
  },
  makeAmount('make-275', '🎁', 275, 'Make ₹275', 'Mix big notes with small ones.'),
];
