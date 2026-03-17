'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  date_label: string;
  description: string;
  is_featured: boolean;
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/events')
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0804] selection:bg-amber-500/30 selection:text-amber-100 px-6 py-16 md:py-24 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/10 blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-amber-400/70 hover:text-amber-300 transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <h1 className="font-display text-5xl md:text-7xl text-amber-50 mb-4 tracking-tight">
            Upcoming Events
          </h1>
          <p className="text-amber-200/60 text-xl">Join our community gatherings at Masjid Al-Ekhuah</p>
        </motion.div>

        {/* Events grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-amber-950/20 border border-amber-500/10 rounded-3xl p-8 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 mb-6" />
                <div className="h-5 bg-amber-500/10 rounded-lg mb-3 w-2/3" />
                <div className="h-3 bg-amber-500/10 rounded mb-4 w-1/2" />
                <div className="h-3 bg-amber-500/5 rounded w-full" />
                <div className="h-3 bg-amber-500/5 rounded w-4/5 mt-2" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <Calendar className="w-16 h-16 text-amber-500/20 mx-auto mb-4" />
            <p className="text-amber-500/50 text-xl font-display">No events scheduled yet</p>
            <p className="text-amber-500/30 text-sm mt-2">Check back soon for upcoming events</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -8 }}
                className={`rounded-3xl p-8 transition-all duration-300 group relative overflow-hidden ${
                  event.is_featured
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-800/10 border border-amber-400/40 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]'
                    : 'bg-amber-950/20 border border-amber-500/20 hover:bg-amber-900/30 hover:border-amber-500/40'
                }`}
              >
                {event.is_featured && (
                  <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-medium uppercase tracking-wider">
                    Featured
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-medium text-amber-50 mb-2">{event.title}</h3>
                <p className="text-amber-400/80 text-sm mb-4">{event.date_label}</p>
                {event.description && (
                  <p className="text-amber-100/60 leading-relaxed text-sm">{event.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
