import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { Challenge } from '../lib/challenges';
import { Piggy } from './Mascot';
import { KidButton } from './ui';

const CHEERS = ['Shabash!', 'Wah! Super!', 'Bahut badhiya!', 'You did it!', 'Money Master!'];
const COLORS = ['#FF8A3D', '#8B5CF6', '#14B8A6', '#F5B53B', '#F472B6', '#5EC6DA'];

export function Celebration({ challenge, message, onNext, onStay }: { challenge: Challenge; message: string; onNext(): void; onStay(): void }) {
  const cheer = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], []);
  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        spin: (Math.random() - 0.5) * 900,
        drift: (Math.random() - 0.5) * 160,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [],
  );

  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center bg-ink/35 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cheer"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <motion.span
            key={i}
            className={`absolute -top-6 block h-4 w-2.5 ${c.round ? 'rounded-full !w-3.5 !h-3.5' : 'rounded-sm'}`}
            style={{ left: `${c.left}%`, background: c.color }}
            initial={{ y: 0, x: 0, rotate: 0 }}
            animate={{ y: '110vh', x: c.drift, rotate: c.spin }}
            transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="relative w-full max-w-md rounded-[32px] bg-white p-7 text-center shadow-2xl"
      >
        <motion.div
          className="absolute -top-14 left-1/2 -translate-x-1/2 text-8xl"
          initial={{ rotate: -40, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 10 }}
        >
          ⭐
        </motion.div>
        <h2 id="cheer" className="mt-8 text-4xl font-extrabold text-saffron-500">
          {cheer}
        </h2>
        <p className="mt-1 text-lg font-extrabold text-ink">
          {challenge.emoji} {challenge.title}
        </p>
        <p className="mt-1 font-semibold text-ink/60">{message}</p>
        <Piggy className="mx-auto my-3 w-24 animate-bob" />
        <div className="flex flex-wrap justify-center gap-3">
          <KidButton onClick={onStay}>Keep playing</KidButton>
          <KidButton variant="violet" big onClick={onNext} autoFocus>
            Next challenge ➜
          </KidButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
