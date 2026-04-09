'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trophy, Flame, Target, BookOpen, Zap, Star, Lock, CheckCircle2, Plus, X, Calendar } from 'lucide-react';
import { useStore } from '@/store';
import { getAllSessions, getAllNotes, saveGoal, getAllGoals } from '@/lib/db';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn, generateId, formatDate } from '@/lib/utils';
import { format, startOfYear, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import type { ReadingGoal, ReadingSession } from '@/types';

// ─── Challenge Definitions ────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'books_read' | 'pages_read' | 'streak' | 'genres' | 'notes' | 'rating' | 'authors';
  target: number;
  xp: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  timeframe?: 'week' | 'month' | 'year' | 'alltime';
}

const ALL_CHALLENGES: Challenge[] = [
  // Easy
  { id: 'first_book', title: 'First Chapter', description: 'Add your first book to the library', icon: '📖', type: 'books_read', target: 1, xp: 50, difficulty: 'easy' },
  { id: 'note_taker', title: 'Note Taker', description: 'Write 5 notes or highlights', icon: '📝', type: 'notes', target: 5, xp: 75, difficulty: 'easy' },
  { id: 'week_warrior', title: 'Week Warrior', description: 'Read 7 days in a row', icon: '⚡', type: 'streak', target: 7, xp: 100, difficulty: 'easy' },
  { id: 'page_turner', title: 'Page Turner', description: 'Read 100 pages total', icon: '📄', type: 'pages_read', target: 100, xp: 100, difficulty: 'easy', timeframe: 'alltime' },
  // Medium
  { id: 'bookworm', title: 'Bookworm', description: 'Finish 5 books', icon: '🐛', type: 'books_read', target: 5, xp: 200, difficulty: 'medium', timeframe: 'alltime' },
  { id: 'genre_explorer', title: 'Genre Explorer', description: 'Read books in 3 different genres', icon: '🗺️', type: 'genres', target: 3, xp: 250, difficulty: 'medium' },
  { id: 'month_reader', title: 'Monthly Reader', description: 'Read every day this month', icon: '🗓️', type: 'streak', target: 30, xp: 300, difficulty: 'medium' },
  { id: 'critic', title: 'The Critic', description: 'Rate 10 books', icon: '⭐', type: 'rating', target: 10, xp: 150, difficulty: 'medium' },
  { id: 'marathon', title: 'Marathon Reader', description: 'Read 1000 pages in a month', icon: '🏃', type: 'pages_read', target: 1000, xp: 350, difficulty: 'medium', timeframe: 'month' },
  // Hard
  { id: 'dozen', title: 'The Dozen', description: 'Finish 12 books this year', icon: '🎯', type: 'books_read', target: 12, xp: 500, difficulty: 'hard', timeframe: 'year' },
  { id: 'author_fan', title: 'Author Fan', description: 'Read books by 10 different authors', icon: '✍️', type: 'authors', target: 10, xp: 400, difficulty: 'hard' },
  { id: 'deep_reader', title: 'Deep Reader', description: 'Write 50 notes total', icon: '🧠', type: 'notes', target: 50, xp: 450, difficulty: 'hard' },
  // Legendary
  { id: 'bibliophile', title: 'Bibliophile', description: 'Finish 52 books in a year', icon: '🏆', type: 'books_read', target: 52, xp: 2000, difficulty: 'legendary', timeframe: 'year' },
  { id: 'centurion', title: 'Centurion', description: '100-day reading streak', icon: '💯', type: 'streak', target: 100, xp: 1500, difficulty: 'legendary' },
  { id: 'library', title: 'Living Library', description: 'Read 10,000 pages total', icon: '🏛️', type: 'pages_read', target: 10000, xp: 1000, difficulty: 'legendary', timeframe: 'alltime' },
];

const DIFFICULTY_STYLES = {
  easy:      { bg: 'rgba(34,197,94,0.1)',   text: '#15803d', label: 'Easy' },
  medium:    { bg: 'rgba(234,179,8,0.1)',   text: '#a16207', label: 'Medium' },
  hard:      { bg: 'rgba(239,68,68,0.1)',   text: '#dc2626', label: 'Hard' },
  legendary: { bg: 'rgba(168,85,247,0.1)',  text: '#7e22ce', label: 'Legendary' },
};

const XP_LEVELS = [
  { level: 1, xp: 0,    title: 'Curious Reader' },
  { level: 2, xp: 200,  title: 'Book Lover' },
  { level: 3, xp: 500,  title: 'Avid Reader' },
  { level: 4, xp: 1000, title: 'Bookworm' },
  { level: 5, xp: 2000, title: 'Scholar' },
  { level: 6, xp: 3500, title: 'Bibliophile' },
  { level: 7, xp: 5000, title: 'Literary Expert' },
  { level: 8, xp: 7500, title: 'Master Reader' },
  { level: 9, xp: 10000, title: 'Grand Librarian' },
  { level: 10, xp: 15000, title: 'Legendary Bookwyrm' },
];

export default function ChallengesPage() {
  const books = useStore(s => s.books);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [notes, setNotes] = useState<number>(0);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard' | 'legendary'>('all');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tab, setTab] = useState<'challenges' | 'goals' | 'history'>('challenges');

  useEffect(() => {
    getAllSessions().then(setSessions);
    getAllNotes().then(n => setNotes(n.length));
    getAllGoals().then(setGoals);
  }, []);

  // ─── Progress computation ─────────────────────────────────────────────────

  const stats = useMemo(() => {
    const booksRead = books.filter(b => b.status === 'read').length;
    const totalPages = sessions.reduce((s, sess) => s + sess.pagesRead, 0);
    const genres = new Set(books.flatMap(b => b.categories || [])).size;
    const authors = new Set(books.flatMap(b => b.authors || [])).size;
    const ratings = books.filter(b => b.userRating).length;

    // Streak
    const today = new Date().toISOString().split('T')[0];
    const sessionDates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();
    let streak = 0;
    let check = today;
    for (const d of sessionDates) {
      if (d === check) {
        streak++;
        const dt = new Date(check); dt.setDate(dt.getDate() - 1);
        check = dt.toISOString().split('T')[0];
      } else break;
    }

    const thisYear = new Date().getFullYear();
    const booksThisYear = books.filter(b => b.finishDate?.startsWith(String(thisYear))).length;
    const thisMonth = format(new Date(), 'yyyy-MM');
    const pagesThisMonth = sessions
      .filter(s => s.date.startsWith(thisMonth))
      .reduce((s, sess) => s + sess.pagesRead, 0);

    return { booksRead, totalPages, genres, authors, ratings, streak, booksThisYear, pagesThisMonth };
  }, [books, sessions]);

  const getProgress = (c: Challenge): number => {
    switch (c.type) {
      case 'books_read':
        return c.timeframe === 'year' ? stats.booksThisYear : stats.booksRead;
      case 'pages_read':
        return c.timeframe === 'month' ? stats.pagesThisMonth : stats.totalPages;
      case 'streak': return stats.streak;
      case 'genres': return stats.genres;
      case 'notes': return notes;
      case 'rating': return stats.ratings;
      case 'authors': return stats.authors;
      default: return 0;
    }
  };

  const isCompleted = (c: Challenge) => getProgress(c) >= c.target;

  // ─── XP + Level ──────────────────────────────────────────────────────────

  const totalXP = useMemo(() =>
    ALL_CHALLENGES.filter(isCompleted).reduce((sum, c) => sum + c.xp, 0),
    [stats, notes]
  );

  const currentLevel = XP_LEVELS.slice().reverse().find(l => totalXP >= l.xp) || XP_LEVELS[0];
  const nextLevel = XP_LEVELS[XP_LEVELS.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel
    ? ((totalXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    : 100;

  const completed = ALL_CHALLENGES.filter(isCompleted);
  const active = ALL_CHALLENGES.filter(c => !isCompleted(c));
  const filtered = (filter === 'all' ? active : active.filter(c => c.difficulty === filter));

  // ─── Year goal progress ───────────────────────────────────────────────────

  const dayOfYear = differenceInDays(new Date(), startOfYear(new Date())) + 1;
  const daysInYear = 365;
  const onTrackTarget = Math.ceil((goals.find(g => g.type === 'yearly_books')?.target || 24) * dayOfYear / daysInYear);

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 pt-4 pb-3 safe-top"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Challenges</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {completed.length} / {ALL_CHALLENGES.length} completed
            </p>
          </div>
          {/* XP Badge */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'var(--accent-light)' }}>
              <span className="text-base">⚔️</span>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {totalXP.toLocaleString()} XP
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Lv.{currentLevel.level}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-4 pt-3 gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['challenges', 'goals', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-xs font-semibold capitalize border-b-2 transition-colors')}
            style={{
              color: tab === t ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderColor: tab === t ? 'var(--accent-primary)' : 'transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-5">

        {tab === 'challenges' && (
          <>
            {/* Level card */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current rank</p>
                  <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {currentLevel.title}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'var(--accent-light)' }}>
                  {currentLevel.level >= 8 ? '🐉' : currentLevel.level >= 6 ? '🏆' : currentLevel.level >= 4 ? '⭐' : currentLevel.level >= 2 ? '📚' : '📖'}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Level {currentLevel.level}</span>
                  {nextLevel && <span>{nextLevel.xp - totalXP} XP to Level {nextLevel.level}</span>}
                </div>
                <div className="progress-bar h-2.5">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${levelProgress}%`, background: 'linear-gradient(to right, var(--accent-primary), #d97706)' }} />
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  <span>{currentLevel.xp.toLocaleString()} XP</span>
                  {nextLevel && <span>{nextLevel.xp.toLocaleString()} XP</span>}
                </div>
              </div>
            </div>

            {/* Completed ribbon */}
            {completed.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                {completed.map(c => (
                  <div key={c.id} className="flex-shrink-0 flex flex-col items-center gap-1 w-16">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl relative"
                      style={{ background: DIFFICULTY_STYLES[c.difficulty].bg }}>
                      <span>{c.icon}</span>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 size={11} className="text-white" />
                      </div>
                    </div>
                    <p className="text-[9px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>
                      {c.title}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {(['all', 'easy', 'medium', 'hard', 'legendary'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all"
                  style={{
                    background: filter === f ? 'var(--accent-primary)' : 'transparent',
                    color: filter === f ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    borderColor: filter === f ? 'transparent' : 'var(--border)',
                  }}>
                  {f === 'all' ? `All (${active.length})` : f}
                </button>
              ))}
            </div>

            {/* Challenge cards */}
            <div className="space-y-3 stagger">
              {filtered.map(c => {
                const progress = getProgress(c);
                const pct = Math.min(100, (progress / c.target) * 100);
                const style = DIFFICULTY_STYLES[c.difficulty];
                return (
                  <div key={c.id} className="card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: style.bg }}>
                        {c.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                            {c.title}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: style.bg, color: style.text }}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>+{c.xp} XP</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{progress.toLocaleString()} / {c.target.toLocaleString()}</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: style.text }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🏆</p>
                <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  All {filter} challenges complete!
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'goals' && (
          <GoalsTab goals={goals} setGoals={setGoals} books={books} sessions={sessions} onTrackTarget={onTrackTarget} />
        )}

        {tab === 'history' && (
          <HistoryTab sessions={sessions} books={books} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ─── Goals Tab ────────────────────────────────────────────────────────────────

function GoalsTab({ goals, setGoals, books, sessions, onTrackTarget }: {
  goals: ReadingGoal[];
  setGoals: React.Dispatch<React.SetStateAction<ReadingGoal[]>>;
  books: import('@/types').UserBook[];
  sessions: ReadingSession[];
  onTrackTarget: number;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const thisYear = new Date().getFullYear();
  const thisMonth = format(new Date(), 'yyyy-MM');

  const booksThisYear = books.filter(b => b.finishDate?.startsWith(String(thisYear))).length;
  const booksThisMonth = books.filter(b => b.finishDate?.startsWith(thisMonth)).length;
  const pagesToday = sessions
    .filter(s => s.date === new Date().toISOString().split('T')[0])
    .reduce((s, sess) => s + sess.pagesRead, 0);
  const minutesToday = sessions
    .filter(s => s.date === new Date().toISOString().split('T')[0])
    .reduce((s, sess) => s + Math.floor(sess.duration / 60), 0);

  const GOAL_DEFS = [
    { type: 'yearly_books' as const, label: 'Books this year', icon: '📚', current: booksThisYear, unit: 'books' },
    { type: 'monthly_books' as const, label: 'Books this month', icon: '📅', current: booksThisMonth, unit: 'books' },
    { type: 'daily_pages' as const, label: 'Pages today', icon: '📄', current: pagesToday, unit: 'pages' },
    { type: 'daily_minutes' as const, label: 'Minutes today', icon: '⏱️', current: minutesToday, unit: 'min' },
  ];

  const saveG = async (type: ReadingGoal['type'], target: number) => {
    const existing = goals.find(g => g.type === type);
    const goal: ReadingGoal = {
      id: existing?.id || generateId(),
      type, target, current: 0,
      year: type === 'yearly_books' ? thisYear : undefined,
    };
    await saveGoal(goal);
    setGoals(gs => [...gs.filter(g => g.type !== type), goal]);
    setEditing(null);
    toast.success('Goal saved!');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Set personal reading goals and track your progress throughout the year.
      </p>

      {/* On-track banner */}
      {goals.find(g => g.type === 'yearly_books') && (
        <div className="card p-3 flex items-center gap-3"
          style={{ background: booksThisYear >= onTrackTarget ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)' }}>
          <span className="text-xl">{booksThisYear >= onTrackTarget ? '🎯' : '⚠️'}</span>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {booksThisYear >= onTrackTarget ? 'On track!' : 'Slightly behind pace'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              You should have read ~{onTrackTarget} books by now to hit your yearly goal.
            </p>
          </div>
        </div>
      )}

      {GOAL_DEFS.map(({ type, label, icon, current, unit }) => {
        const goal = goals.find(g => g.type === type);
        const pct = goal ? Math.min(100, (current / goal.target) * 100) : 0;
        const isEditing = editing === type;
        return (
          <div key={type} className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {label}
                </p>
                {goal && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {current} / {goal.target} {unit}
                  </p>
                )}
              </div>
              <button onClick={() => { setEditing(isEditing ? null : type); setEditValue(goal?.target || 10); }}
                className={cn('text-xs px-3 py-1.5 rounded-full font-medium transition-all',
                  isEditing ? 'btn-secondary' : 'btn-ghost border')}
                style={{ borderColor: 'var(--border)' }}>
                {isEditing ? 'Cancel' : goal ? 'Edit' : 'Set goal'}
              </button>
            </div>

            {isEditing && (
              <div className="space-y-2 animate-fade-up">
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditValue(v => Math.max(1, v - 1))}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>−</button>
                  <input type="number" min="1" className="input-base text-center font-bold flex-1"
                    value={editValue} onChange={e => setEditValue(parseInt(e.target.value) || 1)} />
                  <button onClick={() => setEditValue(v => v + 1)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>+</button>
                </div>
                <button onClick={() => saveG(type, editValue)} className="btn-primary w-full text-sm py-2">
                  Save — {editValue} {unit}
                </button>
              </div>
            )}

            {goal && !isEditing && (
              <div className="space-y-1">
                <div className="progress-bar h-2">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : 'var(--accent-primary)' }} />
                </div>
                <p className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
                  {pct >= 100 ? '✅ Goal reached!' : `${Math.round(pct)}%`}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ sessions, books }: { sessions: ReadingSession[]; books: import('@/types').UserBook[] }) {
  const sorted = [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Group by date
  const grouped = sorted.reduce((acc: Record<string, ReadingSession[]>, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  if (sorted.length === 0) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">📅</p>
      <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>No sessions yet</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Start reading with the timer to track sessions</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).slice(0, 30).map(([date, daySessions]) => {
        const totalPages = daySessions.reduce((s, sess) => s + sess.pagesRead, 0);
        const totalMins = daySessions.reduce((s, sess) => s + Math.floor(sess.duration / 60), 0);
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(date), 'EEEE, MMMM d')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {totalPages > 0 ? `${totalPages}p · ` : ''}{totalMins}min
              </p>
            </div>
            <div className="space-y-2">
              {daySessions.map(s => (
                <div key={s.id} className="card p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                    <BookOpen size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.bookTitle}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {s.pagesRead > 0 ? `${s.pagesRead} pages · ` : ''}
                      {Math.floor(s.duration / 60)} min
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {format(new Date(s.startTime), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
