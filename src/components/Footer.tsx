import { KidButton } from './ui';

interface Props {
  canUndo: boolean;
  hasMoney: boolean;
  challengeOn: boolean;
  stars: number;
  busy: boolean;
  onUndo(): void;
  onReset(): void;
  onTidy(): void;
  onToggleChallenge(): void;
}

export function Footer({ canUndo, hasMoney, challengeOn, stars, busy, onUndo, onReset, onTidy, onToggleChallenge }: Props) {
  return (
    <footer className="sticky bottom-0 z-40 flex items-center justify-center gap-1.5 border-t border-ink/5 bg-cream/85 px-4 py-3 backdrop-blur sm:gap-3 xl:static xl:border-0 xl:bg-transparent xl:pt-0 xl:backdrop-blur-none">
      <KidButton aria-label="Undo" onClick={onUndo} disabled={!canUndo || busy}>
        ↩️<span className="max-[420px]:hidden"> Undo</span>
      </KidButton>
      <KidButton aria-label="Tidy up" onClick={onTidy} disabled={!hasMoney || busy}>
        🗂️<span className="max-[420px]:hidden"> Tidy up</span>
      </KidButton>
      <KidButton aria-label="Reset" variant="rose" onClick={onReset} disabled={!hasMoney || busy}>
        🧹<span className="max-[420px]:hidden"> Reset</span>
      </KidButton>
      <KidButton variant={challengeOn ? 'violet' : 'mint'} className="sm:px-6 sm:py-3 sm:text-xl" onClick={onToggleChallenge} aria-pressed={challengeOn}>
        🏅 <span className="max-sm:hidden">{challengeOn ? 'Exit Challenges' : 'Challenge Mode'}</span><span className="sm:hidden">{challengeOn ? 'Exit' : 'Challenges'}</span>
        <span className="rounded-full bg-white/25 px-2 text-base">⭐ {stars}</span>
      </KidButton>
    </footer>
  );
}
