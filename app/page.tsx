'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, BookOpen, Clock, CheckCircle2, Heart } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store';
import { getAllBooks } from '@/lib/db';
import { getDailyQuote } from '@/lib/api';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatsBar } from '@/components/ui/StatsBar';
import { BookCard } from '@/components/books/BookCard';
import { AddBookModal } from '@/components/books/AddBookModal';
import { BookDetailModal } from '@/components/books/BookDetailModal';
import { PWAInstallBanner } from '@/components/ui/PWAInstallBanner';
import { readingProgress } from '@/lib/utils';
import type { UserBook, Quote } from '@/types';

const FILTERS = [
  { id: 'all',          label: 'All' },
  { id: 'reading',      label: 'Reading' },
  { id: 'want_to_read', label: 'Wishlist' },
  { id: 'read',         label: 'Read' },
  { id: 'favorites',    label: 'Favorites' },
];

export default function LibraryPage() {
  const { books, setBooks } = useStore();
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [sortBy, setSortBy] = useState<'addedAt' | 'title' | 'progress'>('addedAt');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    getAllBooks().then(setBooks);
    getDailyQuote().then(setQuote);
  }, [setBooks]);

  const filtered = useMemo(() => {
    let list = [...books];
    if (filter === 'favorites')  list = list.filter(b => b.favorite);
    else if (filter !== 'all')   list = list.filter(b => b.status === filter);
    list.sort((a, b) => {
      if (sortBy === 'title')    return a.title.localeCompare(b.title);
      if (sortBy === 'progress') {
        const pa = a.pageCount ? a.currentPage / a.pageCount : 0;
        const pb = b.pageCount ? b.currentPage / b.pageCount : 0;
        return pb - pa;
      }
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
    return list;
  }, [books, filter, sortBy]);

  const counts = useMemo(() => ({
    all:          books.length,
    reading:      books.filter(b => b.status === 'reading').length,
    want_to_read: books.filter(b => b.status === 'want_to_read').length,
    read:         books.filter(b => b.status === 'read').length,
    favorites:    books.filter(b => b.favorite).length,
  }), [books]);

  const currentlyReading = books.filter(b => b.status === 'reading');

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 safe-top" style={{ background: 'var(--bg-primary)' }}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="page-title">My Library</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {books.length} book{books.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/search" className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </Link>
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5 px-3 py-2">
              <Plus size={15} /><span className="text-xs">Add</span>
            </button>
          </div>
        </div>
        <StatsBar />
        <div className="px-4 pt-2 pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={{
                  background:  filter === f.id ? 'var(--accent-primary)' : 'transparent',
                  color:       filter === f.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  borderColor: filter === f.id ? 'transparent' : 'var(--border)',
                }}>
                {f.label} {counts[f.id as keyof typeof counts] > 0 && (
                  <span className="ml-1 opacity-70">({counts[f.id as keyof typeof counts]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {quote && filter === 'all' && (
          <div className="rounded-2xl p-4 animate-fade-up"
            style={{ background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>
              ✨ Quote of the day
            </p>
            <blockquote className="text-sm italic leading-relaxed"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              "{quote.content}"
            </blockquote>
            <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-muted)' }}>— {quote.author}</p>
          </div>
        )}

        {currentlyReading.length > 0 && filter === 'all' && (
          <section>
            <p className="section-title mb-3">📖 Currently Reading</p>
            <div className="space-y-2">
              {currentlyReading.map(book => (
                <CurrentlyReadingCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} book{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <select className="text-xs rounded-lg px-2 py-1 border outline-none"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
              <option value="addedAt">Recently added</option>
              <option value="title">A–Z</option>
              <option value="progress">Progress</option>
            </select>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['grid', 'list'] as const).map(l => (
                <button key={l} onClick={() => setLayout(l)}
                  className="w-8 h-7 flex items-center justify-center text-sm transition-colors"
                  style={{
                    background: layout === l ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color:      layout === l ? 'var(--bg-primary)' : 'var(--text-muted)',
                  }}>
                  {l === 'grid' ? '⊞' : '≡'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState filter={filter} onAdd={() => setShowAdd(true)} />
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-3 gap-4 stagger">
            {filtered.map(book => (
              <BookCard key={book.id} book={book} userBook={book} size="sm"
                onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {filtered.map(book => (
              <ListBookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      <PWAInstallBanner />
      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} />}
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
    </div>
  );
}

function CurrentlyReadingCard({ book, onClick }: { book: UserBook; onClick: () => void }) {
  const pct = readingProgress(book.currentPage, book.pageCount);
  return (
    <button onClick={onClick} className="card p-3 w-full text-left flex gap-3 items-center hover:shadow-md transition-shadow">
      {book.cover ? (
        <img src={book.cover} alt="" className="w-12 rounded object-cover flex-shrink-0"
          style={{ height: '72px', boxShadow: 'var(--shadow-book)' }} />
      ) : (
        <div className="w-12 rounded flex items-center justify-center flex-shrink-0"
          style={{ height: '72px', background: 'var(--bg-secondary)' }}>
          <BookOpen size={18} style={{ color: 'var(--text-faint)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {book.title}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{book.authors?.[0]}</p>
        <div className="mt-2 space-y-1">
          <div className="progress-bar"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
          <div className="flex justify-between">
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>p.{book.currentPage}{book.pageCount ? ' / ' + book.pageCount : ''}</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-primary)' }}>{pct}%</span>
          </div>
        </div>
      </div>
      <Link href={'/reading/' + book.id} onClick={e => e.stopPropagation()}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm"
        style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>▶</Link>
    </button>
  );
}

function ListBookCard({ book, onClick }: { book: UserBook; onClick: () => void }) {
  const pct = readingProgress(book.currentPage, book.pageCount);
  const STATUS_EMOJI: Record<string, string> = { reading: '📖', want_to_read: '📚', read: '✅', dnf: '❌' };
  return (
    <button onClick={onClick} className="card p-3 w-full text-left flex gap-3 items-center hover:shadow-md transition-all">
      {book.cover ? (
        <img src={book.cover} alt="" className="w-10 rounded object-cover flex-shrink-0"
          style={{ height: '60px', boxShadow: 'var(--shadow-book)' }} />
      ) : (
        <div className="w-10 rounded flex items-center justify-center flex-shrink-0"
          style={{ height: '60px', background: 'var(--bg-secondary)' }}>
          <BookOpen size={16} style={{ color: 'var(--text-faint)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{book.title}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{book.authors?.[0]}</p>
        {book.status === 'reading' && book.pageCount && (
          <div className="mt-1.5 progress-bar h-1"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-base">{STATUS_EMOJI[book.status]}</span>
        {book.userRating && <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>{'★'.repeat(book.userRating)}</span>}
        {book.status === 'reading' && <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{pct}%</span>}
      </div>
    </button>
  );
}

function EmptyState({ filter, onAdd }: { filter: string; onAdd: () => void }) {
  const msgs: Record<string, { emoji: string; title: string; sub: string }> = {
    all:          { emoji: '📚', title: 'Your library is empty',          sub: 'Start by adding your first book' },
    reading:      { emoji: '📖', title: 'Nothing in progress',            sub: 'Pick a book and start reading' },
    want_to_read: { emoji: '🌟', title: 'Your wishlist is empty',         sub: 'Discover books to add' },
    read:         { emoji: '🎉', title: "Haven't finished any books yet", sub: 'Keep going!' },
    favorites:    { emoji: '❤️', title: 'No favorites yet',              sub: 'Heart a book to save it here' },
  };
  const { emoji, title, sub } = msgs[filter] || msgs.all;
  return (
    <div className="text-center py-20 space-y-3">
      <p className="text-6xl">{emoji}</p>
      <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      {filter === 'all' && (
        <button onClick={onAdd} className="btn-primary mt-2 inline-flex items-center gap-2">
          <Plus size={15} /> Add your first book
        </button>
      )}
    </div>
  );
}
