import { useEffect, useMemo, useRef, useState } from 'react';
import { CHALLENGES, type Challenge } from '../lib/challenges';
import type { Denomination } from '../lib/currency';
import { useStoredState } from '../hooks/useStoredState';

export function useChallenges(values: Denomination[], onComplete: () => void) {
  const [on, setOn] = useState(false);
  const [index, setIndex] = useState(0);
  const [memory, setMemory] = useState<Record<string, string[]>>({});
  const [completed, setCompleted] = useStoredState<string[]>('money-master:stars', []);
  const [celebrating, setCelebrating] = useState<Challenge | null>(null);
  const satisfied = useRef<string | null>(null);

  const challenge = CHALLENGES[index];
  const remembered = memory[challenge.id];
  const status = useMemo(() => (on ? challenge.evaluate(values, remembered ?? []) : null), [on, challenge, values, remembered]);

  useEffect(() => {
    if (!status) return;
    const { remember } = status;
    if (remember && !(remembered ?? []).includes(remember)) {
      setMemory((m) => ({ ...m, [challenge.id]: [...(m[challenge.id] ?? []), remember] }));
    }
    if (!status.done) {
      satisfied.current = null;
      return;
    }
    // Celebrate once per success, not on every re-render while it stays solved.
    if (satisfied.current === challenge.id) return;
    satisfied.current = challenge.id;
    setCompleted((c) => (c.includes(challenge.id) ? c : [...c, challenge.id]));
    setCelebrating(challenge);
    onComplete();
  }, [status, challenge, remembered, setCompleted, onComplete]);

  const goTo = (i: number) => {
    const next = (i + CHALLENGES.length) % CHALLENGES.length;
    satisfied.current = null;
    setMemory((m) => ({ ...m, [CHALLENGES[next].id]: [] }));
    setIndex(next);
    setCelebrating(null);
  };

  return {
    on,
    toggle: () => {
      satisfied.current = null;
      setOn((v) => !v);
    },
    challenge,
    index,
    total: CHALLENGES.length,
    status,
    completed,
    celebrating,
    dismiss: () => setCelebrating(null),
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
  };
}
