'use client';

import { motion, useScroll, useTransform, useAnimationControls, AnimatePresence } from 'motion/react';
import { MapPin, ArrowRight, ArrowUp, Globe, Home, BookOpen, Calendar, LayoutGrid, Heart, Info, Menu, X, Settings, Phone, Mail } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Prayer { id: string; azan: string; jamat: string; }
interface PrayerData { prayers: Prayer[]; jumuah: string; hijri: string; gregorian: string; }
interface Event {
  id: string; title: string; date_label: string; description: string;
  title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string;
}
interface Course {
  id: string; title: string; level: string; duration: string;
  title_ar?: string; title_ku?: string;
}
interface DhikrItem {
  id: string; arabic_text: string; transliteration: string;
  meaning_en: string; meaning_ar?: string; meaning_ku?: string;
  target_count: number; sort_order: number;
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
    Muharram: 'موحەڕڕەم', Safar: 'سەفەر', "Rabi' al-Awwal": 'ڕەبیعو الئەووەل',
    "Rabi' al-Thani": 'ڕەبیعو الثانی', "Jumada al-Awwal": 'جومادا الئووڵى',
    "Jumada al-Thani": 'جومادا الثانی', Rajab: 'ڕەجەب',
    "Sha'ban": 'شەعبان', Ramadan: 'ڕەمەزان', Shawwal: 'شەووال',
    "Dhu al-Qi'dah": 'زولقەعدە', "Dhu al-Hijjah": 'زولحیججە',
  },
};

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  en: {
    nav: { times: 'Times', dhikr: 'Dhikr', events: 'Events', courses: 'Courses', donate: 'Donate', about: 'About' },
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
    donateTitle: 'Support Your Masjid',
    donateDesc: 'Your generous donations help us maintain the mosque and provide services to the community.',
    donateBtn: 'Donate Now',
    aboutTitle: 'About Us',
    mobileNav: { home: 'Home', quran: 'Courses', events: 'Events', timetable: 'Times', more: 'More' },
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
  },
  ku: {
    nav: { times: 'کاتەکان', dhikr: 'زیکر', events: 'بۆنەکان', courses: 'خولەکان', donate: 'بەخشین', about: 'دەربارە' },
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
    donateTitle: 'پشتیوانی مزگەوتەکەت بکە',
    donateDesc: 'بەخشینە بەخشندەکانت یارمەتیدەرمانە بۆ پاراستنی مزگەوتەکە و پێشکەشکردنی خزمەتگوزاری بە کۆمەڵگە.',
    donateBtn: 'ئێستا ببەخشە',
    aboutTitle: 'دەربارەی ئێمە',
    mobileNav: { home: 'سەرەکی', quran: 'خولەکان', events: 'بۆنەکان', timetable: 'کاتەکان', more: 'زیاتر' },
    admin: 'بەڕێوەبەر', close: 'داخستن',
    loading: '…کاتی نوێژ بارکردن',
    openTimetable: 'خشتەی تەواو بکەرەوە',
    noTimetable: 'هیچ خشتەیەک بارنەکراوە',
    noTimetableDesc: 'بەڕێوەبەری مزگەوت دەتوانێت خشتەی مانگانەی کاتەکان لە پانێلی بەڕێوەبەری بار بکات.',
    dhikrTitle: 'یادی خودا',
    dhikrSubtitle: 'کاتێک بۆ ئەندیشە',
    dhikrTap: 'دەستبکە بە ژمارەکردن',
    dhikrReset: 'ڕیسێت',
    dhikrCompleted: 'تەواو بوو',
    dhikrOf: 'لە',
  },
  ar: {
    nav: { times: 'الأوقات', dhikr: 'ذكر', events: 'الفعاليات', courses: 'الدورات', donate: 'تبرع', about: 'حول' },
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
    donateTitle: 'ادعم مسجدك',
    donateDesc: 'تبرعاتك السخية تساعدنا في الحفاظ على المسجد وتقديم الخدمات للمجتمع.',
    donateBtn: 'تبرع الآن',
    aboutTitle: 'معلومات عنا',
    mobileNav: { home: 'الرئيسية', quran: 'الدورات', events: 'الفعاليات', timetable: 'الأوقات', more: 'المزيد' },
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
const AnimatedText = ({
  children,
  className = '',
  nowrap = true,
}: {
  children: React.ReactNode;
  className?: string;
  nowrap?: boolean;
}) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={String(children)}
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
      transition={{ duration: 0.2 }}
      className={`inline-block ${nowrap ? 'whitespace-nowrap' : 'whitespace-normal'} ${className}`}
    >
      {children}
    </motion.span>
  </AnimatePresence>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MosqueHero() {
  const router = useRouter();
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
  const [events, setEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [timetableUrl, setTimetableUrl] = useState<string | null>(null);
  const [dhikrItems, setDhikrItems] = useState<DhikrItem[]>([]);
  const [dhikrIndex, setDhikrIndex] = useState(0);
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  const [dhikrCompleted, setDhikrCompleted] = useState<Record<string, boolean>>({});
  const [dhikrBurst, setDhikrBurst] = useState(false);

  const t = translations[lang];
  const isRTL = lang === 'ar' || lang === 'ku';

  // Feature flags — derived from content (default true until content loads)
  const showEvents  = content.feature_events  !== 'false';
  const showCourses = content.feature_courses !== 'false';
  const showDonate  = content.feature_donate  !== 'false';
  const showDhikr   = content.feature_dhikr   !== 'false';

  // Scroll animations
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  const heroBlur   = useTransform(scrollYProgress, [0, 0.2], ['blur(0px)', 'blur(20px)']);
  const heroY      = useTransform(scrollYProgress, [0, 0.2], ['0%', '15%']);

  // Restore persisted language
  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
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
      setActiveMobileTab('dhikr');
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
      .then((data: Event[]) => setEvents(data.slice(0, 3)));

    fetch('/api/admin/courses')
      .then(r => r.json())
      .then(setCourses);

    fetch('/api/admin/content')
      .then(r => r.json())
      .then(setContent);

    fetch('/api/admin/timetable')
      .then(r => r.json())
      .then(d => d && setTimetableUrl(d.image_url));

    fetch('/api/admin/dhikr')
      .then(r => r.json())
      .then((items: DhikrItem[]) => {
        setDhikrItems(items);
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
      });
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

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('mosque-lang', newLang);
  };

  const handlePinInteraction = useCallback(async () => {
    await pinControls.start({ y: -10, rotate: 360, scale: 1.2, transition: { duration: 0.6, type: 'spring', bounce: 0.5 } });
    pinControls.start({ y: 0, rotate: 0, scale: 1, transition: { duration: 0.3 } });
  }, [pinControls]);

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

  return (
    <main ref={containerRef} dir={isRTL ? 'rtl' : 'ltr'} className="relative bg-[#0a0804] selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden">

      {/* ── Desktop Navigation ────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#0a0804]/80 backdrop-blur-xl py-4 border-b border-amber-500/20' : 'bg-transparent py-6'
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
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border border-amber-500/40 rounded-full group-hover:border-amber-400/80 transition-colors duration-500" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-1 border border-amber-400/30 rounded-full group-hover:border-amber-300/60 transition-colors duration-500" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-400 group-hover:scale-110 transition-transform duration-500">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="font-display font-medium text-lg md:text-xl text-amber-50 tracking-wide whitespace-nowrap">{content.mosque_name || 'Masjid Al-Ekhuah'}</span>
          </motion.div>

          {/* Desktop nav — active section glow */}
          <nav className="hidden lg:flex items-center gap-8">
            {Object.entries(t.nav).filter(([key]) => {
              if (key === 'dhikr')   return showDhikr && dhikrItems.length > 0;
              if (key === 'events')  return showEvents;
              if (key === 'courses') return showCourses;
              if (key === 'donate')  return showDonate;
              return true;
            }).map(([key, item], i) => {
              const isActive = activeSection === key;
              return (
                <motion.a key={key} href={`#${key}`}
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                  className={`text-sm font-medium tracking-wide relative group transition-colors duration-300 ${
                    isActive ? 'text-amber-400' : 'text-amber-100/60 hover:text-amber-400'
                  }`}>
                  <AnimatedText>{item}</AnimatedText>
                  {isActive ? (
                    <motion.span
                      layoutId="active-nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[1px] bg-amber-400"
                      style={{ boxShadow: '0 0 8px 2px rgba(245,158,11,0.5)' }}
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-400 transition-all duration-300 group-hover:w-full" />
                  )}
                </motion.a>
              );
            })}
          </nav>

          <motion.div initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex items-center gap-2 md:gap-4">
            <button onClick={() => changeLang(nextLang[lang])}
              className="flex items-center justify-center px-3 md:px-4 py-2 md:py-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] gap-2 group">
              <Globe className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <AnimatedText>{t.langToggle}</AnimatedText>
            </button>
            <button onMouseEnter={handlePinInteraction} onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden md:flex items-center justify-center px-6 py-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-sm font-medium backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] gap-2 group">
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
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/20 blur-[120px] animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/20 blur-[150px] animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-amber-400/15 blur-[100px] animate-float" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlur, y: heroY }}
          className="relative z-10 flex flex-col items-center justify-center px-6 w-full max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-white w-full leading-[1.1] tracking-tight mb-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <AnimatedText>{heroLine1}</AnimatedText>
            {/* Gradient word — className applied directly to AnimatedText so bg-clip-text works on the motion.span */}
            <AnimatedText className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-400 to-yellow-200 animate-gradient-xy drop-shadow-sm">
              {heroLine2}
            </AnimatedText>
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto">
            <button onClick={() => document.getElementById('times')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0804] font-medium text-base hover:from-amber-300 hover:to-amber-500 transition-all duration-300 flex items-center justify-center gap-2 group animate-breathe hover:animate-none hover:shadow-[0_0_40px_-5px_rgba(245,158,11,0.6)] hover:-translate-y-1">
              <AnimatedText>{t.viewPrayers}</AnimatedText>
              {/* Arrow always animates downward (rotate 90°) on hover in both LTR and RTL */}
              <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
                isRTL
                  ? 'rotate-180 group-hover:translate-y-1 group-hover:rotate-90'
                  : 'group-hover:translate-y-1 group-hover:rotate-90'
              }`} />
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="h-[100vh]" />

      {/* ── Content Sections ──────────────────────────────────────── */}
      <div className="relative z-20 bg-[#0a0804] rounded-t-[3rem] md:rounded-t-[5rem] shadow-[0_-30px_60px_-15px_rgba(245,158,11,0.2)] overflow-hidden pb-32 md:pb-0">

        {/* Prayer Times Section */}
        <section id="times" className="min-h-screen bg-gradient-to-b from-amber-900/40 via-amber-950/40 to-[#0a0804] backdrop-blur-3xl border-t border-amber-500/30 flex flex-col items-center justify-center px-6 py-24">
          <div className="max-w-6xl w-full mx-auto">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, ease: 'easeOut' }} className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-amber-50 mb-6 tracking-tight">
                <AnimatedText>{t.todaysPrayers}</AnimatedText>
              </h2>
              <div className="flex items-center justify-center gap-4 text-sm md:text-base text-amber-200/70">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <AnimatedText>{t.birmingham}</AnimatedText>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                {/* dir="ltr" ensures Hijri date numbers display correctly in RTL mode */}
                <span dir="ltr">{prayerData ? translateHijri(prayerData.hijri, lang) : '—'}</span>
              </div>
            </motion.div>

            {/* Prayer rows — compact horizontal pill list */}
            {prayerLoading ? (
              <div className="flex items-center justify-center py-20">
                <span className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2 md:gap-3 max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto w-full">
                {(prayerData?.prayers ?? []).map((prayer, index) => {
                  const isActive = prayer.id === activePrayer;
                  const isNext = prayer.id === nextPrayer && !isActive;
                  return (
                    <motion.div
                      key={prayer.id}
                      initial={{ opacity: 0, x: isRTL ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
                      className={`relative flex items-center gap-4 rounded-2xl px-5 py-4 md:py-5 md:px-8 transition-all duration-500 ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-500/25 to-amber-700/15 border border-amber-400/60 shadow-[0_0_30px_-8px_rgba(245,158,11,0.4)]'
                          : 'bg-amber-950/30 border border-amber-800/30 hover:border-amber-500/40 hover:bg-amber-900/30'
                      }`}
                    >
                      {/* Prayer name */}
                      <div className="w-28 md:w-32 shrink-0 flex items-center gap-2">
                        <p className={`text-[13px] md:text-sm font-semibold tracking-wider uppercase ${isActive ? 'text-amber-200' : 'text-amber-500/80'}`}>
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
                        <p className="text-amber-500/40 text-[11px] md:text-xs uppercase tracking-widest mb-0.5">{t.azan}</p>
                        <p dir="ltr" className={`font-display text-base md:text-xl tracking-tight ${isActive ? 'text-white' : 'text-amber-100/70'}`}>
                          {prayer.azan || '—'}
                        </p>
                      </div>
                      {/* Separator */}
                      <div className={`w-px self-stretch ${isActive ? 'bg-amber-400/20' : 'bg-amber-800/30'}`} />
                      {/* Jamat */}
                      <div className="flex-1 text-center">
                        <p className="text-amber-500/40 text-[11px] md:text-xs uppercase tracking-widest mb-0.5">{t.jamat}</p>
                        <p dir="ltr" className={`font-display text-base md:text-xl tracking-tight ${isActive ? 'text-amber-300' : 'text-amber-400/70'}`}>
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
                <div className="px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-medium flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span><AnimatedText>{t.jumuah}</AnimatedText></span>
                  <span dir="ltr" className="text-amber-400 font-display text-base">{prayerData.jumuah}</span>
                </div>
              </motion.div>
            )}

            {/* View Full Timetable */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }} className="mt-8 flex justify-center">
              <button onClick={() => setShowTimetable(true)}
                className="px-8 py-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium text-base hover:bg-amber-500/20 transition-all duration-300 flex items-center justify-center gap-2 group hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]">
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
            <section id="dhikr" className="px-6 py-16 md:py-28 overflow-hidden relative">
              {/* Subtle radial background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[100px]" />
              </div>

              <div className="max-w-2xl mx-auto w-full relative z-10">
                {/* Section heading */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="text-center mb-10 md:mb-14"
                >
                  <h2 className="font-display text-3xl md:text-5xl text-amber-50 mb-2 tracking-tight">
                    <AnimatedText>{dhikrTitle}</AnimatedText>
                  </h2>
                  <p className="text-amber-200/50 text-base md:text-lg">
                    <AnimatedText>{t.dhikrSubtitle}</AnimatedText>
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
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
                      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                      transition={{ duration: 0.35 }}
                      className="text-center mb-8 md:mb-10"
                    >
                      <p dir="rtl" className="text-4xl md:text-5xl font-bold text-amber-50 mb-3 leading-tight" style={{ fontFamily: 'serif' }}>
                        {item?.arabic_text}
                      </p>
                      <p className="text-xl md:text-2xl font-medium text-amber-400 mb-2 tracking-wide">
                        {item?.transliteration}
                      </p>
                      <p className="text-sm md:text-base text-amber-200/50">
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
                          ? 'bg-amber-500/20 shadow-[0_0_40px_-8px_rgba(245,158,11,0.6)]'
                          : 'bg-amber-950/60 hover:bg-amber-900/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]'
                      }`} />

                      {/* Count display */}
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={count}
                            initial={{ scale: 1.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
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
        {showEvents && <section id="events" className="px-6 py-12 md:py-24 overflow-hidden">
          <motion.div initial={{ opacity: 0, x: isRTL ? -100 : 100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, ease: 'easeOut' }} className="max-w-6xl w-full mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12 gap-4 md:gap-6">
              <div>
                <h2 className="font-display text-3xl md:text-5xl text-amber-50 mb-2 md:mb-4"><AnimatedText>{t.eventsTitle}</AnimatedText></h2>
                <p className="text-amber-200/60 text-lg"><AnimatedText>{t.eventsSubtitle}</AnimatedText></p>
              </div>
              <button onClick={() => router.push('/events')}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-2 font-medium transition-colors shrink-0">
                <AnimatedText>{t.viewAll}</AnimatedText>
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {events.length === 0 ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-amber-950/20 border border-amber-500/10 rounded-3xl p-5 md:p-8 animate-pulse">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 mb-3 md:mb-6" />
                    <div className="h-5 bg-amber-500/10 rounded-lg mb-3 w-2/3" />
                    <div className="h-3 bg-amber-500/10 rounded mb-4 w-1/2" />
                    <div className="h-3 bg-amber-500/5 rounded w-full" />
                  </div>
                ))
              ) : events.map(event => (
                <motion.div key={event.id} whileHover={{ y: -8 }}
                  className="bg-amber-950/20 border border-amber-500/20 rounded-3xl p-5 md:p-8 hover:bg-amber-900/30 hover:border-amber-500/40 transition-all duration-300 group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3 md:mb-6 group-hover:bg-amber-500/20 transition-colors">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                  </div>
                  <h3 dir="auto" className="text-xl font-medium text-amber-50 mb-2">{getEventTitle(event)}</h3>
                  <p className="text-amber-400/80 text-sm mb-3">{event.date_label}</p>
                  {event.description && <p dir="auto" className="text-amber-100/60 leading-relaxed">{getEventDesc(event)}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>}

        {/* Courses Section */}
        {showCourses && <section id="courses" className="px-6 py-12 md:py-24 bg-amber-950/10 overflow-hidden">
          <motion.div initial={{ opacity: 0, x: isRTL ? 100 : -100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, ease: 'easeOut' }} className="max-w-6xl w-full mx-auto">
            <div className="text-center mb-8 md:mb-16">
              <h2 className="font-display text-3xl md:text-5xl text-amber-50 mb-2 md:mb-4"><AnimatedText>{t.coursesTitle}</AnimatedText></h2>
              <p className="text-amber-200/60 text-lg"><AnimatedText>{t.coursesSubtitle}</AnimatedText></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {courses.length === 0 ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="bg-[#0a0804] border border-amber-500/10 rounded-3xl p-5 md:p-8 animate-pulse">
                    <div className="flex justify-between mb-3 md:mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10" />
                      <div className="h-6 w-20 rounded-full bg-amber-500/10" />
                    </div>
                    <div className="h-5 bg-amber-500/10 rounded-lg mb-3 w-2/3" />
                    <div className="h-3 bg-amber-500/5 rounded w-1/3" />
                  </div>
                ))
              ) : courses.map(course => (
                <motion.div key={course.id} whileHover={{ scale: 1.02 }}
                  className="bg-[#0a0804] border border-amber-500/20 rounded-3xl p-5 md:p-8 hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
                  <div className="flex justify-between items-start mb-3 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">{course.level}</span>
                  </div>
                  <h3 dir="auto" className="text-xl font-medium text-amber-50 mb-2">{getCourseTitle(course)}</h3>
                  <p className="text-amber-100/60 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />{course.duration}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>}

        {/* Donate Section */}
        {showDonate && <section id="donate" className="py-32 px-6 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-900/20 pointer-events-none" />
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-4xl w-full mx-auto text-center relative z-10 bg-amber-950/30 border border-amber-500/30 rounded-[3rem] p-8 md:p-12 lg:p-20 backdrop-blur-md shadow-[0_0_50px_-15px_rgba(245,158,11,0.2)]">
            <div className="w-20 h-20 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-8 border border-amber-400/30">
              <Heart className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="font-display text-4xl md:text-6xl text-amber-50 mb-6 break-words">
              <AnimatedText>{t.donateTitle}</AnimatedText>
            </h2>
            {/* nowrap={false} allows the description to wrap naturally, fixing overflow */}
            <p className="text-amber-100/70 text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              <AnimatedText nowrap={false}>{t.donateDesc}</AnimatedText>
            </p>
            <button className="px-10 py-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0804] font-bold text-lg hover:from-amber-300 hover:to-amber-500 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_0_50px_-5px_rgba(245,158,11,0.7)] hover:-translate-y-1">
              <AnimatedText>{t.donateBtn}</AnimatedText>
            </button>
          </motion.div>
        </section>}

        {/* About / Contact Section */}
        <section id="about" className="py-24 px-6 border-t border-amber-500/10 overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl text-amber-50 mb-6 break-words"><AnimatedText>{t.aboutTitle}</AnimatedText></h2>
              <p className="text-amber-100/60 text-lg leading-relaxed mb-8 break-words">{aboutDesc}</p>
              <div className="space-y-4">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 text-amber-200/80 hover:text-amber-300 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="break-words">{contactAddress}</span>
                </a>
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className="flex items-center gap-4 text-amber-200/80 hover:text-amber-300 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                    <Phone className="w-4 h-4 text-amber-400" />
                  </div>
                  <span dir="ltr">{contactPhone}</span>
                </a>
                <a href={`mailto:${contactEmail}`}
                  className="flex items-center gap-4 text-amber-200/80 hover:text-amber-300 transition-colors group">
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
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </section>

      </div>

      {/* ── Timetable Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showTimetable && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
            <button onClick={() => setShowTimetable(false)}
              className="absolute top-6 right-6 text-amber-100 hover:text-amber-400 z-50 bg-amber-900/50 p-3 rounded-full border border-amber-500/30 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl border border-amber-500/30 bg-[#0a0804] shadow-2xl">
              {timetableUrl ? (
                timetableUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <img src={timetableUrl} alt="Prayer Timetable" className="w-full h-auto rounded-3xl" style={{ touchAction: 'pinch-zoom' }} />
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
            className="fixed z-40 bottom-32 md:bottom-8 right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] hover:-translate-y-1"
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

        <div className="bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-full p-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
          {([
            { id: 'home',    icon: Home,       label: t.mobileNav.home,      href: '#' },
            { id: 'times',   icon: LayoutGrid, label: t.mobileNav.timetable, href: '#times' },
            ...(showEvents  ? [{ id: 'events',  icon: Calendar,  label: t.mobileNav.events, href: '#events'  }] : []),
            ...(showCourses ? [{ id: 'courses', icon: BookOpen,  label: t.mobileNav.quran,  href: '#courses' }] : []),
          ] as { id: string; icon: typeof Home; label: string; href: string }[]).map(item => {
            const Icon = item.icon;
            const isActive = activeMobileTab === item.id && !showMobileMenu;
            return (
              <a key={item.id} href={item.href}
                onClick={() => { setActiveMobileTab(item.id); setShowMobileMenu(false); }}
                className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:text-amber-200'
                }`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-amber-400' : ''}`} />
                <span className="text-[10px] font-medium tracking-wide"><AnimatedText>{item.label}</AnimatedText></span>
              </a>
            );
          })}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 ${
              showMobileMenu ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:text-amber-200'
            }`}>
            <Menu className={`w-5 h-5 mb-1 ${showMobileMenu ? 'text-amber-400' : ''}`} />
            <span className="text-[10px] font-medium tracking-wide"><AnimatedText>{t.mobileNav.more}</AnimatedText></span>
          </button>
        </div>
      </div>

    </main>
  );
}
