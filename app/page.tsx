'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useStore } from '@/store';
import { getAllSessions, getAllNotes } from '@/lib/db';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCelebration } from '@/hooks/useCelebration';
import { formatMinutes, cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ReadingSession, BookNote, UserBook } from '@/types';

const YEAR = new Date().getFullYear();

interface WrappedSlide {
  id: string;
  bg: string;
  content: React.ReactNode;
}

export default function WrappedPage() {
  const books    = useStore(s => s.books);
  const [sessions, setSessions]     = useState<ReadingSession[]>([]);
  const [notes, setNotes]           = useState<BookNote[]>([]);
  const [slide, setSlide]           = useState(0);
  const [animDir, setAnimDir]       = useState<'left' | 'right'>('left');
  const { celebrate }               = useCelebration();
  const hasRun = useRef(false);

  useEffect(() => {
    getAllSessions().then(setSessions);
    getAllNotes().then(setNotes);
  }, []);

  // ── Stats for this year ─────────────────────────────────────────────────────
  const yearBooks   = books.filter(b => b.finishDate?.startsWith(String(YEAR)));
  const yearPages   = sessions.filter(s => s.date.startsWith(String(YEAR))).reduce((a, s) => a + s.pagesRead, 0);
  const yearMinutes = sessions.filter(s => s.date.startsWith(String(YEAR))).reduce((a, s) => a + Math.floor(s.duration / 60), 0);
  const yearNotes   = notes.filter(n => n.createdAt.startsWith(String(YEAR))).length;

  // Month with most books
  const monthCounts = Array(12).fill(0);
  yearBooks.forEach(b => { if (b.finishDate) monthCounts[new Date(b.finishDate).getMonth()]++; });
  const bestMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const bestMonth    = format(new Date(YEAR, bestMonthIdx), 'MMMM');

  // Top genre
  const genreMap: Record<string, number> = {};
  yearBooks.forEach(b => (b.categories || []).forEach(c => { genreMap[c] = (genreMap[c] || 0) + 1; }));
  const topGenre = Object.entries(genreMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

  // Longest book
  const longest = [...yearBooks].sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0))[0];
  // Highest rated
  const topRated = [...yearBooks].filter(b => b.userRating).sort((a, b) => (b.userRating || 0) - (a.userRating || 0))[0];
  // Reading streak data
  const sessionDates = Array.from(new Set(sessions.map(s => s.date))).sort();
  let maxStreak = 0, curStreak = 0, prevDate = '';
  for (const d of sessionDates) {
    if (prevDate) {
      const diff = (new Date(d).getTime() - new Date(prevDate).getTime()) / 86400000;
      curStreak = diff === 1 ? curStreak + 1 : 1;
    } else curStreak = 1;
    maxStreak = Math.max(maxStreak, curStreak);
    prevDate = d;
  }

  // Top 3 books
  const top3 = yearBooks.filter(b => b.userRating).sort((a, b) => (b.userRating || 0) - (a.userRating || 0)).slice(0, 3);

  useEffect(() => {
    if (!hasRun.current && yearBooks.length > 0) {
      hasRun.current = true;
      setTimeout(() => celebrate('milestone'), 500);
    }
  }, [yearBooks.length]);

  const goNext = () => {
    setAnimDir('left');
    setSlide(s => Math.min(s + 1, SLIDES.length - 1));
  };
  const goPrev = () => {
    setAnimDir('right');
    setSlide(s => Math.max(s - 1, 0));
  };

  const handleShare = async () => {
    const text = `My ${YEAR} Reading Wrapped 📚\n\n📖 ${yearBooks.length} books finished\n📄 ${yearPages.toLocaleString()} pages read\n⏱️ ${formatMinutes(yearMinutes)} reading time\n🔥 ${maxStreak}-day best streak\n\n#Readr #ReadingWrapped${YEAR}`;
    try {
      if ('share' in navigator) {
        await (navigator as { share: (d: object) => Promise<void> }).share({ text });
      } else {
        await (navigator as Navigator).clipboard.writeText(text);
      }
    } catch {}
  };

  // ── Slides ──────────────────────────────────────────────────────────────────
  const SLIDES: WrappedSlide[] = [
    {
      id: 'intro',
      bg: 'linear-gradient(135deg, #4a3326 0%, #8f6540 100%)',
      content: (
        <div className="text-center space-y-4">
          <p className="text-6xl animate-float">📚</p>
          <p className="text-white/60 text-sm font-semibold uppercase tracking-widest">Your {YEAR}</p>
          <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>
            Reading<br/>Wrapped
          </h2>
          <p className="text-white/50 text-sm">Swipe to see your year →</p>
        </div>
      ),
    },
    {
      id: 'books',
      bg: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      content: (
        <div className="text-center space-y-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">You read</p>
          <p className="text-8xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>{yearBooks.length}</p>
          <p className="text-white text-2xl font-bold">books</p>
          <p className="text-white/50 text-sm mt-4">
            That's{' '}
            <span className="text-white font-semibold">{yearPages.toLocaleString()} pages</span>
            {' '}in total
          </p>
          {yearBooks.length >= 12 && (
            <div className="inline-block px-4 py-2 rounded-full mt-2"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <p className="text-white text-sm font-semibold">🎯 Goal smashed!</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'time',
      bg: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
      content: (
        <div className="text-center space-y-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">You spent</p>
          <p className="text-6xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
            {formatMinutes(yearMinutes)}
          </p>
          <p className="text-white/80 text-xl">reading</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { label: 'Pages/day avg', value: Math.round(yearPages / 365) || 0 },
              { label: 'Best streak',   value: `${maxStreak}d` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <p className="text-white font-black text-2xl">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'genre',
      bg: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
      content: (
        <div className="text-center space-y-4">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Your favourite genre</p>
          <p className="text-7xl">🎭</p>
          <p className="text-4xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>{topGenre}</p>
          <p className="text-white/60 text-sm">
            You also wrote <span className="text-white font-bold">{yearNotes}</span> notes this year
          </p>
          <p className="text-white/60 text-sm">
            Best reading month: <span className="text-white font-bold">{bestMonth}</span>
          </p>
        </div>
      ),
    },
    {
      id: 'top3',
      bg: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      content: (
        <div className="space-y-3 w-full">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest text-center mb-4">
            Your top books
          </p>
          {top3.length === 0 ? (
            <p className="text-white/60 text-center text-sm">Rate your books to see your top picks!</p>
          ) : top3.map((book, i) => (
            <div key={book.id} className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <span className="text-3xl flex-shrink-0">{['🥇', '🥈', '🥉'][i]}</span>
              {book.cover && (
                <img src={book.cover} alt="" className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate" style={{ fontFamily: 'Georgia, serif' }}>
                  {book.title}
                </p>
                <p className="text-white/60 text-xs truncate">{book.authors?.[0]}</p>
                <p className="text-yellow-300 text-sm">{'★'.repeat(book.userRating || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'highlights',
      bg: 'linear-gradient(135deg, #881337 0%, #f43f5e 100%)',
      content: (
        <div className="text-center space-y-5">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Highlights</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { emoji: '📖', label: 'Longest book', value: longest ? `${longest.pageCount}p` : '—', sub: longest?.title },
              { emoji: '⭐', label: 'Top rated', value: topRated ? `${topRated.userRating}/5` : '—', sub: topRated?.title },
              { emoji: '🔥', label: 'Best streak', value: `${maxStreak} days` },
              { emoji: '✍️', label: 'Notes written', value: yearNotes },
            ].map(({ emoji, label, value, sub }) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <p className="text-2xl mb-1">{emoji}</p>
                <p className="text-white font-black text-lg leading-none">{value}</p>
                {sub && <p className="text-white/50 text-[10px] mt-1 truncate">{sub}</p>}
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'end',
      bg: 'linear-gradient(135deg, #4a3326 0%, #d1a070 100%)',
      content: (
        <div className="text-center space-y-5">
          <p className="text-6xl">🎊</p>
          <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>
            What a year,<br/>reader!
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            You lived {yearBooks.length} more lives through the pages of{' '}
            {yearBooks.length} book{yearBooks.length !== 1 ? 's' : ''}.<br/>
            Here's to an even better {YEAR + 1}! 🥂
          </p>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold mx-auto"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}>
            <Share2 size={15} /> Share my Wrapped
          </button>
        </div>
      ),
    },
  ];

  const currentSlide = SLIDES[slide];

  return (
    <div className="min-h-svh pb-24 flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 safe-top px-4 pt-4 pb-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <h1 className="page-title">{YEAR} Wrapped</h1>
          <button onClick={handleShare} className="btn-ghost flex items-center gap-1.5 text-sm">
            <Share2 size={14} /> Share
          </button>
        </div>
      </header>

      {yearBooks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No books finished in {YEAR} yet
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Finish your first book this year to unlock your Reading Wrapped!
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === slide ? 20 : 6,
                  height:     6,
                  background: i === slide ? 'var(--accent-primary)' : 'var(--border)',
                }} />
            ))}
          </div>

          {/* Slide card */}
          <div key={currentSlide.id}
            className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center animate-scale-in"
            style={{ background: currentSlide.bg, minHeight: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {currentSlide.content}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-4">
            <button onClick={goPrev} disabled={slide === 0}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: slide === 0 ? 'var(--border)' : 'var(--accent-primary)',
                color:      slide === 0 ? 'var(--text-faint)' : 'var(--bg-primary)',
              }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={goNext} disabled={slide === SLIDES.length - 1}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: slide === SLIDES.length - 1 ? 'var(--border)' : 'var(--accent-primary)',
                color:      slide === SLIDES.length - 1 ? 'var(--text-faint)' : 'var(--bg-primary)',
              }}>
              <ChevronRight size={20} />
            </button>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            {slide + 1} / {SLIDES.length}
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
