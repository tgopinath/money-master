import { CURRENCY, type Denomination } from '../../lib/currency';

export type MoneySize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

/** Pixels per real-world millimetre. Coins get a boost so little fingers can grab them. */
const PX_PER_MM: Record<MoneySize, number> = { xl: 1.25, lg: 1.05, md: 0.85, sm: 0.55, xs: 0.36 };
const COIN_BOOST = 2.3;

export function moneySize(value: Denomination, size: MoneySize) {
  const meta = CURRENCY[value];
  const k = PX_PER_MM[size];
  if (meta.kind === 'coin') {
    const d = Math.round(meta.diameterMm * k * COIN_BOOST);
    return { width: d, height: d };
  }
  return { width: Math.round(meta.widthMm * k), height: Math.round(meta.heightMm * k) };
}

/** Photos of real Indian currency (RBI specimens and 2019-series coins); see public/currency/CREDITS.md. */
export const moneyImage = (value: Denomination) =>
  `${import.meta.env.BASE_URL}currency/${CURRENCY[value].kind}-${value}.${CURRENCY[value].kind === 'coin' ? 'png' : 'jpg'}`;

export function Money({ value, size = 'md', className = '' }: { value: Denomination; size?: MoneySize; className?: string }) {
  const meta = CURRENCY[value];
  const { width, height } = moneySize(value, size);
  const isCoin = meta.kind === 'coin';
  return (
    <img
      src={moneyImage(value)}
      alt={`${value} rupee ${meta.kind}`}
      width={width}
      height={height}
      draggable={false}
      decoding="async"
      className={`pointer-events-none block max-w-none select-none ${isCoin ? 'rounded-full' : 'rounded-[3px] object-cover ring-1 ring-black/10'} ${className}`}
      style={{ width, height }}
    />
  );
}
