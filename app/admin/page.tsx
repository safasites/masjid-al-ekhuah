'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Calendar, BookOpen, Clock, Image, Settings,
  LogOut, Plus, Trash2, Edit2, Check, X, Upload, ChevronDown, ChevronUp, Globe, Sparkles
} from 'lucide-react';
import { useTheme, type Theme } from '../theme-provider';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event { id: string; title: string; date_label: string; description: string; is_featured: boolean; sort_order: number; title_ar?: string; title_ku?: string; description_ar?: string; description_ku?: string; }
interface Course { id: string; title: string; level: string; duration: string; description: string; sort_order: number; title_ar?: string; title_ku?: string; }
interface JamatTime { prayer: string; time: string; }
interface Content { [key: string]: string; }
interface Timetable { id: string; label: string; image_url: string; is_active: boolean; created_at: string; }
interface DhikrItem { id: string; arabic_text: string; transliteration: string; meaning_en: string; meaning_ar?: string; meaning_ku?: string; target_count: number; sort_order: number; is_active: boolean; }

type Tab = 'prayer' | 'events' | 'courses' | 'timetable' | 'settings' | 'dhikr';

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
  const [tab, setTab] = useState<Tab>('prayer');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [mosqueName, setMosqueName] = useState('Masjid Al-Ekhuah');

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      if (c.mosque_name) setMosqueName(c.mosque_name);
    });
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
    { id: 'prayer',    label: 'Prayer Times', shortLabel: 'Prayer',    icon: <Clock className="w-4 h-4" /> },
    { id: 'events',    label: 'Events',       shortLabel: 'Events',    icon: <Calendar className="w-4 h-4" /> },
    { id: 'courses',   label: 'Courses',      shortLabel: 'Courses',   icon: <BookOpen className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable',    shortLabel: 'Timetable', icon: <Image className="w-4 h-4" /> },
    { id: 'dhikr',     label: 'Dhikr',        shortLabel: 'Dhikr',     icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings',  label: 'Settings',     shortLabel: 'Settings',  icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0804] flex flex-col md:flex-row">
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[150px] pointer-events-none" />

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-amber-500/10 bg-[#0a0804]/80 backdrop-blur-xl sticky top-0 z-50">
        <span className="text-amber-200 font-medium text-sm">{mosqueName}</span>
        <button onClick={handleLogout} className="p-2 text-amber-500/60 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-amber-500/10 bg-[#0a0804]/90 backdrop-blur-xl sticky top-0 h-screen overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-amber-500/10">
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border border-amber-500/40 rounded-full" />
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-100 font-medium text-sm">Admin Panel</p>
            <p className="text-amber-500/50 text-xs">{mosqueName}</p>
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
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/5'
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
            {tab === 'prayer'    && <PrayerTab showToast={showToast} />}
            {tab === 'events'    && <EventsTab showToast={showToast} />}
            {tab === 'courses'   && <CoursesTab showToast={showToast} />}
            {tab === 'timetable' && <TimetableTab showToast={showToast} />}
            {tab === 'dhikr'     && <DhikrTab showToast={showToast} />}
            {tab === 'settings'  && <SettingsTab showToast={showToast} onMosqueNameChange={setMosqueName} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-[#111310]/95 backdrop-blur-xl border border-amber-500/20 rounded-full p-2 flex items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:text-amber-200'
                }`}>
                <span className={`mb-1 ${isActive ? 'text-amber-400' : ''}`}>{t.icon}</span>
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

// ─── Prayer Tab ────────────────────────────────────────────────────────────────
function PrayerTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [jamat, setJamat] = useState<Record<string, string>>({});
  const [method, setMethod] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/jamat').then(r => r.json()).then((rows: JamatTime[]) => {
      const m: Record<string, string> = {};
      rows.forEach(r => { m[r.prayer] = r.time; });
      setJamat(m);
    });
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      if (c.prayer_method) setMethod(c.prayer_method);
    });
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
  const blank: Omit<Event, 'id'> = { title: '', date_label: '', description: '', is_featured: false, sort_order: 0, title_ar: '', title_ku: '', description_ar: '', description_ku: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/events').then(r => r.json()).then(setEvents);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = editing
        ? await fetch('/api/admin/events', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        : await fetch('/api/admin/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      showToast(editing ? 'Event updated' : 'Event added');
      setEditing(null); setAdding(false); setForm(blank); load();
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
    setForm({ title: e.title, date_label: e.date_label, description: e.description ?? '', is_featured: e.is_featured, sort_order: e.sort_order, title_ar: e.title_ar ?? '', title_ku: e.title_ku ?? '', description_ar: e.description_ar ?? '', description_ku: e.description_ku ?? '' });
    setAdding(true);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-medium text-amber-50 mb-1">Events</h2>
          <p className="text-amber-500/50 text-sm">Manage upcoming events shown on the website.</p>
        </div>
        <Btn onClick={() => { setAdding(!adding); setEditing(null); setForm(blank); }}>
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
                <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
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
          <div key={e.id} className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
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
  const blank = { title: '', level: 'Beginner', duration: '', description: '', sort_order: 0, title_ar: '', title_ku: '' };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/courses').then(r => r.json()).then(setCourses);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    try {
      const res = editing
        ? await fetch('/api/admin/courses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) })
        : await fetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      showToast(editing ? 'Course updated' : 'Course added');
      setEditing(null); setAdding(false); setForm(blank); load();
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
    setForm({ title: c.title, level: c.level, duration: c.duration, description: c.description ?? '', sort_order: c.sort_order, title_ar: c.title_ar ?? '', title_ku: c.title_ku ?? '' });
    setAdding(true);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-medium text-amber-50 mb-1">Courses</h2>
          <p className="text-amber-500/50 text-sm">Manage Islamic courses offered by the mosque.</p>
        </div>
        <Btn onClick={() => { setAdding(!adding); setEditing(null); setForm(blank); }}>
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
                <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
                <Input label="Sort Order" type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} />
                {/* Manual Translations */}
                <div className="pt-2 border-t border-amber-500/10">
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-400/50 uppercase tracking-wider mb-3"><Globe className="w-3.5 h-3.5" /> Translations (optional — leave blank to keep auto-translated)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Arabic Title (عنوان)" dir="rtl" value={form.title_ar ?? ''} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))} placeholder="العنوان بالعربي" />
                    <Input label="Kurdish Title (ناو)" dir="rtl" value={form.title_ku ?? ''} onChange={e => setForm(p => ({ ...p, title_ku: e.target.value }))} placeholder="ناوی کوردی" />
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
          <div key={c.id} className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
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
    fetch('/api/admin/timetable').then(r => r.json()).then(d => setCurrent(d));
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
function SettingsTab({ showToast, onMosqueNameChange }: { showToast: (m: string, t?: 'success' | 'error') => void; onMosqueNameChange?: (name: string) => void }) {
  const { theme: activeTheme, setTheme } = useTheme();
  const [form, setForm] = useState({
    mosque_name: '',
    hero_line1: '',
    hero_line2: '',
    about_desc: '',
    contact_address: '',
    contact_phone: '',
    contact_email: '',
    feature_events: 'true',
    feature_courses: 'true',
    feature_donate: 'true',
  });
  const [saving, setSaving] = useState(false);
  const [retranslating, setRetranslating] = useState(false);

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
        mosque_name:      c.mosque_name      ?? prev.mosque_name,
        hero_line1:       c.hero_line1       ?? prev.hero_line1,
        hero_line2:       c.hero_line2       ?? prev.hero_line2,
        about_desc:       c.about_desc       ?? prev.about_desc,
        contact_address:  c.contact_address  ?? prev.contact_address,
        contact_phone:    c.contact_phone    ?? prev.contact_phone,
        contact_email:    c.contact_email    ?? prev.contact_email,
        feature_events:   c.feature_events   ?? prev.feature_events,
        feature_courses:  c.feature_courses  ?? prev.feature_courses,
        feature_donate:   c.feature_donate   ?? prev.feature_donate,
      }));
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updates = [
        ...Object.entries(form).map(([key, value]) => ({ key, value })),
        { key: 'theme', value: activeTheme },
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

  const themes: { id: Theme; label: string; desc: string; bgHex: string; accentHigh: string; accentMid: string; accentLow: string; dotColor: string }[] = [
    {
      id: 'aurum',
      label: 'Aurum',
      desc: 'Classic gold and amber. Timeless warmth.',
      bgHex: '#0a0804',
      accentHigh: 'oklch(0.879 0.169 91.2)',
      accentMid:  'oklch(0.769 0.188 70.1)',
      accentLow:  'oklch(0.962 0.059 95.2)',
      dotColor:   'oklch(0.828 0.189 84.4)',
    },
    {
      id: 'emerald',
      label: 'Emerald',
      desc: 'Islamic green. Peaceful and traditional.',
      bgHex: '#040a06',
      accentHigh: 'oklch(0.879 0.169 145)',
      accentMid:  'oklch(0.769 0.188 145)',
      accentLow:  'oklch(0.962 0.059 145)',
      dotColor:   'oklch(0.828 0.189 145)',
    },
    {
      id: 'sapphire',
      label: 'Sapphire',
      desc: 'Deep midnight blue. Serene and distinguished.',
      bgHex: '#04080f',
      accentHigh: 'oklch(0.879 0.169 265)',
      accentMid:  'oklch(0.769 0.188 265)',
      accentLow:  'oklch(0.962 0.059 265)',
      dotColor:   'oklch(0.828 0.189 265)',
    },
    {
      id: 'teal',
      label: 'Teal',
      desc: 'Cool teal tones. Fresh and modern.',
      bgHex: '#040b0b',
      accentHigh: 'oklch(0.879 0.169 190)',
      accentMid:  'oklch(0.769 0.188 190)',
      accentLow:  'oklch(0.962 0.059 190)',
      dotColor:   'oklch(0.828 0.189 190)',
    },
    {
      id: 'copper',
      label: 'Copper',
      desc: 'Warm bronze tones. Rich and grounded.',
      bgHex: '#0a0602',
      accentHigh: 'oklch(0.879 0.169 45)',
      accentMid:  'oklch(0.769 0.205 45)',
      accentLow:  'oklch(0.962 0.059 45)',
      dotColor:   'oklch(0.828 0.210 45)',
    },
  ];

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

      <Section title="Appearance">
        <div className="space-y-4">
          <p className="text-amber-500/50 text-sm -mt-2">Choose a colour palette for the entire site. Changes apply instantly.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{ borderColor: activeTheme === t.id ? t.dotColor : undefined }}
                className={`text-left rounded-2xl p-5 border-2 transition-all duration-200 ${
                  activeTheme === t.id
                    ? 'bg-white/5'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* Mini prayer row preview — always shows THIS theme's own colours */}
                <div
                  className="flex items-center gap-3 mb-4 rounded-xl px-4 py-3 border"
                  style={{ backgroundColor: t.bgHex, borderColor: t.dotColor + '33' }}
                >
                  <span
                    className="text-xs font-semibold uppercase tracking-wider w-16 shrink-0"
                    style={{ color: t.accentHigh }}
                  >Fajr</span>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: t.accentMid + 'aa' }}>Azan</p>
                    <p className="font-display text-sm" style={{ color: t.accentLow }}>04:19</p>
                  </div>
                  <div className="w-px self-stretch" style={{ backgroundColor: t.dotColor + '33' }} />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: t.accentMid + 'aa' }}>Jama&apos;at</p>
                    <p className="font-display text-sm" style={{ color: t.accentLow }}>06:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: t.accentLow }}>{t.label}</p>
                    <p className="text-xs mt-0.5 opacity-60" style={{ color: t.accentMid }}>{t.desc}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 transition-colors"
                    style={{
                      borderColor: t.dotColor,
                      backgroundColor: activeTheme === t.id ? t.dotColor : 'transparent',
                    }}
                  >
                    {activeTheme === t.id && <Check className="w-3 h-3" style={{ color: t.bgHex }} />}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-amber-500/40 text-xs">Theme is applied site-wide immediately. Save to persist across sessions.</p>
        </div>
      </Section>

      <Section title="Hero Section">
        <div className="space-y-4">
          <Input label="Headline Line 1" value={form.hero_line1} onChange={e => setForm(p => ({ ...p, hero_line1: e.target.value }))} placeholder="Awaken Your" />
          <Input label="Headline Line 2 (gold text)" value={form.hero_line2} onChange={e => setForm(p => ({ ...p, hero_line2: e.target.value }))} placeholder="Faith" />
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
            { key: 'feature_donate',  label: 'Donate Section',  desc: 'Donation call-to-action on the homepage' },
          ] as { key: 'feature_events' | 'feature_courses' | 'feature_donate'; label: string; desc: string }[]).map(({ key, label, desc }) => {
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
    fetch('/api/admin/dhikr?all=true').then(r => r.json()).then(setItems);
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      if (c.feature_dhikr !== undefined) setFeatureEnabled(c.feature_dhikr !== 'false');
      if (c.dhikr_title) setSectionTitle(c.dhikr_title);
    });
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
