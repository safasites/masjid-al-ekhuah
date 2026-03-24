'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup, useAnimationControls } from 'motion/react';
import {
  MapPin, Globe, Home, BookOpen, BookMarked, Calendar, LayoutGrid,
  Info, Menu, Settings, ArrowRight,
} from 'lucide-react';
import { useAnimationConfig } from '@/app/animation-provider';
import { AnimatedText } from './AnimatedText';
import { Lang, translations, nextLang } from './types';

interface SiteNavProps {
  lang: Lang;
  content: Record<string, string>;
  isRTL: boolean;
  scrolled: boolean;
  bannerVisible: boolean;
  bannerHeight: number;
  activeSection: string;
  activeMobileTab: string;
  showEvents: boolean;
  showCourses: boolean;
  showDonate: boolean;
  showDhikr: boolean;
  hasDhikrCached: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
  onLangChange: (lang: Lang) => void;
  onMobileTabChange: (tab: string) => void;
}

export function SiteNav({
  lang,
  content,
  isRTL,
  scrolled,
  bannerVisible,
  bannerHeight,
  activeSection,
  activeMobileTab,
  showEvents,
  showCourses,
  showDonate,
  showDhikr,
  hasDhikrCached,
  secStyle,
  secLM,
  onLangChange,
  onMobileTabChange,
}: SiteNavProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pinControls = useAnimationControls();

  const handlePinInteraction = useCallback(async () => {
    await pinControls.start({ y: -10, rotate: 360, scale: 1.2, transition: { duration: 0.6, type: 'spring', bounce: 0.5 } });
    pinControls.start({ y: 0, rotate: 0, scale: 1, transition: { duration: 0.3 } });
  }, [pinControls]);

  return (
    <>
      {/* ── Desktop Navigation ────────────────────────────────────── */}
      <header
        style={{
          ...secStyle,
          ...(scrolled ? {} : { backgroundColor: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' }),
          top: bannerVisible ? bannerHeight : 0,
        }}
        className={`section-themed fixed left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass border-b border-amber-500/15 py-4' : 'py-6'
        }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <motion.div {...anim.spinCW}
                className="absolute inset-0 border border-amber-500/40 rounded-full group-hover:border-amber-400/80 transition-colors duration-500" />
              <motion.div {...anim.spinCCW}
                className="absolute inset-1 border border-amber-400/30 rounded-full group-hover:border-amber-300/60 transition-colors duration-500" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-400 group-hover:scale-110 transition-transform duration-500">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <span className={`font-display font-medium text-lg md:text-xl tracking-wide whitespace-nowrap ${secLM ? 'text-amber-900' : 'text-amber-50'}`}>
              {content.mosque_name || 'Masjid Al-Ekhuah'}
            </span>
          </motion.div>

          {/* Desktop nav */}
          <LayoutGroup>
          <nav className="hidden lg:flex items-center gap-8">
            {Object.entries(t.nav).filter(([key]) => {
              // Page-link items (courses, quran) are rendered on the right side with action buttons
              if (key === 'quran' || key === 'courses') return false;
              if (key === 'dhikr')   return showDhikr && hasDhikrCached;
              if (key === 'events')  return showEvents;
              if (key === 'donate')  return showDonate;
              return true;
            }).map(([key, item], i) => {
              const isActive = activeSection === key;
              const href = key === 'events' ? '#events' : `#${key}`;
              return (
                <motion.a key={key} href={href} layout
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className={`text-sm font-medium tracking-wide relative group transition-colors duration-300 ${
                    isActive
                      ? (secLM ? 'text-amber-600' : 'text-amber-400')
                      : (secLM ? 'text-amber-700/70 hover:text-amber-600' : 'text-amber-100/60 hover:text-amber-400')
                  }`}>
                  <AnimatedText>{item}</AnimatedText>
                  {isActive ? (
                    <motion.span
                      layoutId="active-nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[1px] bg-amber-400 shadow-theme-nav"
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 transition-all duration-300 group-hover:w-full" />
                  )}
                </motion.a>
              );
            })}
          </nav>
          </LayoutGroup>

          <motion.div initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center gap-2 md:gap-3">
            {/* Page-link pills — Courses and Quran, grouped with action buttons on the right */}
            {showCourses && (
              <a href="/courses"
                className={`hidden lg:flex items-center text-sm font-medium px-3 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 backdrop-blur-sm transition-all duration-300 hover:shadow-theme-soft ${secLM ? 'text-amber-700' : 'text-amber-300'}`}>
                <AnimatedText>{t.nav.courses}</AnimatedText>
              </a>
            )}
            <a href="/quran"
              className={`hidden lg:flex items-center text-sm font-medium px-3 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 backdrop-blur-sm transition-all duration-300 hover:shadow-theme-soft ${secLM ? 'text-amber-700' : 'text-amber-300'}`}>
              <AnimatedText>{t.nav.quran}</AnimatedText>
            </a>
            <button onClick={() => onLangChange(nextLang[lang])}
              className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-theme-soft gap-2 group ${secLM ? 'text-amber-700' : 'text-amber-300'}`}>
              <Globe className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <AnimatedText>{t.langToggle}</AnimatedText>
            </button>
            <button onMouseEnter={handlePinInteraction} onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className={`hidden md:flex items-center justify-center px-6 py-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-theme-soft gap-2 group ${secLM ? 'text-amber-700' : 'text-amber-300'}`}>
              <motion.div animate={pinControls} className="animate-pin-breathe group-hover:animate-none">
                <MapPin className="w-4 h-4" />
              </motion.div>
              <AnimatedText>{t.findUs}</AnimatedText>
            </button>
          </motion.div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`absolute bottom-full mb-4 ${isRTL ? 'left-0' : 'right-0'} bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-3 flex flex-col gap-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] min-w-[200px]`}>
              <a href="#about" onClick={() => { setShowMobileMenu(false); onMobileTabChange('more'); }}
                className="text-amber-100 hover:text-amber-400 hover:bg-amber-500/10 p-3 rounded-2xl font-medium flex items-center gap-3 transition-colors">
                <Info className="w-5 h-5 text-amber-500/70" /> <AnimatedText>{t.nav.about}</AnimatedText>
              </a>
              <a href="#about" onClick={() => { setShowMobileMenu(false); onMobileTabChange('more'); }}
                className="text-amber-100 hover:text-amber-400 hover:bg-amber-500/10 p-3 rounded-2xl font-medium flex items-center gap-3 transition-colors">
                <MapPin className="w-5 h-5 text-amber-500/70" /> <AnimatedText>{t.findUs}</AnimatedText>
              </a>
              <div className="h-px bg-amber-500/10 mx-2" />
              <a href="/admin"
                className="text-amber-100 hover:text-amber-400 hover:bg-amber-500/10 p-3 rounded-2xl font-medium flex items-center gap-3 transition-colors">
                <Settings className="w-5 h-5 text-amber-500/70" /> <AnimatedText>{t.admin}</AnimatedText>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#111310]/95 backdrop-blur-xl border border-amber-500/15 rounded-[1.75rem] px-1 py-1 flex items-stretch shadow-elevation-3">
          {([
            { id: 'home',    icon: Home,        label: t.mobileNav.home,      href: '#' },
            { id: 'times',   icon: LayoutGrid,  label: t.mobileNav.timetable, href: '#times' },
            ...(showEvents  ? [{ id: 'events',  icon: Calendar,   label: t.mobileNav.events,  href: '#events'  }] : []),
            ...(showCourses ? [{ id: 'courses', icon: BookOpen,   label: t.mobileNav.courses, href: '/courses' }] : []),
            { id: 'quran',   icon: BookMarked,  label: t.mobileNav.quran,     href: '/quran'  },
          ] as { id: string; icon: typeof Home; label: string; href: string }[]).map(item => {
            const Icon = item.icon;
            const isActive = activeMobileTab === item.id && !showMobileMenu;
            return (
              <a key={item.id} href={item.href}
                onClick={() => { onMobileTabChange(item.id); setShowMobileMenu(false); }}
                className={`flex flex-col items-center justify-center flex-1 min-h-[3.5rem] rounded-[1.25rem] transition-all duration-300 py-2 ${
                  isActive ? 'bg-amber-500/15 shadow-theme-soft text-amber-400' : 'text-zinc-400 hover:text-amber-200'
                }`}>
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : ''}`} />
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-amber-300' : ''}`}>
                  <AnimatedText>{item.label}</AnimatedText>
                </span>
              </a>
            );
          })}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[3.5rem] rounded-[1.25rem] transition-all duration-300 py-2 ${
              showMobileMenu ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-400 hover:text-amber-200'
            }`}>
            <Menu className={`w-5 h-5 mb-0.5 ${showMobileMenu ? 'text-amber-400' : ''}`} />
            <span className={`text-[10px] font-medium tracking-wide ${showMobileMenu ? 'text-amber-300' : ''}`}>
              <AnimatedText>{t.mobileNav.more}</AnimatedText>
            </span>
          </button>
        </div>
      </div>

      {/* Unused icon suppression */}
      <span className="hidden"><ArrowRight /></span>
    </>
  );
}
