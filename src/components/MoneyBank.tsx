import { DENOMINATIONS, CURRENCY, type Denomination } from '../lib/currency';
import { useDrag } from '../drag/DragProvider';
import { Money, type MoneySize } from './money/Money';
import { Panel } from './ui';

const COINS = DENOMINATIONS.filter((d) => CURRENCY[d].kind === 'coin');
const NOTES = DENOMINATIONS.filter((d) => CURRENCY[d].kind === 'note');

export function MoneyBank({ size, onAdd, className }: { size: MoneySize; onAdd(value: Denomination): void; className?: string }) {
  const { bankRef, active, over } = useDrag();
  const returning = active?.source === 'table';

  return (
    <Panel tone="mint" step={1} className={className} title="Choose Your Money" subtitle="Drag onto the table — or just tap!" bodyClassName="relative xl:overflow-y-auto">
      <div ref={bankRef} className="relative h-full">
        <div className="flex gap-5 overflow-x-auto px-4 py-4 [scrollbar-width:thin] xl:block xl:overflow-visible xl:px-5">
          <div className="flex shrink-0 items-end gap-5 xl:mb-3 xl:justify-around xl:rounded-3xl xl:bg-mint-50 xl:py-3">
            {COINS.map((value) => (
              <BankItem key={value} value={value} size={size} onAdd={onAdd} />
            ))}
          </div>
          <div className="flex shrink-0 items-end gap-5 xl:grid xl:grid-cols-2 xl:items-start xl:gap-x-3 xl:gap-y-4">
            {NOTES.map((value) => (
              <BankItem key={value} value={value} size={size} onAdd={onAdd} />
            ))}
          </div>
        </div>
        {returning && (
          <div
            className={`pointer-events-none absolute inset-2 grid place-items-center rounded-3xl border-4 border-dashed text-center text-xl font-extrabold transition
              ${over === 'bank' ? 'border-rose-400 bg-rose-50/90 text-rose-600' : 'border-mint-300 bg-white/70 text-mint-700'}`}
          >
            {over === 'bank' ? 'Let go to put it back 👋' : 'Drag here to put money back'}
          </div>
        )}
      </div>
    </Panel>
  );
}

function BankItem({ value, size, onAdd }: { value: Denomination; size: MoneySize; onAdd(value: Denomination): void }) {
  const { begin } = useDrag();
  const meta = CURRENCY[value];
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Add ${meta.words}`}
      onPointerDown={(e) => begin(e, { source: 'bank', value, size }, () => onAdd(value))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd(value);
        }
      }}
      className="group flex shrink-0 cursor-grab touch-pan-x select-none flex-col items-center gap-1 rounded-2xl p-1 outline-none focus-visible:ring-4 focus-visible:ring-mint-300 xl:touch-pan-y"
    >
      <div className="relative transition duration-200 group-hover:-translate-y-1 group-hover:-rotate-2 group-active:scale-95">
        {/* a little stack hints "there's always more where this came from" */}
        <div className="absolute inset-0 translate-x-1 translate-y-1 opacity-40">
          <Money value={value} size={size} />
        </div>
        <div className="relative drop-shadow-[0_4px_6px_rgba(43,33,66,0.22)]">
          <Money value={value} size={size} />
        </div>
      </div>
      <span className="mt-1 rounded-full bg-white px-3 text-lg font-extrabold leading-7 text-ink shadow-sm ring-1 ring-ink/10">₹{value}</span>
      <span className="text-xs font-semibold text-ink/55">{meta.words}</span>
    </div>
  );
}
