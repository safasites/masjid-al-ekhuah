import type {Metadata} from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Masjid Al-Ekhuah | Birmingham',
  description: 'Masjid Al-Ekhuah is a welcoming mosque in Birmingham, UK. Find prayer times, upcoming events, Islamic courses, and community information.',
  keywords: ['mosque', 'Birmingham', 'Islamic centre', 'prayer times', 'Masjid Al-Ekhuah'],
  openGraph: {
    title: 'Masjid Al-Ekhuah | Birmingham',
    description: 'Prayer times, events, and community information for Masjid Al-Ekhuah, Birmingham.',
    type: 'website',
    locale: 'en_GB',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-black text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
