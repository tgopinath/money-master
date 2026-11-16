import type { ReactNode } from 'react';
import { KidButton } from './ui';

interface Props {
  muted: boolean;
  onToggleMute(): void;
  /** Main actions, shown at the top right. */
  actions: ReactNode;
}

export function Header({ muted, onToggleMute, actions }: Props) {
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

      <div className="ml-auto flex items-center gap-1.5 max-sm:w-full max-sm:justify-end sm:gap-2">
        {actions}
        <KidButton aria-label={muted ? 'Turn sound on' : 'Turn sound off'} onClick={onToggleMute} className="!px-3 text-xl">
          {muted ? '🔇' : '🔊'}
        </KidButton>
      </div>
    </header>
  );
}
