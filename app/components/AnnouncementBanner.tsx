'use client';

import { RefObject } from 'react';
import { X } from 'lucide-react';
import { translations, Lang } from './types';

interface AnnouncementBannerProps {
  content: Record<string, string>;
  lang: Lang;
  secStyle: React.CSSProperties;
  secLM: boolean;
  bannerRef: RefObject<HTMLDivElement | null>;
  onDismiss: () => void;
}

export function AnnouncementBanner({ content, lang, secStyle, secLM, bannerRef, onDismiss }: AnnouncementBannerProps) {
  const t = translations[lang];
  return (
    <div
      ref={bannerRef}
      style={secStyle}
      className="section-themed animate-slide-down sticky top-0 z-[55] flex items-center justify-between gap-4 px-4 py-3 border-b border-amber-500/25 backdrop-blur-lg"
    >
      <div className="flex items-center gap-3 min-w-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 shrink-0" aria-hidden="true">
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
        </svg>
        <p className={`text-sm truncate ${secLM ? 'text-amber-800/90' : 'text-amber-200/90'}`}>
          {content.announcement_text}
        </p>
      </div>
      {content.announcement_dismissible !== 'false' && (
        <button onClick={onDismiss}
          className={`shrink-0 transition-colors ${secLM ? 'text-amber-700/60 hover:text-amber-800' : 'text-amber-400/60 hover:text-amber-300'}`}
          aria-label={t.announcementDismiss}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
