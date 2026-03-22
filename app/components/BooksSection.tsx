'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { BookMarked, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '@/app/animation-provider';
import { AnimatedText } from './AnimatedText';
import { Book, Lang, translations } from './types';

interface BooksSectionProps {
  books: Book[];
  lang: Lang;
  isRTL: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
}

export function BooksSection({ books, lang, isRTL, secStyle, secLM }: BooksSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];
  const router = useRouter();

  const getBookTitle = (b: Book) =>
    lang === 'ar' ? (b.title_ar || b.title) : lang === 'ku' ? (b.title_ku || b.title) : b.title;

  return (
    <section id="books" style={secStyle} className="section-themed px-6 py-8 md:py-24 overflow-hidden">
      <motion.div {...anim.sectionEntry} className="max-w-6xl w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-12 gap-3 md:gap-6">
          <div>
            <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${secLM ? 'text-amber-600/60' : 'text-amber-500/50'}`}>Library</p>
            <h2 className={`font-display text-4xl md:text-6xl ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-1 md:mb-3 tracking-tight`}>
              <AnimatedText>{t.booksTitle}</AnimatedText>
            </h2>
            <p className={`text-base md:text-lg ${secLM ? 'text-amber-700/75' : 'text-amber-200/60'}`}>
              <AnimatedText>{t.booksSubtitle}</AnimatedText>
            </p>
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
              className={`rounded-2xl overflow-hidden border ${secLM ? 'bg-amber-50 border-amber-300/30 hover:border-amber-400/50' : 'glass border-amber-500/15 hover:border-amber-500/35 hover:shadow-theme-soft'} cursor-pointer group transition-all duration-300`}>
              {book.image_url ? (
                <div className="aspect-[2/3] w-full overflow-hidden relative">
                  <Image src={book.image_url} alt={getBookTitle(book)}
                    fill className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ) : (
                <div className={`aspect-[2/3] w-full ${secLM ? 'bg-amber-100' : 'bg-amber-950/40'} flex items-center justify-center`}>
                  <BookMarked className="w-6 h-6 text-amber-500/20" />
                </div>
              )}
              <div className="p-2">
                <p dir="auto" className={`${secLM ? 'text-amber-900' : 'text-amber-50'} text-[10px] sm:text-xs font-medium line-clamp-2 leading-snug`}>
                  {getBookTitle(book)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
