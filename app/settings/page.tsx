'use client';

import { useState, useRef } from 'react';
import {
  Moon, Sun, Monitor, Download, Upload, Trash2,
  Bell, LogOut, LogIn, RefreshCw, ChevronRight,
  CloudUpload, Wifi, WifiOff, Shield, BookOpen,
  Type, Palette, Target, Info
} from 'lucide-react';
import { useStore } from '@/store';
import { exportData, importData } from '@/lib/db';
import { signInWithGoogle, signOut, syncBooksToCloud } from '@/lib/supabase';
import { BottomNav } from '@/components/layout/BottomNav';
import { downloadJSON } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UserSettings } from '@/types';

const FONT_OPTIONS = [
  { name: 'Georgia',           label: 'Georgia (Classic)' },
  { name: 'Palatino Linotype', label: 'Palatino (Elegant)' },
  { name: 'Garamond',          label: 'Garamond (Refined)' },
  { name: 'Baskerville',       label: 'Baskerville (Literary)' },
  { name: 'Times New Roman',   label: 'Times New Roman' },
];

const SCHEMES = [
  { id: 'ink',    label: 'Ink',    color: '#8f6540' },
  { id: 'ocean',  label: 'Ocean',  color: '#0369a1' },
  { id: 'forest', label: 'Forest', color: '#15803d' },
  { id: 'rose',   label: 'Rose',   color: '#be185d' },
  { id: 'violet', label: 'Violet', color: '#7c3aed' },
];

export default function SettingsPage() {
  const { settings, updateSettings, user, setUser, books, isOnline } = useStore();
  const notes   = useStore(s => s.notes);
  const sessions = useStore(s => s.sessions);
  const [syncing, setSyncing]       = useState(false);
  const [confirmClear, setConfirm]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    downloadJSON(await exportData(), `readr-${new Date().toISOString().split('T')[0]}.json`);
    toast.success('Backup exported!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await importData(await file.text()); toast.success('Imported! Refresh to see changes.'); }
    catch { toast.error('Invalid file'); }
  };

  const handleSync = async () => {
    if (!user) return toast.error('Sign in first');
    setSyncing(true);
    try { await syncBooksToCloud(books); toast.success('☁️ Synced!'); }
    catch { toast.error('Sync failed'); }
    finally { setSyncing(false); }
  };

  const handleClearData = async () => {
    if (!confirmClear) { setConfirm(true); setTimeout(() => setConfirm(false), 4000); return; }
    try {
      const dbs = await indexedDB.databases();
      for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
      localStorage.clear();
      toast.success('Cleared. Reloading…');
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast.error('Could not clear data'); }
  };

  return (
    <div className="min-h-svh pb-28" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 safe-top px-4 pt-4 pb-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="page-title">Settings</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Customise your reading experience</p>
      </header>

      <div className="px-4 py-5 space-y-8">

        {/* Account */}
        <Sect icon={Shield} title="Account">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 font-bold"
                  style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.name || 'Reader'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                </div>
                {isOnline ? <Wifi size={14} className="text-green-500 flex-shrink-0" />
                           : <WifiOff size={14} className="text-amber-400 flex-shrink-0" />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSync} disabled={syncing || !isOnline}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)', opacity: syncing || !isOnline ? 0.5 : 1 }}>
                  {syncing ? <RefreshCw size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                  {syncing ? 'Syncing…' : 'Sync'}
                </button>
                <button onClick={async () => { await signOut(); setUser(null); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sign in to sync your library across devices.
              </p>
              <button onClick={async () => { const { error } = await signInWithGoogle(); if (error) toast.error('Sign in failed'); }}
                disabled={!isOnline}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                style={{ opacity: isOnline ? 1 : 0.5 }}>
                <LogIn size={15} /> Continue with Google
              </button>
            </div>
          )}
        </Sect>

        {/* Appearance */}
        <Sect icon={Palette} title="Appearance">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Theme</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {([['light','Light',Sun],['dark','Dark',Moon],['system','System',Monitor]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => updateSettings({ theme: id })}
                className="flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all"
                style={{
                  background:  settings.theme === id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  borderColor: settings.theme === id ? 'var(--accent-primary)' : 'transparent',
                  color:       settings.theme === id ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}>
                <Icon size={18} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>Accent Colour</p>
          <div className="flex gap-4 justify-between">
            {SCHEMES.map(s => (
              <button key={s.id} onClick={() => updateSettings({ colorScheme: s.id as UserSettings['colorScheme'] })}
                className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-full transition-all duration-200"
                  style={{
                    background: s.color,
                    outline:    settings.colorScheme === s.id ? `3px solid ${s.color}` : 'none',
                    outlineOffset: 3,
                    transform:  settings.colorScheme === s.id ? 'scale(1.2)' : 'scale(1)',
                  }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              </button>
            ))}
          </div>
        </Sect>

        {/* Typography */}
        <Sect icon={Type} title="Reading Font">
          <div className="space-y-1.5 mb-4">
            {FONT_OPTIONS.map(f => (
              <button key={f.name} onClick={() => updateSettings({ fontFamily: f.name })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                style={{
                  background:  settings.fontFamily === f.name ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  borderColor: settings.fontFamily === f.name ? 'var(--accent-primary)' : 'transparent',
                }}>
                <span className="text-sm" style={{ fontFamily: f.name, color: 'var(--text-primary)' }}>{f.label}</span>
                {settings.fontFamily === f.name && <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>✓</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Size</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              {settings.fontSize}px
            </span>
          </div>
          <input type="range" min="13" max="22" step="1" className="w-full"
            style={{ accentColor: 'var(--accent-primary)' }}
            value={settings.fontSize}
            onChange={e => updateSettings({ fontSize: parseInt(e.target.value) })} />

          <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <p style={{ fontSize: settings.fontSize, fontFamily: settings.fontFamily, color: 'var(--text-primary)', lineHeight: 1.8 }}>
              "A reader lives a thousand lives before he dies."
            </p>
          </div>
        </Sect>

        {/* Goals */}
        <Sect icon={Target} title="Default Reading Goals">
          <div className="space-y-4">
            {([
              { key: 'readingGoalPages', label: 'Daily page target', min: 5,  max: 150, step: 5,  unit: 'pages/day' },
              { key: 'readingGoalBooks', label: 'Yearly book target', min: 1, max: 100, step: 1,  unit: 'books/year' },
            ] as const).map(({ key, label, min, max, step, unit }) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                    {settings[key]} {unit}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step} className="w-full"
                  style={{ accentColor: 'var(--accent-primary)' }}
                  value={settings[key]}
                  onChange={e => updateSettings({ [key]: parseInt(e.target.value) })} />
              </div>
            ))}
          </div>
        </Sect>

        {/* Notifications */}
        <Sect icon={Bell} title="Notifications">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Daily reading reminder</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keep your streak going</p>
            </div>
            <Toggle checked={settings.notifications} onChange={v => {
              updateSettings({ notifications: v });
              if (v && 'Notification' in window) {
                Notification.requestPermission().then(p => {
                  if (p === 'granted') toast.success('🔔 Notifications enabled!');
                  else toast.error('Permission denied in browser');
                });
              }
            }} />
          </div>
        </Sect>

        {/* Data */}
        <Sect icon={BookOpen} title="Your Data">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Books',    value: books.length },
              { label: 'Notes',    value: notes.length },
              { label: 'Sessions', value: sessions.length },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <SettRow icon={Download} label="Export backup" sub="Save all data as JSON" onClick={handleExport} />
            <SettRow icon={Upload}   label="Import backup" sub="Restore from JSON file" onClick={() => fileRef.current?.click()} />
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button onClick={handleClearData}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
              style={{
                background:  confirmClear ? 'rgba(239,68,68,0.08)' : 'var(--bg-secondary)',
                borderColor: confirmClear ? 'rgba(239,68,68,0.4)' : 'transparent',
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                <Trash2 size={15} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: confirmClear ? '#ef4444' : 'var(--text-primary)' }}>
                  {confirmClear ? '⚠️ Tap again to confirm' : 'Clear all data'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {confirmClear ? 'Permanently deletes everything' : 'Remove all books, notes & sessions'}
                </p>
              </div>
            </button>
          </div>
        </Sect>

        {/* About */}
        <Sect icon={Info} title="About">
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3 p-4" style={{ background: 'var(--bg-secondary)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'var(--accent-primary)' }}>📚</div>
              <div>
                <p className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Readr</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>v1.0.0 · Offline-first PWA</p>
                <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: isOnline ? '#22c55e' : '#f59e0b' }}>
                  {isOnline ? '● Online' : '● Offline — all features available'}
                </p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Powered by free public APIs</p>
              {[
                ['Open Library', 'Book data, covers & trending'],
                ['Google Books', 'Enhanced search'],
                ['Quotable',     'Literary quotes'],
                ['Wikipedia',    'Author biographies'],
                ['Supabase',     'Cloud sync & auth'],
              ].map(([n, d]) => (
                <div key={n} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{n}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>— {d}</span>
                </div>
              ))}
            </div>
          </div>
        </Sect>

      </div>
      <BottomNav />
    </div>
  );
}

function Sect({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: 'var(--accent-primary)' }} />
        <p className="section-title">{title}</p>
      </div>
      {children}
    </section>
  );
}

function SettRow({ icon: Icon, label, sub, onClick }: { icon: React.ElementType; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
      style={{ background: 'var(--bg-secondary)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
        <Icon size={15} />
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0"
      style={{ background: checked ? 'var(--accent-primary)' : 'var(--border)' }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? 26 : 2 }} />
    </button>
  );
}
