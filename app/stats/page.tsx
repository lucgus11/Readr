'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Flame, Target, BookOpen, Clock, Star, TrendingUp, Award, Calendar } from 'lucide-react';
import { useStore } from '@/store';
import { computeStats, getAllSessions, getAllGoals, saveGoal } from '@/lib/db';
import { BottomNav } from '@/components/layout/BottomNav';
import { formatMinutes, getWeekDays, formatDate } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { ReadingStats, ReadingGoal } from '@/types';

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHART_COLORS = ['#8f6540', '#d1a070', '#f2d5b0', '#bc9669', '#a07050'];

export default function StatsPage() {
  const { books, sessions, goals, upsertGoal, setGoals } = useStore();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [tab, setTab] = useState<'overview' | 'charts' | 'goals'>('overview');
  const [editGoal, setEditGoal] = useState<{ type: ReadingGoal['type']; target: number } | null>(null);

  useEffect(() => {
    computeStats().then(setStats);
    getAllGoals().then(setGoals);
  }, [books, sessions, setGoals]);

  const weekData = stats ? WEEK_LABELS.map((day, i) => ({
    day,
    pages: stats.pagesThisWeek[i] || 0,
  })) : [];

  const statusData = [
    { name: 'Read', value: books.filter(b => b.status === 'read').length, color: '#22c55e' },
    { name: 'Reading', value: books.filter(b => b.status === 'reading').length, color: '#f59e0b' },
    { name: 'Want', value: books.filter(b => b.status === 'want_to_read').length, color: '#60a5fa' },
    { name: 'DNF', value: books.filter(b => b.status === 'dnf').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const monthlyData = (() => {
    const months: Record<string, number> = {};
    books.filter(b => b.finishDate).forEach(b => {
      const m = b.finishDate!.slice(0, 7);
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).sort().slice(-12).map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      books: count,
    }));
  })();

  const saveGoalHandler = async (type: ReadingGoal['type'], target: number) => {
    const existing = goals.find(g => g.type === type);
    const goal: ReadingGoal = {
      id: existing?.id || generateId(),
      type,
      target,
      current: existing?.current || 0,
      year: new Date().getFullYear(),
    };
    await saveGoal(goal);
    upsertGoal(goal);
    setEditGoal(null);
    toast.success('Goal updated!');
  };

  const yearlyGoal = goals.find(g => g.type === 'yearly_books');
  const dailyPagesGoal = goals.find(g => g.type === 'daily_pages');
  const yearlyProgress = yearlyGoal ? Math.min(100, Math.round(((stats?.booksThisYear || 0) / yearlyGoal.target) * 100)) : 0;
  const dailyPagesTotal = stats?.pagesThisWeek[6] || 0;
  const dailyPagesProgress = dailyPagesGoal ? Math.min(100, Math.round((dailyPagesTotal / dailyPagesGoal.target) * 100)) : 0;

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="px-4 pt-4 pb-3">
          <h1 className="page-title mb-3">Reading Stats</h1>
          <div className="flex gap-1">
            {[['overview', '📊 Overview'], ['charts', '📈 Charts'], ['goals', '🎯 Goals']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as typeof tab)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{ background: tab === id ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: tab === id ? 'var(--bg-primary)' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">

        {/* ── OVERVIEW ─── */}
        {tab === 'overview' && stats && (
          <>
            {/* Streak hero */}
            <div className="card-elevated p-5 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at center, var(--accent-primary), transparent)' }} />
              <div className="relative">
                <div className="text-5xl mb-1">🔥</div>
                <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                  {stats.currentStreak}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Day reading streak</p>
                {stats.currentStreak >= 7 && (
                  <p className="text-xs mt-1 font-semibold" style={{ color: '#f59e0b' }}>🏆 Amazing! Keep it up!</p>
                )}
              </div>
            </div>

            {/* Key stats grid */}
            <div className="grid grid-cols-2 gap-3 stagger">
              {[
                { icon: BookOpen, label: 'Books Read', value: stats.booksRead, sub: `of ${stats.totalBooks} total` },
                { icon: Clock, label: 'Time Reading', value: formatMinutes(stats.totalMinutes), sub: 'total' },
                { icon: TrendingUp, label: 'Pages Read', value: stats.totalPages.toLocaleString(), sub: 'all time' },
                { icon: Star, label: 'Avg Rating', value: stats.avgRating ? `${stats.avgRating.toFixed(1)}★` : '—', sub: 'your reviews' },
                { icon: Calendar, label: 'This Year', value: stats.booksThisYear, sub: 'books finished' },
                { icon: Award, label: 'This Month', value: stats.booksThisMonth, sub: 'books finished' },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color: 'var(--accent-primary)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Favorite genre */}
            {stats.favoriteGenre && (
              <div className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'var(--accent-light)' }}>
                  📚
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Favorite genre</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {stats.favoriteGenre}
                  </p>
                </div>
              </div>
            )}

            {/* This week mini chart */}
            <div className="card p-4">
              <p className="section-title mb-4">Pages This Week</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={weekData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="pages" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Goals preview */}
            {yearlyGoal && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-title flex items-center gap-1.5"><Target size={11} /> Yearly goal</p>
                  <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>{stats.booksThisYear} / {yearlyGoal.target}</span>
                </div>
                <div className="progress-bar h-2">
                  <div className="progress-fill" style={{ width: `${yearlyProgress}%` }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  {yearlyGoal.target - stats.booksThisYear > 0
                    ? `${yearlyGoal.target - stats.booksThisYear} more to go`
                    : '🎉 Goal reached!'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── CHARTS ─── */}
        {tab === 'charts' && (
          <div className="space-y-5 stagger">
            {/* Library breakdown */}
            {statusData.length > 0 && (
              <div className="card p-4">
                <p className="section-title mb-4">Library Breakdown</p>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {statusData.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly books */}
            {monthlyData.length > 0 && (
              <div className="card p-4">
                <p className="section-title mb-4">Books per Month</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="books" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pages this week detailed */}
            {stats && (
              <div className="card p-4">
                <p className="section-title mb-4">Pages this Week</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weekData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                    <Bar dataKey="pages" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} maxBarSize={32}
                      label={{ position: 'top', fontSize: 9, fill: 'var(--text-faint)' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Ratings distribution */}
            {books.filter(b => b.userRating).length > 0 && (
              <div className="card p-4">
                <p className="section-title mb-3">Rating Distribution</p>
                {[5, 4, 3, 2, 1].map(r => {
                  const count = books.filter(b => b.userRating === r).length;
                  const total = books.filter(b => b.userRating).length;
                  const pct = total ? (count / total) * 100 : 0;
                  return (
                    <div key={r} className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs w-4 text-right" style={{ color: 'var(--text-muted)' }}>{r}</span>
                      <span className="text-xs" style={{ color: '#f59e0b' }}>★</span>
                      <div className="flex-1 progress-bar h-2">
                        <div className="progress-fill transition-all duration-700" style={{ width: `${pct}%`, background: '#f59e0b' }} />
                      </div>
                      <span className="text-xs w-4" style={{ color: 'var(--text-faint)' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GOALS ─── */}
        {tab === 'goals' && (
          <div className="space-y-4 stagger">
            {([
              { type: 'yearly_books' as const, label: 'Books this year', icon: '📚', defaultTarget: 24, current: stats?.booksThisYear || 0 },
              { type: 'daily_pages' as const, label: 'Pages per day', icon: '📄', defaultTarget: 30, current: dailyPagesTotal },
              { type: 'monthly_books' as const, label: 'Books this month', icon: '🗓️', defaultTarget: 2, current: stats?.booksThisMonth || 0 },
              { type: 'daily_minutes' as const, label: 'Minutes per day', icon: '⏱️', defaultTarget: 30, current: Math.floor((sessions.filter(s => s.date === new Date().toISOString().split('T')[0]).reduce((a, s) => a + s.duration, 0)) / 60) },
            ] as { type: ReadingGoal['type']; label: string; icon: string; defaultTarget: number; current: number }[]).map(({ type, label, icon, defaultTarget, current }) => {
              const goal = goals.find(g => g.type === type);
              const target = goal?.target || defaultTarget;
              const pct = Math.min(100, Math.round((current / target) * 100));
              const isEditing = editGoal?.type === type;
              return (
                <div key={type} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{current} / {target}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditGoal(isEditing ? null : { type, target })}
                      className="btn-ghost text-xs px-2.5 py-1.5"
                    >
                      {isEditing ? 'Cancel' : '✏️ Edit'}
                    </button>
                  </div>

                  <div className="progress-bar h-2 mb-2">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : 'var(--accent-primary)' }} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {pct >= 100 ? '🎉 Goal reached!' : `${pct}% · ${target - current} remaining`}
                  </p>

                  {isEditing && (
                    <div className="mt-3 flex gap-2 animate-fade-in">
                      <input
                        type="number" min="1"
                        className="input-base flex-1"
                        value={editGoal.target}
                        onChange={e => setEditGoal({ type, target: parseInt(e.target.value) || 1 })}
                      />
                      <button onClick={() => saveGoalHandler(type, editGoal.target)} className="btn-primary px-4">Save</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Achievements */}
            <div className="card p-4">
              <p className="section-title mb-3">🏆 Achievements</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: '🥇', label: 'First Book', unlocked: (stats?.booksRead || 0) >= 1 },
                  { emoji: '📚', label: '10 Books', unlocked: (stats?.booksRead || 0) >= 10 },
                  { emoji: '🔥', label: '7-Day Streak', unlocked: (stats?.currentStreak || 0) >= 7 },
                  { emoji: '📖', label: '1000 Pages', unlocked: (stats?.totalPages || 0) >= 1000 },
                  { emoji: '⏰', label: '24h Reading', unlocked: (stats?.totalMinutes || 0) >= 1440 },
                  { emoji: '🌟', label: '5-Star Review', unlocked: books.some(b => b.userRating === 5) },
                  { emoji: '✍️', label: 'Note Taker', unlocked: false },
                  { emoji: '🎯', label: 'Goal Setter', unlocked: goals.length > 0 },
                  { emoji: '💎', label: '50 Books', unlocked: (stats?.booksRead || 0) >= 50 },
                ].map(({ emoji, label, unlocked }) => (
                  <div key={label} className={`rounded-xl p-3 text-center transition-all ${unlocked ? '' : 'opacity-30'}`}
                    style={{ background: unlocked ? 'var(--accent-light)' : 'var(--bg-secondary)' }}>
                    <p className="text-2xl">{emoji}</p>
                    <p className="text-[10px] mt-1 font-medium" style={{ color: unlocked ? 'var(--accent-primary)' : 'var(--text-faint)' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
