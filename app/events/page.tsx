'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ArrowLeft, ArrowUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Lang = 'en' | 'ku' | 'ar';

interface Event {
  id: string;
  title: string;
  date_label: string;
  description: string;
  is_featured: boolean;
  title_ar?: string;
  title_ku?: string;
  description_ar?: string;
  description_ku?: string;
}

const eventsTranslations = {
  en: {
    title: 'Upcoming Events',
    subtitle: 'Join our community gatherings at Masjid Al-Ekhuah',
    backToHome: 'Back to Home',
    featured: 'Featured',
    noEvents: 'No events scheduled yet',
    noEventsDesc: 'Check back soon for upcoming events',
  },
  ku: {
    title: 'بۆنە ئامادەکراوەکان',
    subtitle: 'بەشداری کۆبوونەوەکانی کۆمەڵگەکەمان بکە لە مزگەوتی ئەل-ئەخوە',
    backToHome: 'گەڕانەوە بۆ سەرەکی',
    featured: 'تایبەتمەند',
    noEvents: 'هێشتا هیچ بۆنەیەک دیاری نەکراوە',
    noEventsDesc: 'دواتر دووبارە سەردان بکە بۆ بۆنە داهاتووەکان',
  },
  ar: {
    title: 'الفعاليات القادمة',
    subtitle: 'انضم إلى تجمعات مجتمعنا في مسجد الإخوة',
    backToHome: 'العودة إلى الرئيسية',
    featured: 'مميز',
    noEvents: 'لا توجد فعاليات مجدولة حتى الآن',
    noEventsDesc: 'تحقق مرة أخرى قريبًا للفعاليات القادمة',
  },
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('en');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mosqueName, setMosqueName] = useState('Masjid Al-Ekhuah');

  const isRTL = lang === 'ar' || lang === 'ku';
  const t = eventsTranslations[lang];

  // Restore language from localStorage (matches homepage setting)
  useEffect(() => {
    const stored = localStorage.getItem('mosque-lang') as Lang | null;
    if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) setLang(stored);
  }, []);

  // Back-to-top scroll tracking
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => { if (c.mosque_name) setMosqueName(c.mosque_name); });
  }, []);

  const getTitle = (e: Event) => lang === 'ar' ? (e.title_ar || e.title) : lang === 'ku' ? (e.title_ku || e.title) : e.title;
  const getDesc  = (e: Event) => lang === 'ar' ? (e.description_ar || e.description) : lang === 'ku' ? (e.description_ku || e.description) : e.description;

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#0a0804] selection:bg-amber-500/30 selection:text-amber-100 px-6 py-16 md:py-24 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-amber-400/70 hover:text-amber-300 transition-colors mb-12 group"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
          <span className="text-sm font-medium">{t.backToHome}</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h1 className="font-display text-5xl md:text-7xl text-amber-50 mb-4 tracking-tight">{t.title}</h1>
          <p className="text-amber-200/60 text-xl">{lang === 'en' ? t.subtitle.replace('Masjid Al-Ekhuah', mosqueName) : t.subtitle}</p>
        </motion.div>

        {/* Events grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-amber-950/20 border border-amber-500/10 rounded-3xl p-8 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 mb-6" />
                <div className="h-5 bg-amber-500/10 rounded-lg mb-3 w-2/3" />
                <div className="h-3 bg-amber-500/10 rounded mb-4 w-1/2" />
                <div className="h-3 bg-amber-500/5 rounded w-full" />
                <div className="h-3 bg-amber-500/5 rounded w-4/5 mt-2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Calendar className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
            <p className="text-amber-500/50 text-xl font-display">{t.noEvents}</p>
            <p className="text-amber-500/30 text-sm mt-2">{t.noEventsDesc}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -8 }}
                className={`rounded-3xl p-8 transition-all duration-300 group relative overflow-hidden ${
                  event.is_featured
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-800/10 border border-amber-400/40 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]'
                    : 'bg-amber-950/20 border border-amber-500/20 hover:bg-amber-900/30 hover:border-amber-500/40'
                }`}
              >
                {event.is_featured && (
                  <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-medium uppercase tracking-wider`}>
                    {t.featured}
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <h3 dir="auto" className="text-xl font-medium text-amber-50 mb-2">{getTitle(event)}</h3>
                <p className="text-amber-400/80 text-sm mb-4">{event.date_label}</p>
                {event.description && (
                  <p dir="auto" className="text-amber-100/60 leading-relaxed text-sm">{getDesc(event)}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed z-40 bottom-8 right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] hover:-translate-y-1"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
