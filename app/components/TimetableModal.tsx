'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { X, Calendar } from 'lucide-react';
import { translations, Lang } from './types';

interface TimetableModalProps {
  show: boolean;
  timetableUrl: string | null;
  secBg: string;
  lang: Lang;
  onClose: () => void;
}

export function TimetableModal({ show, timetableUrl, secBg, lang, onClose }: TimetableModalProps) {
  const t = translations[lang];
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8">
          <button onClick={onClose}
            className="absolute top-6 right-6 text-amber-100 hover:text-amber-400 z-50 bg-amber-900/50 p-3 rounded-full border border-amber-500/30 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            style={{ backgroundColor: secBg }}
            className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl border border-amber-500/30 shadow-2xl">
            {timetableUrl ? (
              timetableUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <div className="relative w-full" style={{ minHeight: 400 }}>
                  <Image src={timetableUrl} alt="Prayer Timetable" fill priority
                    className="object-contain rounded-3xl" sizes="(max-width: 1280px) 100vw, 1280px"
                    style={{ touchAction: 'pinch-zoom' }} />
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center gap-4">
                  <p className="text-amber-200">{t.noTimetable}</p>
                  <a href={timetableUrl} target="_blank" rel="noopener noreferrer"
                    className="px-6 py-3 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors">
                    {t.openTimetable}
                  </a>
                </div>
              )
            ) : (
              <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                <Calendar className="w-16 h-16 text-amber-500/30 mb-4" />
                <p className="text-amber-500/50 text-xl font-display mb-2">{t.noTimetable}</p>
                <p className="text-amber-500/30 text-sm max-w-xs">{t.noTimetableDesc}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
