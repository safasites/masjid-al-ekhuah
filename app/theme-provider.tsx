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
  if (raw === 'classic' || raw === 'accessible' || raw === 'theme') return 'aurum';
  return null;
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'aurum',
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  initialTheme = 'aurum',
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    // Fetch global_theme from DB — applies to admin, quran, and all sub-pages
    fetch('/api/admin/content')
      .then(r => r.json())
      .then((c: Record<string, string>) => {
        const t = normalizeTheme(c.global_theme) ?? 'aurum';
        setThemeState(t);
        document.documentElement.setAttribute('data-theme', t);
        if (isLightTheme(t)) {
          document.documentElement.setAttribute('data-light', '');
        } else {
          document.documentElement.removeAttribute('data-light');
        }
        // Sync to localStorage so the inline script in layout.tsx picks up the
        // correct theme on the next page load, eliminating the flicker.
        localStorage.setItem('mosque-theme', t);

        // Apply custom accent override if set
        const customAccent = c.global_theme_custom_accent;
        const isValidHex = (s: string) => /^#[0-9a-fA-F]{6}$/i.test(s);
        let overrideEl = document.getElementById('custom-theme-override') as HTMLStyleElement | null;
        if (customAccent && isValidHex(customAccent)) {
          if (!overrideEl) {
            overrideEl = document.createElement('style');
            overrideEl.id = 'custom-theme-override';
            document.head.appendChild(overrideEl);
          }
          overrideEl.textContent = `[data-theme]{--color-amber-500:${customAccent};}`;
        } else if (overrideEl) {
          overrideEl.textContent = '';
        }
      })
      .catch(() => {
        // Keep initialTheme on error — don't reset to aurum if SSR gave us the right one
        document.documentElement.setAttribute('data-theme', theme);
        if (isLightTheme(theme)) {
          document.documentElement.setAttribute('data-light', '');
        } else {
          document.documentElement.removeAttribute('data-light');
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
