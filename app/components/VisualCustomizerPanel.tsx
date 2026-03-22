'use client';

import { Palette, Check, X } from 'lucide-react';
import { CUSTOMIZE_SECTION_KEYS, CUSTOMIZE_SECTION_LABELS, CUSTOMIZE_SECTION_SCROLL } from './types';

interface VisualCustomizerPanelProps {
  customizeSection: string;
  customizeColors: Record<string, { bg: string; accent: string }>;
  customizeSaving: boolean;
  customizeSaved: boolean;
  onSectionChange: (key: string) => void;
  onColorChange: (section: string, field: 'bg' | 'accent', value: string) => void;
  onSave: () => void;
}

export function VisualCustomizerPanel({
  customizeSection,
  customizeColors,
  customizeSaving,
  customizeSaved,
  onSectionChange,
  onColorChange,
  onSave,
}: VisualCustomizerPanelProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] bg-[#0c0b08]/96 backdrop-blur-xl border-t border-amber-500/25 shadow-[0_-8px_40px_-4px_rgba(0,0,0,0.8)]" dir="ltr">
      {/* Top row: branding + section pills + actions */}
      <div className="flex items-center gap-3 px-3 md:px-5 py-2.5 border-b border-amber-500/10">
        <div className="flex items-center gap-2 shrink-0">
          <Palette className="w-4 h-4 text-amber-400" />
          <span className="text-amber-200 text-sm font-semibold hidden sm:block whitespace-nowrap">Visual Customizer</span>
        </div>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto min-w-0 scrollbar-none">
          {CUSTOMIZE_SECTION_KEYS.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onSectionChange(key);
                const scrollId = CUSTOMIZE_SECTION_SCROLL[key];
                if (scrollId) {
                  document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (key === 'hero') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                customizeSection === key
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              {CUSTOMIZE_SECTION_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSave}
            disabled={customizeSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${
              customizeSaved
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500 text-[#0a0804] hover:bg-amber-400'
            }`}
          >
            {customizeSaving
              ? <span className="w-3 h-3 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" />
              : <Check className="w-3 h-3" />
            }
            {customizeSaved ? 'Saved!' : 'Save'}
          </button>
          <a
            href="/"
            className="p-1.5 rounded-xl text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
            title="Exit Customizer"
          >
            <X className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Color pickers for selected section */}
      <div className="flex items-center gap-4 md:gap-8 px-3 md:px-5 py-3 flex-wrap">
        <span className="text-amber-400/80 text-xs font-semibold uppercase tracking-wider shrink-0 min-w-[60px]">
          {CUSTOMIZE_SECTION_LABELS[customizeSection]}
        </span>
        <div className="flex items-center gap-2 flex-wrap gap-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-amber-500/50 whitespace-nowrap">Background</label>
            <div className="flex items-center gap-1.5">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 shrink-0">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(customizeColors[customizeSection]?.bg ?? '') ? customizeColors[customizeSection].bg : '#000000'}
                  onChange={e => onColorChange(customizeSection, 'bg', e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div className="w-full h-full rounded-lg" style={{ backgroundColor: customizeColors[customizeSection]?.bg ?? '#0a0804' }} />
              </div>
              <input
                type="text"
                value={customizeColors[customizeSection]?.bg ?? '#0a0804'}
                onChange={e => onColorChange(customizeSection, 'bg', e.target.value)}
                maxLength={7}
                className="w-20 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-amber-100 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="#0a0804"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-amber-500/50 whitespace-nowrap">Accent / UI</label>
            <div className="flex items-center gap-1.5">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 shrink-0">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(customizeColors[customizeSection]?.accent ?? '') ? customizeColors[customizeSection].accent : '#000000'}
                  onChange={e => onColorChange(customizeSection, 'accent', e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div className="w-full h-full rounded-lg" style={{ backgroundColor: customizeColors[customizeSection]?.accent ?? '#d97706' }} />
              </div>
              <input
                type="text"
                value={customizeColors[customizeSection]?.accent ?? '#d97706'}
                onChange={e => onColorChange(customizeSection, 'accent', e.target.value)}
                maxLength={7}
                className="w-20 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-amber-100 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                placeholder="#d97706"
              />
            </div>
          </div>
        </div>
        <p className="text-amber-500/30 text-xs ml-auto hidden md:block">Changes preview instantly · Save to persist</p>
      </div>
    </div>
  );
}
