'use client';

import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useAnimationConfig } from '@/app/animation-provider';
import { GeometricPattern } from './GeometricPattern';
import { AnimatedText } from './AnimatedText';
import { Lang, translations } from './types';

interface DonateSectionProps {
  lang: Lang;
  secStyle: React.CSSProperties;
  secLM: boolean;
}

export function DonateSection({ lang, secStyle, secLM }: DonateSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];

  return (
    <section id="donate" style={secStyle} className="section-themed py-32 px-6 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-900/20 pointer-events-none" />
      <GeometricPattern size={300} opacity={0.035}
        className={`absolute top-8 right-8 hidden md:block pointer-events-none ${anim.isSimplified ? '' : 'animate-geo-rotate-slow'}`} />
      <motion.div {...anim.sectionEntry}
        className={`max-w-4xl w-full mx-auto text-center relative z-10 glass-md rounded-[3rem] p-8 md:p-12 lg:p-20 shadow-elevation-3 ${secLM ? 'bg-amber-100/70 border-amber-300/40' : ''}`}>
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-500/30 to-amber-700/20 rounded-full flex items-center justify-center mb-8 border-2 border-amber-400/40 shadow-theme-glow">
          <Heart className={`w-12 h-12 ${secLM ? 'text-amber-600' : 'text-amber-300'}`} />
        </div>
        <h2 className={`font-display text-3xl sm:text-5xl md:text-7xl mb-6 break-words tracking-tight ${secLM ? 'text-amber-900' : 'text-gradient-theme'}`}>
          <AnimatedText nowrap={false}>{t.donateTitle}</AnimatedText>
        </h2>
        <p className={`text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${secLM ? 'text-amber-800/70' : 'text-amber-100/65'}`}>
          <AnimatedText nowrap={false}>{t.donateDesc}</AnimatedText>
        </p>
        <button className={`px-10 py-5 rounded-full bg-gradient-to-r font-bold text-lg transition-all duration-300 shadow-theme-glow hover:shadow-theme-strong hover:-translate-y-1 ${secLM ? 'from-amber-600 to-amber-800 text-amber-50 hover:from-amber-700 hover:to-amber-900' : 'from-amber-400 to-amber-600 text-[#0a0804] hover:from-amber-300 hover:to-amber-500'}`}>
          <AnimatedText>{t.donateBtn}</AnimatedText>
        </button>
      </motion.div>
    </section>
  );
}
