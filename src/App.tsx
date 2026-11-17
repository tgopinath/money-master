import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DENOMINATIONS, isCoin, sumValues, type Denomination } from './lib/currency';
import { say, setMuted, sfx, spokenRupees } from './lib/sound';
import { useMoney, type Point } from './state/useMoney';
import { useChallenges } from './state/useChallenges';
import { useStoredState } from './hooks/useStoredState';
import { useMediaQuery } from './hooks/useMediaQuery';
import { DragProvider, type DragPayload, type DropInfo } from './drag/DragProvider';
import { Header } from './components/Header';
import { ChallengeToggle, TableActions } from './components/Toolbar';
import { MoneyBank } from './components/MoneyBank';
import { MyMoney } from './components/MyMoney';
import { Converter } from './components/Converter';
import { ChallengeCard } from './components/ChallengeCard';
import { Celebration } from './components/Celebration';
import { moneyImage } from './components/money/Money';
import { backState, m3, muteAction, TITLES, VIEW_OF_HASH, type View } from './lib/m3';

export default function App() {
  const money = useMoney();
  useEffect(() => DENOMINATIONS.forEach((d) => void (new Image().src = moneyImage(d))), []);
  const { items } = money;
  const values = useMemo(() => items.map((i) => i.value), [items]);
  const total = sumValues(values);

  const [muted, setMutedState] = useStoredState('money-master:muted', false);
  useEffect(() => setMuted(muted), [muted]);

  const onChallengeDone = useCallback(() => sfx.win(), []);
  const challenges = useChallenges(values, onChallengeDone);

  // Android app (M3): three destinations, Play, Challenges and Bigger money, from the URL hash
  const [view, setView] = useState<View>(() => VIEW_OF_HASH(location.hash));
  useEffect(() => {
    if (!m3.enabled) return;
    const onHash = () => setView(VIEW_OF_HASH(location.hash));
    const onMute = () => setMutedState((m) => !m);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('mm:mute', onMute);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('mm:mute', onMute); };
  }, [setMutedState]);
  useEffect(() => {
    if (!m3.enabled) return;
    document.documentElement.dataset.mmView = view;
    m3.setTitle(TITLES[view]);
    if (challenges.on !== (view === 'challenges')) challenges.toggle();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  useEffect(() => { if (m3.enabled) m3.setActions([muteAction(muted)]); }, [muted]);
  useEffect(() => {
    if (!m3.enabled) return;
    const box = document.querySelector('.md-nav-item[data-dest="challenges"] .md-nav-indicator');
    if (!box) return;
    let b = box.querySelector<HTMLElement>('.md-badge');
    if (!b) { b = document.createElement('span'); b.className = 'md-badge md-badge--large'; box.appendChild(b); }
    b.textContent = String(challenges.completed.length);
    b.hidden = challenges.completed.length === 0;
    b.setAttribute('aria-label', `${challenges.completed.length} stars`);
  }, [challenges.completed.length]);
  backState.celebrating = !!challenges.celebrating;
  useEffect(() => {
    const onDismiss = () => challenges.dismiss();
    window.addEventListener('mm:dismiss', onDismiss);
    return () => window.removeEventListener('mm:dismiss', onDismiss);
  }, [challenges]);

  const bankSize = useMediaQuery('(min-width: 1280px)') ? 'lg' : 'md';

  const add = useCallback(
    (value: Denomination, at?: Point) => {
      money.add(value, at);
      (isCoin(value) ? sfx.coin : sfx.note)();
      say(`${spokenRupees(value)}. Total, ${spokenRupees(total + value)}.`);
    },
    [money, total],
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        money.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [money]);

  return (
    <DragProvider onDrop={handleDrop}>
      <div className="flex min-h-dvh flex-col xl:h-dvh xl:min-h-[720px]">
        <Header
          muted={muted}
          onToggleMute={() => setMutedState((m) => !m)}
          actions={<ChallengeToggle on={challenges.on} stars={challenges.completed.length} onToggle={challenges.toggle} />}
        />

        <main className="mm-main grid min-h-0 flex-1 gap-4 p-4 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)] xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.45fr)_minmax(330px,1fr)]">
          <MoneyBank size={bankSize} onAdd={add} className="lg:col-span-2 xl:col-span-1" />
          <MyMoney
            items={items}
            total={total}
            onRemove={remove}
            onTapMoney={(value) => say(spokenRupees(value))}
            actions={
              <TableActions canUndo={money.canUndo} hasMoney={items.length > 0} onUndo={money.undo} onReset={money.reset} onTidy={money.tidy} />
            }
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
          <Converter items={items} total={total} />
        </main>

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
