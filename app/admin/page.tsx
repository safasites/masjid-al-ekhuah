'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid, Calendar, BookOpen, Clock, Image, Settings,
  LogOut, Plus, Trash2, Edit2, Check, X, Upload, ChevronDown, ChevronUp, Menu
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event { id: string; title: string; date_label: string; description: string; is_featured: boolean; sort_order: number; }
interface Course { id: string; title: string; level: string; duration: string; description: string; sort_order: number; }
interface JamatTime { prayer: string; time: string; }
interface Content { [key: string]: string; }
interface Timetable { id: string; label: string; image_url: string; is_active: boolean; created_at: string; }

type Tab = 'prayer' | 'events' | 'courses' | 'timetable' | 'settings';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'prayer',   label: 'Prayer Times', icon: <Clock className="w-4 h-4" /> },
    { id: 'events',   label: 'Events',       icon: <Calendar className="w-4 h-4" /> },
    { id: 'courses',  label: 'Courses',      icon: <BookOpen className="w-4 h-4" /> },
    { id: 'timetable',label: 'Timetable',    icon: <Image className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings',     icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0804] flex flex-col md:flex-row">
      {/* Background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[150px] pointer-events-none" />

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-amber-500/10 bg-[#0a0804]/80 backdrop-blur-xl sticky top-0 z-50">
        <span className="text-amber-200 font-medium text-sm">Masjid Admin</span>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-2 text-amber-500/60 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-amber-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.aside
            initial={false}
            className={`
              md:flex flex-col w-full md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-amber-500/10
              bg-[#0a0804]/90 backdrop-blur-xl md:sticky md:top-0 md:h-screen overflow-hidden
              ${sidebarOpen ? 'flex' : 'hidden'}
            `}
          >
            {/* Desktop logo */}
            <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-amber-500/10">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border border-amber-500/40 rounded-full" />
                <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-100 font-medium text-sm">Admin Panel</p>
                <p className="text-amber-500/50 text-xs">Masjid Al-Ekhuah</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-x-visible md:flex-1">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
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

            {/* Logout (desktop) */}
            <div className="hidden md:block p-4 border-t border-amber-500/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 p-5 md:p-8 lg:p-10 overflow-auto">
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
            {tab === 'settings'  && <SettingsTab showToast={showToast} />}
          </motion.div>
        </AnimatePresence>
      </main>

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
    <div className="space-y-6 max-w-2xl">
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
  const blank: Omit<Event, 'id'> = { title: '', date_label: '', description: '', is_featured: false, sort_order: 0 };
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
    setForm({ title: e.title, date_label: e.date_label, description: e.description ?? '', is_featured: e.is_featured, sort_order: e.sort_order });
    setAdding(true);
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
  const blank = { title: '', level: 'Beginner', duration: '', description: '', sort_order: 0 };
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
    setForm({ title: c.title, level: c.level, duration: c.duration, description: c.description ?? '', sort_order: c.sort_order });
    setAdding(true);
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrent(data);
      setFile(null); setLabel(''); setPreview(null);
      showToast('Timetable uploaded successfully');
    } catch { showToast('Upload failed', 'error'); }
    finally { setUploading(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
function SettingsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [form, setForm] = useState({
    hero_line1: '',
    hero_line2: '',
    about_desc: '',
    contact_address: '',
    contact_phone: '',
    contact_email: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/content').then(r => r.json()).then((c: Content) => {
      setForm(prev => ({
        hero_line1:       c.hero_line1       ?? prev.hero_line1,
        hero_line2:       c.hero_line2       ?? prev.hero_line2,
        about_desc:       c.about_desc       ?? prev.about_desc,
        contact_address:  c.contact_address  ?? prev.contact_address,
        contact_phone:    c.contact_phone    ?? prev.contact_phone,
        contact_email:    c.contact_email    ?? prev.contact_email,
      }));
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      const updates = Object.entries(form).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      showToast('Settings saved');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-medium text-amber-50 mb-1">Site Settings</h2>
        <p className="text-amber-500/50 text-sm">Edit text content shown across the website.</p>
      </div>

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

      <Btn onClick={save} disabled={saving}>
        {saving ? <span className="w-4 h-4 border-2 border-[#0a0804]/30 border-t-[#0a0804] rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
        Save All Settings
      </Btn>
    </div>
  );
}
