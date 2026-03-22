'use client';

import { motion } from 'motion/react';
import { MapPin, Calendar, BookOpen, Clock } from 'lucide-react';
import { useAnimationConfig } from '@/app/animation-provider';
import { PrayerData, Event, Course, Lang, translations } from './types';

interface QuickAccessCardsProps {
  prayerData: PrayerData | null;
  nextPrayer: string;
  events: Event[];
  courses: Course[];
  lang: Lang;
  isRTL: boolean;
  showEvents: boolean;
  showCourses: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
}

export function QuickAccessCards({
  prayerData,
  nextPrayer,
  events,
  courses,
  lang,
  showEvents,
  showCourses,
  secStyle,
  secLM,
}: QuickAccessCardsProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];

  const getEventTitle = (e: Event) =>
    lang === 'ar' ? (e.title_ar || e.title) : lang === 'ku' ? (e.title_ku || e.title) : e.title;
  const getCourseTitle = (c: Course) =>
    lang === 'ar' ? (c.title_ar || c.title) : lang === 'ku' ? (c.title_ku || c.title) : c.title;

  const cards = ([
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
    .filter(c => c.show);

  return (
    <div style={secStyle} className="section-themed px-4 py-5 border-b border-amber-500/10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <motion.a
            key={card.label}
            href={card.href}
            {...anim.cardEntry(i)}
            {...anim.cardHover}
            className={`glass rounded-2xl p-4 flex flex-col gap-1 transition-all duration-300 hover:shadow-theme-soft no-underline ${secLM ? 'hover:bg-amber-100/30' : 'hover:bg-amber-500/10'}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[10px] uppercase tracking-widest font-medium ${secLM ? 'text-amber-700/55' : 'text-amber-400/55'}`}>
                {card.label}
              </span>
              <span className={`${secLM ? 'text-amber-600/40' : 'text-amber-400/40'}`}>{card.icon}</span>
            </div>
            <p className={`font-display text-xl font-bold tracking-tight leading-none ${secLM ? 'text-amber-900' : 'text-amber-50'}`}>
              {card.value}
            </p>
            <p dir="ltr" className={`text-xs truncate mt-0.5 ${secLM ? 'text-amber-700/45' : 'text-amber-300/45'}`}>
              {card.sub}
            </p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
