import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CURRENCY, groupValues, type Combination, type Denomination } from '../lib/currency';
import { plural, rupees } from '../lib/format';
import { useDrag } from '../drag/DragProvider';
import type { MoneyItem } from '../state/useMoney';
import { Money } from './money/Money';
import { AnimatedRupees, Panel } from './ui';

interface Props {
  items: MoneyItem[];
  total: number;
  onRemove(id: string): void;
  onTapMoney(value: Denomination): void;
  banner?: ReactNode;
  /** Buttons pinned to the bottom right of the card. */
  actions?: ReactNode;
}

export function MyMoney({ items, total, onRemove, onTapMoney, banner, actions }: Props) {
  const parts = groupValues(items.map((i) => i.value));
  const notes = items.filter((i) => CURRENCY[i.value].kind === 'note').length;
  const coins = items.length - notes;

  return (
    <Panel
      tone="peach"
      step={2}
      title="My Money"
      announce={
        items.length
          ? `My money. ${[notes && plural(notes, 'note', 'notes'), coins && plural(coins, 'coin', 'coins')].filter(Boolean).join(' and ')}. Total, ${rupees(total)}.`
          : 'My money. Put your money on this table.'
      }
      subtitle={
        items.length
          ? [notes && plural(notes, 'note', 'notes'), coins && plural(coins, 'coin', 'coins')].filter(Boolean).join(' · ')
          : 'Your money table'
      }
      right={
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-wider text-ink/50">Total</div>
          <AnimatedRupees value={total} className="text-4xl font-extrabold leading-none text-saffron-600 sm:text-5xl" />
        </div>
      }
      bodyClassName="flex flex-col gap-3 p-3 sm:p-4"
    >
      {banner}
      <MoneyTable items={items} onRemove={onRemove} onTapMoney={onTapMoney} />
      <CountMyMoney parts={parts} total={total} />
      {actions}
    </Panel>
  );
}

function MoneyTable({ items, onRemove, onTapMoney }: Omit<Props, 'total' | 'banner' | 'actions'>) {
  const { tableRef, begin, active, over } = useDrag();
  const adding = active?.source === 'bank';

  return (
    <div
      ref={tableRef}
      className={`table-mat relative min-h-[340px] flex-1 overflow-hidden rounded-3xl border-[3px] border-dashed transition-colors duration-200
        ${adding && over === 'table' ? 'border-saffron-500 bg-saffron-50' : adding ? 'border-saffron-300' : 'border-peach-200'}`}
    >
      <AnimatePresence>
        {items.length === 0 && !adding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center"
          >
            <div>
              <div className="mx-auto mb-3 flex w-fit animate-nudge items-center gap-2 opacity-70">
                <Money value={10} size="sm" />
                <span className="text-3xl">👉</span>
              </div>
              <p className="text-2xl font-extrabold text-ink/70">Drag money here!</p>
              <p className="font-semibold text-ink/50">or tap any note or coin to add it</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {adding && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[60] flex justify-center">
          <span className={`rounded-full px-4 py-1 text-lg font-extrabold shadow transition ${over === 'table' ? 'scale-110 bg-saffron-500 text-white' : 'bg-white text-saffron-600'}`}>
            {over === 'table' ? 'Let go to drop! ✨' : 'Drop it on the table'}
          </span>
        </div>
      )}

      <AnimatePresence>
        {items.map((item, index) => {
          const held = active?.id === item.id;
          return (
            <motion.div
              key={item.id}
              className="money-item absolute cursor-grab touch-none select-none"
              style={{ zIndex: index + 1, x: '-50%', y: '-50%' }}
              initial={{ left: `${item.x}%`, top: `${item.y}%`, scale: 0.2, opacity: 0, rotate: item.tilt - 30 }}
              animate={{ left: `${item.x}%`, top: `${item.y}%`, scale: 1, opacity: held ? 0 : 1, rotate: item.tilt }}
              exit={{ scale: 0, opacity: 0, rotate: item.tilt + 45, transition: { duration: 0.22 } }}
              transition={held ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 22 }}
              onPointerDown={(e) => begin(e, { source: 'table', id: item.id, value: item.value, size: 'md' }, () => onTapMoney(item.value))}
            >
              <div className="drop-shadow-[0_5px_6px_rgba(43,33,66,0.25)]">
                <Money value={item.value} size="md" />
              </div>
              <button
                type="button"
                aria-label={`Remove ₹${item.value}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(item.id)}
                className="remove-btn absolute -right-2.5 -top-2.5 grid size-7 place-items-center rounded-full bg-white text-base font-extrabold text-rose-500 shadow-md ring-1 ring-ink/10 transition hover:scale-110 hover:bg-rose-500 hover:text-white"
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** "Count My Money": each pile as count × value, then the sum. */
function CountMyMoney({ parts, total }: { parts: Combination; total: number }) {
  if (!parts.length) return null;
  return (
    <div className="rounded-3xl bg-peach-50 p-3 ring-1 ring-peach-200">
      <div className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-saffron-700">
        <span>🧮 Count my money</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <AnimatePresence initial={false}>
          {parts.map((p) => (
            <motion.div
              key={p.value}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex shrink-0 items-center gap-2 rounded-2xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-ink/5"
            >
              <Money value={p.value} size="xs" />
              <span className="whitespace-nowrap text-lg font-extrabold text-ink">
                {p.count} × ₹{p.value} <span className="text-ink/40">=</span> <span className="text-saffron-600">{rupees(p.count * p.value)}</span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {parts.length > 1 && (
        <p className="mt-2 text-center text-lg font-bold text-ink/70">
          {parts.map((p) => rupees(p.count * p.value)).join(' + ')} = <span className="font-extrabold text-saffron-600">{rupees(total)}</span>
        </p>
      )}
    </div>
  );
}
