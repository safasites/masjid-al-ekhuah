'use client';

import { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useAnimationConfig } from './animation-provider';

// Always-loaded above-fold components
import { SiteNav } from './components/SiteNav';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { HeroSection } from './components/HeroSection';
import { QuickAccessCards } from './components/QuickAccessCards';
import { PrayerTimesSection } from './components/PrayerTimesSection';
import { DhikrSection } from './components/DhikrSection';
import { TimetableModal } from './components/TimetableModal';
import { VisualCustomizerPanel } from './components/VisualCustomizerPanel';

// Lazy-loaded below-fold sections — defers JS parse until needed
const EventsSection  = lazy(() => import('./components/EventsSection').then(m => ({ default: m.EventsSection })));
const CoursesSection = lazy(() => import('./components/CoursesSection').then(m => ({ default: m.CoursesSection })));
const BooksSection   = lazy(() => import('./components/BooksSection').then(m => ({ default: m.BooksSection })));
const DonateSection  = lazy(() => import('./components/DonateSection').then(m => ({ default: m.DonateSection })));
const AboutSection   = lazy(() => import('./components/AboutSection').then(m => ({ default: m.AboutSection })));
const SiteFooter     = lazy(() => import('./components/SiteFooter').then(m => ({ default: m.SiteFooter })));

import {
  Lang, PrayerData, Event, Course, Book,
  CUSTOMIZE_SECTION_KEYS,
  isDarkBg, getActivePrayer, getNextPrayer,
} from './components/types';

function SectionSkeleton({ height = '60vh' }: { height?: string }) {
  return <div className="shimmer w-full" style={{ height }} />;
}

export default function MosqueHero() {
  const anim = useAnimationConfig();

  // ── Shared UI state ────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>('en');
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [showTimetable, setShowTimetable] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  // ── Data state ─────────────────────────────────────────────────
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [activePrayer, setActivePrayer] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [timetableUrl, setTimetableUrl] = useState<string | null>(null);
  // Default true (optimistic) so the intersection observer includes dhikr from the start.
  // DhikrSection calls onLoad(false) if there are no dhikr items, hiding the nav link.
  const [hasDhikrCached, setHasDhikrCached] = useState(
    typeof window === 'undefined' || localStorage.getItem('mosque-hasDhikr') !== '0'
  );

  // ── Visual Customizer state ────────────────────────────────────
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizeColors, setCustomizeColors] = useState<Record<string, { bg: string; accent: string }>>({});
  const [customizeSaving, setCustomizeSaving] = useState(false);
  const [customizeSaved, setCustomizeSaved] = useState(false);
  const [customizeSection, setCustomizeSection] = useState<string>('hero');

  const isRTL = lang === 'ar' || lang === 'ku';
  const isFriday = new Date().getDay() === 5;

  // Feature flags
  const showEvents  = content.feature_events  !== 'false';
  const showCourses = content.feature_courses !== 'false';
  const showBooks   = content.feature_books   !== 'false';
  const showDonate  = content.feature_donate  !== 'false';
  const showDhikr   = content.feature_dhikr   !== 'false';

  // ── Per-section colour helpers ─────────────────────────────────
  const secBg     = useCallback((key: string) =>
    (isCustomizing ? customizeColors[key]?.bg : null) ?? content[`section_${key}_bg`] ?? '#0a0804',
    [isCustomizing, customizeColors, content]);
  const secAccent = useCallback((key: string) =>
    (isCustomizing ? customizeColors[key]?.accent : null) ?? content[`section_${key}_accent`] ?? '#d97706',
    [isCustomizing, customizeColors, content]);
  const secLM     = useCallback((key: string) => !isDarkBg(secBg(key)), [secBg]);
  const secStyle  = useCallback((key: string): React.CSSProperties => ({
    '--section-accent': secAccent(key),
    backgroundColor: secBg(key),
  } as React.CSSProperties), [secBg, secAccent]);

  // ── Restore persisted state on mount ──────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
    if (localStorage.getItem('mosque-hasDhikr') === '1') setHasDhikrCached(true);
    if (new URLSearchParams(window.location.search).get('customize') === '1') setIsCustomizing(true);
    const dismissedText = localStorage.getItem('mosque-announcement-dismissed-text');
    if (dismissedText) setAnnouncementDismissed(true);
  }, []);

  // ── Scroll listener ────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 300);
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80) {
        setActiveSection('about');
      } else if (window.scrollY < 100) {
        setActiveSection('');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── IntersectionObserver — active nav section ──────────────────
  // Uses hasDhikrCached (boolean, flips once) instead of dhikrItems.length
  // to avoid re-registering the observer repeatedly during data loading
  useEffect(() => {
    const sectionIds = [
      'times',
      ...(showDhikr && hasDhikrCached ? ['dhikr'] : []),
      ...(showEvents  ? ['events']  : []),
      ...(showCourses ? ['courses'] : []),
      ...(showDonate  ? ['donate']  : []),
      'about',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );

    const observed = new Set<string>();
    function tryObserve() {
      sectionIds.forEach(id => {
        if (observed.has(id)) return;
        const el = document.getElementById(id);
        if (el) { observer.observe(el); observed.add(id); }
      });
    }
    tryObserve();

    // Watch for lazy-loaded sections appearing in the DOM
    const mo = new MutationObserver(tryObserve);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { observer.disconnect(); mo.disconnect(); };
  }, [showDhikr, hasDhikrCached, showEvents, showCourses, showDonate]);

  // ── Mobile tab sync ────────────────────────────────────────────
  useEffect(() => {
    if (!activeSection) { setActiveMobileTab('home'); return; }
    if (activeSection === 'times') setActiveMobileTab('times');
    else if (activeSection === 'dhikr') setActiveMobileTab('more');
    else if (activeSection === 'events' && showEvents) setActiveMobileTab('events');
    else if (activeSection === 'courses' && showCourses) setActiveMobileTab('courses');
    else if (activeSection === 'donate' || activeSection === 'about') setActiveMobileTab('more');
  }, [activeSection, showEvents, showCourses]);

  // ── Fetch all data in one batch (React 18 auto-batches these setState calls) ──
  useEffect(() => {
    Promise.all([
      fetch('/api/prayer-times').then(r => r.json()).catch(() => null),
      fetch('/api/admin/events').then(r => r.json()).catch(() => []),
      fetch('/api/admin/courses').then(r => r.json()).catch(() => []),
      fetch('/api/admin/books').then(r => r.json()).catch(() => []),
      fetch('/api/admin/content').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/timetable').then(r => r.json()).catch(() => null),
    ]).then(([prayerRes, eventsRes, coursesRes, booksRes, contentRes, timetableRes]) => {
      if (prayerRes && !prayerRes.error) {
        setPrayerData(prayerRes);
        setActivePrayer(getActivePrayer(prayerRes.prayers));
        setNextPrayer(getNextPrayer(prayerRes.prayers));
        setPrayerLoading(false);
      } else {
        setPrayerLoading(false);
      }
      if (Array.isArray(eventsRes)) setEvents(eventsRes.slice(0, 3));
      if (Array.isArray(coursesRes)) setCourses(coursesRes);
      if (Array.isArray(booksRes))
        setBooks(booksRes.filter((b: Book & { is_active?: boolean }) => b.is_active !== false).slice(0, 6));
      if (contentRes && typeof contentRes === 'object' && !contentRes.error) {
        setContent(contentRes);
        const initial: Record<string, { bg: string; accent: string }> = {};
        for (const k of CUSTOMIZE_SECTION_KEYS) {
          initial[k] = {
            bg:     contentRes[`section_${k}_bg`]     ?? '#0a0804',
            accent: contentRes[`section_${k}_accent`] ?? '#d97706',
          };
        }
        setCustomizeColors(initial);
      }
      if (timetableRes?.image_url) setTimetableUrl(timetableRes.image_url);
    });
  }, []);

  // ── Sync announcement dismissed once content loads ─────────────
  useEffect(() => {
    if (!content.announcement_text) return;
    const dismissedText = localStorage.getItem('mosque-announcement-dismissed-text');
    if (dismissedText !== content.announcement_text) setAnnouncementDismissed(false);
  }, [content.announcement_text]);

  // ── Banner height tracking ──────────────────────────────────────
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBannerHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Immediately measure banner height when the announcement appears
  // (ResizeObserver fires async; this prevents the one-frame overlap flash)
  useEffect(() => {
    const visible = content.announcement_enabled === 'true' && !!content.announcement_text && !announcementDismissed;
    if (visible && bannerRef.current) {
      setBannerHeight(bannerRef.current.offsetHeight);
    }
  }, [content.announcement_enabled, content.announcement_text, announcementDismissed]);

  // ── 60s timer: re-check active/next prayer (not every second) ──
  useEffect(() => {
    if (!prayerData) return;
    const timer = setInterval(() => {
      setActivePrayer(getActivePrayer(prayerData.prayers));
      setNextPrayer(getNextPrayer(prayerData.prayers));
    }, 60000);
    return () => clearInterval(timer);
  }, [prayerData]);

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('mosque-lang', newLang);
  };

  function dismissAnnouncement() {
    setAnnouncementDismissed(true);
    localStorage.setItem('mosque-announcement-dismissed-text', content.announcement_text ?? '');
  }

  async function saveCustomizeColors() {
    setCustomizeSaving(true);
    try {
      const updates = CUSTOMIZE_SECTION_KEYS.flatMap(k => [
        { key: `section_${k}_bg`,     value: customizeColors[k]?.bg     ?? '#0a0804' },
        { key: `section_${k}_accent`, value: customizeColors[k]?.accent ?? '#d97706' },
      ]);
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) alert('Session expired — please log in to admin again.');
      } else {
        setCustomizeSaved(true);
        setTimeout(() => setCustomizeSaved(false), 2500);
      }
    } catch { /* ignore */ }
    finally { setCustomizeSaving(false); }
  }

  const bannerVisible = content.announcement_enabled === 'true' && !!content.announcement_text && !announcementDismissed;

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: secBg('hero') }}
      className={`relative selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden${isCustomizing ? ' pb-36' : ''}`}>

      {/* ── Announcement Banner ──────────────────────────────── */}
      {bannerVisible && (
        <AnnouncementBanner
          content={content}
          lang={lang}
          secStyle={secStyle('hero')}
          secLM={secLM('hero')}
          bannerRef={bannerRef}
          onDismiss={dismissAnnouncement}
        />
      )}

      {/* ── Navigation (desktop + mobile) ───────────────────── */}
      <SiteNav
        lang={lang}
        content={content}
        isRTL={isRTL}
        scrolled={scrolled}
        bannerVisible={bannerVisible}
        bannerHeight={bannerHeight}
        activeSection={activeSection}
        activeMobileTab={activeMobileTab}
        showEvents={showEvents}
        showCourses={showCourses}
        showDonate={showDonate}
        showDhikr={showDhikr}
        hasDhikrCached={hasDhikrCached}
        secStyle={secStyle('hero')}
        secLM={secLM('hero')}
        onLangChange={changeLang}
        onMobileTabChange={setActiveMobileTab}
      />

      {/* ── Fixed Hero (with memoized PrayerCountdownRing inside) */}
      <HeroSection
        lang={lang}
        isRTL={isRTL}
        secLM={secLM('hero')}
        secStyle={secStyle('hero')}
        content={content}
        prayers={prayerData?.prayers ?? []}
        prayerLoading={prayerLoading}
        isFriday={isFriday}
      />

      <div className="h-[100vh]" />

      {/* ── Scrollable content sections ─────────────────────── */}
      <div className="relative z-20 rounded-t-[3rem] md:rounded-t-[5rem] shadow-theme-top overflow-hidden pb-32 md:pb-0">

        {/* Quick access cards — show after prayer data loads */}
        {!prayerLoading && (
          <QuickAccessCards
            prayerData={prayerData}
            nextPrayer={nextPrayer}
            events={events}
            courses={courses}
            lang={lang}
            isRTL={isRTL}
            showEvents={showEvents}
            showCourses={showCourses}
            secStyle={secStyle('hero')}
            secLM={secLM('hero')}
          />
        )}

        {/* Prayer times — always eager (above-fold critical) */}
        <PrayerTimesSection
          prayerData={prayerData}
          prayerLoading={prayerLoading}
          activePrayer={activePrayer}
          lang={lang}
          isRTL={isRTL}
          secStyle={secStyle('prayer')}
          secLM={secLM('prayer')}
          content={content}
          isFriday={isFriday}
          onOpenTimetable={() => setShowTimetable(true)}
        />

        {/* Dhikr — eager but owns its own state and fetch */}
        {showDhikr && (
          <DhikrSection
            lang={lang}
            isRTL={isRTL}
            secStyle={secStyle('dhikr')}
            secLM={secLM('dhikr')}
            content={content}
            onLoad={setHasDhikrCached}
          />
        )}

        {/* Below-fold sections — lazy loaded */}
        {showEvents && (
          <Suspense fallback={<SectionSkeleton height="50vh" />}>
            <EventsSection
              events={events}
              lang={lang}
              isRTL={isRTL}
              secStyle={secStyle('events')}
              secLM={secLM('events')}
            />
          </Suspense>
        )}

        {showCourses && (
          <Suspense fallback={<SectionSkeleton height="50vh" />}>
            <CoursesSection
              courses={courses}
              lang={lang}
              isRTL={isRTL}
              secStyle={secStyle('courses')}
              secLM={secLM('courses')}
            />
          </Suspense>
        )}

        {showBooks && books.length > 0 && (
          <Suspense fallback={<SectionSkeleton height="40vh" />}>
            <BooksSection
              books={books}
              lang={lang}
              isRTL={isRTL}
              secStyle={secStyle('books')}
              secLM={secLM('books')}
            />
          </Suspense>
        )}

        {showDonate && (
          <Suspense fallback={<SectionSkeleton height="50vh" />}>
            <DonateSection
              lang={lang}
              secStyle={secStyle('donate')}
              secLM={secLM('donate')}
            />
          </Suspense>
        )}

        <Suspense fallback={<SectionSkeleton height="50vh" />}>
          <AboutSection
            lang={lang}
            isRTL={isRTL}
            secStyle={secStyle('about')}
            secLM={secLM('about')}
            content={content}
          />
        </Suspense>

        <Suspense fallback={null}>
          <SiteFooter
            lang={lang}
            secStyle={secStyle('footer')}
            secLM={secLM('footer')}
            content={content}
            prayerData={prayerData}
          />
        </Suspense>
      </div>

      {/* ── Timetable Modal ──────────────────────────────────── */}
      <TimetableModal
        show={showTimetable}
        timetableUrl={timetableUrl}
        secBg={secBg('hero')}
        lang={lang}
        onClose={() => setShowTimetable(false)}
      />

      {/* ── Back to Top Button ───────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed z-40 bottom-[5.5rem] md:bottom-8 right-4 md:right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-theme-soft hover:shadow-theme-glow hover:-translate-y-1"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Visual Customizer Panel ──────────────────────────── */}
      {isCustomizing && (
        <VisualCustomizerPanel
          customizeSection={customizeSection}
          customizeColors={customizeColors}
          customizeSaving={customizeSaving}
          customizeSaved={customizeSaved}
          onSectionChange={setCustomizeSection}
          onColorChange={(section, field, value) =>
            setCustomizeColors(p => ({
              ...p,
              [section]: { ...p[section] ?? { bg: '#0a0804', accent: '#d97706' }, [field]: value },
            }))
          }
          onSave={saveCustomizeColors}
        />
      )}
    </main>
  );
}
