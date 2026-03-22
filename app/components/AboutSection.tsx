'use client';

import { motion } from 'motion/react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useAnimationConfig } from '@/app/animation-provider';
import { AnimatedText } from './AnimatedText';
import { Lang, translations } from './types';

interface AboutSectionProps {
  lang: Lang;
  isRTL: boolean;
  secStyle: React.CSSProperties;
  secLM: boolean;
  content: Record<string, string>;
}

export function AboutSection({ lang, secStyle, secLM, content }: AboutSectionProps) {
  const anim = useAnimationConfig();
  const t = translations[lang];

  const baseAboutDesc = content.about_desc || 'Masjid Al-Ekhuah is a welcoming community in the heart of Birmingham, dedicated to worship, education, and serving the local community.';
  const aboutDesc = lang === 'ar' ? (content.about_desc_ar || baseAboutDesc) : lang === 'ku' ? (content.about_desc_ku || baseAboutDesc) : baseAboutDesc;
  const contactAddress = content.contact_address || 'New Spring St, Birmingham B18 7PW, United Kingdom';
  const contactPhone = content.contact_phone || '0121 507 0166';
  const contactEmail = content.contact_email || 'info@masjidalekhuah.com';

  return (
    <section id="about" style={secStyle} className="section-themed py-24 px-6 border-t border-amber-500/10 overflow-hidden">
      <motion.div {...anim.sectionEntry}
        className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className={`font-display text-4xl ${secLM ? 'text-amber-900' : 'text-amber-50'} mb-6 break-words`}>
            <AnimatedText>{t.aboutTitle}</AnimatedText>
          </h2>
          <p dir="auto" className={`text-lg leading-relaxed mb-8 break-words ${secLM ? 'text-amber-800/75' : 'text-amber-100/75'}`}>{aboutDesc}</p>
          <div className="space-y-4">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-4 ${secLM ? 'text-amber-700/80 hover:text-amber-600' : 'text-amber-200/80 hover:text-amber-300'} transition-colors group`}>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <span dir="ltr" className="break-words">{contactAddress}</span>
            </a>
            <a href={`tel:${contactPhone.replace(/\s/g, '')}`}
              className={`flex items-center gap-4 ${secLM ? 'text-amber-700/80 hover:text-amber-600' : 'text-amber-200/80 hover:text-amber-300'} transition-colors group`}>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <Phone className="w-4 h-4 text-amber-400" />
              </div>
              <span dir="ltr">{contactPhone}</span>
            </a>
            <a href={`mailto:${contactEmail}`}
              className={`flex items-center gap-4 ${secLM ? 'text-amber-700/80 hover:text-amber-600' : 'text-amber-200/80 hover:text-amber-300'} transition-colors group`}>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <Mail className="w-4 h-4 text-amber-400" />
              </div>
              <span dir="ltr" className="break-words">{contactEmail}</span>
            </a>
          </div>
        </div>

        {/* Google Maps embed */}
        <div className="relative h-[400px] rounded-[2rem] overflow-hidden border border-amber-500/20">
          <iframe
            title="Masjid Al-Ekhuah location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2428.178789289!2d-1.9207!3d52.4872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870bc8b0a8f5f3d%3A0x123!2sNew%20Spring%20St%2C%20Birmingham%20B18%207PW!5e0!3m2!1sen!2suk!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0, filter: secLM ? 'none' : 'invert(90%) hue-rotate(180deg)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </motion.div>
    </section>
  );
}
