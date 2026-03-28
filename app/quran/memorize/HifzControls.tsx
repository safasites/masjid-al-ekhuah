import { Play, Pause, SkipBack, SkipForward, Loader2, RotateCcw } from 'lucide-react';

interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

interface Reciter {
  id: number;
  reciter_name: string;
  style?: { name: string };
}

interface HifzControlsProps {
  // Surah / range
  chapters: Chapter[];
  surahId: number;
  chapter: Chapter | null;
  startVerse: number;
  endVerse: number;
  onSurahChange: (id: number) => void;
  onStartVerseChange: (v: number) => void;
  onEndVerseChange: (v: number) => void;

  // Reciter
  reciters: Reciter[];
  reciterId: number;
  onReciterChange: (id: number) => void;

  // Playback
  isPlaying: boolean;
  isLoading: boolean;
  audioCurrentTime: number;
  audioDuration: number;
  onPlayPause: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
  onSeek: (t: number) => void;
  onReset: () => void;

  // Settings
  playbackSpeed: number;
  onSpeedChange: (s: number) => void;
  repeatCount: number;
  onRepeatChange: (n: number) => void;
  verseDelay: number;
  onDelayChange: (d: number) => void;
  loopLesson: boolean;
  onLoopChange: (v: boolean) => void;
  showTranslation: boolean;
  onTranslationChange: (v: boolean) => void;

  // Progress
  currentVerseIndex: number;
  totalVerses: number;

  lightMode: boolean;
  dataLoading: boolean;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function HifzControls({
  chapters, surahId, chapter, startVerse, endVerse,
  onSurahChange, onStartVerseChange, onEndVerseChange,
  reciters, reciterId, onReciterChange,
  isPlaying, isLoading, audioCurrentTime, audioDuration,
  onPlayPause, onSeekBack, onSeekForward, onSeek, onReset,
  playbackSpeed, onSpeedChange,
  repeatCount, onRepeatChange,
  verseDelay, onDelayChange,
  loopLesson, onLoopChange,
  showTranslation, onTranslationChange,
  currentVerseIndex, totalVerses,
  lightMode, dataLoading,
}: HifzControlsProps) {
  const maxVerse = chapter?.verses_count ?? 1;
  const selectCls = `w-full rounded-xl px-3 py-2 text-xs border outline-none transition-colors ${
    lightMode
      ? 'bg-amber-50 border-amber-300/50 text-amber-900'
      : 'bg-amber-950/40 border-amber-500/20 text-amber-200'
  }`;
  const labelCls = `text-[10px] uppercase tracking-wider mb-1 ${lightMode ? 'text-amber-700/60' : 'text-amber-500/50'}`;

  return (
    <div className={`rounded-3xl border p-5 space-y-5 ${
      lightMode ? 'border-amber-300/30 bg-white/60' : 'border-amber-500/20 bg-amber-950/20'
    }`}>

      {/* ── Surah selector ────────────────────────────────────────────── */}
      <div>
        <p className={labelCls}>Surah</p>
        <select
          value={surahId}
          onChange={e => onSurahChange(Number(e.target.value))}
          className={selectCls}
          disabled={dataLoading}
        >
          {chapters.map(ch => (
            <option key={ch.id} value={ch.id}>
              {ch.id}. {ch.name_simple}
            </option>
          ))}
        </select>
      </div>

      {/* ── Verse range ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={labelCls}>From verse</p>
          <input
            type="number"
            min={1}
            max={endVerse}
            value={startVerse}
            onChange={e => onStartVerseChange(Math.min(Number(e.target.value), endVerse))}
            className={selectCls}
            disabled={dataLoading}
          />
        </div>
        <div>
          <p className={labelCls}>To verse</p>
          <input
            type="number"
            min={startVerse}
            max={maxVerse}
            value={endVerse}
            onChange={e => onEndVerseChange(Math.max(Number(e.target.value), startVerse))}
            className={selectCls}
            disabled={dataLoading}
          />
        </div>
      </div>

      {/* ── Reciter ───────────────────────────────────────────────────── */}
      {reciters.length > 0 && (
        <div>
          <p className={labelCls}>Reciter</p>
          <select
            value={reciterId}
            onChange={e => onReciterChange(Number(e.target.value))}
            className={selectCls}
            disabled={dataLoading}
          >
            {reciters.map(r => (
              <option key={r.id} value={r.id}>
                {r.reciter_name}{r.style ? ` — ${r.style.name}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Progress indicator ────────────────────────────────────────── */}
      {(isPlaying || currentVerseIndex > 0) && (
        <div className={`text-center py-2 rounded-2xl border ${
          lightMode ? 'border-amber-300/30 bg-amber-50/60' : 'border-amber-500/15 bg-amber-500/5'
        }`}>
          <p className={`text-sm font-medium ${lightMode ? 'text-amber-800' : 'text-amber-300'}`}>
            Verse {currentVerseIndex + 1} of {totalVerses}
          </p>
        </div>
      )}

      {/* ── Playback controls ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-center gap-3 mb-3">
          {/* Reset */}
          <button
            onClick={onReset}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
              lightMode
                ? 'border-amber-300/40 text-amber-700/50 hover:text-amber-700 hover:bg-amber-100'
                : 'border-amber-500/20 text-amber-500/40 hover:text-amber-400 hover:bg-amber-500/10'
            }`}
            aria-label="Reset to beginning"
            title="Reset to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Seek back */}
          <button
            onClick={onSeekBack}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              lightMode
                ? 'border-amber-300/50 text-amber-700/60 hover:text-amber-800 hover:bg-amber-100'
                : 'border-amber-500/25 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
            aria-label="Previous verse"
            title="Previous verse"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onPlayPause}
            disabled={dataLoading}
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-theme-soft disabled:opacity-40 ${
              lightMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-800 hover:bg-amber-500/30 hover:shadow-theme-glow'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:shadow-theme-glow'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading
              ? <Loader2 className="w-6 h-6 animate-spin" />
              : isPlaying
                ? <Pause className="w-6 h-6" />
                : <Play className="w-6 h-6" />
            }
          </button>

          {/* Seek forward */}
          <button
            onClick={onSeekForward}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
              lightMode
                ? 'border-amber-300/50 text-amber-700/60 hover:text-amber-800 hover:bg-amber-100'
                : 'border-amber-500/25 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
            aria-label="Next verse"
            title="Next verse"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed */}
          <select
            value={playbackSpeed}
            onChange={e => onSpeedChange(Number(e.target.value))}
            className={`w-14 rounded-xl px-1 py-1.5 text-xs border text-center outline-none ${
              lightMode
                ? 'bg-amber-50 border-amber-300/50 text-amber-900'
                : 'bg-amber-950/40 border-amber-500/20 text-amber-200'
            }`}
            aria-label="Playback speed"
          >
            {SPEEDS.map(s => (
              <option key={s} value={s}>{s}×</option>
            ))}
          </select>
        </div>

        {/* Progress bar */}
        <div>
          <input
            type="range"
            min={0}
            max={audioDuration || 100}
            value={audioCurrentTime}
            onChange={e => onSeek(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1"
          />
          <div className="flex justify-between text-[10px] text-amber-500/40 mt-0.5">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>
      </div>

      {/* ── Repeat per verse ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={labelCls}>Repeat each verse</p>
          <span className={`text-sm font-medium ${lightMode ? 'text-amber-800' : 'text-amber-300'}`}>{repeatCount}×</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={repeatCount}
          onChange={e => onRepeatChange(Number(e.target.value))}
          className="w-full accent-amber-500 h-1 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-amber-500/30 mt-0.5">
          <span>1</span><span>20</span>
        </div>
      </div>

      {/* ── Verse delay ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={labelCls}>Delay between verses</p>
          <span className={`text-sm font-medium ${lightMode ? 'text-amber-800' : 'text-amber-300'}`}>{verseDelay}s</span>
        </div>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={verseDelay}
          onChange={e => onDelayChange(Number(e.target.value))}
          className="w-full accent-amber-500 h-1 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-amber-500/30 mt-0.5">
          <span>0s</span><span>5s</span>
        </div>
      </div>

      {/* ── Toggles ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className={`text-xs ${lightMode ? 'text-amber-800/70' : 'text-amber-300/70'}`}>Loop lesson</span>
          <button
            role="switch"
            aria-checked={loopLesson}
            onClick={() => onLoopChange(!loopLesson)}
            className={`relative w-10 h-5.5 rounded-full transition-colors border ${
              loopLesson
                ? 'bg-amber-500/40 border-amber-500/60'
                : lightMode
                  ? 'bg-amber-100 border-amber-300/40'
                  : 'bg-amber-950/40 border-amber-500/20'
            }`}
            style={{ height: '22px', width: '40px' }}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                loopLesson
                  ? 'left-[calc(100%-18px)] bg-amber-400'
                  : 'left-0.5 bg-amber-500/40'
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className={`text-xs ${lightMode ? 'text-amber-800/70' : 'text-amber-300/70'}`}>Show translation</span>
          <button
            role="switch"
            aria-checked={showTranslation}
            onClick={() => onTranslationChange(!showTranslation)}
            className={`relative w-10 rounded-full transition-colors border ${
              showTranslation
                ? 'bg-amber-500/40 border-amber-500/60'
                : lightMode
                  ? 'bg-amber-100 border-amber-300/40'
                  : 'bg-amber-950/40 border-amber-500/20'
            }`}
            style={{ height: '22px', width: '40px' }}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                showTranslation
                  ? 'left-[calc(100%-18px)] bg-amber-400'
                  : 'left-0.5 bg-amber-500/40'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
