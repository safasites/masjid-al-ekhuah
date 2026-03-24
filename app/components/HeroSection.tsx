'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAnimationConfig } from '@/app/animation-provider';
import { GeometricPattern } from './GeometricPattern';
import { AnimatedText } from './AnimatedText';
import { PrayerCountdownRing } from './PrayerCountdownRing';
import { Prayer, Lang, translations } from './types';

interface HeroSectionProps {
  lang: Lang;
  isRTL: boolean;
  secLM: boolean;
  secStyle: React.CSSProperties;
  content: Record<string, string>;
  prayers: Prayer[];
  prayerLoading: boolean;
  isFriday: boolean;
}

export function HeroSection({ lang, isRTL, secLM, secStyle, content, prayers, prayerLoading, isFriday }: HeroSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];

  const { scrollY } = useScroll();
  const _heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const _heroY       = useTransform(scrollY, [0, 300], ['0%', '5%']);
  const heroOpacity  = anim.useParallax ? _heroOpacity : 1;
  const heroY        = anim.useParallax ? _heroY : '0%';

  const heroLine1 = lang === 'en' ? (content.hero_line1 || t.awaken) : t.awaken;
  const heroLine2 = lang === 'en' ? (content.hero_line2 || t.faith) : t.faith;

  return (
    <div className="fixed inset-0 z-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className={`hidden md:block absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/20 blur-[120px] ${anim.isSimplified ? '' : 'animate-float'}`} style={{ animationDelay: '0s' }} />
        <div className={`hidden md:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/20 blur-[150px] ${anim.isSimplified ? '' : 'animate-float'}`} style={{ animationDelay: '2s' }} />
        <div className={`hidden md:block absolute top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-amber-400/15 blur-[100px] ${anim.isSimplified ? '' : 'animate-float'}`} style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        <GeometricPattern size={700} opacity={0.035}
          className={`absolute -top-40 -right-40 hidden lg:block ${anim.isSimplified ? '' : 'animate-geo-rotate-slow'}`} />
        <GeometricPattern size={450} opacity={0.025}
          className={`absolute -bottom-24 -left-24 hidden md:block ${anim.isSimplified ? '' : 'animate-geo-rotate-med'}`} />
      </div>

      <motion.div style={{ opacity: heroOpacity, y: heroY, willChange: anim.useParallax ? 'transform, opacity' : 'auto' }}
        className="relative z-10 flex flex-col items-center justify-center px-6 w-full max-w-7xl mx-auto text-center pt-24 pb-24 md:pt-0 md:pb-0">
        <motion.h1
          initial={{ opacity: 0, y: anim.isSimplified ? 0 : 30, filter: anim.blur(10) }}
          animate={{ opacity: 1, y: 0, filter: anim.blur(0) }}
          transition={{ duration: anim.isSimplified ? 0.2 : 1, delay: anim.isSimplified ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`font-display text-6xl sm:text-7xl md:text-[7rem] lg:text-[9rem] xl:text-[10rem] w-full leading-[1.0] tracking-tight mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${secLM ? 'text-amber-900' : 'text-white'}`}>
          <AnimatedText>{heroLine1}</AnimatedText>
          <AnimatedText className={`text-transparent bg-clip-text bg-gradient-to-r drop-shadow-sm ${secLM ? 'from-amber-700 via-amber-900 to-amber-800 animate-gradient-xy' : 'from-amber-100 via-amber-400 to-yellow-200 animate-gradient-xy'}`}>
            {heroLine2}
          </AnimatedText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: anim.isSimplified ? 0.1 : 0.4 }}
          className={`text-base md:text-xl mb-8 max-w-md text-center ${secLM ? 'text-amber-800/50' : 'text-amber-200/45'}`}>
          {content.hero_subtitle || t.footerTagline}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: anim.isSimplified ? 0.1 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto">
          <button onClick={() => document.getElementById('times')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0804] font-medium text-base hover:from-amber-300 hover:to-amber-500 transition-all duration-300 flex items-center justify-center gap-2 group animate-breathe hover:animate-none hover:shadow-theme-strong hover:-translate-y-1">
            <AnimatedText>{t.viewPrayers}</AnimatedText>
            <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${
              isRTL
                ? 'rotate-180 group-hover:translate-y-1 group-hover:rotate-90'
                : 'group-hover:translate-y-1 group-hover:rotate-90'
            }`} />
          </button>
        </motion.div>

        {/* Prayer Countdown Ring — space always reserved to prevent layout shift */}
        <div className="mt-10 flex items-center justify-center" style={{ minHeight: 288 }}>
          {!prayerLoading && (
            <PrayerCountdownRing
              prayers={prayers}
              lang={lang}
              secLM={secLM}
              isFriday={isFriday}
              fridayHighlightEnabled={content.friday_highlight_enabled !== 'false'}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
