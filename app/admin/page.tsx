'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Calendar, BookOpen, Clock, Image, Settings,
  LogOut, Plus, Trash2, Edit2, Check, X, Upload, ChevronDown, ChevronUp, Globe, Sparkles, BookMarked, ExternalLink,
  Home, Heart, Info, Palette, ChevronRight, Lock, Unlock,
} from 'lucide-react';
import { THEME_COLORS } from '@/lib/theme-colors';
import { type Theme, DARK_THEMES, LIGHT_THEMES, isLightTheme } from '../theme-provider';



// ─── Types ────────────────────────────────────────────────────────────────────
interface Event { id: string; title: string; date_label: string; description: string; is_featured: boolean; sort_order: number; image_url?: string; details?: string; title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string; details_ar?: string; details_ku?: string; }
interface Course { id: string; title: string; level: string; duration: string; description: string; sort_order: number; image_url?: string; details?: string; title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string; details_ar?: string; details_ku?: string; }
interface JamatTime { prayer: string; time: string; }
interface Content { [key: string]: string; }
interface Timetable { id: string; label: string; image_url: string; is_active: boolean; created_at: string; }
interface DhikrItem { id: string; arabic_text: string; transliteration: string; meaning_en: string; meaning_ar?: string; meaning_ku?: string; target_count: number; sort_order: number; is_active: boolean; }

type Tab = 'overview' | 'prayer' | 'events' | 'courses' | 'timetable' | 'settings' | 'dhikr' | 'books';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah'] as const;
const PRAYER_LABELS: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', jumuah: "Jumu'ah" };
const CALC_METHODS = [
  { value: '1', label: '1 — Karachi (South Asian / Hanafi)' },
  { value: '2', label: '2 — ISNA (North America)' },
  { value: '3', label: '3 — MWL (Muslim World League)' },
  { value: '4', label: '4 — Makkah (Umm al-Qura)' },
  { value: '5', label: '5 — Egypt' },
];

// ─── Reusable components ──────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-medium shadow-xl ${
        type === 'success'
          ? 'bg-emerald-900/90 border border-emerald-500/40 text-emerald-200'
          : 'bg-red-900/90 border border-red-500/40 text-red-200'
      }`}
    >
      {msg}
    </motion.div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isValidHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-amber-500/20 shrink-0">
        <input
          type="color"
          value={isValidHex(value) ? value : '#000000'}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        />
        <div className="w-full h-full rounded-lg" style={{ backgroundColor: isValidHex(value) ? value : '#000000' }} />
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={7}
        className="w-24 bg-amber-950/30 border border-amber-500/20 rounded-lg px-2 py-1.5 text-amber-100 text-xs font-mono focus:outline-none focus:border-amber-400/50 transition-colors"
        placeholder="#000000"
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-amber-950/20 border border-amber-500/10 rounded-3xl p-6 md:p-8">
      <h3 className="text-lg font-medium text-amber-100 mb-6">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">{label}</label>
      <input
        {...props}
        className="bg-amber-950/30 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-100 placeholder-amber-500/30 text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
      />
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">{label}</label>
      <textarea
        {...props}
        rows={3}
        className="bg-amber-950/30 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-100 placeholder-amber-500/30 text-sm focus:outline-none focus:border-amber-400/50 transition-colors resize-none"
      />
    </div>
  );
}

function Btn({ children, variant = 'primary', size = 'md', ...props }: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'flex items-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0804] hover:from-amber-300 hover:to-amber-500 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]',
    ghost: 'bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20',
  };
  const sizes = { sm: 'text-xs px-3 py-2', md: 'text-sm px-4 py-2.5' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]}`} {...props}>
      {children}
    </button>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [mosqueName, setMosqueName] = useState('Masjid Al-Ekhuah');
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      if (c.mosque_name) setMosqueName(c.mosque_name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    setIsLight(html.hasAttribute('data-light'));
    const obs = new MutationObserver(() => setIsLight(html.hasAttribute('data-light')));
    obs.observe(html, { attributes: true, attributeFilter: ['data-light'] });
    return () => obs.disconnect();
  }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const tabs: { id: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',     shortLabel: 'Home',      icon: <Home className="w-4 h-4" /> },
    { id: 'prayer',    label: 'Prayer Times', shortLabel: 'Prayer',    icon: <Clock className="w-4 h-4" /> },
    { id: 'events',    label: 'Events',       shortLabel: 'Events',    icon: <Calendar className="w-4 h-4" /> },
    { id: 'courses',   label: 'Courses',      shortLabel: 'Courses',   icon: <BookOpen className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable',    shortLabel: 'Timetable', icon: <Image className="w-4 h-4" /> },
    { id: 'dhikr',     label: 'Dhikr',        shortLabel: 'Dhikr',     icon: <Sparkles className="w-4 h-4" /> },
    { id: 'books',     label: 'Books',        shortLabel: 'Books',     icon: <BookMarked className="w-4 h-4" /> },
    { id: 'settings',  label: 'Settings',     shortLabel: 'Settings',  icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isLight ? 'bg-[#f5f0e8]' : 'bg-[#0a0804]'}`}>
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[150px] pointer-events-none" />

      {/* Mobile header */}
      <div className={`md:hidden flex items-center justify-between px-5 py-4 border-b border-amber-500/10 backdrop-blur-xl sticky top-0 z-50 ${isLight ? 'bg-[#f5f0e8]/80' : 'bg-[#0a0804]/80'}`}>
        <span className={`font-medium text-sm ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>{mosqueName}</span>
        <button onClick={handleLogout} className="p-2 text-amber-500/60 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar — desktop only */}
      <aside className={`hidden md:flex flex-col w-64 min-h-screen border-r border-amber-500/10 backdrop-blur-xl sticky top-0 h-screen overflow-hidden ${isLight ? 'bg-[#f5f0e8]/90' : 'bg-[#0a0804]/90'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-amber-500/10">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border border-amber-500/40 rounded-full" />
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className={`font-medium text-sm ${isLight ? 'text-amber-900' : 'text-amber-100'}`}>Admin Panel</p>
            <p className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-500/50'}`}>{mosqueName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? `bg-amber-500/15 border border-amber-500/30 ${isLight ? 'text-amber-700' : 'text-amber-300'}`
                  : `${isLight ? 'text-amber-600/80 hover:text-amber-700' : 'text-amber-500/60 hover:text-amber-300'} hover:bg-amber-500/5`
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-amber-500/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-8 lg:p-10 overflow-auto pb-28 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'overview'  && <OverviewTab onNavigate={setTab} />}
            {tab === 'prayer'    && <PrayerTab showToast={showToast} />}
            {tab === 'events'    && <EventsTab showToast={showToast} />}
            {tab === 'courses'   && <CoursesTab showToast={showToast} />}
            {tab === 'timetable' && <TimetableTab showToast={showToast} />}
            {tab === 'dhikr'     && <DhikrTab showToast={showToast} />}
            {tab === 'books'     && <BooksTab showToast={showToast} />}
            {tab === 'settings'  && <SettingsTab showToast={showToast} onMosqueNameChange={setMosqueName} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className={`backdrop-blur-xl border border-amber-500/20 rounded-full p-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] ${isLight ? 'bg-[#f5f0e8]/95' : 'bg-[#111310]/95'}`}>
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-full transition-all duration-300 ${
                  isActive
                    ? `bg-amber-500/10 ${isLight ? 'text-amber-600' : 'text-amber-400'}`
                    : `${isLight ? 'text-zinc-600 hover:text-amber-700' : 'text-zinc-400 hover:text-amber-200'}`
                }`}>
                <span className={`mb-1 ${isActive ? (isLight ? 'text-amber-600' : 'text-amber-400') : ''}`}>{t.icon}</span>
                <span className="text-[9px] font-medium tracking-wide">{t.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [stats, setStats] = useState({ events: 0, courses: 0, books: 0, announcement: false, mosqueName: 'Masjid Al-Ekhuah' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/events').then(r => r.json()).catch(() => []),
      fetch('/api/admin/courses').then(r => r.json()).catch(() => []),
      fetch('/api/admin/books').then(r => r.json()).catch(() => []),
      fetch('/api/admin/content').then(r => r.json()).catch(() => ({})),
    ]).then(([ev, co, bk, ct]) => {
      setStats({
        events:  Array.isArray(ev) ? ev.length : 0,
        courses: Array.isArray(co) ? co.length : 0,
        books:   Array.isArray(bk) ? bk.filter((b: { is_active?: boolean }) => b.is_active !== false).length : 0,
        announcement: ct.announcement_enabled === 'true',
        mosqueName: ct.mosque_name || 'Masjid Al-Ekhuah',
      });
      setLoading(false);
    });
  }, []);

  const quickNav: { label: string; desc: string; tab: Tab; icon: React.ReactNode }[] = [
    { label: 'Prayer Times', desc: 'Manage congregation times', tab: 'prayer', icon: <Clock className="w-5 h-5" /> },
    { label: 'Events', desc: 'Add & edit events', tab: 'events', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Courses', desc: 'Manage Islamic courses', tab: 'courses', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Timetable', desc: 'Upload monthly timetable', tab: 'timetable', icon: <Image className="w-5 h-5" /> },
    { label: 'Dhikr', desc: 'Remembrance phrases', tab: 'dhikr', icon: <Sparkles className="w-5 h-5" /> },
    { label: 'Books', desc: 'Recommended reading list', tab: 'books', icon: <BookMarked className="w-5 h-5" /> },
    { label: 'Settings', desc: 'Site content & appearance', tab: 'settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Welcome */}
      <div>
        <p className="text-amber-500/50 text-xs uppercase tracking-widest mb-1">Admin Dashboard</p>
        <h2 className="text-3xl font-display font-medium text-amber-50">{stats.mosqueName}</h2>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Events',  value: stats.events,  icon: <Calendar className="w-5 h-5" />,  tab: 'events'  as Tab },
          { label: 'Courses', value: stats.courses, icon: <BookOpen className="w-5 h-5" />,  tab: 'courses' as Tab },
          { label: 'Books',   value: stats.books,   icon: <BookMarked className="w-5 h-5" />, tab: 'books'   as Tab },
        ].map(card => (
          <button key={card.label} onClick={() => onNavigate(card.tab)}
            className="bg-amber-950/20 border border-amber-500/10 rounded-3xl p-5 md:p-6 text-left hover:border-amber-500/25 hover:bg-amber-950/30 transition-all duration-200 group">
            <div className="text-amber-500/40 mb-3 group-hover:text-amber-500/60 transition-colors">{card.icon}</div>
            <p className="font-display text-3xl md:text-4xl font-bold text-amber-100 mb-1">
              {loading ? '—' : card.value}
            </p>
            <p className="text-xs text-amber-500/45 uppercase tracking-wider">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Announcement status */}
      <div className="bg-amber-950/20 border border-amber-500/10 rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-amber-100 mb-0.5">Announcement Banner</h3>
            <p className="text-xs text-amber-500/45">
              {loading ? '—' : stats.announcement ? 'Active — visitors see this banner' : 'No active announcement'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${stats.announcement ? 'bg-emerald-400' : 'bg-amber-500/25'}`} />
            <button onClick={() => onNavigate('settings')}
              className="text-xs text-amber-400/60 hover:text-amber-300 transition-colors">
              Manage →
            </button>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-amber-500/45 mb-3">Manage</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {quickNav.map(item => (
            <button key={item.tab} onClick={() => onNavigate(item.tab)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10 text-left hover:border-amber-500/25 hover:bg-amber-950/30 transition-all duration-200 group">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400/60 group-hover:text-amber-400 group-hover:bg-amber-500/15 transition-all shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-200 group-hover:text-amber-100 transition-colors">{item.label}</p>
                <p className="text-xs text-amber-500/40 truncate">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500/20 group-hover:text-amber-400/50 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Prayer Tab ────────────────────────────────────────────────────────────────
function PrayerTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [jamat, setJamat] = useState<Record<string, string>>({});
  const [method, setMethod] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/jamat').then(r => r.json()).then((rows) => {
      if (!Array.isArray(rows)) return;
      const m: Record<string, string> = {};
      rows.forEach((r: JamatTime) => { m[r.prayer] = r.time; });
      setJamat(m);
    }).catch(() => {});
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      if (c.prayer_method) setMethod(c.prayer_method);
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updates = PRAYERS.map(p => ({ prayer: p, time: jamat[p] ?? '' }));
      const [jamatRes, methodRes] = await Promise.all([
        fetch('/api/admin/jamat', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }),
        fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'prayer_method', value: method }) }),
      ]);
      if (!jamatRes.ok || !methodRes.ok) throw new Error();
      showToast('Prayer times saved successfully');
    } catch {
      showToast('Failed to save prayer times', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-medium text-amber-50 mb-1">Prayer & Jama'at Times</h2>
        <p className="text-amber-500/50 text-sm">Set congregation times displayed to visitors. Azan times are auto-calculated.</p>
      </div>

      <Section title="Jama'at Times">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRAYERS.map(p => (
            <Input
              key={p}
              label={PRAYER_LABELS[p]}
              type="text"
              placeholder="e.g. 06:00 AM"
              value={jamat[p] ?? ''}
              onChange={e => setJamat(prev => ({ ...prev, [p]: e.target.value }))}
            />
          ))}
        </div>
      </Section>

      <Section title="Calculation Method (for Azan times)">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Method</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="bg-amber-950/30 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-100 text-sm focus:outline-none focus:border-amber-400/50 transition-colors"
          >
            {CALC_METHODS.map(m => (
              <option key={m.value} value={m.value} className="bg-[#0a0804]">{m.label}</option>
            ))}
          </select>
          <p className="text-amber-500/40 text-xs mt-1">Contact the mosque to find out which calculation method they use.</p>
        </div>
      </Section>

      <Btn onClick={save} disabled={saving}>
        {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
        Save Changes
      </Btn>
    </div>
  );
}

// ─── Events Tab ────────────────────────────────────────────────────────────────
function EventsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [editing, setEditing] = useState<Event | null>(null);
  const [adding, setAdding] = useState(false);
  const blank: Omit<Event, 'id'> = { title: '', date_label: '', description: '', is_featured: false, sort_order: 0, details: '', title_ar: '', title_ku: '', description_ar: '', description_ku: '', details_ar: '', details_ku: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/events').then(r => r.json()).then((data) => { if (Array.isArray(data)) setEvents(data); }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function save() {
    setSaving(true);
    try {
      const res = editing
        ? await fetch('/api/admin/events', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        : await fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const entityId = editing ? editing.id : (saved.id ?? saved[0]?.id);
      if (imageFile && entityId) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('entity', 'event');
        fd.append('entityId', entityId);
        await fetch('/api/admin/media', { method: 'POST', body: fd });
      }
      showToast(editing ? 'Event updated' : 'Event added');
      setEditing(null); setAdding(false); setForm(blank); setImageFile(null); setImagePreview(null); load();
    } catch { showToast('Failed to save event', 'error'); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this event?')) return;
    const res = await fetch('/api/admin/events', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { showToast('Event deleted'); load(); }
    else showToast('Failed to delete', 'error');
  }

  function startEdit(e: Event) {
    setEditing(e);
    setForm({ title: e.title, date_label: e.date_label, description: e.description ?? '', is_featured: e.is_featured, sort_order: e.sort_order, details: e.details ?? '', title_ar: e.title_ar ?? '', title_ku: e.title_ku ?? '', description_ar: e.description_ar ?? '', description_ku: e.description_ku ?? '', details_ar: e.details_ar ?? '', details_ku: e.details_ku ?? '' });
    setImageFile(null);
    setImagePreview(e.image_url ?? null);
    setAdding(true);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-medium text-amber-50 mb-1">Events</h2>
          <p className="text-amber-500/50 text-sm">Manage upcoming events shown on the website.</p>
        </div>
        <Btn onClick={() => { setAdding(!adding); setEditing(null); setForm(blank); setImageFile(null); setImagePreview(null); }}>
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adding ? 'Cancel' : 'Add Event'}
        </Btn>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Section title={editing ? 'Edit Event' : 'New Event'}>
              <div className="space-y-4">
                <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Friday Khutbah" />
                <Input label="Date / Time" value={form.date_label} onChange={e => setForm(p => ({ ...p, date_label: e.target.value }))} placeholder="e.g. Every Friday, 1:00 PM" />
                <Textarea label="Short Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description shown on the card..." />
                <Textarea label="Full Details (shown in modal)" value={form.details ?? ''} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} placeholder="Full details, schedule, speakers, etc..." />
                {/* Image upload */}
                <div>
                  <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider block mb-1.5">Event Image (optional)</label>
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-500/20 rounded-2xl p-6 cursor-pointer hover:border-amber-400/40 transition-colors text-center">
                    <Upload className="w-6 h-6 text-amber-500/40" />
                    <span className="text-amber-500/60 text-sm">{imageFile ? imageFile.name : 'Click to choose an image (JPEG, PNG, WebP)'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} className="hidden" />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-3 w-full rounded-2xl border border-amber-500/10 max-h-48 object-cover" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="accent-amber-400 w-4 h-4" />
                  <label htmlFor="featured" className="text-sm text-amber-300">Show on homepage (featured)</label>
                </div>
                <Input label="Sort Order" type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                {/* Manual Translations */}
                <div className="pt-2 border-t border-amber-500/10">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-400/50 uppercase tracking-wider mb-3"><Globe className="w-3.5 h-3.5" /> Translations (optional — leave blank to keep auto-translated)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Arabic Title (عنوان)" dir="rtl" value={form.title_ar ?? ''} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))} placeholder="العنوان بالعربي" />
                    <Input label="Kurdish Title (ناو)" dir="rtl" value={form.title_ku ?? ''} onChange={e => setForm(p => ({ ...p, title_ku: e.target.value }))} placeholder="ناوی کوردی" />
                    <Textarea label="Arabic Description (وصف)" dir="rtl" value={form.description_ar ?? ''} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} placeholder="الوصف بالعربي" />
                    <Textarea label="Kurdish Description (پوخته)" dir="rtl" value={form.description_ku ?? ''} onChange={e => setForm(p => ({ ...p, description_ku: e.target.value }))} placeholder="پوختەی کوردی" />
                    <Textarea label="Arabic Details (تفاصيل)" dir="rtl" value={form.details_ar ?? ''} onChange={e => setForm(p => ({ ...p, details_ar: e.target.value }))} placeholder="التفاصيل بالعربي" />
                    <Textarea label="Kurdish Details (وردەکاری)" dir="rtl" value={form.details_ku ?? ''} onChange={e => setForm(p => ({ ...p, details_ku: e.target.value }))} placeholder="وردەکاری کوردی" />
                  </div>
                </div>
                <Btn onClick={save} disabled={saving || !form.title || !form.date_label}>
                  {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? 'Save Changes' : 'Add Event'}
                </Btn>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      <div className="space-y-3">
        {events.length === 0 && <p className="text-amber-500/40 text-sm text-center py-8">No events yet. Add one above.</p>}
        {events.map(e => (
          <div key={e.id} className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-4">
            {e.image_url && (
              <img src={e.image_url} alt={e.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-amber-500/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-amber-100 font-medium text-sm truncate">{e.title}</p>
              <p className="text-amber-500/60 text-xs mt-0.5">{e.date_label}</p>
              {e.description && <p className="text-amber-100/40 text-xs mt-1 line-clamp-2">{e.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Btn size="sm" variant="ghost" onClick={() => startEdit(e)}><Edit2 className="w-3.5 h-3.5" /></Btn>
              <Btn size="sm" variant="danger" onClick={() => del(e.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Courses Tab ───────────────────────────────────────────────────────────────
function CoursesTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const blank = { title: '', level: 'Beginner', duration: '', description: '', sort_order: 0, details: '', title_ar: '', title_ku: '', description_ar: '', description_ku: '', details_ar: '', details_ku: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/courses').then(r => r.json()).then((data) => { if (Array.isArray(data)) setCourses(data); }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function save() {
    setSaving(true);
    try {
      const res = editing
        ? await fetch('/api/admin/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        : await fetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const entityId = editing ? editing.id : (saved.id ?? saved[0]?.id);
      if (imageFile && entityId) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('entity', 'course');
        fd.append('entityId', entityId);
        await fetch('/api/admin/media', { method: 'POST', body: fd });
      }
      showToast(editing ? 'Course updated' : 'Course added');
      setEditing(null); setAdding(false); setForm(blank); setImageFile(null); setImagePreview(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this course?')) return;
    const res = await fetch('/api/admin/courses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { showToast('Course deleted'); load(); }
    else showToast('Failed to delete', 'error');
  }

  function startEdit(c: Course) {
    setEditing(c);
    setForm({ title: c.title, level: c.level, duration: c.duration, description: c.description ?? '', sort_order: c.sort_order, details: c.details ?? '', title_ar: c.title_ar ?? '', title_ku: c.title_ku ?? '', description_ar: c.description_ar ?? '', description_ku: c.description_ku ?? '', details_ar: c.details_ar ?? '', details_ku: c.details_ku ?? '' });
    setImageFile(null);
    setImagePreview(c.image_url ?? null);
    setAdding(true);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-medium text-amber-50 mb-1">Courses</h2>
          <p className="text-amber-500/50 text-sm">Manage Islamic courses offered by the mosque.</p>
        </div>
        <Btn onClick={() => { setAdding(!adding); setEditing(null); setForm(blank); setImageFile(null); setImagePreview(null); }}>
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adding ? 'Cancel' : 'Add Course'}
        </Btn>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Section title={editing ? 'Edit Course' : 'New Course'}>
              <div className="space-y-4">
                <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Quranic Arabic" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Level</label>
                  <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                    className="bg-amber-950/30 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-100 text-sm focus:outline-none focus:border-amber-400/50">
                    {['Beginner','Intermediate','Advanced','All Levels'].map(l => (
                      <option key={l} value={l} className="bg-[#0a0804]">{l}</option>
                    ))}
                  </select>
                </div>
                <Input label="Duration" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 12 Weeks" />
                <Textarea label="Short Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description shown on the card..." />
                <Textarea label="Full Details (shown in modal)" value={form.details ?? ''} onChange={e => setForm(p => ({ ...p, details: e.target.value }))} placeholder="Full syllabus, schedule, requirements, etc..." />
                {/* Image upload */}
                <div>
                  <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider block mb-1.5">Course Image (optional)</label>
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-500/20 rounded-2xl p-6 cursor-pointer hover:border-amber-400/40 transition-colors text-center">
                    <Upload className="w-6 h-6 text-amber-500/40" />
                    <span className="text-amber-500/60 text-sm">{imageFile ? imageFile.name : 'Click to choose an image (JPEG, PNG, WebP)'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} className="hidden" />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-3 w-full rounded-2xl border border-amber-500/10 max-h-48 object-cover" />
                  )}
                </div>
                <Input label="Sort Order" type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                {/* Manual Translations */}
                <div className="pt-2 border-t border-amber-500/10">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-400/50 uppercase tracking-wider mb-3"><Globe className="w-3.5 h-3.5" /> Translations (optional — leave blank to keep auto-translated)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Arabic Title (عنوان)" dir="rtl" value={form.title_ar ?? ''} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))} placeholder="العنوان بالعربي" />
                    <Input label="Kurdish Title (ناو)" dir="rtl" value={form.title_ku ?? ''} onChange={e => setForm(p => ({ ...p, title_ku: e.target.value }))} placeholder="ناوی کوردی" />
                    <Textarea label="Arabic Description (وصف)" dir="rtl" value={form.description_ar ?? ''} onChange={e => setForm(p => ({ ...p, description_ar: e.target.value }))} placeholder="الوصف بالعربي" />
                    <Textarea label="Kurdish Description (پوخته)" dir="rtl" value={form.description_ku ?? ''} onChange={e => setForm(p => ({ ...p, description_ku: e.target.value }))} placeholder="پوختەی کوردی" />
                    <Textarea label="Arabic Details (تفاصيل)" dir="rtl" value={form.details_ar ?? ''} onChange={e => setForm(p => ({ ...p, details_ar: e.target.value }))} placeholder="التفاصيل بالعربي" />
                    <Textarea label="Kurdish Details (وردەکاری)" dir="rtl" value={form.details_ku ?? ''} onChange={e => setForm(p => ({ ...p, details_ku: e.target.value }))} placeholder="وردەکاری کوردی" />
                  </div>
                </div>
                <Btn onClick={save} disabled={saving || !form.title || !form.duration}>
                  {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? 'Save Changes' : 'Add Course'}
                </Btn>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {courses.length === 0 && <p className="text-amber-500/40 text-sm text-center py-8">No courses yet.</p>}
        {courses.map(c => (
          <div key={c.id} className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-4">
            {c.image_url && (
              <img src={c.image_url} alt={c.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-amber-500/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-amber-100 font-medium text-sm">{c.title}</p>
              <p className="text-amber-500/60 text-xs mt-0.5">{c.level} · {c.duration}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Btn size="sm" variant="ghost" onClick={() => startEdit(c)}><Edit2 className="w-3.5 h-3.5" /></Btn>
              <Btn size="sm" variant="danger" onClick={() => del(c.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Timetable Tab ─────────────────────────────────────────────────────────────
function TimetableTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [current, setCurrent] = useState<Timetable | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/timetable').then(r => r.json()).then(d => setCurrent(d)).catch(() => {});
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function upload() {
    if (!file || !label) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('label', label);
      const res = await fetch('/api/admin/timetable', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setCurrent(json);
      setFile(null); setLabel(''); setPreview(null);
      showToast('Timetable uploaded successfully');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Upload failed', 'error'); }
    finally { setUploading(false); }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-medium text-amber-50 mb-1">Prayer Timetable</h2>
        <p className="text-amber-500/50 text-sm">Upload the monthly prayer timetable image for visitors.</p>
      </div>

      {/* Current timetable */}
      {current && (
        <Section title={`Current Timetable — ${current.label}`}>
          {current.image_url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
            <img src={current.image_url} alt="Timetable" className="w-full rounded-2xl border border-amber-500/10" />
          ) : (
            <a href={current.image_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm hover:bg-amber-500/20 transition-colors">
              <Image className="w-4 h-4" /> View PDF Timetable
            </a>
          )}
        </Section>
      )}

      {/* Upload new */}
      <Section title="Upload New Timetable">
        <div className="space-y-4">
          <Input
            label="Label (e.g. March 2026)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="March 2026"
          />
          <div>
            <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider block mb-1.5">File (JPEG, PNG, WebP or PDF)</label>
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-500/20 rounded-2xl p-8 cursor-pointer hover:border-amber-400/40 transition-colors text-center">
              <Upload className="w-8 h-8 text-amber-500/40" />
              <span className="text-amber-500/60 text-sm">{file ? file.name : 'Click to choose a file'}</span>
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
            </label>
          </div>
          {preview && (
            <img src={preview} alt="Preview" className="w-full rounded-2xl border border-amber-500/10 max-h-64 object-contain" />
          )}
          <Btn onClick={upload} disabled={uploading || !file || !label}>
            {uploading ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Timetable
          </Btn>
        </div>
      </Section>
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
type SectionKey = 'hero' | 'prayer' | 'dhikr' | 'events' | 'courses' | 'books' | 'donate' | 'about' | 'footer';
type SavedTheme = { id: string; name: string; globalTheme: Theme; sections: Record<SectionKey, { bg: string; accent: string }> };
const SECTION_LABELS: Record<SectionKey, string> = {
  hero: 'Hero / Header', prayer: 'Prayer Times', dhikr: 'Dhikr',
  events: 'Events', courses: 'Courses', books: 'Books',
  donate: 'Donate', about: 'About', footer: 'Footer',
};
const SECTION_KEYS = Object.keys(SECTION_LABELS) as SectionKey[];
const DEFAULT_BG = '#0a0804';
const DEFAULT_ACCENT = '#d97706';

const THEME_CONFIG: Record<string, { accent: string; darkBg: string; lightBg: string; label: string }> = {
  aurum:    { accent: '#d97706', darkBg: '#0a0804', lightBg: '#f8f5ee', label: 'Aurum' },
  emerald:  { accent: '#10b981', darkBg: '#040a06', lightBg: '#f0faf4', label: 'Emerald' },
  sapphire: { accent: '#3b82f6', darkBg: '#04080f', lightBg: '#f0f4fc', label: 'Sapphire' },
  teal:     { accent: '#14b8a6', darkBg: '#040b0b', lightBg: '#f0fafa', label: 'Teal' },
  copper:   { accent: '#ea580c', darkBg: '#0a0602', lightBg: '#faf2ee', label: 'Copper' },
  rose:     { accent: '#f43f5e', darkBg: '#0f0405', lightBg: '#faf0f2', label: 'Rose' },
  violet:   { accent: '#8b5cf6', darkBg: '#090510', lightBg: '#f5f0fc', label: 'Violet' },
  lime:     { accent: '#84cc16', darkBg: '#060a04', lightBg: '#f4faf0', label: 'Lime' },
};

function SettingsTab({ showToast, onMosqueNameChange }: { showToast: (m: string, t?: 'success' | 'error') => void; onMosqueNameChange?: (name: string) => void }) {
  const [form, setForm] = useState({
    mosque_name: '',
    hero_line1: '',
    hero_line2: '',
    hero_subtitle: '',
    about_desc: '',
    contact_address: '',
    contact_phone: '',
    contact_email: '',
    feature_events: 'true',
    feature_courses: 'true',
    feature_donate: 'true',
    feature_books: 'true',
    animation_mode: 'full',
    announcement_enabled: 'false',
    announcement_text: '',
    announcement_dismissible: 'true',
    friday_highlight_enabled: 'true',
  });
  const [sectionColors, setSectionColors] = useState<Record<SectionKey, { bg: string; accent: string }>>(
    () => Object.fromEntries(SECTION_KEYS.map(k => [k, { bg: DEFAULT_BG, accent: DEFAULT_ACCENT }])) as Record<SectionKey, { bg: string; accent: string }>
  );
  // Whether each section uses a custom colour (true) or follows the global theme (false).
  const [sectionCustom, setSectionCustom] = useState<Record<SectionKey, boolean>>(
    () => Object.fromEntries(SECTION_KEYS.map(k => [k, false])) as Record<SectionKey, boolean>
  );
  const [globalTheme, setGlobalTheme] = useState<Theme>('aurum');
  const [customAccent, setCustomAccent] = useState('');
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [newThemeName, setNewThemeName] = useState('');
  const [saving, setSaving] = useState(false);
  const [retranslating, setRetranslating] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
    hero:    <Home className="w-4 h-4" />,
    prayer:  <Clock className="w-4 h-4" />,
    dhikr:   <Sparkles className="w-4 h-4" />,
    events:  <Calendar className="w-4 h-4" />,
    courses: <BookOpen className="w-4 h-4" />,
    books:   <BookMarked className="w-4 h-4" />,
    donate:  <Heart className="w-4 h-4" />,
    about:   <Info className="w-4 h-4" />,
    footer:  <LayoutGrid className="w-4 h-4" />,
  };

  async function retranslateAll() {
    setRetranslating(true);
    try {
      const res = await fetch('/api/admin/retranslate', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error();
      const { translated } = json;
      showToast(`Translated: ${translated.events} events, ${translated.courses} courses${translated.about ? ', about text' : ''}`);
    } catch { showToast('Retranslation failed', 'error'); }
    finally { setRetranslating(false); }
  }

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      setForm(prev => ({
        mosque_name:              c.mosque_name              ?? prev.mosque_name,
        hero_line1:               c.hero_line1               ?? prev.hero_line1,
        hero_line2:               c.hero_line2               ?? prev.hero_line2,
        hero_subtitle:            c.hero_subtitle            ?? prev.hero_subtitle,
        about_desc:               c.about_desc               ?? prev.about_desc,
        contact_address:          c.contact_address          ?? prev.contact_address,
        contact_phone:            c.contact_phone            ?? prev.contact_phone,
        contact_email:            c.contact_email            ?? prev.contact_email,
        feature_events:           c.feature_events           ?? prev.feature_events,
        feature_courses:          c.feature_courses          ?? prev.feature_courses,
        feature_donate:           c.feature_donate           ?? prev.feature_donate,
        feature_books:            c.feature_books            ?? prev.feature_books,
        animation_mode:           c.animation_mode           ?? prev.animation_mode,
        announcement_enabled:     c.announcement_enabled     ?? prev.announcement_enabled,
        announcement_text:        c.announcement_text        ?? prev.announcement_text,
        announcement_dismissible: c.announcement_dismissible ?? prev.announcement_dismissible,
        friday_highlight_enabled: c.friday_highlight_enabled ?? prev.friday_highlight_enabled,
      }));
      setSectionColors(prev => {
        const next = { ...prev };
        for (const k of SECTION_KEYS) {
          next[k] = {
            bg:     c[`section_${k}_bg`]     ?? DEFAULT_BG,
            accent: c[`section_${k}_accent`] ?? DEFAULT_ACCENT,
          };
        }
        return next;
      });
      setSectionCustom(prev => {
        const next = { ...prev };
        for (const k of SECTION_KEYS) {
          next[k] = c[`section_${k}_custom`] === 'true';
        }
        return next;
      });
      const gt = (c.global_theme ?? 'aurum') as Theme;
      setGlobalTheme(gt);
      document.documentElement.setAttribute('data-theme', gt);
      if (isLightTheme(gt)) document.documentElement.setAttribute('data-light', '');
      else document.documentElement.removeAttribute('data-light');
      if (c.global_theme_custom_accent) setCustomAccent(c.global_theme_custom_accent);
      try { setSavedThemes(JSON.parse(c.saved_themes ?? '[]')); } catch { setSavedThemes([]); }
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updates = [
        ...Object.entries(form).map(([key, value]) => ({ key, value })),
        { key: 'global_theme', value: globalTheme },
        { key: 'global_theme_custom_accent', value: customAccent },
        ...SECTION_KEYS.flatMap(k => [
          { key: `section_${k}_bg`,     value: sectionColors[k].bg },
          { key: `section_${k}_accent`, value: sectionColors[k].accent },
          { key: `section_${k}_custom`, value: String(sectionCustom[k] ?? false) },
        ]),
      ];
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      if (form.mosque_name) onMosqueNameChange?.(form.mosque_name);
      showToast('Settings saved');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  function applyGlobalTheme(t: Theme) {
    setGlobalTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    if (isLightTheme(t)) document.documentElement.setAttribute('data-light', '');
    else document.documentElement.removeAttribute('data-light');
  }

  async function persistSavedThemes(updated: SavedTheme[]) {
    await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ key: 'saved_themes', value: JSON.stringify(updated) }]),
    });
  }

  function saveCurrentTheme() {
    if (!newThemeName.trim()) return;
    const theme: SavedTheme = {
      id: crypto.randomUUID(),
      name: newThemeName.trim(),
      globalTheme,
      sections: sectionColors,
    };
    const updated = [...savedThemes, theme];
    setSavedThemes(updated);
    setNewThemeName('');
    persistSavedThemes(updated)
      .then(() => showToast('Theme saved'))
      .catch(() => showToast('Failed to save theme', 'error'));
  }

  function loadSavedTheme(t: SavedTheme) {
    applyGlobalTheme(t.globalTheme);
    setSectionColors(t.sections);
  }

  function deleteSavedTheme(id: string) {
    const updated = savedThemes.filter(t => t.id !== id);
    setSavedThemes(updated);
    persistSavedThemes(updated)
      .then(() => showToast('Theme deleted'))
      .catch(() => showToast('Failed to delete theme', 'error'));
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-medium text-amber-50 mb-1">Site Settings</h2>
        <p className="text-amber-500/50 text-sm">Edit text content shown across the website.</p>
      </div>

      <Section title="General">
        <Input label="Mosque Name" value={form.mosque_name} onChange={e => setForm(p => ({ ...p, mosque_name: e.target.value }))} placeholder="Masjid Al-Ekhuah" />
        <p className="text-amber-500/40 text-xs mt-2">This name appears in the site header, browser tab, and throughout the site.</p>
      </Section>

      <Section title="Global Theme">
        {/* Visual Customizer CTA */}
        <button
          type="button"
          onClick={() => window.open('/?customize=1', '_blank')}
          className="w-full mb-5 flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 active:scale-[0.99] transition-all duration-200 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
            <Palette className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-200">Open Visual Customizer</p>
            <p className="text-xs text-amber-500/50 mt-0.5">Edit section colours directly on the live site preview</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500/40 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        <p className="text-amber-500/50 text-sm mb-4">Applies to the admin panel, Quran reader, and all sub-pages. Home page sections have their own colour pickers below.</p>

        {/* Active theme badge */}
        {(() => {
          const activeCfg = THEME_CONFIG[globalTheme.replace('-light', '')];
          const modeLabel = isLightTheme(globalTheme) ? 'Light' : 'Dark';
          return activeCfg ? (
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeCfg.accent }} />
              <span className="text-xs font-medium text-amber-200/70">Active theme:</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                style={{ color: activeCfg.accent, borderColor: `${activeCfg.accent}40`, backgroundColor: `${activeCfg.accent}12` }}
              >
                {activeCfg.label} · {modeLabel}
              </span>
            </div>
          ) : null;
        })()}

        {/* Unified theme grid — 8 cards, each with dark + light half */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DARK_THEMES.map(baseName => {
            const cfg = THEME_CONFIG[baseName];
            if (!cfg) return null;
            const darkVariant = baseName as Theme;
            const lightVariant = `${baseName}-light` as Theme;
            const isDarkActive  = globalTheme === darkVariant;
            const isLightActive = globalTheme === lightVariant;
            const isCardActive  = isDarkActive || isLightActive;
            return (
              <div
                key={baseName}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  border: isCardActive ? `2px solid ${cfg.accent}90` : '2px solid rgba(180,120,40,0.10)',
                  boxShadow: isCardActive ? `0 0 0 1px ${cfg.accent}30, 0 4px 20px ${cfg.accent}18` : 'none',
                }}
              >
                {/* Split preview */}
                <div className="relative flex" style={{ height: '80px' }}>
                  <button
                    type="button"
                    title={`${cfg.label} Dark`}
                    onClick={() => applyGlobalTheme(darkVariant)}
                    className="relative flex-1 transition-opacity duration-150 hover:opacity-90 focus:outline-none"
                    style={{ background: `linear-gradient(160deg, ${cfg.darkBg} 20%, ${cfg.accent}50 160%)` }}
                  >
                    {isDarkActive && (
                      <div className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.accent }}>
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-0 right-0 text-center" style={{ fontSize: '9px', color: `${cfg.accent}99`, letterSpacing: '0.05em' }}>DARK</span>
                  </button>
                  <div className="absolute inset-y-0 z-10" style={{ left: '50%', width: '1px', background: `linear-gradient(to bottom, transparent, ${cfg.accent}60, transparent)` }} />
                  <button
                    type="button"
                    title={`${cfg.label} Light`}
                    onClick={() => applyGlobalTheme(lightVariant)}
                    className="relative flex-1 transition-opacity duration-150 hover:opacity-90 focus:outline-none"
                    style={{ background: `linear-gradient(200deg, ${cfg.lightBg} 20%, ${cfg.accent}35 160%)` }}
                  >
                    {isLightActive && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.accent }}>
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-0 right-0 text-center" style={{ fontSize: '9px', color: `${cfg.accent}bb`, letterSpacing: '0.05em' }}>LIGHT</span>
                  </button>
                </div>

                {/* Accent bar */}
                <div style={{ height: '3px', backgroundColor: cfg.accent }} />

                {/* Footer: name + buttons */}
                <div className="px-3 py-2.5" style={{ backgroundColor: '#0f0b07' }}>
                  <p className="text-xs font-semibold text-amber-100/80 mb-2 leading-none">{cfg.label}</p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyGlobalTheme(darkVariant)}
                      className="flex-1 text-[10px] font-semibold py-1 rounded-md transition-all duration-150 focus:outline-none"
                      style={isDarkActive
                        ? { backgroundColor: cfg.accent, color: '#fff', boxShadow: `0 0 8px ${cfg.accent}60` }
                        : { backgroundColor: `${cfg.accent}15`, color: `${cfg.accent}99`, border: `1px solid ${cfg.accent}25` }}
                    >Dark</button>
                    <button
                      type="button"
                      onClick={() => applyGlobalTheme(lightVariant)}
                      className="flex-1 text-[10px] font-semibold py-1 rounded-md transition-all duration-150 focus:outline-none"
                      style={isLightActive
                        ? { backgroundColor: cfg.accent, color: '#fff', boxShadow: `0 0 8px ${cfg.accent}60` }
                        : { backgroundColor: `${cfg.accent}15`, color: `${cfg.accent}99`, border: `1px solid ${cfg.accent}25` }}
                    >Light</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-amber-500/40 text-xs mt-3">Click a theme for live preview. Save All Settings to persist.</p>

        {/* Manual custom accent colour */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
          <p className="text-sm font-semibold text-amber-200 mb-1">Custom Global Accent</p>
          <p className="text-xs text-amber-500/50 mb-3">Override the preset accent colour across the entire site with any colour you choose. Leave blank to use the selected preset above.</p>
          <div className="flex items-center gap-3">
            <ColorInput
              value={customAccent || '#d97706'}
              onChange={v => {
                setCustomAccent(v);
                // Live preview: inject override style tag
                const isValidHex = /^#[0-9a-fA-F]{6}$/.test(v);
                let el = document.getElementById('admin-custom-accent-preview');
                if (!el) { el = document.createElement('style'); el.id = 'admin-custom-accent-preview'; document.head.appendChild(el); }
                el.textContent = isValidHex && v ? `[data-theme]{--color-amber-500:${v};}` : '';
              }}
            />
            {customAccent && (
              <button
                type="button"
                onClick={() => {
                  setCustomAccent('');
                  const el = document.getElementById('admin-custom-accent-preview');
                  if (el) el.textContent = '';
                }}
                className="text-xs text-amber-500/50 hover:text-amber-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Section Colours">
        <p className="text-amber-500/50 text-sm -mt-2 mb-4">
          By default each section follows the global theme. Click the <Lock className="inline w-3.5 h-3.5 mx-0.5" /> icon to unlock a section and set a custom colour.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECTION_KEYS.map(key => {
            const isExpanded = expandedSection === key;
            const isCustom = sectionCustom[key] ?? false;
            const themeBg     = THEME_COLORS[globalTheme]?.bg     ?? DEFAULT_BG;
            const themeAccent = THEME_COLORS[globalTheme]?.accent ?? DEFAULT_ACCENT;
            const bg     = isCustom ? sectionColors[key].bg     : themeBg;
            const accent = isCustom ? sectionColors[key].accent : themeAccent;
            return (
              <div key={key} className="rounded-2xl bg-amber-950/20 border border-amber-500/10 overflow-hidden">
                <div className="w-full flex items-center gap-3 p-3.5">
                  <span className="text-amber-400/60">{SECTION_ICONS[key]}</span>
                  <span className="flex-1 text-sm font-medium text-amber-100">{SECTION_LABELS[key]}</span>
                  {/* Lock / unlock toggle */}
                  <button
                    type="button"
                    title={isCustom ? 'Revert to global theme' : 'Unlock custom colour'}
                    onClick={() => {
                      if (isCustom) {
                        // Re-lock: clear custom flag and collapse
                        setSectionCustom(p => ({ ...p, [key]: false }));
                        if (expandedSection === key) setExpandedSection(null);
                      } else {
                        // Unlock: seed pickers with current theme values and expand
                        setSectionColors(p => ({ ...p, [key]: { bg: themeBg, accent: themeAccent } }));
                        setSectionCustom(p => ({ ...p, [key]: true }));
                        setExpandedSection(key);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${isCustom ? 'text-amber-400 bg-amber-500/15 hover:bg-amber-500/25' : 'text-amber-500/30 hover:text-amber-400 hover:bg-amber-500/10'}`}
                  >
                    {isCustom ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </button>
                  {/* Colour swatches */}
                  <div className={`flex items-center gap-1.5 transition-opacity ${isCustom ? '' : 'opacity-30'}`}>
                    <div className="w-5 h-5 rounded-md border border-white/10 shadow-sm" style={{ backgroundColor: bg }} title="Background" />
                    <div className="w-5 h-5 rounded-md border border-white/10 shadow-sm" style={{ backgroundColor: accent }} title="Accent" />
                  </div>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => setExpandedSection(isExpanded ? null : key)}
                      className="ml-1"
                    >
                      <ChevronDown className={`w-4 h-4 text-amber-500/40 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {isCustom && isExpanded && (
                  <div className="px-4 pb-4 pt-3 space-y-3 border-t border-amber-500/10">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wider">Background</label>
                      <ColorInput
                        value={sectionColors[key].bg}
                        onChange={v => setSectionColors(p => ({ ...p, [key]: { ...p[key], bg: v } }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-amber-500/60 uppercase tracking-wider">Accent / UI Colour</label>
                      <ColorInput
                        value={sectionColors[key].accent}
                        onChange={v => setSectionColors(p => ({ ...p, [key]: { ...p[key], accent: v } }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-amber-500/40 text-xs mt-3">Changes are applied to the home page after saving.</p>
      </Section>

      <Section title="Saved Themes">
        <p className="text-amber-500/50 text-sm -mt-2 mb-4">Save the current global theme + all section colours as a named preset to restore later.</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newThemeName}
            onChange={e => setNewThemeName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveCurrentTheme()}
            placeholder="Theme name (e.g. Ramadan)"
            className="flex-1 bg-amber-950/30 border border-amber-500/20 rounded-xl px-3 py-2 text-amber-100 text-sm focus:outline-none focus:border-amber-400/50 transition-colors placeholder:text-amber-500/30"
          />
          <button
            type="button"
            onClick={saveCurrentTheme}
            disabled={!newThemeName.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Save Current
          </button>
        </div>
        {savedThemes.length === 0 ? (
          <p className="text-amber-500/30 text-sm text-center py-4">No saved themes yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {savedThemes.map(t => {
              const baseName = t.globalTheme.replace('-light', '');
              const cfg = THEME_CONFIG[baseName];
              return (
                <div key={t.id} className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/10 flex flex-col gap-2">
                  <p className="text-amber-100 text-sm font-medium truncate">{t.name}</p>
                  <p className="text-amber-500/40 text-xs capitalize">{t.globalTheme.replace('-', ' ')}</p>
                  {/* Section accent swatches */}
                  <div className="flex gap-1 flex-wrap">
                    {SECTION_KEYS.map(k => (
                      <div
                        key={k}
                        className="w-4 h-4 rounded-full border border-white/10"
                        style={{ backgroundColor: t.sections[k]?.accent ?? DEFAULT_ACCENT }}
                        title={SECTION_LABELS[k]}
                      />
                    ))}
                    {cfg && (
                      <div className="w-4 h-4 rounded-full ml-0.5 border-2 border-amber-500/30" style={{ backgroundColor: cfg.accent }} title={`Theme: ${cfg.label}`} />
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => loadSavedTheme(t)}
                      className="flex-1 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-all"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedTheme(t.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-amber-500/40 text-xs mt-3">Load populates all pickers. Click Save All Settings to apply site-wide.</p>
      </Section>

      <Section title="Hero Section">
        <div className="space-y-4">
          <Input label="Headline Line 1" value={form.hero_line1} onChange={e => setForm(p => ({ ...p, hero_line1: e.target.value }))} placeholder="Awaken Your" />
          <Input label="Headline Line 2 (gold text)" value={form.hero_line2} onChange={e => setForm(p => ({ ...p, hero_line2: e.target.value }))} placeholder="Faith" />
          <Input label="Subtitle (below headline)" value={form.hero_subtitle} onChange={e => setForm(p => ({ ...p, hero_subtitle: e.target.value }))} placeholder="A welcoming community in the heart of Birmingham" />
        </div>
      </Section>

      <Section title="Announcement Banner">
        <p className="text-amber-500/50 text-sm -mt-2 mb-4">Show a dismissible notice to all visitors at the top of the homepage.</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
            <div>
              <p className="text-sm font-medium text-amber-100">Show Announcement</p>
              <p className="text-xs text-amber-500/50 mt-0.5">Enables the banner on the home page</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, announcement_enabled: p.announcement_enabled === 'true' ? 'false' : 'true' }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.announcement_enabled === 'true' ? 'bg-amber-500' : 'bg-amber-500/20 border border-amber-500/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.announcement_enabled === 'true' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <Textarea label="Announcement Text" value={form.announcement_text} onChange={e => setForm(p => ({ ...p, announcement_text: e.target.value }))} placeholder="Jumu'ah begins at 1:15 PM this week..." />
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
            <div>
              <p className="text-sm font-medium text-amber-100">Allow Visitors to Dismiss</p>
              <p className="text-xs text-amber-500/50 mt-0.5">Adds an X button to hide the banner</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, announcement_dismissible: p.announcement_dismissible === 'false' ? 'true' : 'false' }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.announcement_dismissible !== 'false' ? 'bg-amber-500' : 'bg-amber-500/20 border border-amber-500/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.announcement_dismissible !== 'false' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
            <div>
              <p className="text-sm font-medium text-amber-100">Jumu&apos;ah Friday Highlight</p>
              <p className="text-xs text-amber-500/50 mt-0.5">Highlights Jumu&apos;ah on Fridays in the prayer section</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, friday_highlight_enabled: p.friday_highlight_enabled === 'false' ? 'true' : 'false' }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.friday_highlight_enabled !== 'false' ? 'bg-amber-500' : 'bg-amber-500/20 border border-amber-500/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.friday_highlight_enabled !== 'false' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </Section>

      <Section title="About Section">
        <Textarea label="Description" value={form.about_desc} onChange={e => setForm(p => ({ ...p, about_desc: e.target.value }))} placeholder="Describe the mosque..." />
      </Section>

      <Section title="Contact Details">
        <div className="space-y-4">
          <Input label="Address" value={form.contact_address} onChange={e => setForm(p => ({ ...p, contact_address: e.target.value }))} placeholder="New Spring St, Birmingham B18 7PW" />
          <Input label="Phone Number" value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} placeholder="0121 507 0166" />
          <Input label="Email Address" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="info@masjidalekhuah.com" />
        </div>
      </Section>

      <Section title="Feature Toggles">
        <p className="text-amber-500/50 text-sm -mt-2 mb-4">Disable sections you don&apos;t need. Changes apply site-wide after saving.</p>
        <div className="space-y-3">
          {([
            { key: 'feature_events',  label: 'Events Section',  desc: 'Upcoming events and the events page link' },
            { key: 'feature_courses', label: 'Courses Section', desc: 'Islamic courses on the homepage' },
            { key: 'feature_books',   label: 'Books Section',   desc: 'Recommended books on the homepage' },
            { key: 'feature_donate',  label: 'Donate Section',  desc: 'Donation call-to-action on the homepage' },
          ] as { key: 'feature_events' | 'feature_courses' | 'feature_books' | 'feature_donate'; label: string; desc: string }[]).map(({ key, label, desc }) => {
            const enabled = form[key] !== 'false';
            return (
              <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
                <div>
                  <p className="text-sm font-medium text-amber-100">{label}</p>
                  <p className="text-xs text-amber-500/50 mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, [key]: enabled ? 'false' : 'true' }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${enabled ? 'bg-amber-500' : 'bg-amber-500/20 border border-amber-500/20'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Animation Mode">
        <p className="text-amber-500/50 text-sm -mt-2 mb-4">If the site feels slow on mobile, switch to Simplified to reduce GPU-heavy effects (blur, parallax, infinite rotations).</p>
        <div className="flex gap-3">
          {(['full', 'simplified'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setForm(p => ({ ...p, animation_mode: mode }))}
              className={`flex-1 py-4 px-4 rounded-2xl border text-sm font-medium transition-all duration-200 ${
                form.animation_mode === mode
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                  : 'bg-amber-950/20 border-amber-500/10 text-amber-500/50 hover:border-amber-500/30 hover:text-amber-400'
              }`}
            >
              <div className="font-semibold mb-0.5 capitalize">{mode}</div>
              <div className="text-xs opacity-70">{mode === 'full' ? 'All effects enabled' : 'Reduced for performance'}</div>
            </button>
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-4 flex-wrap">
        <Btn onClick={save} disabled={saving}>
          {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
          Save All Settings
        </Btn>
        <Btn variant="ghost" onClick={retranslateAll} disabled={retranslating}>
          {retranslating ? <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> : <span className="text-base leading-none">🌐</span>}
          Retranslate All
        </Btn>
      </div>
      <p className="text-amber-500/40 text-xs -mt-2">Retranslate All: auto-translates existing events, courses, and about text that are missing Arabic/Kurdish translations.</p>
    </div>
  );
}

// ─── Dhikr Tab ─────────────────────────────────────────────────────────────────
function DhikrTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [items, setItems] = useState<DhikrItem[]>([]);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [sectionTitle, setSectionTitle] = useState('Remembrance of God');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const blank = { arabic_text: '', transliteration: '', meaning_en: '', target_count: 33, sort_order: 0, is_active: true };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    fetch('/api/admin/dhikr?all=true').then(r => r.json()).then((data) => { if (Array.isArray(data)) setItems(data); }).catch(() => {});
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      if (c.feature_dhikr !== undefined) setFeatureEnabled(c.feature_dhikr !== 'false');
      if (c.dhikr_title) setSectionTitle(c.dhikr_title);
    }).catch(() => {});
  }, []);

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { key: 'feature_dhikr', value: featureEnabled ? 'true' : 'false' },
          { key: 'dhikr_title',   value: sectionTitle },
        ]),
      });
      if (!res.ok) throw new Error();
      showToast('Dhikr settings saved');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  async function addItem() {
    if (!form.arabic_text || !form.transliteration || !form.meaning_en) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/dhikr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setItems(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      setForm(blank);
      setShowAdd(false);
      showToast('Dhikr phrase added');
    } catch {
      showToast('Failed to add phrase', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function updateItem() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/dhikr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === editingId ? updated : i));
      setEditingId(null);
      setForm(blank);
      showToast('Dhikr phrase updated');
    } catch {
      showToast('Failed to update phrase', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/admin/dhikr?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== id));
      if (editingId === id) { setEditingId(null); setForm(blank); }
      showToast('Dhikr phrase deleted');
    } catch {
      showToast('Failed to delete phrase', 'error');
    }
  }

  function startEdit(item: DhikrItem) {
    setEditingId(item.id);
    setForm({
      arabic_text: item.arabic_text,
      transliteration: item.transliteration,
      meaning_en: item.meaning_en,
      target_count: item.target_count,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowAdd(false);
  }

  function cancelEdit() { setEditingId(null); setForm(blank); }

  const formValid = form.arabic_text.trim() && form.transliteration.trim() && form.meaning_en.trim();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-medium text-amber-50 mb-1">Dhikr Counter</h2>
        <p className="text-amber-500/50 text-sm">Manage the remembrance phrases shown on the homepage counter.</p>
      </div>

      {/* Settings */}
      <Section title="Section Settings">
        <div className="space-y-4">
          {/* Feature toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10">
            <div>
              <p className="text-sm font-medium text-amber-100">Dhikr Section</p>
              <p className="text-xs text-amber-500/50 mt-0.5">Show the dhikr counter on the homepage</p>
            </div>
            <button
              type="button"
              onClick={() => setFeatureEnabled(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${featureEnabled ? 'bg-amber-500' : 'bg-amber-500/20 border border-amber-500/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${featureEnabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <Input
            label="Section Title"
            value={sectionTitle}
            onChange={e => setSectionTitle(e.target.value)}
            placeholder="Remembrance of God"
          />
          <Btn onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Save Settings
          </Btn>
        </div>
      </Section>

      {/* Dhikr phrase list */}
      <Section title={`Phrases (${items.length})`}>
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-amber-500/40 text-sm text-center py-6">No dhikr phrases yet. Add your first one below.</p>
          )}
          {items.map(item => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="bg-amber-950/30 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Editing phrase</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Arabic Text" value={form.arabic_text} onChange={e => setForm(p => ({ ...p, arabic_text: e.target.value }))} placeholder="سُبْحَانَ اللَّه" />
                    <Input label="Transliteration" value={form.transliteration} onChange={e => setForm(p => ({ ...p, transliteration: e.target.value }))} placeholder="SubhanAllah" />
                    <Input label="English Meaning" value={form.meaning_en} onChange={e => setForm(p => ({ ...p, meaning_en: e.target.value }))} placeholder="Glory be to God" />
                    <Input label="Target Count" type="number" min="1" max="999" value={String(form.target_count)} onChange={e => setForm(p => ({ ...p, target_count: parseInt(e.target.value) || 33 }))} />
                    <Input label="Sort Order" type="number" min="0" value={String(form.sort_order)} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                    <div className="flex items-center gap-3 pt-6">
                      <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Active</label>
                      <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.is_active ? 'bg-amber-500' : 'bg-amber-500/20 border border-amber-500/20'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${form.is_active ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap pt-1">
                    <Btn onClick={updateItem} disabled={saving || !formValid}>
                      {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                      Save
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={cancelEdit}><X className="w-3.5 h-3.5" /> Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-950/20 border border-amber-500/10 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span dir="rtl" className="text-lg font-bold text-amber-100" style={{ fontFamily: 'serif' }}>{item.arabic_text}</span>
                      <span className="text-sm text-amber-400">{item.transliteration}</span>
                      {!item.is_active && <span className="text-[10px] uppercase tracking-widest text-amber-500/40 border border-amber-500/20 rounded-full px-2 py-0.5">inactive</span>}
                    </div>
                    <p className="text-xs text-amber-500/50 truncate">{item.meaning_en} · ×{item.target_count}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Btn variant="ghost" size="sm" onClick={() => startEdit(item)}><Edit2 className="w-3.5 h-3.5" /></Btn>
                    <Btn variant="danger" size="sm" onClick={() => deleteItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add form */}
        <div className="mt-4">
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 space-y-3 mb-3">
                  <p className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">New Dhikr Phrase</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Arabic Text" value={form.arabic_text} onChange={e => setForm(p => ({ ...p, arabic_text: e.target.value }))} placeholder="سُبْحَانَ اللَّه" />
                    <Input label="Transliteration" value={form.transliteration} onChange={e => setForm(p => ({ ...p, transliteration: e.target.value }))} placeholder="SubhanAllah" />
                    <Input label="English Meaning" value={form.meaning_en} onChange={e => setForm(p => ({ ...p, meaning_en: e.target.value }))} placeholder="Glory be to God" />
                    <Input label="Target Count" type="number" min="1" max="999" value={String(form.target_count)} onChange={e => setForm(p => ({ ...p, target_count: parseInt(e.target.value) || 33 }))} />
                    <Input label="Sort Order" type="number" min="0" value={String(form.sort_order)} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <p className="text-amber-500/40 text-xs">Arabic and Kurdish meanings will be auto-translated from English.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Btn onClick={addItem} disabled={saving || !formValid}>
                      {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add Phrase
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => { setShowAdd(false); setForm(blank); }}>
                      <X className="w-3.5 h-3.5" /> Cancel
                    </Btn>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!showAdd && !editingId && (
            <Btn variant="ghost" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add Phrase
            </Btn>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Books Tab ──────────────────────────────────────────────────────────────────
interface BookCategory { id: string; name: string; name_ar?: string; name_ku?: string; sort_order: number; }
interface Book { id: string; title: string; author?: string; description?: string; image_url?: string; external_link?: string; is_active: boolean; sort_order: number; category_id?: string; title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string; }

function BooksTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<BookCategory | null>(null);
  const [catForm, setCatForm] = useState({ name: '', name_ar: '', name_ku: '', sort_order: 0 });
  const [addingBook, setAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const blankBook = { title: '', author: '', description: '', external_link: '', is_active: true, sort_order: 0, category_id: '', title_ar: '', title_ku: '', description_ar: '', description_ku: '' };
  const [bookForm, setBookForm] = useState(blankBook);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  const loadAll = useCallback(() => {
    fetch('/api/admin/book-categories').then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d); }).catch(() => {});
    fetch('/api/admin/books').then(r => r.json()).then(d => { if (Array.isArray(d)) setBooks(d); }).catch(() => {});
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredBooks = selectedCatId === null
    ? books
    : selectedCatId === '__none__'
      ? books.filter(b => !b.category_id || !categories.find(c => c.id === b.category_id))
      : books.filter(b => b.category_id === selectedCatId);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function saveCat() {
    setSavingCat(true);
    try {
      const res = editingCat
        ? await fetch('/api/admin/book-categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingCat.id, ...catForm }) })
        : await fetch('/api/admin/book-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) });
      if (!res.ok) throw new Error();
      showToast(editingCat ? 'Category updated' : 'Category added');
      setEditingCat(null); setAddingCat(false); setCatForm({ name: '', name_ar: '', name_ku: '', sort_order: 0 }); loadAll();
    } catch { showToast('Failed to save category', 'error'); }
    finally { setSavingCat(false); }
  }

  async function delCat(id: string) {
    if (!confirm('Delete this category? Books will not be deleted.')) return;
    const res = await fetch('/api/admin/book-categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { showToast('Category deleted'); if (selectedCatId === id) setSelectedCatId(null); loadAll(); }
    else showToast('Failed to delete', 'error');
  }

  async function saveBook() {
    setSavingBook(true);
    try {
      const payload = { ...bookForm, category_id: bookForm.category_id || null };
      const res = editingBook
        ? await fetch('/api/admin/books', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingBook.id, ...payload }) })
        : await fetch('/api/admin/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const entityId = editingBook ? editingBook.id : (saved.id ?? saved[0]?.id);
      if (imageFile && entityId) {
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('entity', 'book');
        fd.append('entityId', entityId);
        await fetch('/api/admin/media', { method: 'POST', body: fd });
      }
      showToast(editingBook ? 'Book updated' : 'Book added');
      setEditingBook(null); setAddingBook(false); setBookForm(blankBook); setImageFile(null); setImagePreview(null); loadAll();
    } catch { showToast('Failed to save book', 'error'); }
    finally { setSavingBook(false); }
  }

  async function delBook(id: string) {
    if (!confirm('Delete this book?')) return;
    const res = await fetch('/api/admin/books', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { showToast('Book deleted'); loadAll(); }
    else showToast('Failed to delete', 'error');
  }

  function startEditBook(b: Book) {
    setEditingBook(b);
    setBookForm({ title: b.title, author: b.author ?? '', description: b.description ?? '', external_link: b.external_link ?? '', is_active: b.is_active, sort_order: b.sort_order, category_id: b.category_id ?? '', title_ar: b.title_ar ?? '', title_ku: b.title_ku ?? '', description_ar: b.description_ar ?? '', description_ku: b.description_ku ?? '' });
    setImageFile(null); setImagePreview(b.image_url ?? null);
    setAddingBook(true);
  }

  function startEditCat(c: BookCategory) {
    setEditingCat(c);
    setCatForm({ name: c.name, name_ar: c.name_ar ?? '', name_ku: c.name_ku ?? '', sort_order: c.sort_order });
    setAddingCat(true);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-medium text-amber-50 mb-1">Recommended Books</h2>
        <p className="text-amber-500/50 text-sm">Manage book categories and books shown on the website.</p>
      </div>

      {/* Categories */}
      <Section title="Categories">
        <div className="space-y-3 mb-4">
          {categories.length === 0 && <p className="text-amber-500/40 text-sm">No categories yet.</p>}
          {categories.map(cat => (
            <div key={cat.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedCatId === cat.id ? 'bg-amber-500/15 border-amber-400/40 text-amber-200' : 'bg-amber-950/20 border-amber-500/10 text-amber-100 hover:border-amber-500/30'}`}
              onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}>
              <span className="text-sm font-medium">{cat.name}</span>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Btn size="sm" variant="ghost" onClick={() => startEditCat(cat)}><Edit2 className="w-3.5 h-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => delCat(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
              </div>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {addingCat && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 space-y-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Category Name" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Kids" />
                  <Input label="Sort Order" type="number" value={catForm.sort_order} onChange={e => setCatForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                  <Input label="Arabic Name (اسم)" dir="rtl" value={catForm.name_ar} onChange={e => setCatForm(p => ({ ...p, name_ar: e.target.value }))} placeholder="للأطفال" />
                  <Input label="Kurdish Name (ناو)" dir="rtl" value={catForm.name_ku} onChange={e => setCatForm(p => ({ ...p, name_ku: e.target.value }))} placeholder="منداڵان" />
                </div>
                <div className="flex gap-2">
                  <Btn onClick={saveCat} disabled={savingCat || !catForm.name}>
                    {savingCat ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingCat ? 'Save' : 'Add Category'}
                  </Btn>
                  <Btn variant="ghost" size="sm" onClick={() => { setAddingCat(false); setEditingCat(null); setCatForm({ name: '', name_ar: '', name_ku: '', sort_order: 0 }); }}><X className="w-3.5 h-3.5" /> Cancel</Btn>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!addingCat && (
          <Btn variant="ghost" onClick={() => { setAddingCat(true); setEditingCat(null); }}>
            <Plus className="w-4 h-4" /> Add Category
          </Btn>
        )}
      </Section>

      {/* Books */}
      <Section title={selectedCatId ? `Books — ${categories.find(c => c.id === selectedCatId)?.name ?? ''}` : 'All Books'}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedCatId(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCatId === null ? 'bg-amber-500/20 border-amber-400/40 text-amber-200' : 'bg-transparent border-amber-500/20 text-amber-500/60 hover:border-amber-500/40'}`}>All</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedCatId === cat.id ? 'bg-amber-500/20 border-amber-400/40 text-amber-200' : 'bg-transparent border-amber-500/20 text-amber-500/60 hover:border-amber-500/40'}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <Btn onClick={() => { setAddingBook(!addingBook); setEditingBook(null); setBookForm({ ...blankBook, category_id: selectedCatId ?? '' }); setImageFile(null); setImagePreview(null); }}>
            {addingBook ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {addingBook ? 'Cancel' : 'Add Book'}
          </Btn>
        </div>

        <AnimatePresence>
          {addingBook && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 space-y-4 mb-4">
                <p className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">{editingBook ? 'Edit Book' : 'New Book'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Title" value={bookForm.title} onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Don't Be Sad" />
                  <Input label="Author" value={bookForm.author ?? ''} onChange={e => setBookForm(p => ({ ...p, author: e.target.value }))} placeholder="e.g. Aaidh al-Qarni" />
                </div>
                <Textarea label="Description" value={bookForm.description ?? ''} onChange={e => setBookForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the book..." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider">Category</label>
                    <select value={bookForm.category_id ?? ''} onChange={e => setBookForm(p => ({ ...p, category_id: e.target.value }))}
                      className="bg-amber-950/30 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-100 text-sm focus:outline-none focus:border-amber-400/50">
                      <option value="" className="bg-[#0a0804]">— No category —</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id} className="bg-[#0a0804]">{cat.name}</option>)}
                    </select>
                  </div>
                  <Input label="External Link (optional)" value={bookForm.external_link ?? ''} onChange={e => setBookForm(p => ({ ...p, external_link: e.target.value }))} placeholder="https://..." />
                </div>
                {/* Cover image */}
                <div>
                  <label className="text-xs font-medium text-amber-400/70 uppercase tracking-wider block mb-1.5">Cover Image (optional)</label>
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-500/20 rounded-2xl p-6 cursor-pointer hover:border-amber-400/40 transition-colors text-center">
                    <Upload className="w-6 h-6 text-amber-500/40" />
                    <span className="text-amber-500/60 text-sm">{imageFile ? imageFile.name : 'Click to choose an image (JPEG, PNG, WebP)'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} className="hidden" />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-3 max-h-40 rounded-2xl border border-amber-500/10 object-contain mx-auto" />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Sort Order" type="number" value={bookForm.sort_order} onChange={e => setBookForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" id="book-active" checked={bookForm.is_active} onChange={e => setBookForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-amber-400 w-4 h-4" />
                    <label htmlFor="book-active" className="text-sm text-amber-300">Show on website</label>
                  </div>
                </div>
                {/* Manual translations */}
                <div className="pt-2 border-t border-amber-500/10">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-400/50 uppercase tracking-wider mb-3"><Globe className="w-3.5 h-3.5" /> Translations (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Arabic Title" dir="rtl" value={bookForm.title_ar ?? ''} onChange={e => setBookForm(p => ({ ...p, title_ar: e.target.value }))} placeholder="العنوان بالعربي" />
                    <Input label="Kurdish Title" dir="rtl" value={bookForm.title_ku ?? ''} onChange={e => setBookForm(p => ({ ...p, title_ku: e.target.value }))} placeholder="ناوی کوردی" />
                    <Textarea label="Arabic Description" dir="rtl" value={bookForm.description_ar ?? ''} onChange={e => setBookForm(p => ({ ...p, description_ar: e.target.value }))} placeholder="الوصف بالعربي" />
                    <Textarea label="Kurdish Description" dir="rtl" value={bookForm.description_ku ?? ''} onChange={e => setBookForm(p => ({ ...p, description_ku: e.target.value }))} placeholder="پوختەی کوردی" />
                  </div>
                </div>
                <Btn onClick={saveBook} disabled={savingBook || !bookForm.title}>
                  {savingBook ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingBook ? 'Save Changes' : 'Add Book'}
                </Btn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {filteredBooks.length === 0 && <p className="text-amber-500/40 text-sm text-center py-8">No books here yet.</p>}
          {filteredBooks.map(b => (
            <div key={b.id} className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-4">
              {b.image_url && (
                <img src={b.image_url} alt={b.title} className="w-12 h-16 rounded-xl object-cover shrink-0 border border-amber-500/10" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-amber-100 font-medium text-sm">{b.title}</p>
                  {!b.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500/60 border border-amber-500/20">Hidden</span>}
                  {b.external_link && <ExternalLink className="w-3 h-3 text-amber-500/40 shrink-0" />}
                </div>
                {b.author && <p className="text-amber-500/60 text-xs mt-0.5">{b.author}</p>}
                {b.description && <p className="text-amber-100/40 text-xs mt-1 line-clamp-2">{b.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Btn size="sm" variant="ghost" onClick={() => startEditBook(b)}><Edit2 className="w-3.5 h-3.5" /></Btn>
                <Btn size="sm" variant="danger" onClick={() => delBook(b.id)}><Trash2 className="w-3.5 h-3.5" /></Btn>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
