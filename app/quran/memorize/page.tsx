'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, BookOpen, Home, ArrowUp, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { useAnimationConfig } from '../../animation-provider';
import { useTheme, isLightTheme } from '../../theme-provider';
import HifzControls from './HifzControls';
import HifzVerseCard, { type HifzVerse } from './HifzVerseCard';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  translated_name: { name: string };
  verses_count: number;
  bismillah_pre: boolean;
  revelation_place: 'makkah' | 'madinah';
}

interface Reciter {
  id: number;
  reciter_name: string;
  style?: { name: string };
}

interface RawVerse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  translations: { id: number; text: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE = 'https://api.quran.com/api/v4';

function pad3(n: number) { return String(n).padStart(3, '0'); }

function verseAudioUrl(reciterId: number, surahId: number, verseNum: number) {
  return `https://verses.quran.com/${reciterId}/${pad3(surahId)}${pad3(verseNum)}.mp3`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// ─── Engine Signal type ────────────────────────────────────────────────────────
interface EngineSignal {
  cancelled: boolean;
  cancelDelay?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
function HifzPage() {
  const searchParams = useSearchParams();
  const anim = useAnimationConfig();
  const { theme } = useTheme();
  const lightMode = isLightTheme(theme);

  // ─── Settings state (localStorage-persisted) ───────────────────────────
  const [surahId, setSurahId] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const fromUrl = Number(searchParams.get('surah'));
    if (fromUrl >= 1 && fromUrl <= 114) return fromUrl;
    const stored = Number(localStorage.getItem('mosque-hifz-surah'));
    return stored >= 1 && stored <= 114 ? stored : 1;
  });

  const [reciterId, setReciterId] = useState<number>(() => {
    if (typeof window === 'undefined') return 7;
    return Number(localStorage.getItem('mosque-hifz-reciter') || '7');
  });

  const [repeatCount, setRepeatCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    return Number(localStorage.getItem('mosque-hifz-repeat') || '3');
  });

  const [verseDelay, setVerseDelay] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return Number(localStorage.getItem('mosque-hifz-delay') || '1');
  });

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return Number(localStorage.getItem('mosque-hifz-speed') || '1');
  });

  const [loopLesson, setLoopLesson] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mosque-hifz-loop') === 'true';
  });

  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mosque-hifz-translation') === 'true';
  });

  // ─── Data state ────────────────────────────────────────────────────────
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<HifzVerse[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [verseAudioUrls, setVerseAudioUrls] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(true);

  // Verse range (not persisted — resets on surah change)
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(1);

  // ─── Playback state ────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0); // index into lesson slice
  const [repeatsDone, setRepeatsDone] = useState(0);

  // ─── UI state ──────────────────────────────────────────────────────────
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  // ─── Refs ──────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const engineSignal = useRef<EngineSignal>({ cancelled: true });
  const verseRowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  // Store current mutable values for engine without causing re-runs
  const engineConfig = useRef({ repeatCount, verseDelay, playbackSpeed, loopLesson, verseAudioUrls, reciterId, surahId });

  const bg = 'bg-[var(--page-bg)]';

  // ─── Sync engine config ref ────────────────────────────────────────────
  useEffect(() => {
    engineConfig.current = { repeatCount, verseDelay, playbackSpeed, loopLesson, verseAudioUrls, reciterId, surahId };
  }, [repeatCount, verseDelay, playbackSpeed, loopLesson, verseAudioUrls, reciterId, surahId]);

  // ─── Persist settings ──────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('mosque-hifz-surah', String(surahId)); }, [surahId]);
  useEffect(() => { localStorage.setItem('mosque-hifz-reciter', String(reciterId)); }, [reciterId]);
  useEffect(() => { localStorage.setItem('mosque-hifz-repeat', String(repeatCount)); }, [repeatCount]);
  useEffect(() => { localStorage.setItem('mosque-hifz-delay', String(verseDelay)); }, [verseDelay]);
  useEffect(() => { localStorage.setItem('mosque-hifz-speed', String(playbackSpeed)); }, [playbackSpeed]);
  useEffect(() => { localStorage.setItem('mosque-hifz-loop', String(loopLesson)); }, [loopLesson]);
  useEffect(() => { localStorage.setItem('mosque-hifz-translation', String(showTranslation)); }, [showTranslation]);

  // ─── Create audio element on mount ────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const onMeta    = () => setAudioDuration(audio.duration);
    const onTime    = () => setAudioCurrentTime(audio.currentTime);
    const onWaiting = () => setAudioLoading(true);
    const onCanPlay = () => setAudioLoading(false);

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // ─── Scroll detection ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Fetch all chapters (once) ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/chapters?language=en`)
      .then(r => r.json())
      .then(d => setAllChapters(d.chapters ?? []))
      .catch(() => {});
  }, []);

  // ─── Fetch chapter + verses when surahId changes ───────────────────────
  useEffect(() => {
    if (surahId < 1 || surahId > 114) return;

    // Stop any running engine
    engineSignal.current.cancelled = true;
    engineSignal.current.cancelDelay?.();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setIsPlaying(false);
    setCurrentVerseIndex(0);
    setRepeatsDone(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    setDataLoading(true);
    setVerses([]);
    setChapter(null);

    Promise.allSettled([
      fetch(`${BASE}/chapters/${surahId}?language=en`).then(r => r.json()),
      fetch(`${BASE}/verses/by_chapter/${surahId}?language=en&translations=20&fields=text_uthmani&per_page=286&page=1`).then(r => r.json()),
      fetch(`${BASE}/resources/recitations?language=en`).then(r => r.json()),
    ]).then(([chRes, versesRes, recRes]) => {
      if (chRes.status === 'fulfilled' && chRes.value.chapter) {
        const ch: Chapter = chRes.value.chapter;
        setChapter(ch);
        setStartVerse(1);
        setEndVerse(ch.verses_count);
      }
      if (versesRes.status === 'fulfilled') {
        const raw: RawVerse[] = versesRes.value.verses ?? [];
        setVerses(raw.map(v => ({
          id: v.id,
          verse_key: v.verse_key,
          verse_number: v.verse_number,
          text_uthmani: v.text_uthmani,
          translation: v.translations[0]?.text ? stripTags(v.translations[0].text) : undefined,
        })));
      }
      if (recRes.status === 'fulfilled') setReciters(recRes.value.recitations ?? []);
      setDataLoading(false);
    });
  }, [surahId]);

  // ─── Fetch per-verse audio URLs ────────────────────────────────────────
  useEffect(() => {
    if (surahId < 1 || surahId > 114) return;
    setVerseAudioUrls({});
    fetch(`${BASE}/recitations/${reciterId}/by_chapter/${surahId}?per_page=286&page=1`)
      .then(r => r.json())
      .then(d => {
        const urls: Record<string, string> = {};
        (d.audio_files ?? []).forEach((f: { verse_key: string; url: string }) => {
          urls[f.verse_key] = f.url;
        });
        setVerseAudioUrls(urls);
      })
      .catch(() => {});
  }, [surahId, reciterId]);

  // ─── Audio Engine ──────────────────────────────────────────────────────
  const runEngine = useCallback(async (
    lessonVerses: HifzVerse[],
    startIndex: number,
    startRep: number,
    signal: EngineSignal,
  ) => {
    const audio = audioRef.current;
    if (!audio) return;

    for (let vi = startIndex; vi < lessonVerses.length; vi++) {
      if (signal.cancelled) return;

      const verse = lessonVerses[vi];
      const cfg = engineConfig.current;

      for (let rep = (vi === startIndex ? startRep : 0); rep < cfg.repeatCount; rep++) {
        if (signal.cancelled) return;

        setCurrentVerseIndex(vi);
        setRepeatsDone(rep);

        // Scroll active verse into view
        verseRowRefs.current[vi]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const url = cfg.verseAudioUrls[verse.verse_key]
          ?? verseAudioUrl(cfg.reciterId, cfg.surahId, verse.verse_number);

        audio.playbackRate = cfg.playbackSpeed;
        audio.src = url;

        // canplay-then-play: wait for browser to buffer before calling play(),
        // preventing the AbortError that fires when load() + play() are called
        // back-to-back (which caused the engine to race through all verses instantly).
        const el = audio;
        await new Promise<void>(resolve => {
          if (signal.cancelled) { resolve(); return; }

          let settled = false;
          const finish = () => {
            if (!settled) {
              settled = true;
              el.removeEventListener('canplay', onCanPlay);
              el.removeEventListener('error', onLoadError);
              el.removeEventListener('ended', onEnded);
              resolve();
            }
          };

          // Safety timeout — never hang longer than 12s per verse
          const safetyTimer = setTimeout(finish, 12000);
          const finishAndClear = () => { clearTimeout(safetyTimer); finish(); };

          function onCanPlay() {
            el.removeEventListener('canplay', onCanPlay);
            el.removeEventListener('error', onLoadError);
            if (signal.cancelled) { finishAndClear(); return; }
            el.addEventListener('ended', onEnded, { once: true });
            // play() rejection after canplay is rare but handled
            el.play().catch(finishAndClear);
          }

          const onLoadError = finishAndClear;
          const onEnded = finishAndClear;

          el.addEventListener('canplay', onCanPlay, { once: true });
          el.addEventListener('error', onLoadError, { once: true });
          el.load(); // explicitly trigger load (preload='none')
        });

        if (signal.cancelled) return;

        // Delay between repeats/verses
        const delay = engineConfig.current.verseDelay;
        if (delay > 0) {
          await new Promise<void>(resolve => {
            const t = setTimeout(resolve, delay * 1000);
            signal.cancelDelay = () => { clearTimeout(t); resolve(); };
          });
          signal.cancelDelay = undefined;
        }

        if (signal.cancelled) return;
      }
    }

    // Lesson complete
    if (!signal.cancelled && engineConfig.current.loopLesson) {
      setCurrentVerseIndex(0);
      setRepeatsDone(0);
      runEngine(lessonVerses, 0, 0, signal);
    } else {
      setIsPlaying(false);
      setCurrentVerseIndex(0);
      setRepeatsDone(0);
    }
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const lessonVerses = verses.slice(startVerse - 1, endVerse);

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Pause
      engineSignal.current.cancelled = true;
      engineSignal.current.cancelDelay?.();
      audio.pause();
      setIsPlaying(false);
    } else {
      // Play / Resume
      const signal: EngineSignal = { cancelled: false };
      engineSignal.current = signal;
      setIsPlaying(true);
      runEngine(lessonVerses, currentVerseIndex, repeatsDone, signal);
    }
  }

  function handleReset() {
    engineSignal.current.cancelled = true;
    engineSignal.current.cancelDelay?.();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setIsPlaying(false);
    setCurrentVerseIndex(0);
    setRepeatsDone(0);
    setAudioCurrentTime(0);
    setAudioDuration(0);
  }

  function handleSeekBack() {
    // Go to previous verse in lesson
    const newIdx = Math.max(0, currentVerseIndex - 1);
    if (isPlaying) {
      // Restart engine from previous verse
      engineSignal.current.cancelled = true;
      engineSignal.current.cancelDelay?.();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      setCurrentVerseIndex(newIdx);
      setRepeatsDone(0);
      const signal: EngineSignal = { cancelled: false };
      engineSignal.current = signal;
      runEngine(lessonVerses, newIdx, 0, signal);
    } else {
      setCurrentVerseIndex(newIdx);
      setRepeatsDone(0);
    }
  }

  function handleSeekForward() {
    const newIdx = Math.min(lessonVerses.length - 1, currentVerseIndex + 1);
    if (isPlaying) {
      engineSignal.current.cancelled = true;
      engineSignal.current.cancelDelay?.();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      setCurrentVerseIndex(newIdx);
      setRepeatsDone(0);
      const signal: EngineSignal = { cancelled: false };
      engineSignal.current = signal;
      runEngine(lessonVerses, newIdx, 0, signal);
    } else {
      setCurrentVerseIndex(newIdx);
      setRepeatsDone(0);
    }
  }

  function handleSeek(t: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setAudioCurrentTime(t);
  }

  function handleSurahChange(id: number) {
    setSurahId(id);
    // Data fetch + state reset happens in the useEffect above
  }

  function handleReciterChange(id: number) {
    setReciterId(id);
    if (isPlaying) {
      engineSignal.current.cancelled = true;
      engineSignal.current.cancelDelay?.();
      if (audioRef.current) { audioRef.current.pause(); }
      setIsPlaying(false);
    }
  }

  function handleStartVerseChange(v: number) {
    const clamped = Math.max(1, Math.min(v, endVerse));
    setStartVerse(clamped);
    if (isPlaying) handleReset();
    else { setCurrentVerseIndex(0); setRepeatsDone(0); }
  }

  function handleEndVerseChange(v: number) {
    const clamped = Math.max(startVerse, Math.min(v, chapter?.verses_count ?? 1));
    setEndVerse(clamped);
    if (isPlaying) handleReset();
    else { setCurrentVerseIndex(0); setRepeatsDone(0); }
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <main className={`min-h-screen ${bg} selection:bg-amber-500/30 selection:text-amber-100 relative overflow-x-hidden pb-24 md:pb-8`}>
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 py-3 px-4 backdrop-blur-xl border-b border-amber-500/15 bg-[var(--page-bg)]/90">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/quran"
            className="flex items-center gap-1.5 text-amber-400/70 hover:text-amber-300 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Surahs</span>
          </Link>
          <div className="h-4 w-px bg-amber-500/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-amber-400/60" />
            <span className={`text-sm font-medium ${lightMode ? 'text-amber-900' : 'text-amber-200'}`}>
              Memorize
            </span>
            {chapter && (
              <span className="text-amber-500/50 text-sm">— {chapter.name_simple}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 relative z-10">

        {/* Page title (mobile) */}
        <motion.div
          initial={{ opacity: 0, y: anim.isSimplified ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: anim.isSimplified ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <h1 className={`font-display text-3xl md:text-4xl tracking-tight ${lightMode ? 'text-amber-900' : 'text-amber-50'}`}>
            Hifz Practice
          </h1>
          <p className={`text-sm mt-1 ${lightMode ? 'text-amber-700/60' : 'text-amber-400/60'}`}>
            Select a surah and verse range, then press play to begin
          </p>
        </motion.div>

        {/* ── Two-column layout: flex-col on mobile, grid on desktop ── */}
        {/* Controls come first in DOM so they appear at TOP on mobile   */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start">

          {/* ── Controls (top on mobile, right sticky column on desktop) */}
          <div className="mb-6 md:mb-0 md:col-start-2 md:row-start-1 md:sticky md:top-20 md:self-start">
            <HifzControls
              chapters={allChapters}
              surahId={surahId}
              chapter={chapter}
              startVerse={startVerse}
              endVerse={endVerse}
              onSurahChange={handleSurahChange}
              onStartVerseChange={handleStartVerseChange}
              onEndVerseChange={handleEndVerseChange}
              reciters={reciters}
              reciterId={reciterId}
              onReciterChange={handleReciterChange}
              isPlaying={isPlaying}
              isLoading={audioLoading}
              audioCurrentTime={audioCurrentTime}
              audioDuration={audioDuration}
              onPlayPause={handlePlayPause}
              onSeekBack={handleSeekBack}
              onSeekForward={handleSeekForward}
              onSeek={handleSeek}
              onReset={handleReset}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
              repeatCount={repeatCount}
              onRepeatChange={setRepeatCount}
              verseDelay={verseDelay}
              onDelayChange={setVerseDelay}
              loopLesson={loopLesson}
              onLoopChange={setLoopLesson}
              showTranslation={showTranslation}
              onTranslationChange={setShowTranslation}
              showSettings={showSettings}
              onToggleSettings={() => setShowSettings(v => !v)}
              currentVerseIndex={currentVerseIndex}
              totalVerses={lessonVerses.length}
              lightMode={lightMode}
              dataLoading={dataLoading}
            />
          </div>

          {/* ── Verse list (below controls on mobile, left column on desktop) */}
          <div className="md:col-start-1 md:row-start-1">
            {dataLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-3xl bg-amber-950/20 border border-amber-500/10 p-6 animate-pulse">
                    <div className="h-8 bg-amber-500/8 rounded-xl mb-4 w-16 ml-auto" />
                    <div className="h-10 bg-amber-500/8 rounded-xl mb-4 w-4/5 ml-auto" />
                    <div className="h-3 bg-amber-500/5 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : lessonVerses.length === 0 ? (
              <div className={`rounded-3xl border p-10 text-center ${lightMode ? 'border-amber-300/30 bg-white/40' : 'border-amber-500/15 bg-amber-950/20'}`}>
                <BookOpen className="w-10 h-10 text-amber-500/30 mx-auto mb-3" />
                <p className={`text-sm ${lightMode ? 'text-amber-700/60' : 'text-amber-400/60'}`}>
                  Select a surah to begin
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessonVerses.map((verse, i) => (
                  <div
                    key={verse.id}
                    ref={el => { verseRowRefs.current[i] = el; }}
                  >
                    <motion.div
                      initial={anim.isSimplified ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: anim.isSimplified ? 0.15 : 0.35,
                        delay: anim.isSimplified ? 0 : Math.min(i * 0.025, 0.5),
                      }}
                    >
                      <HifzVerseCard
                        verse={verse}
                        isActive={i === currentVerseIndex && isPlaying}
                        showTranslation={showTranslation}
                        repeatsDone={repeatsDone}
                        totalRepeats={repeatCount}
                        lightMode={lightMode}
                        indexInLesson={i}
                        totalInLesson={lessonVerses.length}
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Back to Top ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed z-40 bottom-[5.5rem] md:bottom-8 right-4 md:right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-theme-soft hover:shadow-theme-glow hover:-translate-y-1"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav ──────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-2 w-full max-w-xs">
        <div className="bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-full p-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
          <Link href="/" className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-100/50 hover:text-amber-300 transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/quran" className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-100/50 hover:text-amber-300 transition-colors">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Surahs</span>
          </Link>
          <button className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-400 transition-colors" disabled>
            <BrainCircuit className="w-5 h-5" />
            <span className="text-[10px] font-medium">Memorize</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function HifzPageWrapper() {
  return (
    <Suspense>
      <HifzPage />
    </Suspense>
  );
}
