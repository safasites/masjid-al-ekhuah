'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ArrowLeft, ArrowUp, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '../animation-provider';
import { useTheme, isLightTheme } from '../theme-provider';

type Lang = 'en' | 'ku' | 'ar';

interface Event {
  id: string;
  title: string;
  date_label: string;
  description: string;
  details?: string;
  image_url?: string;
  is_featured: boolean;
  title_ar?: string;
  title_ku?: string;
  description_ar?: string;
  description_ku?: string;
  details_ar?: string;
  details_ku?: string;
}

const eventsTranslations = {
  en: {
    title: 'Upcoming Events',
    subtitle: 'Join our community gatherings at Masjid Al-Ekhuah',
    backToHome: 'Back to Home',
    featured: 'Featured',
    noEvents: 'No events scheduled yet',
    noEventsDesc: 'Check back soon for upcoming events',
    viewDetails: 'View Details',
    close: 'Close',
  },
  ku: {
    title: 'بۆنە ئامادەکراوەکان',
    subtitle: 'بەشداری کۆبوونەوەکانی کۆمەڵگەکەمان بکە لە مزگەوتی ئەل-ئەخوە',
    backToHome: 'گەڕانەوە بۆ سەرەکی',
    featured: 'تایبەتمەند',
    noEvents: 'هێشتا هیچ بۆنەیەک دیاری نەکراوە',
    noEventsDesc: 'دواتر دووبارە سەردان بکە بۆ بۆنە داهاتووەکان',
    viewDetails: 'وردەکاری ببینە',
    close: 'داخستن',
  },
  ar: {
    title: 'الفعاليات القادمة',
    subtitle: 'انضم إلى تجمعات مجتمعنا في مسجد الإخوة',
    backToHome: 'العودة إلى الرئيسية',
    featured: 'مميز',
    noEvents: 'لا توجد فعاليات مجدولة حتى الآن',
    noEventsDesc: 'تحقق مرة أخرى قريبًا للفعاليات القادمة',
    viewDetails: 'عرض التفاصيل',
    close: 'إغلاق',
  },
};

export default function EventsPage() {
  const router = useRouter();
  const anim = useAnimationConfig();
  const { theme } = useTheme();
  const lightMode = isLightTheme(theme);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('en');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mosqueName, setMosqueName] = useState('Masjid Al-Ekhuah');
  const [selected, setSelected] = useState<Event | null>(null);

  const isRTL = lang === 'ar' || lang === 'ku';
  const tr = eventsTranslations[lang];
  const bg = lightMode ? 'bg-[#f8f5ee]' : 'bg-[#0a0804]';

  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => { if (c.mosque_name) setMosqueName(c.mosque_name); })
      .catch(() => {});
  }, []);

  const getTitle   = (e: Event) => lang === 'ar' ? (e.title_ar || e.title) : lang === 'ku' ? (e.title_ku || e.title) : e.title;
  const getDesc    = (e: Event) => lang === 'ar' ? (e.description_ar || e.description) : lang === 'ku' ? (e.description_ku || e.description) : e.description;
  const getDetails = (e: Event) => lang === 'ar' ? (e.details_ar || e.details || e.description_ar || e.description) : lang === 'ku' ? (e.details_ku || e.details || e.description_ku || e.description) : (e.details || e.description);

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
          className="mb-16"
        >
          <h1 className="font-display text-4xl md:text-7xl text-amber-50 mb-3 tracking-tight">{tr.title}</h1>
          <p className="text-amber-200/75 text-base md:text-xl">{lang === 'en' ? tr.subtitle.replace('Masjid Al-Ekhuah', mosqueName) : tr.subtitle}</p>
        </motion.div>

        {/* Events grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-amber-950/20 border border-amber-500/10 rounded-3xl overflow-hidden animate-pulse">
                <div className="aspect-video w-full bg-amber-500/10" />
                <div className="p-5">
                  <div className="h-4 bg-amber-500/10 rounded mb-2 w-2/3" />
                  <div className="h-3 bg-amber-500/10 rounded mb-3 w-1/2" />
                  <div className="h-3 bg-amber-500/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <Calendar className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
            <p className="text-amber-500/50 text-xl font-display">{tr.noEvents}</p>
            <p className="text-amber-500/30 text-sm mt-2">{tr.noEventsDesc}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                {...anim.cardEntry(i)}
                {...anim.cardHover}
                onClick={() => setSelected(event)}
                className={`rounded-3xl overflow-hidden border cursor-pointer group transition-all duration-300 ${
                  event.is_featured
                    ? 'border-amber-400/40 shadow-theme-glow bg-gradient-to-b from-amber-500/15 to-amber-800/5'
                    : 'border-amber-500/15 bg-amber-950/20 hover:bg-amber-900/25 hover:border-amber-500/35'
                }`}
              >
                {/* Image / placeholder */}
                {event.image_url ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={event.image_url}
                      alt={getTitle(event)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-amber-950/40 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-amber-500/20" />
                  </div>
                )}

                {/* Card content */}
                <div className="p-5 md:p-6">
                  {event.is_featured && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-medium uppercase tracking-wider mb-2">
                      {tr.featured}
                    </span>
                  )}
                  <h3 dir="auto" className="text-base md:text-lg font-medium text-amber-50 mb-1.5 line-clamp-2">{getTitle(event)}</h3>
                  <p className="text-amber-400/80 text-xs md:text-sm mb-2">{event.date_label}</p>
                  {event.description && (
                    <p dir="auto" className="text-amber-100/60 text-xs md:text-sm line-clamp-2 leading-relaxed">{getDesc(event)}</p>
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
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              {...anim.modalEntry}
              className={`w-full sm:max-w-2xl ${lightMode ? 'bg-[#f0ede4]' : 'bg-[#111310]'} sm:${lightMode ? 'bg-[#f8f5ee]' : 'bg-[#0a0804]'} border border-amber-500/20 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              {selected.image_url && (
                <div className="aspect-video w-full">
                  <img src={selected.image_url} alt={getTitle(selected)} className="w-full h-full object-cover" />
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
                {selected.is_featured && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-medium uppercase tracking-wider mb-3">
                    {tr.featured}
                  </span>
                )}
                <h2 dir="auto" className="text-2xl md:text-3xl font-display text-amber-50 mb-2 pr-8">{getTitle(selected)}</h2>
                <p className="text-amber-400 text-sm mb-5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {selected.date_label}
                </p>
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
