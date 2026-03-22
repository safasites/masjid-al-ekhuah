// ─── Shared types, helpers, and constants for the main page ──────────────────
// All components import from here to avoid duplication.

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Prayer { id: string; azan: string; jamat: string; }
export interface PrayerData { prayers: Prayer[]; jumuah: string; hijri: string; gregorian: string; }
export interface Event {
  id: string; title: string; date_label: string; description: string; image_url?: string;
  title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string;
}
export interface Course {
  id: string; title: string; level: string; duration: string; image_url?: string;
  title_ar?: string; title_ku?: string;
}
export interface DhikrItem {
  id: string; arabic_text: string; transliteration: string;
  meaning_en: string; meaning_ar?: string; meaning_ku?: string;
  target_count: number; sort_order: number;
}
export interface Book {
  id: string; title: string; author?: string; image_url?: string; external_link?: string;
  title_ar?: string; title_ku?: string;
}
export type Lang = 'en' | 'ku' | 'ar';

// ─── Visual Customizer constants ──────────────────────────────────────────────
export const CUSTOMIZE_SECTION_KEYS = ['hero', 'prayer', 'dhikr', 'events', 'courses', 'books', 'donate', 'about', 'footer'] as const;
export const CUSTOMIZE_SECTION_LABELS: Record<string, string> = {
  hero: 'Hero', prayer: 'Prayer', dhikr: 'Dhikr',
  events: 'Events', courses: 'Courses', books: 'Books',
  donate: 'Donate', about: 'About', footer: 'Footer',
};
export const CUSTOMIZE_SECTION_SCROLL: Record<string, string | null> = {
  hero: null, prayer: 'times', dhikr: 'dhikr',
  events: 'events', courses: 'courses', books: 'books',
  donate: 'donate', about: 'about', footer: null,
};

// ─── Hijri month name lookup ───────────────────────────────────────────────
export const hijriMonths: Record<Lang, Record<string, string>> = {
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
export const translations = {
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

export const nextLang: Record<Lang, Lang> = { en: 'ku', ku: 'ar', ar: 'en' };

// ─── Helper: determine which prayer is currently active ───────────────────────
export function getActivePrayer(prayers: Prayer[]): string {
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

export function getNextPrayer(prayers: Prayer[]): string {
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
  return prayers[0].id;
}

// ─── Helper: format jamat with translated "X mins after Azan" pattern ─────────
export function formatJamat(jamat: string, t: typeof translations['en']): string {
  const match = jamat.match(/^(\d+)\s*min/i);
  if (match) return t.minsAfterAzan(parseInt(match[1]));
  const numMatch = jamat.match(/^\d+$/);
  if (numMatch) return t.minsAfterAzan(parseInt(jamat));
  return jamat;
}

// ─── Helper: translate hijri date month names ─────────────────────────────────
export function translateHijri(hijri: string, lang: Lang): string {
  if (lang === 'en' || !hijri) return hijri;
  const months = hijriMonths[lang];
  let result = hijri;
  for (const [en, translated] of Object.entries(months)) {
    result = result.replace(en, translated);
  }
  return result;
}

// ─── Helper: luminosity check for background color ───────────────────────────
export function isDarkBg(hex: string): boolean {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
