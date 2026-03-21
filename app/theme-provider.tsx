'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme =
  // ── Dark themes ─────────────────────────────────────────────────────────────
  | 'aurum' | 'emerald' | 'sapphire' | 'teal' | 'copper'
  | 'rose'  | 'violet'  | 'lime'
  // ── Light variants ──────────────────────────────────────────────────────────
  | 'aurum-light' | 'emerald-light' | 'sapphire-light' | 'teal-light' | 'copper-light'
  | 'rose-light'  | 'violet-light'  | 'lime-light';

export const DARK_THEMES: Theme[]  = ['aurum','emerald','sapphire','teal','copper','rose','violet','lime'];
export const LIGHT_THEMES: Theme[] = ['aurum-light','emerald-light','sapphire-light','teal-light','copper-light','rose-light','violet-light','lime-light'];
const VALID_THEMES: Theme[]        = [...DARK_THEMES, ...LIGHT_THEMES];

export const isLightTheme = (t: Theme): boolean => LIGHT_THEMES.includes(t);

function normalizeTheme(raw: string | null | undefined): Theme | null {
  if (!raw) return null;
  if (VALID_THEMES.includes(raw as Theme)) return raw as Theme;
  // Legacy aliases
  if (raw === 'classic' || raw === 'accessible') return 'aurum';
  return null;
}

function applyDataAttributes(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  if (isLightTheme(t)) {
    document.documentElement.setAttribute('data-light', '');
  } else {
    document.documentElement.removeAttribute('data-light');
  }
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'aurum',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('aurum');

  useEffect(() => {
    // 1. Apply localStorage immediately for no-FOUC
    const raw = localStorage.getItem('mosque-theme');
    const stored = normalizeTheme(raw);
    if (stored) {
      apply(stored);
      if (raw !== stored) localStorage.setItem('mosque-theme', stored);
    }
    // 2. Always fetch DB to get the global admin-set theme (overrides stale localStorage)
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        const t: Theme = normalizeTheme(c.theme) ?? 'aurum';
        apply(t);
        localStorage.setItem('mosque-theme', t);
      })
      .catch(() => { if (!stored) apply('aurum'); });
  }, []);

  function apply(t: Theme) {
    setThemeState(t);
    applyDataAttributes(t);
  }

  function setTheme(t: Theme) {
    apply(t);
    localStorage.setItem('mosque-theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
