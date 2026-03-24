'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimationConfig } from '@/app/animation-provider';
import { GeometricPattern } from './GeometricPattern';
import { AnimatedText } from './AnimatedText';
import { DhikrItem, Lang, translations } from './types';

interface DhikrSectionProps {
  lang: Lang;
  isRTL: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
  content: Record<string, string>;
  onLoad: (hasItems: boolean) => void;
}

export function DhikrSection({ lang, isRTL, secStyle, secLM, content, onLoad }: DhikrSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];

  const [dhikrItems, setDhikrItems] = useState<DhikrItem[]>([]);
  const [dhikrIndex, setDhikrIndex] = useState(0);
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [dhikrCompleted, setDhikrCompleted] = useState<Record<string, boolean>>({});
  const [dhikrBurst, setDhikrBurst] = useState(false);

  useEffect(() => {
    fetch('/api/admin/dhikr')
      .then(r => r.json())
      .then((items) => {
        if (!Array.isArray(items)) return;
        setDhikrItems(items);
        localStorage.setItem('mosque-hasDhikr', items.length > 0 ? '1' : '0');
        onLoad(items.length > 0);
        // Restore persisted counts and index from localStorage
        try {
          const stored = localStorage.getItem('mosque-dhikr');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.counts) setDhikrCounts(parsed.counts);
            if (parsed.completed) setDhikrCompleted(parsed.completed);
            if (typeof parsed.currentIndex === 'number') setDhikrIndex(parsed.currentIndex);
          }
        } catch { /* ignore */ }
      })
      .catch(() => {});
  }, [onLoad]);

  function saveDhikrState(counts: Record<string, number>, completed: Record<string, boolean>, index: number) {
    try { localStorage.setItem('mosque-dhikr', JSON.stringify({ counts, completed, currentIndex: index })); } catch { /* ignore */ }
  }

  function handleDhikrTap() {
    const item = dhikrItems[dhikrIndex];
    if (!item) return;
    if (dhikrCompleted[item.id]) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);
    const newCount = (dhikrCounts[item.id] ?? 0) + 1;
    const newCounts = { ...dhikrCounts, [item.id]: newCount };
    setDhikrCounts(newCounts);
    if (newCount >= item.target_count) {
      const newCompleted = { ...dhikrCompleted, [item.id]: true };
      setDhikrCompleted(newCompleted);
      setDhikrBurst(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 40, 80]);
      saveDhikrState(newCounts, newCompleted, dhikrIndex);
      const nextIdx = dhikrIndex + 1 < dhikrItems.length ? dhikrIndex + 1 : dhikrIndex;
      setTimeout(() => {
        setDhikrBurst(false);
        if (nextIdx !== dhikrIndex) {
          setDhikrIndex(nextIdx);
          saveDhikrState(newCounts, newCompleted, nextIdx);
        }
      }, 900);
    } else {
      saveDhikrState(newCounts, dhikrCompleted, dhikrIndex);
    }
  }

  function handleDhikrReset() {
    const item = dhikrItems[dhikrIndex];
    if (!item) return;
    const newCounts = { ...dhikrCounts, [item.id]: 0 };
    const newCompleted = { ...dhikrCompleted, [item.id]: false };
    setDhikrCounts(newCounts);
    setDhikrCompleted(newCompleted);
    setDhikrBurst(false);
    saveDhikrState(newCounts, newCompleted, dhikrIndex);
  }

  function handleDhikrNav(idx: number) {
    setDhikrIndex(idx);
    saveDhikrState(dhikrCounts, dhikrCompleted, idx);
  }

  const getDhikrMeaning = (d: DhikrItem) =>
    lang === 'ar' ? (d.meaning_ar || d.meaning_en) :
    lang === 'ku' ? (d.meaning_ku || d.meaning_en) : d.meaning_en;

  if (dhikrItems.length === 0) return null;

  const item = dhikrItems[dhikrIndex];
  const count = dhikrCounts[item?.id] ?? 0;
  const target = item?.target_count ?? 33;
  const isCompleted = !!dhikrCompleted[item?.id];
  const progress = Math.min(count / target, 1);
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * progress;
  const gap = circumference - dash;
  const dhikrTitle = content.dhikr_title || t.dhikrTitle;

  return (
    <section id="dhikr" style={secStyle} className="section-themed px-6 py-16 md:py-28 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>
      <GeometricPattern size={180} opacity={0.04}
        className="absolute top-6 right-6 hidden md:block pointer-events-none" />

      <div className="max-w-2xl mx-auto w-full relative z-10">
        <motion.div {...anim.sectionEntry} className="text-center mb-10 md:mb-14">
          <h2 className={`font-display text-3xl md:text-5xl ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-2 tracking-tight`}>
            <AnimatedText>{dhikrTitle}</AnimatedText>
          </h2>
          <p className={`text-base md:text-lg ${secLM ? 'text-amber-700/50' : 'text-amber-200/50'}`}>
            <AnimatedText>{t.dhikrSubtitle}</AnimatedText>
          </p>
        </motion.div>

        <motion.div {...anim.sectionEntry} className="flex flex-col items-center">
          {/* Dhikr phrase switcher dots */}
          {dhikrItems.length > 1 && (
            <div className="flex items-center gap-2 mb-8">
              {dhikrItems.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => handleDhikrNav(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === dhikrIndex
                      ? 'w-6 h-2.5 bg-amber-400'
                      : 'w-2.5 h-2.5 bg-amber-500/30 hover:bg-amber-500/60'
                  }`}
                  aria-label={it.transliteration}
                />
              ))}
            </div>
          )}

          {/* Arabic phrase + transliteration + meaning */}
          <AnimatePresence mode="wait">
            <motion.div
              key={item?.id}
              initial={anim.phraseInitial}
              animate={anim.phraseAnimate}
              exit={anim.phraseExit}
              transition={{ duration: anim.phraseDuration }}
              className="text-center mb-8 md:mb-10"
            >
              <p dir="rtl" className={`text-4xl md:text-5xl font-bold ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-3 leading-tight`} style={{ fontFamily: 'serif' }}>
                {item?.arabic_text}
              </p>
              <p className="text-xl md:text-2xl font-medium text-amber-400 mb-2 tracking-wide">
                {item?.transliteration}
              </p>
              <p className={`text-sm md:text-base ${secLM ? 'text-amber-700/50' : 'text-amber-200/50'}`}>
                {item && getDhikrMeaning(item)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Circular counter button */}
          <div className="relative mb-6">
            <AnimatePresence>
              {dhikrBurst && (
                <motion.div
                  key="burst"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none"
                />
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleDhikrTap}
              whileTap={isCompleted ? {} : { scale: 0.93 }}
              className={`relative w-52 h-52 md:w-64 md:h-64 rounded-full flex items-center justify-center select-none touch-manipulation focus:outline-none ${
                isCompleted ? 'cursor-default' : 'cursor-pointer active:scale-95'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="5" />
                <circle cx="50" cy="50" r={r} fill="none"
                  stroke={isCompleted ? 'rgba(245,158,11,0.9)' : 'rgba(245,158,11,0.7)'}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${dash} ${gap}`}
                  style={{ transition: 'stroke-dasharray 0.3s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
                />
              </svg>
              <div className={`absolute inset-3 rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-amber-500/20 shadow-theme-dhikr'
                  : secLM
                    ? 'bg-amber-600/10 hover:bg-amber-600/15 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]'
                    : 'bg-amber-950/60 hover:bg-amber-900/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]'
              }`} />
              <div className="relative z-10 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={count}
                    initial={{ scale: anim.isSimplified ? 1 : 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: anim.isSimplified ? 1 : 0.7, opacity: 0 }}
                    transition={anim.counterTransition}
                    className={`font-display leading-none font-bold tabular-nums text-5xl md:text-6xl ${
                      count === 0
                        ? (secLM ? 'text-amber-600/40' : 'text-amber-500/40')
                        : isCompleted
                          ? (secLM ? 'text-amber-700' : 'text-amber-300')
                          : (secLM ? 'text-amber-900' : 'text-amber-100')
                    }`}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
                {count === 0 && !isCompleted && (
                  <span className={`text-xs mt-1 tracking-widest uppercase ${secLM ? 'text-amber-600/50' : 'text-amber-500/40'}`}>{t.dhikrTap}</span>
                )}
                {isCompleted && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-amber-400 mt-1 tracking-widest uppercase"
                  >
                    {t.dhikrCompleted}
                  </motion.span>
                )}
              </div>
            </motion.button>
          </div>

          {/* Progress text + reset */}
          <div className="flex flex-col items-center gap-3">
            <p className={`text-sm tabular-nums ${secLM ? 'text-amber-600/60' : 'text-amber-500/60'}`}>
              <span className={`font-medium ${secLM ? 'text-amber-700' : 'text-amber-300'}`}>{count}</span>
              {' '}{t.dhikrOf}{' '}
              <span className={secLM ? 'text-amber-700/60' : 'text-amber-100/60'}>{target}</span>
            </p>
            {count > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                onClick={handleDhikrReset}
                className="text-xs text-amber-500/40 hover:text-amber-400 transition-colors tracking-widest uppercase px-4 py-2 rounded-full hover:bg-amber-500/10"
              >
                {t.dhikrReset}
              </motion.button>
            )}
          </div>

          {/* Prev / Next navigation arrows */}
          {dhikrItems.length > 1 && (
            <div className="flex items-center gap-8 mt-8">
              <button
                onClick={() => handleDhikrNav(Math.max(0, dhikrIndex - 1))}
                disabled={dhikrIndex === 0}
                className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Previous dhikr"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={isRTL ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
                </svg>
              </button>
              <span className="text-amber-500/30 text-xs tabular-nums">{dhikrIndex + 1} / {dhikrItems.length}</span>
              <button
                onClick={() => handleDhikrNav(Math.min(dhikrItems.length - 1, dhikrIndex + 1))}
                disabled={dhikrIndex === dhikrItems.length - 1}
                className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                aria-label="Next dhikr"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={isRTL ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
                </svg>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
