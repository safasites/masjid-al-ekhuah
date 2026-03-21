'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type AnimationMode = 'full' | 'simplified';
const VALID_MODES: AnimationMode[] = ['full', 'simplified'];
const LS_KEY = 'mosque-animation-mode';

// ─── Context ──────────────────────────────────────────────────────────────────
const AnimationContext = createContext<{
  mode: AnimationMode;
  setMode: (m: AnimationMode) => void;
}>({ mode: 'full', setMode: () => {} });

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AnimationMode>('full');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile once on mount — used to disable Y parallax on mobile
    setIsMobile(window.innerWidth < 768);

    const raw = localStorage.getItem(LS_KEY) as AnimationMode | null;
    if (raw && VALID_MODES.includes(raw)) {
      setModeState(raw);
      return;
    }
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        const m = (VALID_MODES.includes(c.animation_mode as AnimationMode)
          ? c.animation_mode
          : 'full') as AnimationMode;
        setModeState(m);
        localStorage.setItem(LS_KEY, m);
      })
      .catch(() => setModeState('full'));
  }, []);

  function setMode(m: AnimationMode) {
    setModeState(m);
    localStorage.setItem(LS_KEY, m);
  }

  return (
    <AnimationContext.Provider value={{ mode, setMode }}>
      {children}
    </AnimationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnimationConfig() {
  const { mode, setMode } = useContext(AnimationContext);
  const s = mode === 'simplified';

  // isMobile is read from the provider; default false (SSR-safe — no hydration mismatch)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

  return {
    mode,
    setMode,
    isSimplified: s,

    // Section entrance (whileInView)
    sectionEntry: s
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-100px' }, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },

    // Card entrance (staggered)
    cardEntry: (i: number) => s
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15, delay: i * 0.03 } }
      : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: i * 0.08, ease: 'easeOut' as const } },

    // Card hover
    cardHover: s ? {} : { whileHover: { y: -4 } },
    courseCardHover: s ? {} : { whileHover: { scale: 1.02 } },

    // Infinite rotation (logo rings etc.)
    spinCW: s ? {} : { animate: { rotate: 360 }, transition: { duration: 30, repeat: Infinity, ease: 'linear' as const } },
    spinCCW: s ? {} : { animate: { rotate: -360 }, transition: { duration: 22, repeat: Infinity, ease: 'linear' as const } },
    spinSlow: s ? {} : { animate: { rotate: 360 }, transition: { duration: 20, repeat: Infinity, ease: 'linear' as const } },

    // Blur filter string (expensive on GPU)
    blur: (px: number) => s ? 'none' : `blur(${px}px)`,

    // Whether to use scroll-driven parallax
    // Disabled on mobile to prevent jitter with iOS/Android momentum scrolling
    useParallax: !s && !isMobile,

    // AnimatedText transition
    textTransition: s
      ? { duration: 0.15 }
      : { duration: 0.2 },
    textInitial: (dir: 1 | -1 = 1) => s
      ? { opacity: 0 }
      : { opacity: 0, y: 10 * dir, filter: 'blur(4px)' },
    textAnimate: s
      ? { opacity: 1 }
      : { opacity: 1, y: 0, filter: 'blur(0px)' },
    textExit: (dir: 1 | -1 = -1) => s
      ? { opacity: 0 }
      : { opacity: 0, y: 10 * dir, filter: 'blur(4px)' },

    // Dhikr counter
    counterTransition: s
      ? { duration: 0.1, ease: 'easeOut' as const }
      : { duration: 0.18, ease: 'easeOut' as const },

    // Dhikr phrase switcher
    phraseInitial: s ? { opacity: 0 } : { opacity: 0, y: 16, filter: 'blur(6px)' },
    phraseAnimate: s ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' },
    phraseExit:    s ? { opacity: 0 } : { opacity: 0, y: -16, filter: 'blur(6px)' },
    phraseDuration: s ? 0.15 : 0.35,

    // Modal entrance (bottom-sheet / detail)
    modalEntry: s
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
      : { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 60 }, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
  };
}
