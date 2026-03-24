'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ArrowLeft, ArrowUp, X, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '../animation-provider';
import { useTheme, isLightTheme } from '../theme-provider';
import { GeometricPattern } from '../components/GeometricPattern';

type Lang = 'en' | 'ku' | 'ar';

interface Course {
  id: string;
  title: string;
  level: string;
  duration: string;
  description: string;
  details?: string;
  image_url?: string;
  title_ar?: string;
  title_ku?: string;
  description_ar?: string;
  description_ku?: string;
  details_ar?: string;
  details_ku?: string;
}

const coursesTranslations = {
  en: {
    title: 'Islamic Courses',
    subtitle: 'Expand your knowledge at Masjid Al-Ekhuah',
    backToHome: 'Back to Home',
    noCourses: 'No courses available yet',
    noCoursesDesc: 'Check back soon for upcoming courses',
    close: 'Close',
    duration: 'Duration',
    level: 'Level',
  },
  ku: {
    title: 'خولە ئیسلامییەکان',
    subtitle: 'زانیارییەکانت فراوان بکە لە مزگەوتی ئەل-ئەخوە',
    backToHome: 'گەڕانەوە بۆ سەرەکی',
    noCourses: 'هێشتا هیچ خولەیەک بەردەست نییە',
    noCoursesDesc: 'دواتر دووبارە سەردان بکە',
    close: 'داخستن',
    duration: 'ماوە',
    level: 'ئاست',
  },
  ar: {
    title: 'الدورات الإسلامية',
    subtitle: 'وسع معرفتك في مسجد الإخوة',
    backToHome: 'العودة إلى الرئيسية',
    noCourses: 'لا توجد دورات متاحة بعد',
    noCoursesDesc: 'تحقق مرة أخرى قريبًا',
    close: 'إغلاق',
    duration: 'المدة',
    level: 'المستوى',
  },
};

export default function CoursesPage() {
  const router = useRouter();
  const anim = useAnimationConfig();
  const { theme } = useTheme();
  const lightMode = isLightTheme(theme);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('en');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mosqueName, setMosqueName] = useState('Masjid Al-Ekhuah');
  const [selected, setSelected] = useState<Course | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar' || lang === 'ku';
  const tr = coursesTranslations[lang];
  const bg = 'bg-[var(--page-bg)]';

  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Focus trap + Escape key for modal
  useEffect(() => {
    if (!selected) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSelected(null); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) { e.preventDefault(); return; }
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previouslyFocused?.focus(); };
  }, [selected]);

  useEffect(() => {
    fetch('/api/admin/courses')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourses(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => { if (c.mosque_name) setMosqueName(c.mosque_name); })
      .catch(() => {});
  }, []);

  const getTitle   = (c: Course) => lang === 'ar' ? (c.title_ar || c.title) : lang === 'ku' ? (c.title_ku || c.title) : c.title;
  const getDesc    = (c: Course) => lang === 'ar' ? (c.description_ar || c.description) : lang === 'ku' ? (c.description_ku || c.description) : c.description;
  const getDetails = (c: Course) => lang === 'ar' ? (c.details_ar || c.details || c.description_ar || c.description) : lang === 'ku' ? (c.details_ku || c.details || c.description_ku || c.description) : (c.details || c.description);

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className={`min-h-screen ${bg} selection:bg-amber-500/30 selection:text-amber-100 px-6 py-16 md:py-24 relative overflow-hidden`}>
      {/* Background glows */}
      <div className="hidden md:block fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="hidden md:block fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-amber-400/70 hover:text-amber-300 transition-colors mb-12 group"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
          <span className="text-sm font-medium">{tr.backToHome}</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: anim.isSimplified ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: anim.isSimplified ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 relative"
        >
          {!anim.isSimplified && <GeometricPattern size={200} opacity={0.04} className="absolute top-0 right-0 hidden md:block" />}
          <p className="text-xs uppercase tracking-widest text-amber-500/50 mb-3">{mosqueName}</p>
          <h1 className="font-display text-5xl md:text-8xl text-amber-50 mb-4 tracking-tight">{tr.title}</h1>
          <p className="text-amber-200/60 text-lg">{lang === 'en' ? tr.subtitle.replace('Masjid Al-Ekhuah', mosqueName) : tr.subtitle}</p>
        </motion.div>

        {/* Courses grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-3xl overflow-hidden">
                <div className="aspect-video w-full shimmer" />
                <div className="p-5">
                  <div className="h-4 shimmer rounded mb-2 w-2/3" />
                  <div className="h-3 shimmer rounded mb-3 w-1/2" />
                  <div className="h-3 shimmer rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <BookOpen className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
            <p className="text-amber-500/50 text-xl font-display">{tr.noCourses}</p>
            <p className="text-amber-500/30 text-sm mt-2">{tr.noCoursesDesc}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                {...anim.cardEntry(i)}
                {...anim.cardHover}
                onClick={() => setSelected(course)}
                className="glass rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-elevation-2 hover:shadow-theme-soft relative"
              >

                {/* Image / placeholder */}
                {course.image_url ? (
                  <div className="aspect-video w-full overflow-hidden relative">
                    <Image
                      src={course.image_url}
                      alt={getTitle(course)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-amber-950/40 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-amber-500/20" />
                  </div>
                )}

                {/* Card content */}
                <div className="p-5 md:p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                      /beginner|basic|intro/i.test(course.level)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : /advanced|expert/i.test(course.level)
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : /inter|mid/i.test(course.level)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {course.level}
                    </span>
                    <span className="text-amber-500/50 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />{course.duration}
                    </span>
                  </div>
                  <h3 dir="auto" className="text-base md:text-lg font-medium text-amber-50 mb-2 line-clamp-2">{getTitle(course)}</h3>
                  {course.description && (
                    <p dir="auto" className="text-amber-100/60 text-xs md:text-sm line-clamp-2 leading-relaxed">{getDesc(course)}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              {...anim.modalEntry}
              className={`w-full sm:max-w-2xl ${lightMode ? 'bg-[#f0ede4]/95' : 'bg-[#111310]/95'} backdrop-blur-xl border border-amber-500/20 shadow-elevation-3 rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden max-h-[90vh] overflow-y-auto outline-none`}
              onClick={e => e.stopPropagation()}
            >
              {selected.image_url && (
                <div className="aspect-video w-full relative">
                  <Image src={selected.image_url} alt={getTitle(selected)} fill
                    className="object-cover" sizes="(max-width: 640px) 100vw, 672px" priority />
                </div>
              )}
              <div className={`p-6 md:p-8 relative ${!selected.image_url ? 'pt-12' : ''}`}>
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors z-10"
                  aria-label={tr.close}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    /beginner|basic|intro/i.test(selected.level)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : /advanced|expert/i.test(selected.level)
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : /inter|mid/i.test(selected.level)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selected.level}
                  </span>
                  <span className="text-amber-500/60 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />{selected.duration}
                  </span>
                </div>
                <h2 id="modal-title" dir="auto" className="text-2xl md:text-3xl font-display text-amber-50 mb-5 pr-8">{getTitle(selected)}</h2>
                {getDetails(selected) && (
                  <p dir="auto" className="text-amber-100/80 leading-relaxed whitespace-pre-wrap">{getDetails(selected)}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed z-40 bottom-8 right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-theme-soft hover:shadow-theme-glow hover:-translate-y-1"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
