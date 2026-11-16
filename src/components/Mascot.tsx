import { AnimatePresence, motion } from 'motion/react';

/** Gullu the piggy bank (गुल्लक) — the app's friendly guide. */
export function Piggy({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 72" className={className} aria-hidden="true">
      <ellipse cx="40" cy="68" rx="24" ry="3.5" fill="#2B2142" opacity="0.08" />
      <rect x="21" y="52" width="9" height="14" rx="4" fill="#F28AAB" />
      <rect x="47" y="52" width="9" height="14" rx="4" fill="#F28AAB" />
      <path d="M17 18 L22 4 L31 15 Z" fill="#F28AAB" />
      <path d="M50 15 L59 4 L63 18 Z" fill="#F28AAB" />
      <ellipse cx="40" cy="38" rx="30" ry="25" fill="#FFB6CB" />
      <ellipse cx="32" cy="25" rx="12" ry="6" fill="#fff" opacity="0.35" />
      <rect x="32" y="13.5" width="16" height="3.4" rx="1.7" fill="#C2537A" />
      <circle cx="40" cy="8" r="6" fill="#F5B53B" stroke="#7A4E00" strokeWidth="1" className="origin-center animate-coin-drop" />
      <circle cx="28" cy="35" r="3.6" fill="#2B2142" />
      <circle cx="52" cy="35" r="3.6" fill="#2B2142" />
      <circle cx="29.3" cy="33.7" r="1.2" fill="#fff" />
      <circle cx="53.3" cy="33.7" r="1.2" fill="#fff" />
      <ellipse cx="20" cy="43" rx="4.5" ry="3" fill="#FF8FB0" opacity="0.7" />
      <ellipse cx="60" cy="43" rx="4.5" ry="3" fill="#FF8FB0" opacity="0.7" />
      <ellipse cx="40" cy="45" rx="10" ry="7" fill="#FF8FB0" />
      <ellipse cx="36.5" cy="45" rx="1.8" ry="2.6" fill="#C2537A" />
      <ellipse cx="43.5" cy="45" rx="1.8" ry="2.6" fill="#C2537A" />
      <path d="M69 34 q7 -3 4 4 q-3 5 3 4" fill="none" stroke="#F28AAB" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Mascot({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Piggy className="w-16 shrink-0 animate-bob" />
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative mb-3 rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-[15px] font-semibold leading-snug text-ink shadow-sm ring-1 ring-ink/10"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
