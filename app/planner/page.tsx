'use client';

import { useState, useMemo } from 'react';
import { CalendarDays, BookOpen, ChevronRight, Clock, Zap } from 'lucide-react';
import { useStore } from '@/store';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookDetailModal } from '@/components/books/BookDetailModal';
import { readingProgress, estimateReadingTime, cn } from '@/lib/utils';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import type { UserBook } from '@/types';

// Pages per minute at different speeds
const READING_SPEEDS = {
  slow:   { label: 'Slow',   ppm: 0.4, desc: '~0.4 pages/min' },
  medium: { label: 'Normal', ppm: 0.6, desc: '~0.6 pages/min' },
  fast:   { label: 'Fast',   ppm: 0.9, desc: '~0.9 pages/min' },
} as const;

export default function PlannerPage() {
  const books           = useStore(s => s.books);
  const sessions        = useStore(s => s.sessions);
  const settings        = useStore(s => s.settings);
  const [speed, setSpeed]         = useState<keyof typeof READING_SPEEDS>('medium');
  const [dailyMin, setDailyMin]   = useState(settings.readingGoalPages * 2); // rough: pages -> minutes
  const [selected, setSelected]   = useState<UserBook | null>(null);

  const ppm          = READING_SPEEDS[speed].ppm;
  const dailyPages   = Math.round(dailyMin * ppm);

  const reading      = books.filter(b => b.status === 'reading');
  const wantToRead   = books.filter(b => b.status === 'want_to_read');

  // Compute finish dates for current books
  const schedule = useMemo(() => {
    let cursor = new Date();
    return reading.map(book => {
      const remaining = (book.pageCount || 0) - book.currentPage;
      const daysNeeded = remaining > 0 ? Math.ceil(remaining / dailyPages) : 0;
      const finishDate = addDays(cursor, daysNeeded);
      cursor = addDays(finishDate, 1);
      return { book, remaining, daysNeeded, finishDate };
    });
  }, [reading, dailyPages]);

  // Build a reading queue with estimated dates
  const queue = useMemo(() => {
    let cursor = schedule.length > 0
      ? addDays(schedule[schedule.length - 1].finishDate, 1)
      : new Date();
    return wantToRead.slice(0, 8).map(book => {
      const pages = book.pageCount || 250;
      const daysNeeded = Math.ceil(pages / dailyPages);
      const startDate = new Date(cursor);
      cursor = addDays(startDate, daysNeeded + 1);
      return { book, pages, daysNeeded, startDate, endDate: addDays(startDate, daysNeeded) };
    });
  }, [wantToRead, schedule, dailyPages]);

  // Weekly calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach(s => { map[s.date] = (map[s.date] || 0) + s.pagesRead; });
    return map;
  }, [sessions]);

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 safe-top px-4 pt-4 pb-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <CalendarDays size={20} style={{ color: 'var(--accent-primary)' }} />
          <h1 className="page-title">Reading Planner</h1>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Plan your reading schedule and track progress
        </p>
      </header>

      <div className="px-4 py-4 space-y-6">

        {/* Speed & daily target controls */}
        <div className="card p-4 space-y-4">
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Your reading settings
          </p>

          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Reading speed</p>
            <div className="flex gap-2">
              {Object.entries(READING_SPEEDS).map(([k, v]) => (
                <button key={k} onClick={() => setSpeed(k as typeof speed)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                  style={{
                    background:  speed === k ? 'var(--accent-primary)' : 'transparent',
                    color:       speed === k ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    borderColor: speed === k ? 'transparent' : 'var(--border)',
                  }}>
                  {v.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-faint)' }}>
              {READING_SPEEDS[speed].desc}
            </p>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Daily reading time</p>
              <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                {dailyMin} min · ~{dailyPages} pages
              </span>
            </div>
            <input type="range" min={10} max={180} step={5} className="w-full"
              style={{ accentColor: 'var(--accent-primary)' }}
              value={dailyMin} onChange={e => setDailyMin(parseInt(e.target.value))} />
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-faint)' }}>
              <span>10 min</span><span>3 hours</span>
            </div>
          </div>
        </div>

        {/* This week */}
        <section>
          <p className="section-title mb-3">📅 This Week</p>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => {
              const dateStr   = format(day, 'yyyy-MM-dd');
              const pages     = sessionsByDate[dateStr] || 0;
              const isToday   = dateStr === format(new Date(), 'yyyy-MM-dd');
              const isPast    = day < new Date() && !isToday;
              const filled    = pages >= dailyPages;
              return (
                <div key={dateStr} className="flex flex-col items-center gap-1">
                  <p className="text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>
                    {format(day, 'EEE')}
                  </p>
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all')}
                    style={{
                      background: filled ? 'var(--accent-primary)' : isToday ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      color:      filled ? 'var(--bg-primary)' : isToday ? 'var(--accent-primary)' : isPast ? 'var(--text-faint)' : 'var(--text-primary)',
                      border:     isToday ? '2px solid var(--accent-primary)' : 'none',
                    }}>
                    {format(day, 'd')}
                  </div>
                  {pages > 0 && (
                    <p className="text-[9px]" style={{ color: 'var(--accent-primary)' }}>{pages}p</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Current books timeline */}
        {schedule.length > 0 && (
          <section>
            <p className="section-title mb-3">📖 Finish Dates</p>
            <div className="space-y-2">
              {schedule.map(({ book, remaining, daysNeeded, finishDate }) => (
                <button key={book.id} onClick={() => setSelected(book)}
                  className="card p-3 w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow">
                  {book.cover && (
                    <img src={book.cover} alt="" className="w-10 rounded object-cover flex-shrink-0"
                      style={{ height: 60, boxShadow: 'var(--shadow-book)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      {book.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {remaining} pages left · {daysNeeded} day{daysNeeded !== 1 ? 's' : ''}
                    </p>
                    <div className="mt-1.5 progress-bar h-1.5">
                      <div className="progress-fill"
                        style={{ width: `${readingProgress(book.currentPage, book.pageCount)}%` }} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {format(finishDate, 'MMM d')}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {format(finishDate, 'EEE')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Want-to-read queue */}
        {queue.length > 0 && (
          <section>
            <p className="section-title mb-3">📚 Reading Queue</p>
            <div className="space-y-2">
              {queue.map(({ book, pages, daysNeeded, startDate, endDate }, idx) => (
                <button key={book.id} onClick={() => setSelected(book)}
                  className="card p-3 w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                    {idx + 1}
                  </div>
                  {book.cover && (
                    <img src={book.cover} alt="" className="w-8 rounded object-cover flex-shrink-0"
                      style={{ height: 48, boxShadow: 'var(--shadow-book)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                      {book.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ~{pages}p · {daysNeeded} days
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {format(startDate, 'MMM d')}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      → {format(endDate, 'MMM d')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {reading.length === 0 && wantToRead.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">📅</p>
            <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              No books to plan
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Add books to your library to see your reading schedule
            </p>
          </div>
        )}
      </div>

      <BottomNav />
      {selected && <BookDetailModal book={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
