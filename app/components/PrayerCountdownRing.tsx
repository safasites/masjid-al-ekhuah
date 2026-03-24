'use client';

import { memo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAnimationConfig } from '@/app/animation-provider';
import { Prayer, Lang, translations, getNextPrayer, getActivePrayer } from './types';

interface PrayerCountdownRingProps {
  prayers: Prayer[];
  lang: Lang;
  secLM: boolean;
  isFriday: boolean;
  fridayHighlightEnabled: boolean;
}

function PrayerCountdownRingInner({ prayers, lang, secLM, isFriday, fridayHighlightEnabled }: PrayerCountdownRingProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];
  const [countdown, setCountdown] = useState('');
  const [minuteProgress, setMinuteProgress] = useState(0);
  const [nextPrayer, setNextPrayer] = useState('');

  useEffect(() => {
    if (!prayers.length) return;

    function tick() {
      const now = new Date();
      const totalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const nextId = getNextPrayer(prayers);
      setNextPrayer(nextId);
      const next = prayers.find(p => p.id === nextId);
      if (!next) { setCountdown(''); return; }
      const m = next.azan.match(/^(\d{1,2}):(\d{2})/);
      if (!m) { setCountdown(''); return; }
      let diff = (parseInt(m[1]) * 3600 + parseInt(m[2]) * 60) - totalSecs;
      if (diff < 0) diff += 86400;
      const h = Math.floor(diff / 3600);
      const mm = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      setCountdown(h > 0 ? `${h}h ${pad(mm)}m ${pad(s)}s` : `${pad(mm)}m ${pad(s)}s`);

      // Arc tracks the full interval from current prayer to next prayer
      const currentId = getActivePrayer(prayers);
      const current = prayers.find(p => p.id === currentId);
      let intervalProgress = 1 - (diff % 60) / 60; // fallback: per-minute
      if (current) {
        const cm = current.azan.match(/^(\d{1,2}):(\d{2})/);
        if (cm) {
          const startSecs = parseInt(cm[1]) * 3600 + parseInt(cm[2]) * 60;
          const endSecs   = parseInt(m[1])  * 3600 + parseInt(m[2])  * 60;
          let totalInterval = endSecs - startSecs;
          if (totalInterval <= 0) totalInterval += 86400;
          intervalProgress = 1 - diff / totalInterval;
        }
      }
      setMinuteProgress(Math.max(0, Math.min(1, intervalProgress)));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayers]);

  if (!countdown || !nextPrayer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: anim.isSimplified ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 relative pointer-events-auto"
    >
      <div className={`relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center ${anim.isSimplified ? '' : 'animate-ring-pulse'}`}>
        {/* Spinning outer decorative rings */}
        <motion.div {...anim.spinCW}
          className="absolute inset-0 rounded-full border border-amber-500/20" />
        <motion.div {...anim.spinCCW}
          className="absolute inset-2 rounded-full border border-amber-400/15" />
        {/* SVG progress arc — tracks seconds in current minute */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(245,158,11,0.08)" strokeWidth="2" />
          <circle cx="50" cy="50" r="46" fill="none"
            stroke="rgba(245,158,11,0.55)" strokeWidth="2" strokeLinecap="round"
            strokeDasharray={`${minuteProgress * 289.0} 289.0`}
            style={{ transition: 'stroke-dasharray 1s linear' }} />
        </svg>
        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-3">
          <p className={`text-xs uppercase tracking-widest mb-1 ${secLM ? 'text-stone-500' : 'text-amber-400/60'}`}>
            {t.nextPrayerCard}
          </p>
          <p className={`font-display text-xl font-semibold mb-1 ${secLM ? 'text-stone-900' : 'text-amber-100'}`}>
            {t.prayers[nextPrayer as keyof typeof t.prayers]}
          </p>
          <p dir="ltr" className={`font-display text-2xl md:text-3xl tabular-nums font-bold ${secLM ? 'text-stone-800' : 'text-amber-300'}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {countdown}
          </p>
        </div>
      </div>
      {/* Friday badge */}
      {isFriday && fridayHighlightEnabled && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-600 text-[#0a0804] text-[9px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 shadow-theme-glow">
          {t.jumuahSpecial}
        </div>
      )}
    </motion.div>
  );
}

// React.memo with custom equality: only re-render when prayers array reference or lang changes.
// prayers is set once from API and never mutated, so the ring almost never re-renders from page level.
export const PrayerCountdownRing = memo(PrayerCountdownRingInner, (prev, next) =>
  prev.prayers === next.prayers &&
  prev.lang === next.lang &&
  prev.secLM === next.secLM &&
  prev.isFriday === next.isFriday &&
  prev.fridayHighlightEnabled === next.fridayHighlightEnabled
);
