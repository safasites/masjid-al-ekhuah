'use client';

import { MapPin, Phone, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PrayerData, Lang, translations } from './types';

interface SiteFooterProps {
  lang: Lang;
  secStyle: React.CSSProperties;
  secLM: boolean;
  content: Record<string, string>;
  prayerData: PrayerData | null;
}

export function SiteFooter({ lang, secStyle, secLM, content, prayerData }: SiteFooterProps) {
  const t = translations[lang];
  const router = useRouter();

  const contactAddress = content.contact_address || 'New Spring St, Birmingham B18 7PW, United Kingdom';
  const contactPhone = content.contact_phone || '0121 507 0166';
  const contactEmail = content.contact_email || 'info@masjidalekhuah.com';

  return (
    <footer id="footer" style={secStyle} className="section-themed border-t border-amber-500/20 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Branding */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-amber-500/40 rounded-full flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
                </svg>
              </div>
              <span className={`font-display font-medium text-lg ${secLM ? 'text-amber-900' : 'text-amber-50'}`}>
                {content.mosque_name || 'Masjid Al-Ekhuah'}
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${secLM ? 'text-amber-800/70' : 'text-amber-200/60'}`}>
              {t.footerTagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${secLM ? 'text-amber-700' : 'text-amber-400'}`}>
              {t.footerQuickLinks}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '#hero', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                { label: t.nav.times, href: '#times' },
                { label: t.nav.events, href: '#events' },
                { label: t.nav.courses, href: '#courses' },
                { label: t.nav.quran, href: '/quran' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} onClick={link.onClick}
                    className={`text-sm transition-colors ${secLM ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Prayer Times */}
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${secLM ? 'text-amber-700' : 'text-amber-400'}`}>
              {t.footerPrayerTimes}
            </h3>
            {prayerData ? (
              <ul className="space-y-1.5">
                {prayerData.prayers.map(p => (
                  <li key={p.id} className="flex justify-between gap-4">
                    <span className={`text-xs ${secLM ? 'text-amber-700/70' : 'text-amber-300/70'}`}>
                      {t.prayers[p.id as keyof typeof t.prayers]}
                    </span>
                    <span dir="ltr" className={`text-xs font-medium ${secLM ? 'text-amber-800' : 'text-amber-200'}`}
                      style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {p.azan || '—'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-xs ${secLM ? 'text-amber-700/50' : 'text-amber-400/50'}`}>{t.loading}</p>
            )}
          </div>

          {/* Contact */}
          <div>
            <h3 className={`text-xs font-semibold uppercase tracking-widest mb-4 ${secLM ? 'text-amber-700' : 'text-amber-400'}`}>
              {t.footerContact}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`flex items-start gap-2 text-xs transition-colors ${secLM ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                  <span dir="ltr">{contactAddress}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`}
                  className={`flex items-center gap-2 text-xs transition-colors ${secLM ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                  <Phone className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span dir="ltr">{contactPhone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${contactEmail}`}
                  className={`flex items-center gap-2 text-xs transition-colors ${secLM ? 'text-amber-700/70 hover:text-amber-700' : 'text-amber-200/60 hover:text-amber-300'}`}>
                  <Mail className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span dir="ltr" className="break-all">{contactEmail}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`pt-8 border-t ${secLM ? 'border-amber-200/40' : 'border-amber-500/15'} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <p className={`text-xs ${secLM ? 'text-amber-700/50' : 'text-amber-400/40'}`}>
            {t.footerCopyright(content.mosque_name || 'Masjid Al-Ekhuah', new Date().getFullYear())}
          </p>
          <button onClick={() => router.push('/admin')}
            className={`text-xs transition-colors ${secLM ? 'text-amber-700/30 hover:text-amber-700/60' : 'text-amber-500/20 hover:text-amber-400/50'}`}>
            {t.admin}
          </button>
        </div>
      </div>
    </footer>
  );
}
