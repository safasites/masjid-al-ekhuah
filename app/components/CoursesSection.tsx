'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAnimationConfig } from '@/app/animation-provider';
import { AnimatedText } from './AnimatedText';
import { Course, Lang, translations } from './types';

interface CoursesSectionProps {
  courses: Course[];
  lang: Lang;
  isRTL: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
}

export function CoursesSection({ courses, lang, isRTL, secStyle, secLM }: CoursesSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];
  const router = useRouter();

  const getCourseTitle = (c: Course) =>
    lang === 'ar' ? (c.title_ar || c.title) : lang === 'ku' ? (c.title_ku || c.title) : c.title;

  return (
    <section id="courses" style={secStyle} className="section-themed px-6 py-8 md:py-24 overflow-hidden">
      <motion.div {...anim.sectionEntry} className="max-w-6xl w-full mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-12 gap-3 md:gap-6">
          <div>
            <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${secLM ? 'text-amber-600/60' : 'text-amber-500/50'}`}>Education</p>
            <h2 className={`font-display text-4xl md:text-6xl ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-1 md:mb-3 tracking-tight`}>
              <AnimatedText>{t.coursesTitle}</AnimatedText>
            </h2>
            <p className={`text-base md:text-lg ${secLM ? 'text-amber-700/75' : 'text-amber-200/60'}`}>
              <AnimatedText>{t.coursesSubtitle}</AnimatedText>
            </p>
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
                className={`glass rounded-3xl overflow-hidden transition-all duration-300 group cursor-pointer hover:shadow-elevation-2 hover:shadow-theme-soft ${secLM ? 'bg-amber-50/60 border-amber-300/30' : ''}`}>
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
                  <h3 dir="auto" className={`text-base sm:text-lg font-semibold ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-1.5 leading-snug`}>{getCourseTitle(course)}</h3>
                  <p className={`text-xs sm:text-sm flex items-center gap-2 ${secLM ? 'text-amber-800/65' : 'text-amber-100/60'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0" />{course.duration}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
