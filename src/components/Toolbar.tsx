import { KidButton } from './ui';

interface TableActionsProps {
  canUndo: boolean;
  hasMoney: boolean;
  onUndo(): void;
  onReset(): void;
  onTidy(): void;
}

/** Undo / Tidy up / Reset, shown at the bottom right of the My Money card. */
export function TableActions({ canUndo, hasMoney, onUndo, onReset, onTidy }: TableActionsProps) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <KidButton aria-label="Undo" onClick={onUndo} disabled={!canUndo}>
        ↩️<span className="max-[420px]:hidden"> Undo</span>
      </KidButton>
      <KidButton aria-label="Tidy up" onClick={onTidy} disabled={!hasMoney}>
        🗂️<span className="max-[420px]:hidden"> Tidy up</span>
      </KidButton>
      <KidButton aria-label="Reset" variant="rose" onClick={onReset} disabled={!hasMoney}>
        🧹<span className="max-[420px]:hidden"> Reset</span>
      </KidButton>
    </div>
  );
}

interface ChallengeToggleProps {
  on: boolean;
  stars: number;
  onToggle(): void;
}

export function ChallengeToggle({ on, stars, onToggle }: ChallengeToggleProps) {
  return (
    <KidButton variant={on ? 'violet' : 'mint'} aria-label={on ? 'Exit challenges' : 'Challenge mode'} onClick={onToggle} aria-pressed={on}>
      🏅 <span className="max-sm:hidden">{on ? 'Exit Challenges' : 'Challenge Mode'}</span>
      <span className="whitespace-nowrap rounded-full bg-white/25 px-2 text-base">⭐ {stars}</span>
    </KidButton>
  );
}
