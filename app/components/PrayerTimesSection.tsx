'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar } from 'lucide-react';
import { useAnimationConfig } from '@/app/animation-provider';
import { GeometricPattern } from './GeometricPattern';
import { AnimatedText } from './AnimatedText';
import { PrayerData, Lang, translations, translateHijri, formatJamat, getNextPrayer } from './types';

interface PrayerTimesSectionProps {
  prayerData: PrayerData | null;
  prayerLoading: boolean;
  activePrayer: string;
  lang: Lang;
  isRTL: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
  content: Record<string, string>;
  isFriday: boolean;
  onOpenTimetable: () => void;
}

export function PrayerTimesSection({
  prayerData,
  prayerLoading,
  activePrayer,
  lang,
  isRTL,
  secStyle,
  secLM,
  content,
  isFriday,
  onOpenTimetable,
}: PrayerTimesSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];

  // Local countdown — scoped to this section only (doesn't affect rest of page)
  const [countdown, setCountdown] = useState('');
  const [nextPrayer, setNextPrayer] = useState('');

  useEffect(() => {
    if (!prayerData) return;
    function tick() {
      const now = new Date();
      const totalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const nextId = getNextPrayer(prayerData!.prayers);
      setNextPrayer(nextId);
      const next = prayerData!.prayers.find(p => p.id === nextId);
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
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerData]);

  return (
    <section id="times" style={secStyle} className="section-themed min-h-screen bg-gradient-to-b from-amber-900/40 via-amber-950/40 to-transparent backdrop-blur-3xl border-t border-amber-500/30 flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
      <GeometricPattern size={200} opacity={0.04}
        className="absolute top-8 right-8 hidden md:block pointer-events-none" />
      <div className="max-w-6xl w-full mx-auto">
        <motion.div {...anim.sectionEntry} className="text-center mb-16">
          <p className={`text-xs uppercase tracking-widest font-semibold mb-3 ${secLM ? 'text-amber-600/60' : 'text-amber-500/50'}`}>
            {t.birmingham}
          </p>
          <h2 className={`font-display text-4xl md:text-6xl lg:text-7xl ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-6 tracking-tight`}>
            <AnimatedText>{t.todaysPrayers}</AnimatedText>
          </h2>
          <div className={`flex items-center justify-center gap-4 text-sm md:text-base ${secLM ? 'text-amber-700/70' : 'text-amber-200/70'}`}>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              <AnimatedText>{t.birmingham}</AnimatedText>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
            <span dir="ltr">{prayerData ? translateHijri(prayerData.hijri, lang) : '—'}</span>
          </div>
        </motion.div>

        {/* Countdown pill */}
        {!prayerLoading && countdown && nextPrayer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} className="flex justify-center mb-6">
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-sm ${
              secLM
                ? 'bg-amber-100/80 border-amber-300/60 text-amber-800'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
            }`}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span className="text-sm font-medium">
                {t.nextPrayer}:&nbsp;
                <span className={`font-semibold ${secLM ? 'text-amber-700' : 'text-amber-300'}`}>
                  {t.prayers[nextPrayer as keyof typeof t.prayers]}
                </span>
                &nbsp;{t.prayerIn}&nbsp;
              </span>
              <span dir="ltr" className={`font-display text-base ${secLM ? 'text-amber-900' : 'text-amber-50'}`}
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {countdown}
              </span>
            </div>
          </motion.div>
        )}

        {/* Prayer rows */}
        {prayerLoading ? (
          <div className="flex flex-col gap-3 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto w-full">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="shimmer rounded-2xl h-[72px]" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 md:gap-3 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto w-full">
            {(prayerData?.prayers ?? []).map((prayer, index) => {
              const isActive = prayer.id === activePrayer;
              const isNext = prayer.id === nextPrayer && !isActive;
              return (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, x: anim.isSimplified ? 0 : (isRTL ? 30 : -30) }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: anim.isSimplified ? 0.15 : 0.5, delay: anim.isSimplified ? index * 0.03 : index * 0.07, ease: 'easeOut' }}
                  className={`relative flex items-center gap-4 rounded-2xl px-5 py-4 md:py-5 md:px-8 transition-all duration-500 ${
                    isActive
                      ? 'glass-md border border-amber-400/60 shadow-theme-glow bg-gradient-to-r from-amber-500/20 to-transparent'
                      : secLM
                        ? 'bg-white/60 border border-amber-600/20 hover:border-amber-600/35 hover:bg-white/75'
                        : 'glass border border-amber-500/10 hover:border-amber-500/30 hover:shadow-theme-soft'
                  }`}
                >
                  <div className="w-28 md:w-32 shrink-0 flex items-center gap-2">
                    <p className={`text-[13px] md:text-sm font-semibold tracking-wider uppercase ${isActive ? (secLM ? 'text-amber-900' : 'text-amber-200') : (secLM ? 'text-amber-700' : 'text-amber-500/80')}`}>
                      {t.prayers[prayer.id as keyof typeof t.prayers]}
                    </p>
                    {isActive && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[9px] font-semibold tracking-widest uppercase text-amber-400/60 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                        Next
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-center">
                    <p className={`text-[11px] md:text-xs uppercase tracking-widest mb-0.5 ${secLM ? 'text-amber-600/60' : 'text-amber-500/40'}`}>{t.azan}</p>
                    <p dir="ltr" className={`font-display text-base md:text-xl tracking-tight ${isActive ? (secLM ? 'text-amber-900' : 'text-white') : (secLM ? 'text-amber-800/80' : 'text-amber-100/70')}`}>
                      {prayer.azan || '—'}
                    </p>
                  </div>
                  <div className={`w-px self-stretch ${isActive ? 'bg-amber-400/20' : (secLM ? 'bg-amber-300/40' : 'bg-amber-800/30')}`} />
                  <div className="flex-1 text-center">
                    <p className={`text-[11px] md:text-xs uppercase tracking-widest mb-0.5 ${secLM ? 'text-amber-600/60' : 'text-amber-500/40'}`}>{t.jamat}</p>
                    <p dir="ltr" className={`font-display text-base md:text-xl tracking-tight ${isActive ? (secLM ? 'text-amber-700' : 'text-amber-300') : (secLM ? 'text-amber-700/70' : 'text-amber-400/70')}`}>
                      {prayer.jamat ? formatJamat(prayer.jamat, t) : '—'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Jumu'ah */}
        {prayerData?.jumuah && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
            className="mt-6 flex justify-center">
            <div className={`px-6 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 transition-all ${
              isFriday && content.friday_highlight_enabled !== 'false'
                ? 'bg-gradient-to-r from-amber-500/30 to-amber-700/20 border-2 border-amber-400/50 shadow-theme-glow animate-breathe'
                : secLM
                  ? 'bg-amber-100 border border-amber-300/60 text-amber-800'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
            }`}>
              {isFriday && content.friday_highlight_enabled !== 'false' && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/25 border border-amber-400/30 rounded-full px-2 py-0.5 shrink-0">
                  {t.jumuahSpecial}
                </span>
              )}
              <Calendar className={`w-4 h-4 ${secLM ? 'text-amber-600' : 'text-amber-400'}`} />
              <span><AnimatedText>{t.jumuah}</AnimatedText></span>
              <span dir="ltr" className={`font-display text-base ${secLM ? 'text-amber-700' : 'text-amber-400'}`}>{prayerData.jumuah}</span>
            </div>
          </motion.div>
        )}

        {/* View Full Timetable button */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }} className="mt-8 flex justify-center">
          <button onClick={onOpenTimetable}
            className={`px-8 py-4 rounded-full font-medium text-base transition-all duration-300 flex items-center justify-center gap-2 group hover:shadow-theme-glow ${secLM ? 'bg-amber-100/80 border border-amber-400/40 text-amber-800 hover:bg-amber-200/80' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'}`}>
            <AnimatedText>{t.viewFullTimetable}</AnimatedText>
            <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
