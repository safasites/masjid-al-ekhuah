'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookMarked, ArrowLeft, ArrowUp, X, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '../animation-provider';
import { useTheme, isLightTheme } from '../theme-provider';

type Lang = 'en' | 'ku' | 'ar';

interface BookCategory {
  id: string;
  name: string;
  name_ar?: string;
  name_ku?: string;
  sort_order: number;
}

interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  image_url?: string;
  external_link?: string;
  is_active: boolean;
  sort_order: number;
  category_id?: string;
  title_ar?: string;
  title_ku?: string;
  description_ar?: string;
  description_ku?: string;
}

const booksTranslations = {
  en: {
    title: 'Recommended Books',
    subtitle: 'Selected reads from Masjid Al-Ekhuah',
    backToHome: 'Back to Home',
    noBooks: 'No books available yet',
    noBooksDesc: 'Check back soon for recommended reads',
    close: 'Close',
    viewBook: 'View Book',
    uncategorised: 'General',
  },
  ku: {
    title: 'کتێبە پێشنیارکراوەکان',
    subtitle: 'خوێندنەوەی هەڵبژێردراو لە مزگەوتی ئەل-ئەخوە',
    backToHome: 'گەڕانەوە بۆ سەرەکی',
    noBooks: 'هێشتا هیچ کتێبێک بەردەست نییە',
    noBooksDesc: 'دواتر دووبارە سەردان بکە',
    close: 'داخستن',
    viewBook: 'کتێبەکە ببینە',
    uncategorised: 'گشتی',
  },
  ar: {
    title: 'الكتب الموصى بها',
    subtitle: 'قراءات مختارة من مسجد الإخوة',
    backToHome: 'العودة إلى الرئيسية',
    noBooks: 'لا توجد كتب متاحة بعد',
    noBooksDesc: 'تحقق مرة أخرى قريبًا',
    close: 'إغلاق',
    viewBook: 'عرض الكتاب',
    uncategorised: 'عام',
  },
};

export default function BooksPage() {
  const router = useRouter();
  const anim = useAnimationConfig();
  const { theme } = useTheme();
  const lightMode = isLightTheme(theme);

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('en');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mosqueName, setMosqueName] = useState('Masjid Al-Ekhuah');
  const [selected, setSelected] = useState<Book | null>(null);

  const isRTL = lang === 'ar' || lang === 'ku';
  const tr = booksTranslations[lang];
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
    Promise.all([
      fetch('/api/admin/books').then(r => r.json()),
      fetch('/api/admin/book-categories').then(r => r.json()),
      fetch('/api/admin/content').then(r => r.json()),
    ]).then(([booksData, catsData, content]) => {
      if (Array.isArray(booksData)) setBooks(booksData.filter((b: Book) => b.is_active));
      if (Array.isArray(catsData)) setCategories(catsData);
      if (content?.mosque_name) setMosqueName(content.mosque_name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getCatName = (cat: BookCategory) =>
    lang === 'ar' ? (cat.name_ar || cat.name) : lang === 'ku' ? (cat.name_ku || cat.name) : cat.name;
  const getTitle = (b: Book) =>
    lang === 'ar' ? (b.title_ar || b.title) : lang === 'ku' ? (b.title_ku || b.title) : b.title;
  const getDesc = (b: Book) =>
    lang === 'ar' ? (b.description_ar || b.description) : lang === 'ku' ? (b.description_ku || b.description) : b.description;

  // Group books by category
  const categorised = categories.map(cat => ({
    cat,
    items: books.filter(b => b.category_id === cat.id),
  })).filter(g => g.items.length > 0);
  const uncategorised = books.filter(b => !b.category_id || !categories.find(c => c.id === b.category_id));

  return (
    <main dir={isRTL ? 'rtl' : 'ltr'} className={`min-h-screen ${bg} selection:bg-amber-500/30 selection:text-amber-100 px-6 py-16 md:py-24 relative overflow-hidden`}>
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

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
          <p className="text-amber-200/75 text-base md:text-xl">
            {lang === 'en' ? tr.subtitle.replace('Masjid Al-Ekhuah', mosqueName) : tr.subtitle}
          </p>
        </motion.div>

        {/* Books grouped by category */}
        {loading ? (
          <div className="space-y-12">
            {[1, 2].map(g => (
              <div key={g}>
                <div className="h-6 bg-amber-500/10 rounded w-32 mb-6 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="aspect-[2/3] bg-amber-950/20 border border-amber-500/10 rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <BookMarked className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
            <p className="text-amber-500/50 text-xl font-display">{tr.noBooks}</p>
            <p className="text-amber-500/30 text-sm mt-2">{tr.noBooksDesc}</p>
          </motion.div>
        ) : (
          <div className="space-y-14">
            {categorised.map(({ cat, items }) => (
              <div key={cat.id}>
                <h2 className="text-xl md:text-2xl font-display text-amber-200 mb-6 pb-3 border-b border-amber-500/15">
                  {getCatName(cat)}
                </h2>
                <BookGrid books={items} getTitle={getTitle} getDesc={getDesc} setSelected={setSelected} anim={anim} />
              </div>
            ))}
            {uncategorised.length > 0 && (
              <div>
                <h2 className="text-xl md:text-2xl font-display text-amber-200 mb-6 pb-3 border-b border-amber-500/15">
                  {tr.uncategorised}
                </h2>
                <BookGrid books={uncategorised} getTitle={getTitle} getDesc={getDesc} setSelected={setSelected} anim={anim} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
              className={`w-full sm:max-w-2xl ${lightMode ? 'bg-[#f0ede4]' : 'bg-[#111310]'} border border-amber-500/20 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto`}
              onClick={e => e.stopPropagation()}
            >
              {selected.image_url && (
                <div className="w-full flex justify-center p-8 pb-0">
                  <img src={selected.image_url} alt={getTitle(selected)} className="max-h-64 rounded-2xl object-contain shadow-xl" />
                </div>
              )}
              <div className={`p-6 md:p-8 relative ${!selected.image_url ? 'pt-12' : 'pt-6'}`}>
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors z-10"
                  aria-label={tr.close}
                >
                  <X className="w-4 h-4" />
                </button>
                <h2 dir="auto" className="text-2xl md:text-3xl font-display text-amber-50 mb-2 pr-8">{getTitle(selected)}</h2>
                {selected.author && (
                  <p className="text-amber-400/70 text-sm mb-4">{selected.author}</p>
                )}
                {getDesc(selected) && (
                  <p dir="auto" className="text-amber-100/80 leading-relaxed whitespace-pre-wrap mb-6">{getDesc(selected)}</p>
                )}
                {selected.external_link && (
                  <a
                    href={selected.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-medium hover:bg-amber-500/25 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {tr.viewBook}
                  </a>
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

function BookGrid({
  books, getTitle, getDesc, setSelected, anim,
}: {
  books: Book[];
  getTitle: (b: Book) => string;
  getDesc: (b: Book) => string | undefined;
  setSelected: (b: Book) => void;
  anim: ReturnType<typeof useAnimationConfig>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
      {books.map((book, i) => (
        <motion.div
          key={book.id}
          {...anim.cardEntry(i)}
          {...anim.cardHover}
          onClick={() => {
            if (book.external_link && !book.description) {
              window.open(book.external_link, '_blank', 'noopener,noreferrer');
            } else {
              setSelected(book);
            }
          }}
          className="rounded-2xl overflow-hidden border border-amber-500/15 bg-amber-950/20 hover:bg-amber-900/25 hover:border-amber-500/35 cursor-pointer group transition-all duration-300"
        >
          {book.image_url ? (
            <div className="aspect-[2/3] w-full overflow-hidden">
              <img
                src={book.image_url}
                alt={getTitle(book)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ) : (
            <div className="aspect-[2/3] w-full bg-amber-950/40 flex items-center justify-center">
              <BookMarked className="w-8 h-8 text-amber-500/20" />
            </div>
          )}
          <div className="p-3">
            <p dir="auto" className="text-amber-50 text-xs font-medium line-clamp-2 leading-snug">{getTitle(book)}</p>
            {book.author && <p className="text-amber-500/50 text-[10px] mt-1 truncate">{book.author}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
