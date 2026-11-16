import { AnimatedRupees, KidButton } from './ui';

interface Props {
  total: number;
  muted: boolean;
  onToggleMute(): void;
  onReset(): void;
  canReset: boolean;
}

export function Header({ total, muted, onToggleMute, onReset, canReset }: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 px-4 pt-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="relative grid size-14 place-items-center rounded-2xl bg-amber-300 shadow-[inset_0_-5px_0_rgba(0,0,0,0.12)] ring-4 ring-white">
          <span className="text-3xl font-extrabold text-amber-800">₹</span>
          <span className="absolute -right-1.5 -top-1.5 text-lg">✨</span>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold leading-none tracking-tight text-ink sm:text-4xl">
            Money <span className="text-saffron-500">Master</span>
          </h1>
          <p className="text-base font-bold text-ink/55">Learn Indian Money</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-1.5 shadow-sm ring-1 ring-ink/10">
          <span className="text-sm font-extrabold uppercase tracking-wider text-ink/50">Total</span>
          <AnimatedRupees value={total} className="text-3xl font-extrabold text-saffron-600" />
        </div>
        <KidButton aria-label={muted ? 'Turn sound on' : 'Turn sound off'} onClick={onToggleMute} className="!px-3 text-xl">
          {muted ? '🔇' : '🔊'}
        </KidButton>
        <KidButton variant="rose" onClick={onReset} disabled={!canReset} className="max-sm:!hidden">
          🧹 Reset
        </KidButton>
      </div>
    </header>
  );
}
