'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'classic' | 'accessible';

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'classic',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('classic');

  useEffect(() => {
    // 1. Check localStorage first (instant, no network)
    const stored = localStorage.getItem('mosque-theme') as Theme | null;
    if (stored === 'classic' || stored === 'accessible') {
      apply(stored);
      return;
    }
    // 2. Fallback: fetch admin-configured theme from Supabase content
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        const t: Theme = c.theme === 'accessible' ? 'accessible' : 'classic';
        apply(t);
        localStorage.setItem('mosque-theme', t);
      })
      .catch(() => apply('classic'));
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
