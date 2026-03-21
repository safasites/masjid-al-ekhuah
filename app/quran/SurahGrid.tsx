'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, ChevronDown, BookOpen, ArrowUp, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '../animation-provider';
import { useTheme, isLightTheme } from '../theme-provider';
import type { Chapter } from './page';

type Lang = 'en' | 'ku' | 'ar';

const tajweedRules = [
  { cls: 'ham_wasl',           color: '#9CA3AF', name: 'Hamzat Wasl' },
  { cls: 'slnt',               color: '#9CA3AF', name: 'Silent' },
  { cls: 'madda_normal',       color: '#3B82F6', name: 'Madd Normal' },
  { cls: 'madda_permissible',  color: '#60A5FA', name: 'Madd Permissible' },
  { cls: 'madda_obligatory',   color: '#1D4ED8', name: 'Madd Obligatory' },
  { cls: 'madda_necessary',    color: '#1E3A8A', name: 'Madd Necessary' },
  { cls: 'qalaqah',            color: '#F97316', name: 'Qalqalah' },
  { cls: 'ghunnah',            color: '#16A34A', name: 'Ghunnah' },
  { cls: 'ikhafa',             color: '#4ADE80', name: 'Ikhfāʾ' },
  { cls: 'ikhafa_shafawi',     color: '#2DD4BF', name: 'Ikhfāʾ Shafawī' },
  { cls: 'idgham_ghunnah',     color: '#15803D', name: 'Idghām with Ghunnah' },
  { cls: 'idgham_wo_ghunnah',  color: '#65A30D', name: 'Idghām without Ghunnah' },
  { cls: 'idgham_shafawi',     color: '#059669', name: 'Idghām Shafawī' },
  { cls: 'iqlab',              color: '#9333EA', name: 'Iqlab' },
  { cls: 'lam_shamsiyah',      color: '#9F1239', name: 'Lam Shamsiyyah' },
  { cls: 'noon_toone_tashdeed',color: '#B91C1C', name: 'Noon/Tanween Tashdeed' },
];

export default function SurahGrid({ chapters }: { chapters: Chapter[] }) {
  const router = useRouter();
  const anim = useAnimationConfig();
  const { theme } = useTheme();
  const lightMode = isLightTheme(theme);

  const [search, setSearch] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const bg = lightMode ? 'bg-[#f8f5ee]' : 'bg-[#0a0804]';
  const isRTL = lang === 'ar' || lang === 'ku';

  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filtered = chapters.filter(ch => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(ch.id).includes(q) ||
      ch.name_simple.toLowerCase().includes(q) ||
      ch.translated_name.name.toLowerCase().includes(q)
    );
  });

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className={`min-h-screen ${bg} selection:bg-amber-500/30 selection:text-amber-100 px-6 py-16 md:py-24 relative overflow-hidden pb-24 md:pb-8`}>
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-amber-400/70 hover:text-amber-300 transition-colors mb-12 group"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
          <span className="text-sm font-medium">Back to Home</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: anim.isSimplified ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: anim.isSimplified ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-amber-400" />
            <h1 className="font-display text-4xl md:text-6xl text-amber-50 tracking-tight">The Noble Quran</h1>
          </div>
          <p className="text-amber-200/60 text-base md:text-lg">Browse all 114 surahs — tap any to read with tajweed, translation, and audio</p>
        </motion.div>

        {/* Search + Tajweed Guide toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search surah name, number, or meaning…"
              className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border text-sm ${
                lightMode
                  ? 'bg-amber-50 border-amber-300/40 text-amber-900 placeholder:text-amber-400'
                  : 'bg-amber-950/30 border-amber-500/20 text-amber-100 placeholder:text-amber-500/40'
              } outline-none focus:border-amber-500/50 transition-colors`}
            />
          </div>
          <button
            onClick={() => setShowGuide(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/8 text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/15 transition-all text-sm whitespace-nowrap"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showGuide ? 'rotate-180' : ''}`} />
            Tajweed Colour Guide
          </button>
        </div>

        {/* Tajweed Colour Guide (collapsible) */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mb-8 p-5 rounded-3xl border border-amber-500/15 bg-amber-950/20">
                <p className="text-amber-400/60 text-xs font-medium uppercase tracking-wider mb-4">Tajweed Rules — Colour Key</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {tajweedRules.map(rule => (
                    <div key={rule.cls} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rule.color }} />
                      <span className="text-xs text-amber-200/60">{rule.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {search && (
          <p className="text-amber-500/50 text-xs mb-4">
            {filtered.length} surah{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Surah grid */}
        {chapters.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
            <p className="text-amber-500/50 text-xl font-display">Unable to load surahs</p>
            <p className="text-amber-500/30 text-sm mt-2">Please check your connection and refresh</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-amber-500/20 mx-auto mb-3" />
            <p className="text-amber-500/40 text-lg">No surahs match &quot;{search}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((ch, i) => (
              <motion.div
                key={ch.id}
                initial={anim.isSimplified ? { opacity: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: anim.isSimplified ? 0.15 : 0.4, delay: anim.isSimplified ? 0 : Math.min(i * 0.02, 0.5) }}
              >
                <Link
                  href={`/quran/${ch.id}`}
                  className={`block rounded-2xl border p-4 group hover:border-amber-500/35 hover:-translate-y-0.5 transition-all duration-200 ${
                    lightMode
                      ? 'border-amber-300/30 bg-amber-50 hover:bg-amber-100/60'
                      : 'border-amber-500/15 bg-amber-950/20 hover:bg-amber-900/25'
                  }`}
                >
                  {/* Number + revelation badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 font-mono text-xs font-medium shrink-0">
                      {ch.id}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium uppercase tracking-wide ${
                      ch.revelation_place === 'makkah'
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400/70'
                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400/70'
                    }`}>
                      {ch.revelation_place === 'makkah' ? 'Makki' : 'Madani'}
                    </span>
                  </div>

                  {/* Arabic name */}
                  <p className="font-arabic text-xl text-amber-100 text-right mb-1 leading-relaxed group-hover:text-amber-50 transition-colors">
                    {ch.name_arabic}
                  </p>

                  {/* English name + translation */}
                  <p className="text-amber-200/80 text-sm font-medium leading-tight mb-0.5">{ch.name_simple}</p>
                  <p className="text-amber-500/50 text-xs leading-tight">{ch.translated_name.name}</p>

                  {/* Verse count */}
                  <p className="text-amber-500/35 text-[10px] mt-2">{ch.verses_count} verses</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Back to Top ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hidden md:flex fixed z-40 bottom-8 right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-theme-soft hover:shadow-theme-glow hover:-translate-y-1"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-2 w-full max-w-xs">
        <div className="bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-full p-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
          <Link href="/" className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-100/50 hover:text-amber-300 transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <button className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-400 transition-colors" disabled>
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Surahs</span>
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-100/50 hover:text-amber-300 transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Top</span>
          </button>
        </div>
      </div>
    </main>
  );
}
