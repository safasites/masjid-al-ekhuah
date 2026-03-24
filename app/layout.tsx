import type {Metadata} from 'next';
import { Inter, Outfit, Amiri } from 'next/font/google';
import './globals.css'; // Global styles
import { ThemeProvider } from './theme-provider';
import { AnimationProvider } from './animation-provider';
import { createServerSupabase } from '@/lib/supabase-server';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });
const amiri = Amiri({ subsets: ['arabic', 'latin'], weight: ['400', '700'], variable: '--font-arabic' });

export async function generateMetadata(): Promise<Metadata> {
  let mosqueName = 'Masjid Al-Ekhuah';
  try {
    const db = createServerSupabase();
    if (db) {
      const { data } = await db.from('content').select('key, value').eq('key', 'mosque_name').single();
      if (data?.value) mosqueName = data.value;
    }
  } catch { /* use default */ }
  return {
    title: `${mosqueName} | Birmingham`,
    description: `${mosqueName} is a welcoming mosque in Birmingham, UK. Find prayer times, upcoming events, Islamic courses, and community information.`,
    keywords: ['mosque', 'Birmingham', 'Islamic centre', 'prayer times', mosqueName],
    openGraph: {
      title: `${mosqueName} | Birmingham`,
      description: `Prayer times, events, and community information for ${mosqueName}, Birmingham.`,
      type: 'website',
      locale: 'en_GB',
    },
  };
}

export default async function RootLayout({children}: {children: React.ReactNode}) {
  let initialTheme = 'aurum';
  let isLight = false;
  let customAccent: string | null = null;
  try {
    const db = createServerSupabase();
    if (db) {
      const { data } = await db.from('content').select('key, value')
        .in('key', ['global_theme', 'global_theme_custom_accent']);
      const row = (data ?? []).reduce<Record<string, string>>(
        (acc, r) => { acc[r.key] = r.value; return acc; }, {}
      );
      const lightList = ['aurum-light','emerald-light','sapphire-light','teal-light',
                         'copper-light','rose-light','violet-light','lime-light'];
      const darkList  = ['aurum','emerald','sapphire','teal','copper','rose','violet','lime'];
      const t = row.global_theme;
      if (t && [...darkList, ...lightList].includes(t)) {
        initialTheme = t;
        isLight = lightList.includes(t);
      }
      const acc = row.global_theme_custom_accent;
      if (acc && /^#[0-9a-fA-F]{6}$/i.test(acc)) customAccent = acc;
    }
  } catch { /* use defaults */ }

  return (
    <html lang="en" data-theme={initialTheme} {...(isLight ? { 'data-light': '' } : {})}
      className={`${inter.variable} ${outfit.variable} ${amiri.variable}`}>
      <body className="font-sans antialiased bg-black text-white" suppressHydrationWarning>
        {customAccent && (
          <style id="custom-theme-override">{`[data-theme]{--color-amber-500:${customAccent};}`}</style>
        )}
        {/* Sync localStorage so ThemeProvider's next fetch stays consistent */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){localStorage.setItem('mosque-theme','${initialTheme}');})();`
        }} />
        <ThemeProvider initialTheme={initialTheme as import('./theme-provider').Theme}>
          <AnimationProvider>
            {children}
          </AnimationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
