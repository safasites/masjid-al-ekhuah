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
const VALID_THEMES: Theme[]        = [...DARK_THEMES, ...LIGHT_THEMES];

export const isLightTheme = (t: Theme): boolean => LIGHT_THEMES.includes(t);

function normalizeTheme(raw: string | null | undefined): Theme | null {
  if (!raw) return null;
  if (VALID_THEMES.includes(raw as Theme)) return raw as Theme;
  // Legacy aliases
  if (raw === 'classic' || raw === 'accessible' || raw === 'theme') return 'aurum';
  return null;
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'aurum',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch global_theme from DB — applies to admin, quran, and all sub-pages
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        const t = normalizeTheme(c.global_theme) ?? 'aurum';
        document.documentElement.setAttribute('data-theme', t);
        if (isLightTheme(t)) {
          document.documentElement.setAttribute('data-light', '');
        } else {
          document.documentElement.removeAttribute('data-light');
        }
      })
      .catch(() => {
        document.documentElement.setAttribute('data-theme', 'aurum');
        document.documentElement.removeAttribute('data-light');
      });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'aurum', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
