'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Play, Pause,
  ChevronDown, Volume2, BookOpen, ArrowUp, Loader2, Home,
} from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import Link from 'next/link';
import { useAnimationConfig } from '../../animation-provider';
import { useTheme, isLightTheme } from '../../theme-provider';

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

interface Translation { id: number; text: string; }

interface Verse {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  text_uthmani_tajweed: string;
  translations: Translation[];
}

interface Word {
  position: number;
  text_uthmani: string;
  transliteration: { text: string };
  translation: { text: string };
  char_type_name?: string;
}

interface Reciter {
  id: number;
  reciter_name: string;
  style?: { name: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE = 'https://api.quran.com/api/v4';

const TRANSLATIONS = [
  { id: 20, name: 'Saheeh International' },
  { id: 19, name: 'Pickthall' },
  { id: 22, name: 'Yusuf Ali' },
  { id: 84, name: 'Mufti Taqi Usmani' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad3(n: number) { return String(n).padStart(3, '0'); }

function verseAudioUrl(reciterId: number, surahId: number, verseNum: number) {
  return `https://verses.quran.com/${reciterId}/${pad3(surahId)}${pad3(verseNum)}.mp3`;
}

function wordAudioUrl(verseKey: string, position: number) {
  const [ch, v] = verseKey.split(':');
  return `https://audio.qurancdn.com/wbw/${pad3(Number(ch))}_${pad3(Number(v))}_${pad3(position)}.mp3`;
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SurahReaderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const anim = useAnimationConfig();
  const { theme } = useTheme();
  const lightMode = isLightTheme(theme);

  const surahId = Number(params.surahId);
  const isValidSurah = surahId >= 1 && surahId <= 114;

  // URL-driven state — init from searchParams once
  const [translationId, setTranslationId] = useState(() => Number(searchParams.get('t') || '20'));
  const [reciterId, setReciterId] = useState(() => Number(searchParams.get('r') || '7'));

  // Data
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [surahAudioUrl, setSurahAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Word-by-word
  const [wordsByVerse, setWordsByVerse] = useState<Record<string, Word[]>>({});
  const [expandedVerse, setExpandedVerse] = useState<string | null>(null);
  const wordLoadingRef = useRef<Set<string>>(new Set());

  // Audio (surah)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);

  // Audio (word)
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);

  // UI
  const [showTajweed, setShowTajweed] = useState(true);
  const [jumpToAyah, setJumpToAyah] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [verseAudioKey, setVerseAudioKey] = useState<string | null>(null);

  const bg = lightMode ? 'bg-[#f8f5ee]' : 'bg-[#0a0804]';

  // ─── Create audio elements on mount ──────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const onLoadedMeta = () => setAudioDuration(audio.duration);
    const onTimeUpdate  = () => setAudioCurrentTime(audio.currentTime);
    const onEnded       = () => setAudioPlaying(false);
    const onWaiting     = () => setAudioLoading(true);
    const onCanPlay     = () => setAudioLoading(false);

    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    wordAudioRef.current = new Audio();
    wordAudioRef.current.preload = 'none';

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.pause();
      audio.src = '';
      if (wordAudioRef.current) { wordAudioRef.current.pause(); wordAudioRef.current.src = ''; }
    };
  }, []);

  // ─── Fetch chapter + verses + reciters (re-run when surahId or translationId changes) ──
  useEffect(() => {
    if (!isValidSurah) return;
    setLoading(true);
    setVerses([]);
    setChapter(null);
    setExpandedVerse(null);
    setWordsByVerse({});

    // Stop audio on surah change
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    setAudioPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    Promise.allSettled([
      fetch(`${BASE}/chapters/${surahId}?language=en`).then(r => r.json()),
      fetch(`${BASE}/verses/by_chapter/${surahId}?language=en&translations=${translationId}&fields=text_uthmani,text_uthmani_tajweed&per_page=286&page=1`).then(r => r.json()),
      fetch(`${BASE}/resources/recitations?language=en`).then(r => r.json()),
    ]).then(([chRes, versesRes, recRes]) => {
      if (chRes.status === 'fulfilled' && chRes.value.chapter) setChapter(chRes.value.chapter);
      if (versesRes.status === 'fulfilled') setVerses(versesRes.value.verses ?? []);
      if (recRes.status === 'fulfilled') setReciters(recRes.value.recitations ?? []);
      setLoading(false);
    });
  }, [surahId, translationId, isValidSurah]);

  // ─── Fetch audio URL (re-run when surahId or reciterId changes) ───────────
  useEffect(() => {
    if (!isValidSurah) return;
    fetch(`${BASE}/chapter_recitations/${reciterId}/${surahId}`)
      .then(r => r.json())
      .then(d => setSurahAudioUrl(d.audio_file?.audio_url ?? null))
      .catch(() => setSurahAudioUrl(null));
  }, [surahId, reciterId, isValidSurah]);

  // ─── Update audio element src when URL changes ────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (surahAudioUrl) {
      audio.src = surahAudioUrl;
      audio.load();
    } else {
      audio.src = '';
    }
    setAudioPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
  }, [surahAudioUrl]);

  // ─── Scroll detection ─────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function handleTranslationChange(id: number) {
    setTranslationId(id);
    router.replace(`/quran/${surahId}?t=${id}&r=${reciterId}`, { scroll: false });
  }

  function handleReciterChange(id: number) {
    setReciterId(id);
    router.replace(`/quran/${surahId}?t=${translationId}&r=${id}`, { scroll: false });
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !surahAudioUrl) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      audio.play().catch(() => {});
      setAudioPlaying(true);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setAudioCurrentTime(t);
  }

  function handleJumpToAyah() {
    const n = Number(jumpToAyah);
    if (!n || n < 1 || n > (chapter?.verses_count ?? 286)) return;
    document.getElementById(`verse-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setJumpToAyah('');
  }

  function playVerseAudio(verseKey: string, verseNum: number) {
    if (audioRef.current) { audioRef.current.pause(); setAudioPlaying(false); }
    const url = verseAudioUrl(reciterId, surahId, verseNum);
    const wAudio = wordAudioRef.current;
    if (!wAudio) return;
    if (verseAudioKey === verseKey) {
      wAudio.pause();
      setVerseAudioKey(null);
      return;
    }
    wAudio.src = url;
    wAudio.play().catch(() => {});
    setVerseAudioKey(verseKey);
    wAudio.onended = () => setVerseAudioKey(null);
  }

  function playWordAudio(verseKey: string, position: number) {
    const url = wordAudioUrl(verseKey, position);
    if (audioRef.current) { audioRef.current.pause(); setAudioPlaying(false); }
    const wAudio = wordAudioRef.current;
    if (!wAudio) return;
    wAudio.src = url;
    wAudio.play().catch(() => {});
  }

  async function handleWordByWordToggle(verseKey: string) {
    if (expandedVerse === verseKey) { setExpandedVerse(null); return; }
    setExpandedVerse(verseKey);
    if (wordsByVerse[verseKey] || wordLoadingRef.current.has(verseKey)) return;
    wordLoadingRef.current.add(verseKey);
    try {
      const res = await fetch(
        `${BASE}/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani,transliteration,translation&translations=${translationId}`
      );
      const data = await res.json();
      const words: Word[] = (data.verse?.words ?? []).filter((w: Word) => w.char_type_name !== 'end');
      setWordsByVerse(prev => ({ ...prev, [verseKey]: words }));
    } catch { /* silently fail */ }
    finally { wordLoadingRef.current.delete(verseKey); }
  }

  // ─── Invalid surah ────────────────────────────────────────────────────────
  if (!isValidSurah) {
    return (
      <main className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-amber-500/50 text-xl mb-4">Surah not found</p>
          <Link href="/quran" className="text-amber-400 hover:text-amber-300 text-sm">← Back to Surah List</Link>
        </div>
      </main>
    );
  }

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className={`min-h-screen ${bg} px-6 py-16 relative overflow-hidden`}>
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="h-5 w-28 bg-amber-500/10 rounded-full mb-12 animate-pulse" />
          <div className="h-12 w-56 bg-amber-500/10 rounded-2xl mb-2 animate-pulse" />
          <div className="h-4 w-40 bg-amber-500/8 rounded-xl mb-10 animate-pulse" />
          <div className="h-20 bg-amber-950/30 border border-amber-500/10 rounded-3xl mb-6 animate-pulse" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-3xl bg-amber-950/20 border border-amber-500/10 p-6 mb-4 animate-pulse">
              <div className="h-10 bg-amber-500/8 rounded-xl mb-4 w-3/4 ml-auto" />
              <div className="h-3 bg-amber-500/5 rounded w-full mb-2" />
              <div className="h-3 bg-amber-500/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  const prevSurahUrl = surahId > 1   ? `/quran/${surahId - 1}?t=${translationId}&r=${reciterId}` : null;
  const nextSurahUrl = surahId < 114 ? `/quran/${surahId + 1}?t=${translationId}&r=${reciterId}` : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className={`min-h-screen ${bg} selection:bg-amber-500/30 selection:text-amber-100 relative overflow-x-hidden pb-24 md:pb-8`}>
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

      {/* ── Sticky Controls Bar ──────────────────────────────────────────── */}
      <div className={`sticky top-0 z-30 py-3 px-4 backdrop-blur-xl border-b border-amber-500/15 ${lightMode ? 'bg-[#f8f5ee]/90' : 'bg-[#0a0804]/90'}`}>
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2">
          {/* Back */}
          <Link
            href="/quran"
            className="flex items-center gap-1.5 text-amber-400/70 hover:text-amber-300 transition-colors mr-2 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Surahs</span>
          </Link>

          <div className="h-4 w-px bg-amber-500/20 hidden sm:block" />

          {/* Translation dropdown */}
          <select
            value={translationId}
            onChange={e => handleTranslationChange(Number(e.target.value))}
            className={`rounded-xl px-3 py-1.5 text-xs border ${lightMode ? 'bg-amber-50 border-amber-300/40 text-amber-900' : 'bg-amber-950/40 border-amber-500/20 text-amber-200'} outline-none`}
          >
            {TRANSLATIONS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Reciter dropdown */}
          {reciters.length > 0 && (
            <select
              value={reciterId}
              onChange={e => handleReciterChange(Number(e.target.value))}
              className={`rounded-xl px-3 py-1.5 text-xs border flex-1 min-w-0 ${lightMode ? 'bg-amber-50 border-amber-300/40 text-amber-900' : 'bg-amber-950/40 border-amber-500/20 text-amber-200'} outline-none`}
            >
              {reciters.map(r => (
                <option key={r.id} value={r.id}>
                  {r.reciter_name}{r.style ? ` — ${r.style.name}` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Jump to Ayah */}
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="number"
              min={1}
              max={chapter?.verses_count ?? 286}
              value={jumpToAyah}
              onChange={e => setJumpToAyah(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJumpToAyah()}
              placeholder="Ayah"
              className={`w-14 rounded-xl px-2 py-1.5 text-xs border ${lightMode ? 'bg-amber-50 border-amber-300/40 text-amber-900 placeholder:text-amber-400' : 'bg-amber-950/40 border-amber-500/20 text-amber-200 placeholder:text-amber-500/40'} outline-none`}
            />
            <button
              onClick={handleJumpToAyah}
              className="px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/25 rounded-xl text-amber-300 text-xs hover:bg-amber-500/25 transition-colors"
            >
              Go
            </button>
          </div>

          {/* Tajweed toggle */}
          <button
            onClick={() => setShowTajweed(v => !v)}
            className={`px-2.5 py-1.5 rounded-xl text-xs border transition-colors shrink-0 ${
              showTajweed
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : `border-amber-500/15 ${lightMode ? 'text-amber-700/50' : 'text-amber-500/40'}`
            }`}
          >
            Tajweed
          </button>
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 relative z-10">

        {/* Surah header */}
        <motion.div
          initial={{ opacity: 0, y: anim.isSimplified ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: anim.isSimplified ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="text-amber-500/50 text-sm font-mono">#{surahId}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide ${
              chapter?.revelation_place === 'makkah'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400/70'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400/70'
            }`}>
              {chapter?.revelation_place === 'makkah' ? 'Makki' : 'Madani'}
            </span>
            <span className="text-amber-500/40 text-xs">{chapter?.verses_count} verses</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-amber-50 tracking-tight mb-1">
            {chapter?.name_simple ?? `Surah ${surahId}`}
          </h1>
          <p className="text-amber-200/50 text-base mb-1">{chapter?.translated_name.name}</p>
          {chapter?.name_arabic && (
            <p className="font-arabic text-3xl text-amber-200/70 text-right">{chapter.name_arabic}</p>
          )}
        </motion.div>

        {/* ── Full Surah Audio Player ───────────────────────────────────── */}
        <div className="rounded-3xl border border-amber-500/20 bg-amber-950/20 p-5 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={!surahAudioUrl}
              className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 hover:bg-amber-500/30 transition-all disabled:opacity-40 shrink-0"
              aria-label={audioPlaying ? 'Pause' : 'Play'}
            >
              {audioLoading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : audioPlaying
                  ? <Pause className="w-5 h-5" />
                  : <Play className="w-5 h-5" />
              }
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-amber-400/60 text-xs mb-1.5">Full Surah Audio</p>
              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                value={audioCurrentTime}
                onChange={handleSeek}
                disabled={!surahAudioUrl}
                className="w-full accent-amber-500 cursor-pointer disabled:opacity-40 disabled:cursor-default h-1"
              />
              <div className="flex justify-between text-[10px] text-amber-500/40 mt-1">
                <span>{formatTime(audioCurrentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            <Volume2 className="w-4 h-4 text-amber-500/30 shrink-0" />
          </div>
          {!surahAudioUrl && (
            <p className="text-amber-500/35 text-xs mt-2 text-center">Audio unavailable for this reciter</p>
          )}
        </div>

        {/* ── Prev / Next (top) ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          {prevSurahUrl ? (
            <Link href={prevSurahUrl} className="flex items-center gap-1.5 text-amber-400/60 hover:text-amber-300 text-sm group transition-colors">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Surah {surahId - 1}</span>
            </Link>
          ) : <div />}
          {nextSurahUrl ? (
            <Link href={nextSurahUrl} className="flex items-center gap-1.5 text-amber-400/60 hover:text-amber-300 text-sm group transition-colors">
              <span>Surah {surahId + 1}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : <div />}
        </div>

        {/* Bismillah (for all except Al-Fatiha and At-Tawbah) */}
        {chapter?.bismillah_pre && surahId !== 1 && surahId !== 9 && (
          <div className="text-center mb-8 py-5 border-y border-amber-500/15">
            <p className="font-arabic text-3xl text-amber-200/90 leading-relaxed">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-amber-400/60 text-xs mt-2 tracking-wide">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
          </div>
        )}

        {/* ── Verse List ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {verses.map((verse, i) => {
            const isExpanded = expandedVerse === verse.verse_key;
            const words = wordsByVerse[verse.verse_key];
            const isVerseAudioPlaying = verseAudioKey === verse.verse_key;

            const safeHtml = showTajweed && verse.text_uthmani_tajweed
              ? DOMPurify.sanitize(verse.text_uthmani_tajweed, { ADD_TAGS: ['span'], ADD_ATTR: ['class'] })
              : null;

            return (
              <motion.div
                key={verse.id}
                id={`verse-${verse.verse_number}`}
                initial={anim.isSimplified ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: anim.isSimplified ? 0.15 : 0.35, delay: anim.isSimplified ? 0 : Math.min(i * 0.03, 0.6) }}
                className={`rounded-3xl border p-5 md:p-6 ${
                  lightMode
                    ? 'border-amber-300/25 bg-amber-50'
                    : 'border-amber-500/15 bg-amber-950/20'
                }`}
              >
                {/* Verse header row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    {/* Verse number badge */}
                    <span className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 font-mono text-xs font-medium shrink-0">
                      {verse.verse_number}
                    </span>
                    <span className="text-amber-500/40 text-xs">{verse.verse_key}</span>
                  </div>

                  {/* Verse audio play button */}
                  <button
                    onClick={() => playVerseAudio(verse.verse_key, verse.verse_number)}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                      isVerseAudioPlaying
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                        : 'bg-amber-500/8 border-amber-500/20 text-amber-500/50 hover:border-amber-500/40 hover:text-amber-400'
                    }`}
                    aria-label={isVerseAudioPlaying ? 'Stop verse audio' : 'Play verse audio'}
                  >
                    {isVerseAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Arabic text */}
                {safeHtml ? (
                  <div
                    className={`tajweed-text mb-5 ${lightMode ? 'text-amber-950' : 'text-amber-50'}`}
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                  />
                ) : (
                  <p
                    className={`mb-5 text-right leading-loose ${lightMode ? 'text-amber-950' : 'text-amber-50'}`}
                    style={{ fontFamily: 'var(--font-arabic), Amiri, serif', fontSize: '1.6rem', direction: 'rtl' }}
                  >
                    {verse.text_uthmani}
                  </p>
                )}

                {/* Translation */}
                {verse.translations[0]?.text && (
                  <div
                    className={`text-sm leading-relaxed border-t pt-4 mb-4 ${
                      lightMode ? 'border-amber-300/20 text-amber-800/70' : 'border-amber-500/10 text-amber-200/65'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(verse.translations[0].text, { ALLOWED_TAGS: ['sup', 'sub', 'i', 'b'] })
                    }}
                  />
                )}

                {/* Word-by-word toggle */}
                <button
                  onClick={() => handleWordByWordToggle(verse.verse_key)}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    lightMode ? 'text-amber-600/50 hover:text-amber-600' : 'text-amber-500/40 hover:text-amber-400'
                  }`}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  Word by word
                </button>

                {/* Word chips */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 flex flex-wrap gap-2 justify-end" dir="rtl">
                        {!words ? (
                          <div className="w-full flex items-center justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500/40" />
                          </div>
                        ) : words.map(word => (
                          <button
                            key={word.position}
                            onClick={() => playWordAudio(verse.verse_key, word.position)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border transition-all min-w-[52px] min-h-[44px] ${
                              lightMode
                                ? 'bg-amber-50 border-amber-300/30 hover:bg-amber-100 hover:border-amber-400/50'
                                : 'bg-amber-500/8 border-amber-500/15 hover:bg-amber-500/15 hover:border-amber-500/30'
                            }`}
                            aria-label={`Play word: ${word.transliteration?.text}`}
                          >
                            <span className="font-arabic text-lg text-amber-100 leading-tight">{word.text_uthmani}</span>
                            {word.transliteration?.text && (
                              <span className="text-[9px] text-amber-400/60 font-mono leading-tight">{word.transliteration.text}</span>
                            )}
                            {word.translation?.text && (
                              <span className="text-[9px] text-amber-200/45 leading-tight text-center" dir="ltr">{word.translation.text}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── Prev / Next (bottom) ──────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-amber-500/10">
          {prevSurahUrl ? (
            <Link href={prevSurahUrl} className="flex items-center gap-2 text-amber-400/60 hover:text-amber-300 group transition-colors">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <div>
                <p className="text-[10px] text-amber-500/40 uppercase tracking-wide">Previous</p>
                <p className="text-sm">Surah {surahId - 1}</p>
              </div>
            </Link>
          ) : <div />}
          <Link href="/quran" className="flex flex-col items-center gap-1 text-amber-500/40 hover:text-amber-400 transition-colors">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">All Surahs</span>
          </Link>
          {nextSurahUrl ? (
            <Link href={nextSurahUrl} className="flex items-center gap-2 text-amber-400/60 hover:text-amber-300 group transition-colors text-right">
              <div>
                <p className="text-[10px] text-amber-500/40 uppercase tracking-wide">Next</p>
                <p className="text-sm">Surah {surahId + 1}</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : <div />}
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
            className="hidden md:flex fixed z-40 bottom-8 right-6 w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 items-center justify-center hover:bg-amber-500/30 transition-all duration-300 backdrop-blur-md shadow-theme-soft hover:shadow-theme-glow hover:-translate-y-1"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-2 w-full max-w-xs">
        <div className="bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-full p-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
          <Link href="/" className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-100/50 hover:text-amber-300 transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/quran" className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-400 transition-colors">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Surahs</span>
          </Link>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-full text-amber-100/50 hover:text-amber-300 transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
            <span className="text-[10px] font-medium">Top</span>
          </button>
        </div>
      </div>
    </main>
  );
}
