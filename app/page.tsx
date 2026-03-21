'use client';

import { motion, useScroll, useTransform, useAnimationControls, AnimatePresence, LayoutGroup } from 'motion/react';
import { MapPin, ArrowRight, ArrowUp, Globe, Home, BookOpen, BookMarked, Calendar, LayoutGrid, Heart, Info, Menu, X, Settings, Phone, Mail, Check, Palette, Clock } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAnimationConfig } from './animation-provider';
import { GeometricPattern } from './components/GeometricPattern';

function isDarkBg(hex: string): boolean {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ─── Visual Customizer constants ──────────────────────────────────────────────
const CUSTOMIZE_SECTION_KEYS = ['hero', 'prayer', 'dhikr', 'events', 'courses', 'books', 'donate', 'about', 'footer'] as const;
const CUSTOMIZE_SECTION_LABELS: Record<string, string> = {
  hero: 'Hero', prayer: 'Prayer', dhikr: 'Dhikr',
  events: 'Events', courses: 'Courses', books: 'Books',
  donate: 'Donate', about: 'About', footer: 'Footer',
};
const CUSTOMIZE_SECTION_SCROLL: Record<string, string | null> = {
  hero: null, prayer: 'times', dhikr: 'dhikr',
  events: 'events', courses: 'courses', books: 'books',
  donate: 'donate', about: 'about', footer: null,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Prayer { id: string; azan: string; jamat: string; }
interface PrayerData { prayers: Prayer[]; jumuah: string; hijri: string; gregorian: string; }
interface Event {
  id: string; title: string; date_label: string; description: string; image_url?: string;
  title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string;
}
interface Course {
  id: string; title: string; level: string; duration: string; image_url?: string;
  title_ar?: string; title_ku?: string;
}
interface DhikrItem {
  id: string; arabic_text: string; transliteration: string;
  meaning_en: string; meaning_ar?: string; meaning_ku?: string;
  target_count: number; sort_order: number;
}
interface Book {
  id: string; title: string; author?: string; image_url?: string; external_link?: string;
  title_ar?: string; title_ku?: string;
}
type Lang = 'en' | 'ku' | 'ar';

// ─── Hijri month name lookup ───────────────────────────────────────────────
const hijriMonths: Record<Lang, Record<string, string>> = {
  en: {},
  ar: {
    Muharram: 'مُحرَّم', Safar: 'صَفَر', "Rabi' al-Awwal": 'رَبيع الأوَّل',
    "Rabi' al-Thani": 'رَبيع الثَّاني', "Jumada al-Awwal": 'جُمادى الأولى',
    "Jumada al-Thani": 'جُمادى الثَّانية', Rajab: 'رَجَب',
    "Sha'ban": 'شَعبان', Ramadan: 'رَمَضان', Shawwal: 'شَوَّال',
    "Dhu al-Qi'dah": 'ذُو القَعدة', "Dhu al-Hijjah": 'ذُو الحِجَّة',
  },
  ku: {
    Muharram: 'موحەڕڕەم', Safar: 'سەفەر', "Rabi' al-Awwal": 'ڕەبیعو ئەوەل',
    "Rabi' al-Thani": 'ڕەبیعو دووەم', "Jumada al-Awwal": 'جومادا ئەوەل',
    "Jumada al-Thani": 'جومادا دووەم', Rajab: 'ڕەجەب',
    "Sha'ban": 'شەعبان', Ramadan: 'ڕەمەزان', Shawwal: 'شەووال',
    "Dhu al-Qi'dah": 'زولقەعدە', "Dhu al-Hijjah": 'زولحیججە',
  },
};

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  en: {
    nav: { times: 'Times', dhikr: 'Dhikr', events: 'Events', courses: 'Courses', quran: 'Quran', donate: 'Donate', about: 'About' },
    findUs: 'Find Us',
    awaken: 'Awaken Your',
    faith: 'Faith',
    viewPrayers: 'View Prayer Times',
    viewFullTimetable: 'View Full Timetable',
    todaysPrayers: "Today's Prayers",
    birmingham: 'Birmingham',
    prayers: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    azan: 'Azan', jamat: "Jama'at", jumuah: "Jumu'ah",
    minsAfterAzan: (n: number) => `${n} mins after Azan`,
    langToggle: 'کوردی',
    eventsTitle: 'Upcoming Events',
    eventsSubtitle: 'Join our community gatherings',
    viewAll: 'View All',
    coursesTitle: 'Islamic Courses',
    coursesSubtitle: 'Expand your knowledge',
    booksTitle: 'Recommended Books',
    booksSubtitle: 'Selected reads for our community',
    donateTitle: 'Support Your Masjid',
    donateDesc: 'Your generous donations help us maintain the mosque and provide services to the community.',
    donateBtn: 'Donate Now',
    aboutTitle: 'About Us',
    mobileNav: { home: 'Home', courses: 'Courses', quran: 'Quran', events: 'Events', timetable: 'Times', more: 'More' },
    admin: 'Admin', close: 'Close',
    loading: 'Loading prayer times…',
    openTimetable: 'Open Full Timetable',
    noTimetable: 'No Timetable Uploaded',
    noTimetableDesc: 'The mosque admin can upload the monthly timetable from the Admin panel.',
    dhikrTitle: 'Remembrance of God',
    dhikrSubtitle: 'A moment of reflection',
    dhikrTap: 'Tap to count',
    dhikrReset: 'Reset',
    dhikrCompleted: 'Completed',
    dhikrOf: 'of',
    nextPrayer: 'Next prayer',
    prayerIn: 'in',
    nextPrayerCard: 'Next Prayer',
    todayEventsCard: "Today's Events",
    weeklyCoursesCard: 'Courses',
    findUsCard: 'Find Us',
    jumuahSpecial: "Jumu'ah Today",
    announcementDismiss: 'Dismiss',
    footerTagline: 'A welcoming community in the heart of Birmingham',
    footerQuickLinks: 'Quick Links',
    footerContact: 'Contact',
    footerPrayerTimes: 'Prayer Times',
    footerCopyright: (name: string, year: number) => `© ${year} ${name}`,
  },
  ku: {
    nav: { times: 'کاتەکان', dhikr: 'زیکر', events: 'بۆنەکان', courses: 'خولەکان', quran: 'قورئان', donate: 'بەخشین', about: 'دەربارە' },
    findUs: 'ناونیشان',
    awaken: 'باوەڕت',
    faith: 'بەئاگا بهێنە',
    viewPrayers: 'کاتی نوێژەکان ببینە',
    viewFullTimetable: 'خشتەی تەواوی کاتەکان ببینە',
    todaysPrayers: 'نوێژەکانی ئەمڕۆ',
    birmingham: 'بیرمینگام',
    prayers: { fajr: 'فەجر', dhuhr: 'نیوەڕۆ', asr: 'عەسر', maghrib: 'مەغریب', isha: 'عیشا' },
    azan: 'ئەزان', jamat: 'جەماعەت', jumuah: 'ئینی',
    minsAfterAzan: (n: number) => `${n} خولەک دوای ئەزان`,
    langToggle: 'العربية',
    eventsTitle: 'بۆنە ئامادەکراوەکان',
    eventsSubtitle: 'بەشداری کۆبوونەوەکانی کۆمەڵگەکەمان بکە',
    viewAll: 'هەمووی ببینە',
    coursesTitle: 'خولە ئیسلامییەکان',
    coursesSubtitle: 'زانیارییەکانت فراوان بکە',
    booksTitle: 'کتێبە پێشنیارکراوەکان',
    booksSubtitle: 'خوێندنەوەی هەڵبژێردراو بۆ کۆمەڵگەکەمان',
    donateTitle: 'پشتیوانی مزگەوتەکەت بکە',
    donateDesc: 'بەخشینە بەخشندەکانت یارمەتیدەرمانە بۆ پاراستنی مزگەوتەکە و پێشکەشکردنی خزمەتگوزاری بە کۆمەڵگە.',
    donateBtn: 'ئێستا ببەخشە',
    aboutTitle: 'دەربارەی ئێمە',
    mobileNav: { home: 'سەرەکی', courses: 'خولەکان', quran: 'قورئان', events: 'بۆنەکان', timetable: 'کاتەکان', more: 'زیاتر' },
    admin: 'بەڕێوەبەر', close: 'داخستن',
    loading: 'کاتی نوێژ بارکردن…',
    openTimetable: 'خشتەی تەواو بکەرەوە',
    noTimetable: 'هیچ خشتەیەک بارنەکراوە',
    noTimetableDesc: 'بەڕێوەبەری مزگەوت دەتوانێت خشتەی مانگانەی کاتەکان لە پانێلی بەڕێوەبەری بار بکات.',
    dhikrTitle: 'یادی خودا',
    dhikrSubtitle: 'کاتێک بۆ ئەندیشە',
    dhikrTap: 'دەستبکە بە ژمارەکردن',
    dhikrReset: 'ڕیسێت',
    dhikrCompleted: 'تەواو بوو',
    dhikrOf: 'لە',
    nextPrayer: 'نوێژی داهاتوو',
    prayerIn: 'لە ماوەی',
    nextPrayerCard: 'نوێژی داهاتوو',
    todayEventsCard: 'بۆنەکانی ئەمڕۆ',
    weeklyCoursesCard: 'خولەکان',
    findUsCard: 'ناونیشان',
    jumuahSpecial: 'ئینی ئەمڕۆ',
    announcementDismiss: 'داخستن',
    footerTagline: 'کۆمەڵگەیەکی بەخێرهاتوو لە دڵی بیرمینگام',
    footerQuickLinks: 'بەستەرە خێراکان',
    footerContact: 'پەیوەندی',
    footerPrayerTimes: 'کاتی نوێژ',
    footerCopyright: (name: string, year: number) => `© ${year} ${name}`,
  },
  ar: {
    nav: { times: 'الأوقات', dhikr: 'ذكر', events: 'الفعاليات', courses: 'الدورات', quran: 'القرآن', donate: 'تبرع', about: 'حول' },
    findUs: 'موقعنا',
    awaken: 'أيقظ',
    faith: 'إيمانك',
    viewPrayers: 'عرض أوقات الصلاة',
    viewFullTimetable: 'عرض الجدول الزمني الكامل',
    todaysPrayers: 'صلوات اليوم',
    birmingham: 'برمنغهام',
    prayers: { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    azan: 'أذان', jamat: 'جماعة', jumuah: 'الجمعة',
    minsAfterAzan: (n: number) => `${n} دقائق بعد الأذان`,
    langToggle: 'EN',
    eventsTitle: 'الفعاليات القادمة',
    eventsSubtitle: 'انضم إلى تجمعات مجتمعنا',
    viewAll: 'عرض الكل',
    coursesTitle: 'الدورات الإسلامية',
    coursesSubtitle: 'وسع معرفتك',
    booksTitle: 'الكتب الموصى بها',
    booksSubtitle: 'قراءات مختارة لمجتمعنا',
    donateTitle: 'ادعم مسجدك',
    donateDesc: 'تبرعاتك السخية تساعدنا في الحفاظ على المسجد وتقديم الخدمات للمجتمع.',
    donateBtn: 'تبرع الآن',
    aboutTitle: 'معلومات عنا',
    mobileNav: { home: 'الرئيسية', courses: 'الدورات', quran: 'القرآن', events: 'الفعاليات', timetable: 'الأوقات', more: 'المزيد' },
    admin: 'المسؤول', close: 'إغلاق',
    loading: '…جاري تحميل أوقات الصلاة',
    openTimetable: 'فتح الجدول الكامل',
    noTimetable: 'لم يتم رفع جدول',
    noTimetableDesc: 'يمكن لمسؤول المسجد رفع الجدول الشهري من لوحة الإدارة.',
    dhikrTitle: 'ذكر الله',
    dhikrSubtitle: 'لحظة من التأمل',
    dhikrTap: 'اضغط للعد',
    dhikrReset: 'إعادة',
    dhikrCompleted: 'اكتمل',
    dhikrOf: 'من',
    nextPrayer: 'الصلاة القادمة',
    prayerIn: 'خلال',
    nextPrayerCard: 'الصلاة القادمة',
    todayEventsCard: 'فعاليات اليوم',
    weeklyCoursesCard: 'الدورات',
    findUsCard: 'موقعنا',
    jumuahSpecial: 'الجمعة اليوم',
    announcementDismiss: 'إغلاق',
    footerTagline: 'مجتمع مرحب في قلب برمنغهام',
    footerQuickLinks: 'روابط سريعة',
    footerContact: 'تواصل معنا',
    footerPrayerTimes: 'أوقات الصلاة',
    footerCopyright: (name: string, year: number) => `© ${year} ${name}`,
  },
};

const nextLang: Record<Lang, Lang> = { en: 'ku', ku: 'ar', ar: 'en' };

// ─── Helper: determine which prayer is currently active ───────────────────────
function getActivePrayer(prayers: Prayer[]): string {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  function toMins(t: string): number {
    if (!t) return -1;
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return -1;
    return parseInt(m[1]) * 60 + parseInt(m[2]);
  }

  const prayerMins = prayers.map(p => toMins(p.azan));
  let active = prayers[prayers.length - 1].id;
  for (let i = prayerMins.length - 1; i >= 0; i--) {
    if (prayerMins[i] !== -1 && mins >= prayerMins[i]) {
      active = prayers[i].id;
      break;
    }
  }
  return active;
}

function getNextPrayer(prayers: Prayer[]): string {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  function toMins(t: string): number {
    if (!t) return -1;
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return -1;
    return parseInt(m[1]) * 60 + parseInt(m[2]);
  }
  for (const p of prayers) {
    const pm = toMins(p.azan);
    if (pm !== -1 && mins < pm) return p.id;
  }
  return prayers[0].id; // wrap to Fajr (next day)
}

// ─── Helper: format jamat with translated "X mins after Azan" pattern ─────────
function formatJamat(jamat: string, t: typeof translations['en']): string {
  const match = jamat.match(/^(\d+)\s*min/i);
  if (match) return t.minsAfterAzan(parseInt(match[1]));
  const numMatch = jamat.match(/^\d+$/);
  if (numMatch) return t.minsAfterAzan(parseInt(jamat));
  return jamat;
}

// ─── Helper: translate hijri date month names ─────────────────────────────────
function translateHijri(hijri: string, lang: Lang): string {
  if (lang === 'en' || !hijri) return hijri;
  const months = hijriMonths[lang];
  let result = hijri;
  for (const [en, translated] of Object.entries(months)) {
    result = result.replace(en, translated);
  }
  return result;
}

// ─── AnimatedText ─────────────────────────────────────────────────────────────
function AnimatedText({
  children,
  className = '',
  nowrap = true,
}: {
  children: React.ReactNode;
  className?: string;
  nowrap?: boolean;
}) {
  const anim = useAnimationConfig();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={String(children)}
        initial={anim.textInitial(1)}
        animate={anim.textAnimate}
        exit={anim.textExit(-1)}
        transition={anim.textTransition}
        className={`inline-block ${nowrap ? 'whitespace-nowrap' : 'whitespace-normal'} ${className}`}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MosqueHero() {
  const router = useRouter();
  const anim = useAnimationConfig();
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeMobileTab, setActiveMobileTab] = useState('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showTimetable, setShowTimetable] = useState(false);
  const containerRef = useRef(null);
  const pinControls = useAnimationControls();

  // Dynamic data state
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [activePrayer, setActivePrayer] = useState<string>('');
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [countdown, setCountdown] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [timetableUrl, setTimetableUrl] = useState<string | null>(null);
  const [dhikrItems, setDhikrItems] = useState<DhikrItem[]>([]);
  const [hasDhikrCached, setHasDhikrCached] = useState(false);
  const [dhikrIndex, setDhikrIndex] = useState(0);
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [dhikrCompleted, setDhikrCompleted] = useState<Record<string, boolean>>({});
  const [dhikrBurst, setDhikrBurst] = useState(false);

  // Announcement banner
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  // Hero prayer ring progress (0–1, seconds within current minute)
  const [minuteProgress, setMinuteProgress] = useState(0);

  // Visual Customizer mode
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizeColors, setCustomizeColors] = useState<Record<string, { bg: string; accent: string }>>({});
  const [customizeSaving, setCustomizeSaving] = useState(false);
  const [customizeSaved, setCustomizeSaved] = useState(false);
  const [customizeSection, setCustomizeSection] = useState<string>('hero');

  const t = translations[lang];
  const isRTL = lang === 'ar' || lang === 'ku';
  const isFriday = new Date().getDay() === 5;

  // Feature flags — derived from content (default true until content loads)
  const showEvents  = content.feature_events  !== 'false';
  const showCourses = content.feature_courses !== 'false';
  const showBooks   = content.feature_books   !== 'false';
  const showDonate  = content.feature_donate  !== 'false';
  const showDhikr   = content.feature_dhikr   !== 'false';

  // Scroll animations — always called (rules of hooks), but only applied when parallax is enabled
  // Use window scroll (not containerRef) to avoid iOS/Android momentum scroll jitter
  const { scrollY } = useScroll();
  const _heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const _heroY       = useTransform(scrollY, [0, 300], ['0%', '5%']);
  const heroOpacity  = anim.useParallax ? _heroOpacity : 1;
  const heroY        = anim.useParallax ? _heroY : '0%';

  // Restore persisted language + dhikr visibility hint + announcement dismissed
  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
    if (localStorage.getItem('mosque-hasDhikr') === '1') setHasDhikrCached(true);
    // Detect visual customizer mode
    if (new URLSearchParams(window.location.search).get('customize') === '1') {
      setIsCustomizing(true);
    }
    // Announcement dismissed — compare against text to re-show if text changes
    const dismissedText = localStorage.getItem('mosque-announcement-dismissed-text');
    // Will be compared to content.announcement_text once content loads
    if (dismissedText) setAnnouncementDismissed(true); // may be reset once content loads
  }, []);

  // Scroll state — header backdrop + back-to-top visibility
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
    onScroll(); // run once on mount to reset any stale router-cached state
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver — active nav section
  useEffect(() => {
    const sectionIds = [
      'times',
      ...(showDhikr && dhikrItems.length > 0 ? ['dhikr'] : []),
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
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [showDhikr, dhikrItems.length, showEvents, showCourses, showDonate]);

  // Sync mobile nav tab with active section on scroll
  useEffect(() => {
    if (!activeSection) { setActiveMobileTab('home'); return; }
    if (activeSection === 'times') {
      setActiveMobileTab('times');
    } else if (activeSection === 'dhikr') {
      setActiveMobileTab('more');
    } else if (activeSection === 'events' && showEvents) {
      setActiveMobileTab('events');
    } else if (activeSection === 'courses' && showCourses) {
      setActiveMobileTab('courses');
    } else if (activeSection === 'donate' || activeSection === 'about') {
      setActiveMobileTab('more');
    }
  }, [activeSection, showEvents, showCourses]);

  // Fetch all dynamic data on mount
  useEffect(() => {
    fetch('/api/prayer-times')
      .then(r => r.json())
      .then((data: PrayerData) => {
        setPrayerData(data);
        setActivePrayer(getActivePrayer(data.prayers));
        setNextPrayer(getNextPrayer(data.prayers));
        setPrayerLoading(false);
      })
      .catch(() => setPrayerLoading(false));

    fetch('/api/admin/events')
      .then(r => r.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data.slice(0, 3)); })
      .catch(() => {});

    fetch('/api/admin/courses')
      .then(r => r.json())
      .then((data) => { if (Array.isArray(data)) setCourses(data); })
      .catch(() => {});

    fetch('/api/admin/books')
      .then(r => r.json())
      .then((data) => { if (Array.isArray(data)) setBooks(data.filter((b: Book & { is_active?: boolean }) => b.is_active !== false).slice(0, 6)); })
      .catch(() => {});

    fetch('/api/admin/content')
      .then(r => r.json())
      .then((data) => {
        if (data && typeof data === 'object' && !data.error) {
          setContent(data);
          // Initialize customizer colors from loaded content
          const initial: Record<string, { bg: string; accent: string }> = {};
          for (const k of CUSTOMIZE_SECTION_KEYS) {
            initial[k] = {
              bg:     data[`section_${k}_bg`]     ?? '#0a0804',
              accent: data[`section_${k}_accent`] ?? '#d97706',
            };
          }
          setCustomizeColors(initial);
        }
      })
      .catch(() => {});

    fetch('/api/admin/timetable')
      .then(r => r.json())
      .then((d) => { if (d && d.image_url) setTimetableUrl(d.image_url); })
      .catch(() => {});

    fetch('/api/admin/dhikr')
      .then(r => r.json())
      .then((items) => {
        if (!Array.isArray(items)) return;
        setDhikrItems(items);
        localStorage.setItem('mosque-hasDhikr', items.length > 0 ? '1' : '0');
        if (items.length > 0) setHasDhikrCached(true);
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
  }, []);

  // Sync announcement dismissed state once content loads
  useEffect(() => {
    if (!content.announcement_text) return;
    const dismissedText = localStorage.getItem('mosque-announcement-dismissed-text');
    if (dismissedText !== content.announcement_text) {
      setAnnouncementDismissed(false);
    }
  }, [content.announcement_text]);

  // Track banner height for header offset
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBannerHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-check active prayer every minute
  useEffect(() => {
    if (!prayerData) return;
    const timer = setInterval(() => {
      setActivePrayer(getActivePrayer(prayerData.prayers));
      setNextPrayer(getNextPrayer(prayerData.prayers));
    }, 60000);
    return () => clearInterval(timer);
  }, [prayerData]);

  // Live countdown to next prayer (ticks every second)
  useEffect(() => {
    if (!prayerData) return;
    function tick() {
      const now = new Date();
      const totalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const nextId = getNextPrayer(prayerData!.prayers);
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
      // minuteProgress: how far through the current minute (for hero ring arc)
      setMinuteProgress(1 - (diff % 60) / 60);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayerData]);

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('mosque-lang', newLang);
  };

  const handlePinInteraction = useCallback(async () => {
    await pinControls.start({ y: -10, rotate: 360, scale: 1.2, transition: { duration: 0.6, type: 'spring', bounce: 0.5 } });
    pinControls.start({ y: 0, rotate: 0, scale: 1, transition: { duration: 0.3 } });
  }, [pinControls]);

  // Per-section colour helpers — in customize mode reads from live customizeColors state
  const secBg     = (key: string) => (isCustomizing ? customizeColors[key]?.bg     : null) ?? content[`section_${key}_bg`]     ?? '#0a0804';
  const secAccent = (key: string) => (isCustomizing ? customizeColors[key]?.accent : null) ?? content[`section_${key}_accent`] ?? '#d97706';
  const secLM     = (key: string) => !isDarkBg(secBg(key)); // true = light background
  const secStyle  = (key: string): React.CSSProperties => ({
    '--section-accent': secAccent(key),
    backgroundColor: secBg(key),
  } as React.CSSProperties);

  // Derived content — hero text respects language; database content only used for English
  const heroLine1 = lang === 'en' ? (content.hero_line1 || t.awaken) : t.awaken;
  const heroLine2 = lang === 'en' ? (content.hero_line2 || t.faith) : t.faith;
  const baseAboutDesc = content.about_desc || 'Masjid Al-Ekhuah is a welcoming community in the heart of Birmingham, dedicated to worship, education, and serving the local community.';
  const aboutDesc = lang === 'ar' ? (content.about_desc_ar || baseAboutDesc) : lang === 'ku' ? (content.about_desc_ku || baseAboutDesc) : baseAboutDesc;
  const contactAddress = content.contact_address || 'New Spring St, Birmingham B18 7PW, United Kingdom';
  const contactPhone = content.contact_phone || '0121 507 0166';
  const contactEmail = content.contact_email || 'info@masjidalekhuah.com';

  // Translation helpers for database-driven content
  const getEventTitle = (e: Event)  => lang === 'ar' ? (e.title_ar || e.title) : lang === 'ku' ? (e.title_ku || e.title) : e.title;
  const getEventDesc  = (e: Event)  => lang === 'ar' ? (e.description_ar || e.description) : lang === 'ku' ? (e.description_ku || e.description) : e.description;
  const getCourseTitle = (c: Course) => lang === 'ar' ? (c.title_ar || c.title) : lang === 'ku' ? (c.title_ku || c.title) : c.title;
  const getDhikrMeaning = (d: DhikrItem) => lang === 'ar' ? (d.meaning_ar || d.meaning_en) : lang === 'ku' ? (d.meaning_ku || d.meaning_en) : d.meaning_en;

  // Dhikr counter helpers
  function saveDhikrState(counts: Record<string, number>, completed: Record<string, boolean>, index: number) {
    try { localStorage.setItem('mosque-dhikr', JSON.stringify({ counts, completed, currentIndex: index })); } catch { /* ignore */ }
  }

  function handleDhikrTap() {
    const item = dhikrItems[dhikrIndex];
    if (!item) return;
    if (dhikrCompleted[item.id]) return;

    // Haptic feedback
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
      // Auto-advance to next dhikr after 900ms
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
        if (res.status === 401 || res.status === 403) {
          alert('Session expired — please log in to admin again.');
        }
      } else {
        setCustomizeSaved(true);
        setTimeout(() => setCustomizeSaved(false), 2500);
      }
    } catch { /* ignore */ }
    finally { setCustomizeSaving(false); }
  }

  function dismissAnnouncement() {
    setAnnouncementDismissed(true);
    localStorage.setItem('mosque-announcement-dismissed-text', content.announcement_text ?? '');
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

  const bannerVisible = content.announcement_enabled === 'true' && !!content.announcement_text && !announcementDismissed;

  return (
    <main ref={containerRef} dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: secBg('hero') }} className={`relative selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden${isCustomizing ? ' pb-36' : ''}`}>

      {/* ── Announcement Banner ───────────────────────────────────── */}
      {bannerVisible && (
        <div
          ref={bannerRef}
          style={secStyle('hero')}
          className="section-themed animate-slide-down sticky top-0 z-[55] flex items-center justify-between gap-4 px-4 py-3 border-b border-amber-500/25 backdrop-blur-lg"
        >
          <div className="flex items-center gap-3 min-w-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 shrink-0" aria-hidden="true">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
            </svg>
            <p className={`text-sm truncate ${secLM('hero') ? 'text-amber-800/90' : 'text-amber-200/90'}`}>
              {content.announcement_text}
            </p>
          </div>
          {content.announcement_dismissible !== 'false' && (
            <button onClick={dismissAnnouncement}
              className={`shrink-0 transition-colors ${secLM('hero') ? 'text-amber-700/60 hover:text-amber-800' : 'text-amber-400/60 hover:text-amber-300'}`}
              aria-label={t.announcementDismiss}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Desktop Navigation ────────────────────────────────────── */}
      <header
        style={{
          ...secStyle('hero'),
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
            <span className={`font-display font-medium text-lg md:text-xl tracking-wide whitespace-nowrap ${secLM('hero') ? 'text-amber-900' : 'text-amber-50'}`}>{content.mosque_name || 'Masjid Al-Ekhuah'}</span>
          </motion.div>

          {/* Desktop nav — active section glow */}
          <LayoutGroup>
          <nav className="hidden lg:flex items-center gap-8">
            {Object.entries(t.nav).filter(([key]) => {
              if (key === 'dhikr')   return showDhikr && (dhikrItems.length > 0 || hasDhikrCached);
              if (key === 'events')  return showEvents;
              if (key === 'courses') return showCourses;
              if (key === 'donate')  return showDonate;
              return true;
            }).map(([key, item], i) => {
              const isActive = activeSection === key;
              const href = key === 'courses' ? '/courses' : key === 'quran' ? '/quran' : key === 'events' ? '#events' : `#${key}`;
              return (
                <motion.a key={key} href={href} layout
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className={`text-sm font-medium tracking-wide relative group transition-colors duration-300 ${
                    isActive
                      ? (secLM('hero') ? 'text-amber-600' : 'text-amber-400')
                      : (secLM('hero') ? 'text-amber-700/70 hover:text-amber-600' : 'text-amber-100/60 hover:text-amber-400')
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
            className="flex items-center gap-2 md:gap-4">
            <button onClick={() => changeLang(nextLang[lang])}
              className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-theme-soft gap-2 group ${secLM('hero') ? 'text-amber-700' : 'text-amber-300'}`}>
              <Globe className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <AnimatedText>{t.langToggle}</AnimatedText>
            </button>
            <button onMouseEnter={handlePinInteraction} onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className={`hidden md:flex items-center justify-center px-6 py-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-theme-soft gap-2 group ${secLM('hero') ? 'text-amber-700' : 'text-amber-300'}`}>
              <motion.div animate={pinControls} className="animate-pin-breathe group-hover:animate-none">
                <MapPin className="w-4 h-4" />
              </motion.div>
              <AnimatedText>{t.findUs}</AnimatedText>
            </button>
          </motion.div>
        </div>
      </header>

      {/* ── Fixed Hero ────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`hidden md:block absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/20 blur-[120px] ${anim.isSimplified ? '' : 'animate-float'}`} style={{ animationDelay: '0s' }} />
          <div className={`hidden md:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/20 blur-[150px] ${anim.isSimplified ? '' : 'animate-float'}`} style={{ animationDelay: '2s' }} />
          <div className={`hidden md:block absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-amber-400/15 blur-[100px] ${anim.isSimplified ? '' : 'animate-float'}`} style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
          {/* Islamic geometric decorators */}
          <GeometricPattern size={700} opacity={0.035}
            className={`absolute -top-40 -right-40 hidden lg:block ${anim.isSimplified ? '' : 'animate-geo-rotate-slow'}`} />
          <GeometricPattern size={450} opacity={0.025}
            className={`absolute -bottom-24 -left-24 hidden md:block ${anim.isSimplified ? '' : 'animate-geo-rotate-med'}`} />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY, willChange: anim.useParallax ? 'transform, opacity' : 'auto' }}
          className="relative z-10 flex flex-col items-center justify-center px-6 w-full max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: anim.isSimplified ? 0 : 30, filter: anim.blur(10) }}
            animate={{ opacity: 1, y: 0, filter: anim.blur(0) }}
            transition={{ duration: anim.isSimplified ? 0.2 : 1, delay: anim.isSimplified ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl sm:text-7xl md:text-[7rem] lg:text-[9rem] xl:text-[10rem] text-white w-full leading-[1.0] tracking-tight mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <AnimatedText>{heroLine1}</AnimatedText>
            <AnimatedText className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-yellow-200 animate-gradient-xy drop-shadow-sm">
              {heroLine2}
            </AnimatedText>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: anim.isSimplified ? 0.1 : 0.4 }}
            className={`text-base md:text-xl mb-8 max-w-md text-center ${secLM('hero') ? 'text-amber-800/50' : 'text-amber-200/45'}`}>
            {content.hero_subtitle || t.footerTagline}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: anim.isSimplified ? 0.1 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto">
            <button onClick={() => document.getElementById('times')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0804] font-medium text-base hover:from-amber-300 hover:to-amber-500 transition-all duration-300 flex items-center justify-center gap-2 group animate-breathe hover:animate-none hover:shadow-theme-strong hover:-translate-y-1">
              <AnimatedText>{t.viewPrayers}</AnimatedText>
              <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
                isRTL
                  ? 'rotate-180 group-hover:translate-y-1 group-hover:rotate-90'
                  : 'group-hover:translate-y-1 group-hover:rotate-90'
              }`} />
            </button>
          </motion.div>

          {/* Hero Prayer Ring */}
          {!prayerLoading && countdown && nextPrayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: anim.isSimplified ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 relative pointer-events-auto"
            >
              <div className={`relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center ${anim.isSimplified ? '' : 'animate-ring-pulse'}`}>
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
                  <p className={`text-[10px] uppercase tracking-widest mb-0.5 ${secLM('hero') ? 'text-amber-700/50' : 'text-amber-400/60'}`}>
                    {t.nextPrayerCard}
                  </p>
                  <p className={`font-display text-lg font-semibold mb-0.5 ${secLM('hero') ? 'text-amber-900' : 'text-amber-100'}`}>
                    {t.prayers[nextPrayer as keyof typeof t.prayers]}
                  </p>
                  <p dir="ltr" className={`font-display text-xl md:text-2xl tabular-nums font-bold ${secLM('hero') ? 'text-amber-800' : 'text-amber-300'}`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {countdown}
                  </p>
                </div>
              </div>
              {/* Friday badge */}
              {isFriday && content.friday_highlight_enabled !== 'false' && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-amber-600 text-[#0a0804] text-[9px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 shadow-theme-glow">
                  {t.jumuahSpecial}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="h-[100vh]" />

      {/* ── Content Sections ──────────────────────────────────────── */}
      <div className="relative z-20 rounded-t-[3rem] md:rounded-t-[5rem] shadow-theme-top overflow-hidden pb-32 md:pb-0">

        {/* Quick Access Cards */}
        {!prayerLoading && (
          <div style={secStyle('hero')} className="section-themed px-4 py-5 border-b border-amber-500/10">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                {
                  label: t.nextPrayerCard,
                  value: prayerData ? t.prayers[nextPrayer as keyof typeof t.prayers] : '—',
                  sub: prayerData?.prayers.find(p => p.id === nextPrayer)?.azan ?? '',
                  icon: <Clock className="w-4 h-4" />,
                  href: '#times',
                  show: true,
                },
                {
                  label: t.todayEventsCard,
                  value: String(events.length),
                  sub: events.length > 0 ? getEventTitle(events[0]) : '—',
                  icon: <Calendar className="w-4 h-4" />,
                  href: '#events',
                  show: showEvents,
                },
                {
                  label: t.weeklyCoursesCard,
                  value: String(courses.length),
                  sub: courses.length > 0 ? getCourseTitle(courses[0]) : '—',
                  icon: <BookOpen className="w-4 h-4" />,
                  href: '/courses',
                  show: showCourses,
                },
                {
                  label: t.findUsCard,
                  value: t.birmingham,
                  sub: 'B18 7PW',
                  icon: <MapPin className="w-4 h-4" />,
                  href: '#about',
                  show: true,
                },
              ] as { label: string; value: string; sub: string; icon: React.ReactNode; href: string; show: boolean }[])
                .filter(c => c.show)
                .map((card, i) => (
                  <motion.a
                    key={card.label}
                    href={card.href}
                    {...anim.cardEntry(i)}
                    {...anim.cardHover}
                    className={`glass rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 hover:shadow-theme-soft no-underline ${secLM('hero') ? 'hover:bg-amber-100/30' : 'hover:bg-amber-500/10'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] uppercase tracking-widest font-medium ${secLM('hero') ? 'text-amber-700/55' : 'text-amber-400/55'}`}>
                        {card.label}
                      </span>
                      <span className={`${secLM('hero') ? 'text-amber-600/40' : 'text-amber-400/40'}`}>{card.icon}</span>
                    </div>
                    <p className={`font-display text-xl font-bold tracking-tight leading-none ${secLM('hero') ? 'text-amber-900' : 'text-amber-50'}`}>
                      {card.value}
                    </p>
                    <p dir="ltr" className={`text-xs truncate mt-0.5 ${secLM('hero') ? 'text-amber-700/45' : 'text-amber-300/45'}`}>
                      {card.sub}
                    </p>
                  </motion.a>
                ))}
            </div>
          </div>
        )}

        {/* Prayer Times Section */}
        <section id="times" style={secStyle('prayer')} className="section-themed min-h-screen bg-gradient-to-b from-amber-900/40 via-amber-950/40 to-transparent backdrop-blur-3xl border-t border-amber-500/30 flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
          {/* Decorative geometric pattern */}
          <GeometricPattern size={200} opacity={0.04}
            className="absolute top-8 right-8 hidden md:block pointer-events-none" />
          <div className="max-w-6xl w-full mx-auto">
            <motion.div {...anim.sectionEntry} className="text-center mb-16">
              <p className={`text-xs uppercase tracking-widest font-semibold mb-3 ${secLM('prayer') ? 'text-amber-600/60' : 'text-amber-500/50'}`}>
                {t.birmingham}
              </p>
              <h2 className={`font-display text-4xl md:text-6xl lg:text-7xl ${secLM('prayer') ? 'text-amber-900' : 'text-amber-50'} mb-6 tracking-tight`}>
                <AnimatedText>{t.todaysPrayers}</AnimatedText>
              </h2>
              <div className={`flex items-center justify-center gap-4 text-sm md:text-base ${secLM('prayer') ? 'text-amber-700/70' : 'text-amber-200/70'}`}>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <AnimatedText>{t.birmingham}</AnimatedText>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                {/* dir="ltr" ensures Hijri date numbers display correctly in RTL mode */}
                <span dir="ltr">{prayerData ? translateHijri(prayerData.hijri, lang) : '—'}</span>
              </div>
            </motion.div>

            {/* Countdown pill — next prayer live timer */}
            {!prayerLoading && countdown && nextPrayer && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }} className="flex justify-center mb-6">
                <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-sm ${
                  secLM('prayer')
                    ? 'bg-amber-100/80 border-amber-300/60 text-amber-800'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                }`}>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <span className="text-sm font-medium">
                    {t.nextPrayer}:&nbsp;
                    <span className={`font-semibold ${secLM('prayer') ? 'text-amber-700' : 'text-amber-300'}`}>
                      {t.prayers[nextPrayer as keyof typeof t.prayers]}
                    </span>
                    &nbsp;{t.prayerIn}&nbsp;
                  </span>
                  <span dir="ltr" className={`font-display text-base ${secLM('prayer') ? 'text-amber-900' : 'text-amber-50'}`}
                    style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {countdown}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Prayer rows — glass morphism card list */}
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
                      initial={{ opacity: 0, x: anim.isSimplified ? 0 : (isRTL ? 30 : -30) }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: anim.isSimplified ? 0.15 : 0.5, delay: anim.isSimplified ? index * 0.03 : index * 0.07, ease: 'easeOut' }}
                      className={`relative flex items-center gap-4 rounded-2xl px-5 py-4 md:py-5 md:px-8 transition-all duration-500 ${
                        isActive
                          ? 'glass-md border border-amber-400/60 shadow-theme-glow bg-gradient-to-r from-amber-500/20 to-transparent'
                          : secLM('prayer')
                            ? 'bg-amber-50/70 border border-amber-300/40 hover:border-amber-400/60 hover:bg-amber-100/60'
                            : 'glass border border-amber-500/10 hover:border-amber-500/30 hover:shadow-theme-soft'
                      }`}
                    >
                      {/* Prayer name */}
                      <div className="w-28 md:w-32 shrink-0 flex items-center gap-2">
                        <p className={`text-[13px] md:text-sm font-semibold tracking-wider uppercase ${isActive ? (secLM('prayer') ? 'text-amber-900' : 'text-amber-200') : (secLM('prayer') ? 'text-amber-700' : 'text-amber-500/80')}`}>
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
                      {/* Azan */}
                      <div className="flex-1 text-center">
                        <p className={`text-[11px] md:text-xs uppercase tracking-widest mb-0.5 ${secLM('prayer') ? 'text-amber-600/60' : 'text-amber-500/40'}`}>{t.azan}</p>
                        <p dir="ltr" className={`font-display text-base md:text-xl tracking-tight ${isActive ? (secLM('prayer') ? 'text-amber-900' : 'text-white') : (secLM('prayer') ? 'text-amber-800/80' : 'text-amber-100/70')}`}>
                          {prayer.azan || '—'}
                        </p>
                      </div>
                      {/* Separator */}
                      <div className={`w-px self-stretch ${isActive ? 'bg-amber-400/20' : (secLM('prayer') ? 'bg-amber-300/40' : 'bg-amber-800/30')}`} />
                      {/* Jamat */}
                      <div className="flex-1 text-center">
                        <p className={`text-[11px] md:text-xs uppercase tracking-widest mb-0.5 ${secLM('prayer') ? 'text-amber-600/60' : 'text-amber-500/40'}`}>{t.jamat}</p>
                        <p dir="ltr" className={`font-display text-base md:text-xl tracking-tight ${isActive ? (secLM('prayer') ? 'text-amber-700' : 'text-amber-300') : (secLM('prayer') ? 'text-amber-700/70' : 'text-amber-400/70')}`}>
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
                    : secLM('prayer')
                      ? 'bg-amber-100 border border-amber-300/60 text-amber-800'
                      : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                }`}>
                  {isFriday && content.friday_highlight_enabled !== 'false' && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/25 border border-amber-400/30 rounded-full px-2 py-0.5 shrink-0">
                      {t.jumuahSpecial}
                    </span>
                  )}
                  <Calendar className={`w-4 h-4 ${secLM('prayer') ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span><AnimatedText>{t.jumuah}</AnimatedText></span>
                  <span dir="ltr" className={`font-display text-base ${secLM('prayer') ? 'text-amber-700' : 'text-amber-400'}`}>{prayerData.jumuah}</span>
                </div>
              </motion.div>
            )}

            {/* View Full Timetable */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }} className="mt-8 flex justify-center">
              <button onClick={() => setShowTimetable(true)}
                className={`px-8 py-4 rounded-full font-medium text-base transition-all duration-300 flex items-center justify-center gap-2 group hover:shadow-theme-glow ${secLM('prayer') ? 'bg-amber-100/80 border border-amber-400/40 text-amber-800 hover:bg-amber-200/80' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'}`}>
                <AnimatedText>{t.viewFullTimetable}</AnimatedText>
                <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Dhikr Section */}
        {showDhikr && dhikrItems.length > 0 && (() => {
          const item = dhikrItems[dhikrIndex];
          const count = dhikrCounts[item?.id] ?? 0;
          const target = item?.target_count ?? 33;
          const isCompleted = !!dhikrCompleted[item?.id];
          const progress = Math.min(count / target, 1);
          // SVG ring math: radius 44 on 100x100 viewBox
          const r = 44;
          const circumference = 2 * Math.PI * r;
          const dash = circumference * progress;
          const gap = circumference - dash;
          const dhikrTitle = content.dhikr_title || t.dhikrTitle;
          return (
            <section id="dhikr" style={secStyle('dhikr')} className="section-themed px-6 py-16 md:py-28 overflow-hidden relative">
              {/* Subtle radial background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[100px]" />
              </div>
              <GeometricPattern size={180} opacity={0.04}
                className="absolute top-6 right-6 hidden md:block pointer-events-none" />

              <div className="max-w-2xl mx-auto w-full relative z-10">
                {/* Section heading */}
                <motion.div
                  {...anim.sectionEntry}
                  className="text-center mb-10 md:mb-14"
                >
                  <h2 className={`font-display text-3xl md:text-5xl ${secLM('dhikr') ? 'text-amber-900' : 'text-amber-50'} mb-2 tracking-tight`}>
                    <AnimatedText>{dhikrTitle}</AnimatedText>
                  </h2>
                  <p className={`text-base md:text-lg ${secLM('dhikr') ? 'text-amber-700/50' : 'text-amber-200/50'}`}>
                    <AnimatedText>{t.dhikrSubtitle}</AnimatedText>
                  </p>
                </motion.div>

                <motion.div
                  {...anim.sectionEntry}
                  className="flex flex-col items-center"
                >
                  {/* Dhikr phrase switcher dots */}
                  {dhikrItems.length > 1 && (
                    <div className="flex items-center gap-2 mb-8">
                      {dhikrItems.map((item, i) => (
                        <button
                          key={item.id}
                          onClick={() => handleDhikrNav(i)}
                          className={`rounded-full transition-all duration-300 ${
                            i === dhikrIndex
                              ? 'w-6 h-2.5 bg-amber-400'
                              : 'w-2.5 h-2.5 bg-amber-500/30 hover:bg-amber-500/60'
                          }`}
                          aria-label={item.transliteration}
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
                      <p dir="rtl" className={`text-4xl md:text-5xl font-bold ${secLM('dhikr') ? 'text-amber-900' : 'text-amber-50'} mb-3 leading-tight`} style={{ fontFamily: 'serif' }}>
                        {item?.arabic_text}
                      </p>
                      <p className="text-xl md:text-2xl font-medium text-amber-400 mb-2 tracking-wide">
                        {item?.transliteration}
                      </p>
                      <p className={`text-sm md:text-base ${secLM('dhikr') ? 'text-amber-700/50' : 'text-amber-200/50'}`}>
                        {item && getDhikrMeaning(item)}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Circular counter button */}
                  <div className="relative mb-6">
                    {/* Completion burst ring */}
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
                        isCompleted
                          ? 'cursor-default'
                          : 'cursor-pointer active:scale-95'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {/* SVG progress ring */}
                      <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                        aria-hidden="true"
                      >
                        {/* Track */}
                        <circle
                          cx="50" cy="50" r={r}
                          fill="none"
                          stroke="rgba(245,158,11,0.12)"
                          strokeWidth="5"
                        />
                        {/* Progress */}
                        <circle
                          cx="50" cy="50" r={r}
                          fill="none"
                          stroke={isCompleted ? 'rgba(245,158,11,0.9)' : 'rgba(245,158,11,0.7)'}
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={`${dash} ${gap}`}
                          style={{ transition: 'stroke-dasharray 0.3s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
                        />
                      </svg>

                      {/* Inner circle background */}
                      <div className={`absolute inset-3 rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-amber-500/20 shadow-theme-dhikr'
                          : 'bg-amber-950/60 hover:bg-amber-900/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]'
                      }`} />

                      {/* Count display */}
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={count}
                            initial={{ scale: anim.isSimplified ? 1 : 1.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: anim.isSimplified ? 1 : 0.7, opacity: 0 }}
                            transition={anim.counterTransition}
                            className={`font-display leading-none font-bold tabular-nums ${
                              count === 0
                                ? 'text-5xl md:text-6xl text-amber-500/40'
                                : isCompleted
                                  ? 'text-5xl md:text-6xl text-amber-300'
                                  : 'text-5xl md:text-6xl text-amber-100'
                            }`}
                          >
                            {count}
                          </motion.span>
                        </AnimatePresence>
                        {count === 0 && !isCompleted && (
                          <span className="text-xs text-amber-500/40 mt-1 tracking-widest uppercase">{t.dhikrTap}</span>
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
                    <p className="text-amber-500/60 text-sm tabular-nums">
                      <span className="text-amber-300 font-medium">{count}</span>
                      {' '}{t.dhikrOf}{' '}
                      <span className="text-amber-100/60">{target}</span>
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
        })()}

        {/* Events Section */}
        {showEvents && <section id="events" style={secStyle('events')} className="section-themed px-6 py-8 md:py-24 overflow-hidden">
          <motion.div {...anim.sectionEntry} className="max-w-6xl w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-12 gap-3 md:gap-6">
              <div>
                <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${secLM('events') ? 'text-amber-600/60' : 'text-amber-500/50'}`}>Community</p>
                <h2 className={`font-display text-4xl md:text-6xl ${secLM('events') ? 'text-amber-900' : 'text-amber-50'} mb-1 md:mb-3 tracking-tight`}><AnimatedText>{t.eventsTitle}</AnimatedText></h2>
                <p className={`text-base md:text-lg ${secLM('events') ? 'text-amber-700/75' : 'text-amber-200/60'}`}><AnimatedText>{t.eventsSubtitle}</AnimatedText></p>
              </div>
              <button onClick={() => router.push('/events')}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-2 font-medium transition-colors shrink-0">
                <AnimatedText>{t.viewAll}</AnimatedText>
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {events.length === 0 ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="rounded-3xl overflow-hidden">
                    <div className="shimmer aspect-video" />
                    <div className="p-4 space-y-2">
                      <div className="shimmer rounded-lg h-4 w-2/3" />
                      <div className="shimmer rounded-lg h-3 w-1/2" />
                      <div className="shimmer rounded h-3 w-full" />
                    </div>
                  </div>
                ))
              ) : events.map(event => (
                <motion.div key={event.id} {...anim.cardHover}
                  onClick={() => router.push('/events')}
                  className={`glass rounded-3xl overflow-hidden transition-all duration-300 group cursor-pointer hover:shadow-elevation-2 hover:shadow-theme-soft ${secLM('events') ? 'bg-amber-50/60 border-amber-300/30' : ''}`}>
                  {event.image_url ? (
                    <div className="aspect-video w-full overflow-hidden relative">
                      <Image src={event.image_url} alt={getEventTitle(event)} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mt-4 mx-4 md:mt-6 md:mx-6 group-hover:bg-amber-500/20 transition-colors">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                    </div>
                  )}
                  <div className="p-4 md:p-6">
                    <h3 dir="auto" className={`text-base sm:text-lg font-semibold ${secLM('events') ? 'text-amber-900' : 'text-amber-50'} mb-1.5 leading-snug`}>{getEventTitle(event)}</h3>
                    <p className="text-amber-500/70 text-xs sm:text-sm mb-2">{event.date_label}</p>
                    {event.description && <p dir="auto" className={`leading-relaxed text-xs sm:text-sm line-clamp-2 ${secLM('events') ? 'text-amber-800/65' : 'text-amber-100/60'}`}>{getEventDesc(event)}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>}

        {/* Courses Section */}
        {showCourses && <section id="courses" style={secStyle('courses')} className="section-themed px-6 py-8 md:py-24 overflow-hidden">
          <motion.div {...anim.sectionEntry} className="max-w-6xl w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-12 gap-3 md:gap-6">
              <div>
                <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${secLM('courses') ? 'text-amber-600/60' : 'text-amber-500/50'}`}>Education</p>
                <h2 className={`font-display text-4xl md:text-6xl ${secLM('courses') ? 'text-amber-900' : 'text-amber-50'} mb-1 md:mb-3 tracking-tight`}><AnimatedText>{t.coursesTitle}</AnimatedText></h2>
                <p className={`text-base md:text-lg ${secLM('courses') ? 'text-amber-700/75' : 'text-amber-200/60'}`}><AnimatedText>{t.coursesSubtitle}</AnimatedText></p>
              </div>
              <button onClick={() => router.push('/courses')}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-2 font-medium transition-colors shrink-0">
                <AnimatedText>{t.viewAll}</AnimatedText>
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {courses.length === 0 ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="rounded-3xl overflow-hidden">
                    <div className="shimmer aspect-video" />
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <div className="shimmer rounded-2xl w-10 h-10" />
                        <div className="shimmer rounded-full h-6 w-20" />
                      </div>
                      <div className="shimmer rounded-lg h-4 w-2/3" />
                      <div className="shimmer rounded h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : courses.map(course => {
                const levelColor = course.level === 'Beginner'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25'
                  : course.level === 'Advanced'
                    ? 'bg-red-500/15 text-red-300 border-red-400/25'
                    : course.level === 'Intermediate'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                return (
                  <motion.div key={course.id} {...anim.courseCardHover}
                    onClick={() => router.push('/courses')}
                    className={`glass rounded-3xl overflow-hidden transition-all duration-300 group cursor-pointer hover:shadow-elevation-2 hover:shadow-theme-soft ${secLM('courses') ? 'bg-amber-50/60 border-amber-300/30' : ''}`}>
                  {course.image_url ? (
                    <div className="aspect-video w-full overflow-hidden relative">
                      <Image src={course.image_url} alt={getCourseTitle(course)} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </div>
                  ) : null}
                  <div className="p-4 md:p-6 relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      {!course.image_url && (
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-amber-400" />
                        </div>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${levelColor} ${!course.image_url ? '' : 'ml-auto'}`}>{course.level}</span>
                    </div>
                    <h3 dir="auto" className={`text-base sm:text-lg font-semibold ${secLM('courses') ? 'text-amber-900' : 'text-amber-50'} mb-1.5 leading-snug`}>{getCourseTitle(course)}</h3>
                    <p className={`text-xs sm:text-sm flex items-center gap-2 ${secLM('courses') ? 'text-amber-800/65' : 'text-amber-100/60'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0" />{course.duration}
                    </p>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>}

        {/* Books Section */}
        {showBooks && books.length > 0 && <section id="books" style={secStyle('books')} className="section-themed px-6 py-8 md:py-24 overflow-hidden">
          <motion.div {...anim.sectionEntry} className="max-w-6xl w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-12 gap-3 md:gap-6">
              <div>
                <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${secLM('books') ? 'text-amber-600/60' : 'text-amber-500/50'}`}>Library</p>
                <h2 className={`font-display text-4xl md:text-6xl ${secLM('books') ? 'text-amber-900' : 'text-amber-50'} mb-1 md:mb-3 tracking-tight`}><AnimatedText>{t.booksTitle}</AnimatedText></h2>
                <p className={`text-base md:text-lg ${secLM('books') ? 'text-amber-700/75' : 'text-amber-200/60'}`}><AnimatedText>{t.booksSubtitle}</AnimatedText></p>
              </div>
              <button onClick={() => router.push('/books')}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-2 font-medium transition-colors shrink-0">
                <AnimatedText>{t.viewAll}</AnimatedText>
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
              {books.map((book, i) => (
                <motion.div key={book.id} {...anim.cardEntry(i)} {...anim.cardHover}
                  onClick={() => router.push('/books')}
                  className={`rounded-2xl overflow-hidden border ${secLM('books') ? 'bg-amber-50 border-amber-300/30 hover:border-amber-400/50' : 'glass border-amber-500/15 hover:border-amber-500/35 hover:shadow-theme-soft'} cursor-pointer group transition-all duration-300`}>
                  {book.image_url ? (
                    <div className="aspect-[2/3] w-full overflow-hidden relative">
                      <Image src={book.image_url} alt={lang === 'ar' ? (book.title_ar || book.title) : lang === 'ku' ? (book.title_ku || book.title) : book.title}
                        fill className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw" />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ) : (
                    <div className={`aspect-[2/3] w-full ${secLM('books') ? 'bg-amber-100' : 'bg-amber-950/40'} flex items-center justify-center`}>
                      <BookMarked className="w-6 h-6 text-amber-500/20" />
                    </div>
                  )}
                  <div className="p-2">
                    <p dir="auto" className={`${secLM('books') ? 'text-amber-900' : 'text-amber-50'} text-[10px] sm:text-xs font-medium line-clamp-2 leading-snug`}>
                      {lang === 'ar' ? (book.title_ar || book.title) : lang === 'ku' ? (book.title_ku || book.title) : book.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>}

        {/* Donate Section */}
        {showDonate && <section id="donate" style={secStyle('donate')} className="section-themed py-32 px-6 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-900/20 pointer-events-none" />
          <GeometricPattern size={300} opacity={0.035}
            className={`absolute top-8 right-8 hidden md:block pointer-events-none ${anim.isSimplified ? '' : 'animate-geo-rotate-slow'}`} />
          <motion.div {...anim.sectionEntry}
            className={`max-w-4xl w-full mx-auto text-center relative z-10 glass-md rounded-[3rem] p-8 md:p-12 lg:p-20 shadow-elevation-3 ${secLM('donate') ? 'bg-amber-100/70 border-amber-300/40' : ''}`}>
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500/30 to-amber-700/20 rounded-full flex items-center justify-center mb-8 border-2 border-amber-400/40 shadow-theme-glow">
              <Heart className="w-12 h-12 text-amber-300" />
            </div>
            <h2 className={`font-display text-5xl md:text-7xl mb-6 break-words tracking-tight ${secLM('donate') ? 'text-amber-900' : 'text-gradient-theme'}`}>
              <AnimatedText>{t.donateTitle}</AnimatedText>
            </h2>
            <p className={`text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${secLM('donate') ? 'text-amber-800/70' : 'text-amber-100/65'}`}>
              <AnimatedText nowrap={false}>{t.donateDesc}</AnimatedText>
            </p>
            <button className={`px-10 py-5 rounded-full bg-gradient-to-r font-bold text-lg transition-all duration-300 shadow-theme-glow hover:shadow-theme-strong hover:-translate-y-1 ${secLM('donate') ? 'from-amber-600 to-amber-800 text-amber-50 hover:from-amber-700 hover:to-amber-900' : 'from-amber-400 to-amber-600 text-[#0a0804] hover:from-amber-300 hover:to-amber-500'}`}>
              <AnimatedText>{t.donateBtn}</AnimatedText>
            </button>
          </motion.div>
        </section>}

        {/* About / Contact Section */}
        <section id="about" style={secStyle('about')} className="section-themed py-24 px-6 border-t border-amber-500/10 overflow-hidden">
          <motion.div {...anim.sectionEntry}
            className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className={`font-display text-4xl ${secLM('about') ? 'text-amber-900' : 'text-amber-50'} mb-6 break-words`}><AnimatedText>{t.aboutTitle}</AnimatedText></h2>
              <p dir="auto" className={`text-lg leading-relaxed mb-8 break-words ${secLM('about') ? 'text-amber-800/75' : 'text-amber-100/75'}`}>{aboutDesc}</p>
              <div className="space-y-4">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-4 ${secLM('about') ? 'text-amber-700/80 hover:text-amber-600' : 'text-amber-200/80 hover:text-amber-300'} transition-colors group`}>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <span dir="ltr" className="break-words">{contactAddress}</span>
                </a>
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className={`flex items-center gap-4 ${secLM('about') ? 'text-amber-700/80 hover:text-amber-600' : 'text-amber-200/80 hover:text-amber-300'} transition-colors group`}>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <Phone className="w-4 h-4 text-amber-400" />
                  </div>
                  <span dir="ltr">{contactPhone}</span>
                </a>
                <a href={`mailto:${contactEmail}`}
                  className={`flex items-center gap-4 ${secLM('about') ? 'text-amber-700/80 hover:text-amber-600' : 'text-amber-200/80 hover:text-amber-300'} transition-colors group`}>
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <Mail className="w-4 h-4 text-amber-400" />
                  </div>
                  <span dir="ltr" className="break-words">{contactEmail}</span>
                </a>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="relative h-[400px] rounded-[2rem] overflow-hidden border border-amber-500/20">
              <iframe
                title="Masjid Al-Ekhuah location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2428.178789289!2d-1.9207!3d52.4872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870bc8b0a8f5f3d%3A0x123!2sNew%20Spring%20St%2C%20Birmingham%20B18%207PW!5e0!3m2!1sen!2suk!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, filter: secLM('about') ? 'none' : 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer id="footer" style={secStyle('footer')} className="section-themed border-t border-amber-500/20 px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

              {/* Branding */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border border-amber-500/40 rounded-full flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                      <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
                    </svg>
                  </div>
                  <span className={`font-display font-medium text-lg ${secLM('footer') ? 'text-amber-900' : 'text-amber-50'}`}>
                    {content.mosque_name || 'Masjid Al-Ekhuah'}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${secLM('footer') ? 'text-amber-800/70' : 'text-amber-200/60'}`}>
                  {t.footerTagline}
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${secLM('footer') ? 'text-amber-700' : 'text-amber-400'}`}>
                  {t.footerQuickLinks}
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Home', href: '#hero', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                    { label: t.nav.times, href: '#times' },
                    { label: t.nav.events, href: '#events' },
                    { label: t.nav.courses, href: '#courses' },
                    { label: t.nav.quran, href: '/quran' },
                  ].map(link => (
                    <li key={link.label}>
                      <a href={link.href} onClick={link.onClick}
                        className={`text-sm transition-colors ${secLM('footer') ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prayer Times */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${secLM('footer') ? 'text-amber-700' : 'text-amber-400'}`}>
                  {t.footerPrayerTimes}
                </h3>
                {prayerData ? (
                  <ul className="space-y-1.5">
                    {prayerData.prayers.map(p => (
                      <li key={p.id} className="flex justify-between gap-4">
                        <span className={`text-xs ${secLM('footer') ? 'text-amber-700/70' : 'text-amber-300/70'}`}>
                          {t.prayers[p.id as keyof typeof t.prayers]}
                        </span>
                        <span dir="ltr" className={`text-xs font-medium ${secLM('footer') ? 'text-amber-800' : 'text-amber-200'}`}
                          style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {p.azan || '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`text-xs ${secLM('footer') ? 'text-amber-700/50' : 'text-amber-400/50'}`}>{t.loading}</p>
                )}
              </div>

              {/* Contact */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${secLM('footer') ? 'text-amber-700' : 'text-amber-400'}`}>
                  {t.footerContact}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`}
                      target="_blank" rel="noopener noreferrer"
                      className={`flex items-start gap-2 text-xs transition-colors ${secLM('footer') ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                      <span dir="ltr">{contactAddress}</span>
                    </a>
                  </li>
                  <li>
                    <a href={`tel:${contactPhone.replace(/\s/g, '')}`}
                      className={`flex items-center gap-2 text-xs transition-colors ${secLM('footer') ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                      <Phone className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span dir="ltr">{contactPhone}</span>
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${contactEmail}`}
                      className={`flex items-center gap-2 text-xs transition-colors ${secLM('footer') ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                      <Mail className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span dir="ltr" className="break-all">{contactEmail}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className={`pt-8 border-t ${secLM('footer') ? 'border-amber-200/40' : 'border-amber-500/15'} flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <p className={`text-xs ${secLM('footer') ? 'text-amber-700/50' : 'text-amber-400/40'}`}>
                {t.footerCopyright(content.mosque_name || 'Masjid Al-Ekhuah', new Date().getFullYear())}
              </p>
              <button onClick={() => router.push('/admin')}
                className={`text-xs transition-colors ${secLM('footer') ? 'text-amber-700/30 hover:text-amber-700/60' : 'text-amber-500/20 hover:text-amber-400/50'}`}>
                {t.admin}
              </button>
            </div>
          </div>
        </footer>

      </div>

      {/* ── Timetable Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showTimetable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8">
            <button onClick={() => setShowTimetable(false)}
              className="absolute top-6 right-6 text-amber-100 hover:text-amber-400 z-50 bg-amber-900/50 p-3 rounded-full border border-amber-500/30 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              style={{ backgroundColor: secBg('hero') }}
              className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl border border-amber-500/30 shadow-2xl">
              {timetableUrl ? (
                timetableUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <div className="relative w-full" style={{ minHeight: 400 }}>
                    <Image src={timetableUrl} alt="Prayer Timetable" fill priority
                      className="object-contain rounded-3xl" sizes="(max-width: 1280px) 100vw, 1280px"
                      style={{ touchAction: 'pinch-zoom' }} />
                  </div>
                ) : (
                  <div className="p-8 flex flex-col items-center gap-4">
                    <p className="text-amber-200">{t.noTimetable}</p>
                    <a href={timetableUrl} target="_blank" rel="noopener noreferrer"
                      className="px-6 py-3 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors">
                      {t.openTimetable}
                    </a>
                  </div>
                )
              ) : (
                <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                  <Calendar className="w-16 h-16 text-amber-500/30 mb-4" />
                  <p className="text-amber-500/50 text-xl font-display mb-2">{t.noTimetable}</p>
                  <p className="text-amber-500/30 text-sm max-w-xs">{t.noTimetableDesc}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Back to Top Button ────────────────────────────────────── */}
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

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`absolute bottom-full mb-4 ${isRTL ? 'left-0' : 'right-0'} bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-3 flex flex-col gap-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] min-w-[200px]`}>
              <a href="#about" onClick={() => { setShowMobileMenu(false); setActiveMobileTab('more'); }}
                className="text-amber-100 hover:text-amber-400 hover:bg-amber-500/10 p-3 rounded-2xl font-medium flex items-center gap-3 transition-colors">
                <Info className="w-5 h-5 text-amber-500/70" /> <AnimatedText>{t.nav.about}</AnimatedText>
              </a>
              <a href="#about" onClick={() => { setShowMobileMenu(false); setActiveMobileTab('more'); }}
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
            ...(showEvents  ? [{ id: 'events',  icon: Calendar,    label: t.mobileNav.events,  href: '#events'  }] : []),
            ...(showCourses ? [{ id: 'courses', icon: BookOpen,    label: t.mobileNav.courses, href: '/courses' }] : []),
            { id: 'quran',   icon: BookMarked,  label: t.mobileNav.quran,     href: '/quran'  },
          ] as { id: string; icon: typeof Home; label: string; href: string }[]).map(item => {
            const Icon = item.icon;
            const isActive = activeMobileTab === item.id && !showMobileMenu;
            return (
              <a key={item.id} href={item.href}
                onClick={() => { setActiveMobileTab(item.id); setShowMobileMenu(false); }}
                className={`flex flex-col items-center justify-center flex-1 min-h-[3.5rem] rounded-[1.25rem] transition-all duration-300 py-2 ${
                  isActive ? 'bg-amber-500/15 shadow-theme-soft text-amber-400' : 'text-zinc-400 hover:text-amber-200'
                }`}>
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : ''}`} />
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-amber-300' : ''}`}><AnimatedText>{item.label}</AnimatedText></span>
              </a>
            );
          })}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[3.5rem] rounded-[1.25rem] transition-all duration-300 py-2 ${
              showMobileMenu ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-400 hover:text-amber-200'
            }`}>
            <Menu className={`w-5 h-5 mb-0.5 ${showMobileMenu ? 'text-amber-400' : ''}`} />
            <span className={`text-[10px] font-medium tracking-wide ${showMobileMenu ? 'text-amber-300' : ''}`}><AnimatedText>{t.mobileNav.more}</AnimatedText></span>
          </button>
        </div>
      </div>

      {/* ── Visual Customizer Panel ───────────────────────────────── */}
      {isCustomizing && (
        <div className="fixed bottom-0 left-0 right-0 z-[150] bg-[#0c0b08]/96 backdrop-blur-xl border-t border-amber-500/25 shadow-[0_-8px_40px_-4px_rgba(0,0,0,0.8)]" dir="ltr">
          {/* Top row: branding + section pills + actions */}
          <div className="flex items-center gap-3 px-3 md:px-5 py-2.5 border-b border-amber-500/10">
            <div className="flex items-center gap-2 shrink-0">
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="text-amber-200 text-sm font-semibold hidden sm:block whitespace-nowrap">Visual Customizer</span>
            </div>
            <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-0 scrollbar-none">
              {CUSTOMIZE_SECTION_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCustomizeSection(key);
                    const scrollId = CUSTOMIZE_SECTION_SCROLL[key];
                    if (scrollId) {
                      document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else if (key === 'hero') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    customizeSection === key
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  {CUSTOMIZE_SECTION_LABELS[key]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={saveCustomizeColors}
                disabled={customizeSaving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
                  customizeSaved
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-500 text-[#0a0804] hover:bg-amber-400'
                }`}
              >
                {customizeSaving
                  ? <span className="w-3 h-3 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" />
                  : <Check className="w-3 h-3" />
                }
                {customizeSaved ? 'Saved!' : 'Save'}
              </button>
              <a
                href="/"
                className="p-1.5 rounded-xl text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                title="Exit Customizer"
              >
                <X className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Color pickers for selected section */}
          <div className="flex items-center gap-4 md:gap-8 px-3 md:px-5 py-3 flex-wrap">
            <span className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider shrink-0 min-w-[60px]">
              {CUSTOMIZE_SECTION_LABELS[customizeSection]}
            </span>
            <div className="flex items-center gap-2 flex-wrap gap-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-amber-500/50 whitespace-nowrap">Background</label>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 shrink-0">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(customizeColors[customizeSection]?.bg ?? '') ? customizeColors[customizeSection].bg : '#000000'}
                      onChange={e => setCustomizeColors(p => ({ ...p, [customizeSection]: { ...p[customizeSection] ?? { bg: '#0a0804', accent: '#d97706' }, bg: e.target.value } }))}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full rounded-lg" style={{ backgroundColor: customizeColors[customizeSection]?.bg ?? '#0a0804' }} />
                  </div>
                  <input
                    type="text"
                    value={customizeColors[customizeSection]?.bg ?? '#0a0804'}
                    onChange={e => setCustomizeColors(p => ({ ...p, [customizeSection]: { ...p[customizeSection] ?? { bg: '#0a0804', accent: '#d97706' }, bg: e.target.value } }))}
                    maxLength={7}
                    className="w-20 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-amber-100 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="#0a0804"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-amber-500/50 whitespace-nowrap">Accent / UI</label>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 shrink-0">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(customizeColors[customizeSection]?.accent ?? '') ? customizeColors[customizeSection].accent : '#000000'}
                      onChange={e => setCustomizeColors(p => ({ ...p, [customizeSection]: { ...p[customizeSection] ?? { bg: '#0a0804', accent: '#d97706' }, accent: e.target.value } }))}
                      className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full rounded-lg" style={{ backgroundColor: customizeColors[customizeSection]?.accent ?? '#d97706' }} />
                  </div>
                  <input
                    type="text"
                    value={customizeColors[customizeSection]?.accent ?? '#d97706'}
                    onChange={e => setCustomizeColors(p => ({ ...p, [customizeSection]: { ...p[customizeSection] ?? { bg: '#0a0804', accent: '#d97706' }, accent: e.target.value } }))}
                    maxLength={7}
                    className="w-20 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-amber-100 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                    placeholder="#d97706"
                  />
                </div>
              </div>
            </div>
            <p className="text-amber-500/30 text-xs ml-auto hidden md:block">Changes preview instantly · Save to persist</p>
          </div>
        </div>
      )}

    </main>
  );
}
