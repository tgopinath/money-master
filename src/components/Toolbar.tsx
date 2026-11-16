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

export function Toolbar({ canUndo, hasMoney, challengeOn, stars, busy, onUndo, onReset, onTidy, onToggleChallenge }: Props) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <KidButton aria-label="Undo" onClick={onUndo} disabled={!canUndo || busy}>
        ↩️<span className="max-[420px]:hidden"> Undo</span>
      </KidButton>
      <KidButton aria-label="Tidy up" onClick={onTidy} disabled={!hasMoney || busy}>
        🗂️<span className="max-[420px]:hidden"> Tidy up</span>
      </KidButton>
      <KidButton aria-label="Reset" variant="rose" onClick={onReset} disabled={!hasMoney || busy}>
        🧹<span className="max-[420px]:hidden"> Reset</span>
      </KidButton>
      <KidButton variant={challengeOn ? 'violet' : 'mint'} aria-label={challengeOn ? 'Exit challenges' : 'Challenge mode'} onClick={onToggleChallenge} aria-pressed={challengeOn}>
        🏅 <span className="max-sm:hidden">{challengeOn ? 'Exit Challenges' : 'Challenge Mode'}</span>
        <span className="whitespace-nowrap rounded-full bg-white/25 px-2 text-base">⭐ {stars}</span>
      </KidButton>
    </div>
  );
}
