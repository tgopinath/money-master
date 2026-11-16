import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { alternativeCombinations, countPieces, greedyChange, groupValues, signatureOf, type Combination } from '../lib/currency';
import { describeParts, plural, rupees } from '../lib/format';
import type { MoneyItem } from '../state/useMoney';
import { Mascot } from './Mascot';
import { Money } from './money/Money';
import { PieceGroup } from './PieceGroup';
import { KidButton, Panel } from './ui';

interface Props {
  items: MoneyItem[];
  total: number;
}

export function Converter({ items, total }: Props) {
  const yours = groupValues(items.map((i) => i.value));
  const fewest = greedyChange(total) ?? [];
  const pieces = items.length;
  const fewestCount = countPieces(fewest);

  const tip =
    total === 0
      ? "Hi, I'm Gullu! Put some money on the table and I'll show you how to make bigger money."
      : pieces > fewestCount
        ? `Look! Your ${pieces} pieces are the same as just ${fewestCount}. Small money joins up into big money!`
        : pieces === 1
          ? `One ${rupees(total)} piece. Can you make the same amount with smaller money?`
          : `Wow! You're using the fewest pieces possible for ${rupees(total)}. ⭐`;

  return (
    <Panel tone="lilac" step={3} title="Make Bigger Money" subtitle="Same money, fewer pieces" bodyClassName="flex flex-col gap-4 p-4 xl:overflow-y-auto">
      {total === 0 ? (
        <EmptyExample />
      ) : (
        <>
          <div className="relative rounded-3xl bg-white p-4 shadow-sm ring-1 ring-ink/5">
            <Row label="You have" detail={plural(pieces, 'piece', 'pieces')}>
              <PieceGroup parts={yours} size="sm" />
            </Row>
            <div className="my-3 flex items-center gap-3">
              <div className="h-0.5 flex-1 rounded bg-lilac-200" />
              <span className="rounded-full bg-violet-500 px-4 py-1 text-2xl font-extrabold text-white shadow">= {rupees(total)}</span>
              <div className="h-0.5 flex-1 rounded bg-lilac-200" />
            </div>
            <Row label="Same as" detail={`${plural(fewestCount, 'piece', 'pieces')} · fewest`}>
              <PieceGroup parts={fewest} size="sm" />
            </Row>

          </div>

          <OtherWays key={total} total={total} yours={yours} />
        </>
      )}
      <Mascot message={tip} className="mt-auto" />
    </Panel>
  );
}

function Row({ label, detail, children }: { label: string; detail: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-extrabold uppercase tracking-wider text-ink/50">{label}</span>
        <span className="text-sm font-bold text-ink/45">{detail}</span>
      </div>
      {children}
    </div>
  );
}

/** Ways to make the total other than the fewest (shown above) and the money already on the table. */
function OtherWays({ total, yours }: { total: number; yours: Combination }) {
  const ways = alternativeCombinations(total)
    .slice(1)
    .filter((way) => signatureOf(way) !== signatureOf(yours));
  const [index, setIndex] = useState(0);
  if (!ways.length) return null;
  const way = ways[index];
  const go = (step: number) => setIndex((i) => (i + step + ways.length) % ways.length);

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-ink/5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-extrabold text-ink">Other ways to make it</h3>
        <span className="shrink-0 rounded-full bg-lilac-100 px-3 py-0.5 text-sm font-extrabold text-violet-700">
          Way {index + 1} of {ways.length}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <KidButton aria-label="Previous way" className="!px-3" onClick={() => go(-1)}>
          ◀
        </KidButton>
        <div className="min-h-[96px] flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-2"
            >
              <PieceGroup parts={way} size="xs" maxLoose={10} />
              <p className="text-center text-lg font-extrabold text-ink">{describeParts(way)}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <KidButton aria-label="Next way" className="!px-3" onClick={() => go(1)}>
          ▶
        </KidButton>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {ways.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show way ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-violet-500' : 'w-2.5 bg-lilac-200 hover:bg-lilac-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Before anything is on the table: show the big idea with a tiny looping example. */
function EmptyExample() {
  return (
    <div className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-ink/5">
      <p className="mb-4 text-lg font-extrabold text-ink">Small money can join up into big money!</p>
      <div className="flex items-center justify-center gap-2">
        <motion.div animate={{ x: [0, 14, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
          <Money value={10} size="sm" />
        </motion.div>
        <span className="text-2xl font-extrabold text-ink/50">+</span>
        <motion.div animate={{ x: [0, -14, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
          <Money value={10} size="sm" />
        </motion.div>
      </div>
      <div className="my-2 text-3xl font-extrabold text-violet-500">=</div>
      <motion.div className="flex justify-center" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.2, repeat: Infinity }}>
        <Money value={20} size="md" />
      </motion.div>
      <p className="mt-3 font-bold text-ink/60">₹10 + ₹10 = ₹20</p>
    </div>
  );
}
