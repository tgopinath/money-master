import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Money, type MoneySize } from '../components/money/Money';
import type { Denomination } from '../lib/currency';

export type DropTarget = 'table' | 'bank' | null;

export interface DragPayload {
  source: 'bank' | 'table';
  value: Denomination;
  size: MoneySize;
  /** Set when dragging an item already on the table. */
  id?: string;
}

export interface DropInfo {
  target: DropTarget;
  /** Where the dragged piece's centre landed, in % of the table. */
  x: number;
  y: number;
}

interface DragContextValue {
  active: DragPayload | null;
  over: DropTarget;
  tableRef: RefObject<HTMLDivElement | null>;
  bankRef: RefObject<HTMLDivElement | null>;
  begin(e: React.PointerEvent<HTMLElement>, payload: DragPayload, onTap?: () => void): void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function useDrag() {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDrag must be used inside <DragProvider>');
  return ctx;
}

const START_DISTANCE = 6;
const inside = (el: HTMLElement | null, x: number, y: number) => {
  const r = el?.getBoundingClientRect();
  return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
};

interface Props {
  onDrop(payload: DragPayload, drop: DropInfo): void;
  disabled?: boolean;
  children: ReactNode;
}

/**
 * Pointer-event drag and drop: one code path for mouse, touch and pen.
 * The piece being dragged is drawn as a "ghost" that follows the finger without re-rendering React.
 */
export function DragProvider({ onDrop, disabled = false, children }: Props) {
  const [active, setActive] = useState<DragPayload | null>(null);
  const [over, setOver] = useState<DropTarget>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const overRef = useRef<DropTarget>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const begin = useCallback<DragContextValue['begin']>((e, payload, onTap) => {
    if (disabledRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.pointerType === 'mouse') e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const grab = { x: e.clientX - (rect.left + rect.width / 2), y: e.clientY - (rect.top + rect.height / 2) };
    const start = { x: e.clientX, y: e.clientY };
    const pointerId = e.pointerId;
    let dragging = false;

    const hit = (x: number, y: number): DropTarget =>
      inside(tableRef.current, x, y) ? 'table' : inside(bankRef.current, x, y) ? 'bank' : null;

    const place = (x: number, y: number) => {
      pos.current = { x: x - grab.x, y: y - grab.y };
      if (ghostRef.current) ghostRef.current.style.transform = ghostTransform(pos.current);
    };

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (!dragging) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < START_DISTANCE) return;
        dragging = true;
        document.body.classList.add('is-dragging');
        setActive(payload);
      }
      ev.preventDefault();
      place(ev.clientX, ev.clientY);
      const target = hit(ev.clientX, ev.clientY);
      if (target !== overRef.current) {
        overRef.current = target;
        setOver(target);
      }
    };

    const finish = (ev: PointerEvent, cancelled: boolean) => {
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      document.body.classList.remove('is-dragging');
      if (!dragging) {
        if (!cancelled) onTap?.();
        return;
      }
      if (!cancelled) {
        const r = tableRef.current?.getBoundingClientRect();
        const x = r ? ((pos.current.x - r.left) / r.width) * 100 : 50;
        const y = r ? ((pos.current.y - r.top) / r.height) * 100 : 50;
        onDropRef.current(payload, { target: hit(ev.clientX, ev.clientY), x, y });
      }
      overRef.current = null;
      setOver(null);
      // Let the dropped item render at its new spot before the ghost disappears.
      requestAnimationFrame(() => setActive(null));
    };
    const onUp = (ev: PointerEvent) => finish(ev, false);
    const onCancel = (ev: PointerEvent) => finish(ev, true);

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }, []);

  const value = useMemo(() => ({ active, over, tableRef, bankRef, begin }), [active, over, begin]);

  return (
    <DragContext.Provider value={value}>
      {children}
      {active &&
        createPortal(
          <div
            ref={ghostRef}
            className="pointer-events-none fixed left-0 top-0 z-[100] drop-shadow-[0_18px_22px_rgba(43,33,66,0.35)]"
            style={{ transform: ghostTransform(pos.current) }}
          >
            <Money value={active.value} size={active.size} />
          </div>,
          document.body,
        )}
    </DragContext.Provider>
  );
}

const ghostTransform = (p: { x: number; y: number }) =>
  `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(-5deg) scale(1.08)`;
