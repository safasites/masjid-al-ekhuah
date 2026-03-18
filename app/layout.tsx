import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css'; // Global styles
import { ThemeProvider } from './theme-provider';
import { createServerSupabase } from '@/lib/supabase-server';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export async function generateMetadata(): Promise<Metadata> {
  let mosqueName = 'Masjid Al-Ekhuah';
  try {
    const db = createServerSupabase();
    const { data } = await db.from('content').select('key, value').eq('key', 'mosque_name').single();
    if (data?.value) mosqueName = data.value;
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-black text-white" suppressHydrationWarning>
        {/* Inline script: apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('mosque-theme');var v=['aurum','emerald','sapphire','teal','copper'];if(t==='classic'||t==='accessible')t='aurum';if(v.indexOf(t)!==-1){document.documentElement.setAttribute('data-theme',t);}})();` }} />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
