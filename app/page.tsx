'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Bookmark, Flame, Grid, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';
import { searchBooks, getTrendingBooks, getBooksBySubject, getDailyQuote, FEATURED_SUBJECTS } from '@/lib/api';
import { saveBook, saveQuote, deleteQuote, getSavedQuotes } from '@/lib/db';
import { BookCard } from '@/components/books/BookCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { generateId, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Book, Quote, ReadingStatus, UserBook } from '@/types';

export default function DiscoverPage() {
  const { addBook, savedQuotes, addSavedQuote, removeSavedQuote, setSavedQuotes } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [trending, setTrending] = useState<Book[]>([]);
  const [subjectBooks, setSubjectBooks] = useState<Book[]>([]);
  const [activeSubject, setActiveSubject] = useState('science_fiction');
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [addBookTarget, setAddBookTarget] = useState<Book | null>(null);
  const [tab, setTab] = useState<'explore' | 'search' | 'quotes'>('explore');

  useEffect(() => {
    setTrendingLoading(true);
    getTrendingBooks().then(b => { setTrending(b); setTrendingLoading(false); });
    getDailyQuote().then(setDailyQuote);
    getSavedQuotes().then(setSavedQuotes);
    loadSubject('science_fiction');
  }, [setSavedQuotes]);

  const loadSubject = async (subject: string) => {
    setSubjectLoading(true);
    setActiveSubject(subject);
    const books = await getBooksBySubject(subject, 12);
    setSubjectBooks(books);
    setSubjectLoading(false);
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setTab('search');
    const books = await searchBooks(query);
    setResults(books);
    setLoading(false);
  }, [query]);

  const handleAddBook = async (book: Book, status: ReadingStatus) => {
    const userBook: UserBook = {
      ...book,
      status,
      currentPage: status === 'read' ? (book.pageCount || 0) : 0,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: status !== 'want_to_read' ? new Date().toISOString().split('T')[0] : undefined,
      finishDate: status === 'read' ? new Date().toISOString().split('T')[0] : undefined,
    };
    await saveBook(userBook);
    addBook(userBook);
    toast.success(`"${truncate(book.title, 25)}" added!`);
  };

  const toggleSaveQuote = async (quote: Quote) => {
    const saved = savedQuotes.some(q => q.id === quote.id);
    if (saved) {
      await deleteQuote(quote.id);
      removeSavedQuote(quote.id);
      toast('Quote removed');
    } else {
      await saveQuote(quote);
      addSavedQuote(quote);
      toast.success('Quote saved! ✨');
    }
  };

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="px-4 pt-4 pb-3">
          <h1 className="page-title mb-3">Discover</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input type="text" className="input-base pl-9" placeholder="Search books, authors, ISBN..."
                value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>
            <button onClick={handleSearch} disabled={loading} className="btn-primary px-4 text-sm">
              {loading ? '…' : 'Search'}
            </button>
          </div>
          <div className="flex gap-1 mt-3">
            {[['explore', '🔥 Explore'], ['search', '🔍 Results'], ['quotes', '💬 Quotes']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as typeof tab)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{ background: tab === id ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: tab === id ? 'var(--bg-primary)' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">

        {tab === 'explore' && (
          <>
            {/* Daily quote */}
            {dailyQuote && (
              <div className="card-elevated p-4 relative" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="section-title">✨ Daily Quote</p>
                  <div className="flex gap-1">
                    <button onClick={() => getDailyQuote().then(setDailyQuote)} className="btn-ghost p-1.5 rounded-lg"><RefreshCw size={12} /></button>
                    <button onClick={() => toggleSaveQuote(dailyQuote)} className="btn-ghost p-1.5 rounded-lg">
                      <Bookmark size={12} fill={savedQuotes.some(q => q.id === dailyQuote.id) ? 'currentColor' : 'none'} style={{ color: 'var(--accent-primary)' }} />
                    </button>
                  </div>
                </div>
                <p className="text-sm italic leading-relaxed" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  "{dailyQuote.content}"
                </p>
                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>— {dailyQuote.author}</p>
              </div>
            )}

            {/* Trending */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Flame size={13} style={{ color: 'var(--accent-primary)' }} />
                <p className="section-title">Trending This Week</p>
              </div>
              {trendingLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex-shrink-0 space-y-2">
                      <div className="shimmer rounded-lg" style={{ width: 120, height: 180 }} />
                      <div className="shimmer h-3 rounded" style={{ width: 100 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {trending.map(book => (
                    <BookCard key={book.id} book={book} size="md" onAdd={handleAddBook} onClick={() => setAddBookTarget(book)} />
                  ))}
                </div>
              )}
            </section>

            {/* Genre browser */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Grid size={13} style={{ color: 'var(--accent-primary)' }} />
                <p className="section-title">Browse by Genre</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-3">
                {FEATURED_SUBJECTS.map(({ id, label, emoji }) => (
                  <button key={id} onClick={() => loadSubject(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
                    style={{ background: activeSubject === id ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: activeSubject === id ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                    {emoji} {label}
                  </button>
                ))}
              </div>
              {subjectLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array(6).fill(0).map((_, i) => <div key={i} className="space-y-2"><div className="shimmer h-[150px] rounded-lg" /><div className="shimmer h-3 rounded w-3/4" /></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 stagger">
                  {subjectBooks.map(book => (
                    <BookCard key={book.id} book={book} size="sm" onAdd={handleAddBook} onClick={() => setAddBookTarget(book)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {tab === 'search' && (
          <section>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">{Array(9).fill(0).map((_, i) => <div key={i} className="space-y-2"><div className="shimmer h-[150px] rounded-lg" /><div className="shimmer h-3 rounded" /></div>)}</div>
            ) : results.length > 0 ? (
              <>
                <p className="section-title mb-3">{results.length} results for "{query}"</p>
                <div className="grid grid-cols-3 gap-3 stagger">
                  {results.map(book => <BookCard key={book.id} book={book} size="sm" onAdd={handleAddBook} onClick={() => setAddBookTarget(book)} />)}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🔍</p>
                <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Search for books</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Enter a title, author or ISBN above</p>
              </div>
            )}
          </section>
        )}

        {tab === 'quotes' && (
          <section className="space-y-3">
            <p className="section-title">Saved Quotes ({savedQuotes.length})</p>
            {savedQuotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>No saved quotes yet</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Bookmark quotes from the Explore tab</p>
              </div>
            ) : (
              <div className="space-y-3 stagger">
                {savedQuotes.map(q => (
                  <div key={q.id} className="card p-4" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm italic leading-relaxed flex-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        "{q.content}"
                      </p>
                      <button onClick={() => toggleSaveQuote(q)} className="flex-shrink-0 btn-ghost p-1 text-xs opacity-50">✕</button>
                    </div>
                    <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>— {q.author}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Quick-add sheet */}
      {addBookTarget && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddBookTarget(null)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-5 animate-fade-up"
            style={{ background: 'var(--bg-card)' }}>
            <div className="flex gap-3 mb-4">
              {addBookTarget.cover && <img src={addBookTarget.cover} alt="" className="w-14 h-20 rounded-lg object-cover flex-shrink-0" style={{ boxShadow: 'var(--shadow-book)' }} />}
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{addBookTarget.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{addBookTarget.authors?.[0]}</p>
                {addBookTarget.pageCount && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{addBookTarget.pageCount} pages · {addBookTarget.publishedDate}</p>}
              </div>
            </div>
            {addBookTarget.description && (
              <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{addBookTarget.description}</p>
            )}
            <p className="section-title mb-3">Add to library as…</p>
            <div className="grid grid-cols-3 gap-2">
              {([['want_to_read', '📚', 'Want to Read'], ['reading', '📖', 'Reading Now'], ['read', '✅', 'Already Read']] as [ReadingStatus, string, string][]).map(([s, emoji, label]) => (
                <button key={s} onClick={() => { handleAddBook(addBookTarget, s); setAddBookTarget(null); }}
                  className="rounded-xl py-3 px-2 text-center transition-all active:scale-95"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <p className="text-xl mb-1">{emoji}</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
