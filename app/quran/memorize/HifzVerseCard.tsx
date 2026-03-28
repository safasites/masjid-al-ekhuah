interface HifzVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  translation?: string;
}

interface HifzVerseCardProps {
  verse: HifzVerse;
  isActive: boolean;
  showTranslation: boolean;
  repeatsDone: number;
  totalRepeats: number;
  lightMode: boolean;
  indexInLesson: number;
  totalInLesson: number;
}

export default function HifzVerseCard({
  verse,
  isActive,
  showTranslation,
  repeatsDone,
  totalRepeats,
  lightMode,
  indexInLesson,
  totalInLesson,
}: HifzVerseCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 md:p-6 transition-all duration-300 ${
        isActive
          ? lightMode
            ? 'border-amber-500/50 bg-amber-100/60 shadow-theme-soft'
            : 'border-amber-400/40 bg-amber-500/10 shadow-theme-glow'
          : lightMode
          ? 'border-amber-700/15 bg-white/40'
          : 'border-amber-500/15 bg-amber-950/20'
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-9 h-9 rounded-full border flex items-center justify-center font-mono text-xs font-medium shrink-0 transition-colors ${
              isActive
                ? 'bg-amber-500/30 border-amber-400/50 text-amber-300'
                : 'bg-amber-500/15 border-amber-500/25 text-amber-400'
            }`}
          >
            {verse.verse_number}
          </span>
          <span className="text-amber-500/40 text-xs">{verse.verse_key}</span>
          {!isActive && (
            <span className="text-amber-500/30 text-[10px]">
              {indexInLesson + 1}/{totalInLesson}
            </span>
          )}
        </div>

        {/* Active verse progress */}
        {isActive && (
          <div className="flex items-center gap-2">
            <span className="text-amber-400/60 text-xs">
              {indexInLesson + 1}/{totalInLesson}
            </span>
            {totalRepeats > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
                {repeatsDone + 1}/{totalRepeats}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arabic text */}
      <p
        className={`mb-4 text-right leading-loose transition-colors ${
          isActive
            ? lightMode
              ? 'text-amber-900'
              : 'text-amber-100'
            : lightMode
            ? 'text-amber-800/70'
            : 'text-amber-50/70'
        }`}
        style={{
          fontFamily: 'var(--font-arabic), Amiri, serif',
          fontSize: '1.6rem',
          direction: 'rtl',
        }}
      >
        {verse.text_uthmani}
      </p>

      {/* Translation */}
      {showTranslation && verse.translation && (
        <p
          className={`text-sm leading-relaxed border-t pt-3 transition-colors ${
            isActive
              ? lightMode
                ? 'border-amber-500/30 text-amber-800/80'
                : 'border-amber-500/20 text-amber-200/80'
              : lightMode
              ? 'border-amber-700/15 text-amber-700/60'
              : 'border-amber-500/10 text-amber-200/50'
          }`}
        >
          {verse.translation}
        </p>
      )}
    </div>
  );
}

export type { HifzVerse };
