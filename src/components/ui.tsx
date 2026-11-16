import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { animate, motion } from 'motion/react';
import { rupees } from '../lib/format';
import { say, speakable } from '../lib/sound';

export type Tone = 'mint' | 'peach' | 'lilac';

const TONES: Record<Tone, { header: string; badge: string }> = {
  mint: { header: 'bg-mint-100', badge: 'bg-mint-500' },
  peach: { header: 'bg-peach-100', badge: 'bg-saffron-500' },
  lilac: { header: 'bg-lilac-100', badge: 'bg-violet-500' },
};

interface PanelProps {
  tone: Tone;
  step: number;
  title: string;
  subtitle: string;
  /** What the title's speaker reads aloud; defaults to the title and subtitle. */
  announce?: string;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({ tone, step, title, subtitle, announce, right, className = '', bodyClassName = '', children }: PanelProps) {
  const t = TONES[tone];
  return (
    <section className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] bg-white/85 shadow-panel ring-1 ring-ink/5 ${className}`}>
      <header className={`flex items-center gap-3 px-5 py-3 ${t.header}`}>
        <span className={`grid size-9 shrink-0 place-items-center rounded-full text-lg font-extrabold text-white shadow-sm ${t.badge}`}>{step}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">
            <button
              type="button"
              aria-label={`${title}, read aloud`}
              onClick={() => say(speakable(announce ?? `${title}. ${subtitle}`))}
              className="group inline-flex max-w-full items-center gap-2 rounded-xl text-left outline-none focus-visible:ring-4 focus-visible:ring-saffron-300"
            >
              <span className="truncate">{title}</span>
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-white/80 text-sm shadow-sm ring-1 ring-ink/10 transition group-hover:scale-110 group-active:scale-95"
              >
                🔊
              </span>
            </button>
          </h2>
          <p className="truncate text-sm font-semibold text-ink/60">{subtitle}</p>
        </div>
        {right}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

type Variant = 'saffron' | 'violet' | 'mint' | 'white' | 'rose';
const VARIANTS: Record<Variant, string> = {
  saffron: 'bg-saffron-500 text-white border-saffron-700',
  violet: 'bg-violet-500 text-white border-violet-700',
  mint: 'bg-mint-500 text-white border-mint-700',
  rose: 'bg-rose-400 text-white border-rose-600',
  white: 'bg-white text-ink border-ink/15',
};

export function KidButton({
  variant = 'white',
  big = false,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; big?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex select-none items-center justify-center gap-2 rounded-2xl border-b-4 font-extrabold transition
        hover:brightness-105 active:translate-y-0.5 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0 disabled:active:border-b-4
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-saffron-300
        ${big ? 'px-6 py-3 text-xl' : 'px-4 py-2 text-base'} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** A rupee amount that counts up/down smoothly and does a little bounce when it changes. */
export function AnimatedRupees({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useEffect(() => {
    const controls = animate(shown.current, value, {
      duration: 0.55,
      ease: 'easeOut',
      onUpdate: (v) => {
        shown.current = v;
        if (ref.current) ref.current.textContent = rupees(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value]);
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.18 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className={`inline-block tabular-nums ${className}`}
    >
      <span ref={ref}>{rupees(value)}</span>
    </motion.span>
  );
}
