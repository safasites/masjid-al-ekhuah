'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '@/app/animation-provider';
import { AnimatedText } from './AnimatedText';
import { Event, Lang, translations } from './types';

interface EventsSectionProps {
  events: Event[];
  lang: Lang;
  isRTL: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
}

export function EventsSection({ events, lang, isRTL, secStyle, secLM }: EventsSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];
  const router = useRouter();

  const getEventTitle = (e: Event) =>
    lang === 'ar' ? (e.title_ar || e.title) : lang === 'ku' ? (e.title_ku || e.title) : e.title;
  const getEventDesc  = (e: Event) =>
    lang === 'ar' ? (e.description_ar || e.description) : lang === 'ku' ? (e.description_ku || e.description) : e.description;

  return (
    <section id="events" style={secStyle} className="section-themed px-6 py-8 md:py-24 overflow-hidden">
      <motion.div {...anim.sectionEntry} className="max-w-6xl w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-12 gap-3 md:gap-6">
          <div>
            <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${secLM ? 'text-amber-600/60' : 'text-amber-500/50'}`}>Community</p>
            <h2 className={`font-display text-4xl md:text-6xl ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-1 md:mb-3 tracking-tight`}>
              <AnimatedText>{t.eventsTitle}</AnimatedText>
            </h2>
            <p className={`text-base md:text-lg ${secLM ? 'text-amber-700/75' : 'text-amber-200/60'}`}>
              <AnimatedText>{t.eventsSubtitle}</AnimatedText>
            </p>
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
              className={`glass rounded-3xl overflow-hidden transition-all duration-300 group cursor-pointer hover:shadow-elevation-2 hover:shadow-theme-soft ${secLM ? 'bg-amber-50/60 border-amber-300/30' : ''}`}>
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
                <h3 dir="auto" className={`text-base sm:text-lg font-semibold ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-1.5 leading-snug`}>{getEventTitle(event)}</h3>
                <p className="text-amber-500/70 text-xs sm:text-sm mb-2">{event.date_label}</p>
                {event.description && <p dir="auto" className={`leading-relaxed text-xs sm:text-sm line-clamp-2 ${secLM ? 'text-amber-800/65' : 'text-amber-100/60'}`}>{getEventDesc(event)}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
