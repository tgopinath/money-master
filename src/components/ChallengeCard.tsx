import { motion } from 'motion/react';
import type { Challenge, ChallengeStatus } from '../lib/challenges';
import { say, speakable } from '../lib/sound';
import { KidButton } from './ui';

interface Props {
  challenge: Challenge;
  index: number;
  status: ChallengeStatus | null;
  completed: string[];
  onPrev(): void;
  onNext(): void;
}

export function ChallengeCard({ challenge, index, status, completed, onPrev, onNext }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="shrink-0 overflow-hidden"
    >
      <div className="rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-[3px] shadow-md">
        <div className="flex items-center gap-3 rounded-[21px] bg-white px-3 py-2.5 sm:px-4">
          <motion.span key={challenge.id} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} className="text-4xl">
            {challenge.emoji}
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-violet-600">
              Challenge {index + 1}
              {completed.includes(challenge.id) && <span className="normal-case">✅ solved</span>}
              <span className="ml-auto whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 normal-case text-amber-700">⭐ {completed.length}</span>
            </div>
            <div className="flex items-start gap-2">
              <h3 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">{challenge.title}</h3>
              <button
                type="button"
                aria-label="Read the challenge aloud"
                onClick={() => say(speakable(`${challenge.title}. ${status?.message ?? challenge.hint}`))}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-500 text-lg text-white shadow-sm transition hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
              >
                🔊
              </button>
            </div>
            <p className={`text-sm font-bold sm:text-base ${status?.done ? 'text-mint-700' : 'text-ink/60'}`}>
              {status?.done ? '✅ ' : '💡 '}
              {status?.message ?? challenge.hint}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
            <KidButton aria-label="Previous challenge" className="!px-3 !py-1.5" onClick={onPrev} disabled={index === 0}>
              ◀
            </KidButton>
            <KidButton aria-label="Next challenge" className="!px-3 !py-1.5" onClick={onNext}>
              ▶
            </KidButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
