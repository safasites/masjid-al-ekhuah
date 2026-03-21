'use client';

import { createContext, useContext, useEffect } from 'react';

export type Theme =
  // ── Dark themes ─────────────────────────────────────────────────────────────
  | 'aurum' | 'emerald' | 'sapphire' | 'teal' | 'copper'
  | 'rose'  | 'violet'  | 'lime'
  // ── Light variants ──────────────────────────────────────────────────────────
  | 'aurum-light' | 'emerald-light' | 'sapphire-light' | 'teal-light' | 'copper-light'
  | 'rose-light'  | 'violet-light'  | 'lime-light';

export const DARK_THEMES: Theme[]  = ['aurum','emerald','sapphire','teal','copper','rose','violet','lime'];
export const LIGHT_THEMES: Theme[] = ['aurum-light','emerald-light','sapphire-light','teal-light','copper-light','rose-light','violet-light','lime-light'];

export const isLightTheme = (t: Theme): boolean => LIGHT_THEMES.includes(t);

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'aurum',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'aurum');
    document.documentElement.removeAttribute('data-light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'aurum', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
