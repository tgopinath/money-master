import { motion } from 'motion/react';
import { countPieces, expandParts, type Combination } from '../lib/currency';
import { Money, type MoneySize } from './money/Money';

/**
 * Draws a combination of money. Small sets show every piece; bigger ones are
 * grouped as "piece × count" so the picture stays readable.
 */
export function PieceGroup({ parts, size = 'sm', maxLoose = 8 }: { parts: Combination; size?: MoneySize; maxLoose?: number }) {
  if (countPieces(parts) <= maxLoose) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {expandParts(parts).map((value, i) => (
          <motion.div
            key={`${value}-${i}`}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22, delay: i * 0.03 }}
            className="drop-shadow-sm"
          >
            <Money value={value} size={size} />
          </motion.div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {parts.map((p) => (
        <div key={p.value} className="relative drop-shadow-sm">
          <Money value={p.value} size={size} />
          <span className="absolute -right-2 -top-2 rounded-full bg-ink px-2 py-0.5 text-xs font-extrabold text-white shadow">×{p.count}</span>
        </div>
      ))}
    </div>
  );
}
