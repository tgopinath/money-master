import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { findExchange, isCoin, sumValues, type Denomination, type Exchange } from './lib/currency';
import { setMuted, sfx } from './lib/sound';
import { useMoney, type Point } from './state/useMoney';
import { useChallenges } from './state/useChallenges';
import { useStoredState } from './hooks/useStoredState';
import { useMediaQuery } from './hooks/useMediaQuery';
import { DragProvider, type DragPayload, type DropInfo } from './drag/DragProvider';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MoneyBank } from './components/MoneyBank';
import { MyMoney, type Merge } from './components/MyMoney';
import { Converter } from './components/Converter';
import { ChallengeCard } from './components/ChallengeCard';
import { Celebration } from './components/Celebration';
import { moneyImage } from './components/money/Money';
import { DENOMINATIONS } from './lib/currency';

const MERGE_MS = 800;

export default function App() {
  const money = useMoney();
  useEffect(() => DENOMINATIONS.forEach((d) => void (new Image().src = moneyImage(d))), []);
  const { items } = money;
  const values = useMemo(() => items.map((i) => i.value), [items]);
  const total = sumValues(values);
  const nextExchange = useMemo(() => findExchange(items), [items]);

  const [muted, setMutedState] = useStoredState('money-master:muted', false);
  useEffect(() => setMuted(muted), [muted]);

  const [exchanging, setExchanging] = useState<{ exchange: Exchange; merge: Merge } | null>(null);
  const [flash, setFlash] = useState<(Point & { key: number }) | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onChallengeDone = useCallback(() => sfx.win(), []);
  const challenges = useChallenges(values, onChallengeDone);

  const bankSize = useMediaQuery('(min-width: 1280px)') ? 'lg' : 'md';

  const add = useCallback(
    (value: Denomination, at?: Point) => {
      money.add(value, at);
      (isCoin(value) ? sfx.coin : sfx.note)();
    },
    [money],
  );

  const remove = useCallback(
    (id: string) => {
      money.remove(id);
      sfx.remove();
    },
    [money],
  );

  const handleDrop = useCallback(
    (payload: DragPayload, drop: DropInfo) => {
      if (payload.source === 'bank') {
        if (drop.target === 'table') add(payload.value, drop);
      } else if (payload.id) {
        if (drop.target === 'table') money.move(payload.id, drop);
        else remove(payload.id);
      }
    },
    [add, remove, money],
  );

  const runExchange = () => {
    if (!nextExchange || exchanging) return;
    const chosen = items.filter((i) => nextExchange.ids.includes(i.id));
    const at = {
      x: sumValues(chosen.map((i) => i.x)) / chosen.length,
      y: sumValues(chosen.map((i) => i.y)) / chosen.length,
    };
    setExchanging({ exchange: nextExchange, merge: { ids: nextExchange.ids, ...at } });
    sfx.whoosh();
    timer.current = window.setTimeout(() => {
      money.exchange(nextExchange.ids, nextExchange.to, at);
      setExchanging(null);
      setFlash({ ...at, key: Date.now() });
      sfx.exchange();
    }, MERGE_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !exchanging) {
        e.preventDefault();
        money.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [money, exchanging]);

  return (
    <DragProvider onDrop={handleDrop} disabled={!!exchanging}>
      <div className="flex min-h-dvh flex-col xl:h-dvh xl:min-h-[720px]">
        <Header
          total={total}
          muted={muted}
          onToggleMute={() => setMutedState((m) => !m)}
          onReset={money.reset}
          canReset={items.length > 0 && !exchanging}
        />

        <main className="grid min-h-0 flex-1 gap-4 p-4 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)] xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.45fr)_minmax(330px,1fr)]">
          <MoneyBank size={bankSize} onAdd={add} className="lg:col-span-2 xl:col-span-1" />
          <MyMoney
            items={items}
            total={total}
            merging={exchanging?.merge ?? null}
            flash={flash}
            onRemove={remove}
            banner={
              <AnimatePresence>
                {challenges.on && (
                  <ChallengeCard
                    challenge={challenges.challenge}
                    index={challenges.index}
                    status={challenges.status}
                    completed={challenges.completed}
                    onPrev={challenges.prev}
                    onNext={challenges.next}
                  />
                )}
              </AnimatePresence>
            }
          />
          <Converter
            items={items}
            total={total}
            nextExchange={nextExchange}
            exchanging={exchanging?.exchange ?? null}
            onExchange={runExchange}
          />
        </main>

        <Footer
          canUndo={money.canUndo}
          hasMoney={items.length > 0}
          challengeOn={challenges.on}
          stars={challenges.completed.length}
          busy={!!exchanging}
          onUndo={money.undo}
          onReset={money.reset}
          onTidy={money.tidy}
          onToggleChallenge={challenges.toggle}
        />
        <p className="px-4 pb-2 text-center text-[11px] font-semibold text-ink/35">
          Currency images: Reserve Bank of India specimens &amp; Wikimedia Commons (GODL-India, CC0)
        </p>
      </div>

      <AnimatePresence>
        {challenges.celebrating && (
          <Celebration
            challenge={challenges.celebrating}
            message={challenges.status?.message ?? ''}
            onStay={challenges.dismiss}
            onNext={() => {
              money.reset();
              challenges.next();
            }}
          />
        )}
      </AnimatePresence>
    </DragProvider>
  );
}
