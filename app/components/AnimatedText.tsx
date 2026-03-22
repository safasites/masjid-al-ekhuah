'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useAnimationConfig } from '@/app/animation-provider';

export function AnimatedText({
  children,
  className = '',
  nowrap = true,
}: {
  children: React.ReactNode;
  className?: string;
  nowrap?: boolean;
}) {
  const anim = useAnimationConfig();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={String(children)}
        initial={anim.textInitial(1)}
        animate={anim.textAnimate}
        exit={anim.textExit(-1)}
        transition={anim.textTransition}
        className={`inline-block ${nowrap ? 'whitespace-nowrap' : 'whitespace-normal'} ${className}`}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
