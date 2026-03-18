'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'aurum' | 'emerald' | 'sapphire' | 'teal' | 'copper';

const VALID_THEMES: Theme[] = ['aurum', 'emerald', 'sapphire', 'teal', 'copper'];

function normalizeTheme(raw: string | null | undefined): Theme | null {
  if (!raw) return null;
  if (VALID_THEMES.includes(raw as Theme)) return raw as Theme;
  // Legacy aliases
  if (raw === 'classic' || raw === 'accessible') return 'aurum';
  return null;
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'aurum',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('aurum');

  useEffect(() => {
    // 1. Check localStorage first (instant, no network)
    const raw = localStorage.getItem('mosque-theme');
    const stored = normalizeTheme(raw);
    if (stored) {
      apply(stored);
      // Rewrite stale legacy values (e.g. 'classic' → 'aurum')
      if (raw !== stored) localStorage.setItem('mosque-theme', stored);
      return;
    }
    // 2. Fallback: fetch admin-configured theme from Supabase content
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        const t: Theme = normalizeTheme(c.theme) ?? 'aurum';
        apply(t);
        localStorage.setItem('mosque-theme', t);
      })
      .catch(() => apply('aurum'));
  }, []);

  function apply(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
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
