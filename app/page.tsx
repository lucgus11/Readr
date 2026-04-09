'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, Camera, ArrowLeft, X, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchBooks } from '@/lib/api';
import { saveBook } from '@/lib/db';
import { useStore } from '@/store';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookCard } from '@/components/books/BookCard';
import { BookDiscoverModal } from '@/components/books/BookDiscoverModal';
import { ISBNScanner } from '@/components/ui/ISBNScanner';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Book, ReadingStatus, UserBook } from '@/types';

const QUICK_SEARCHES = [
  { label: 'Top 2024', q: 'best books 2024' },
  { label: 'Classics', q: 'classic literature' },
  { label: 'Self-Help', q: 'self help productivity' },
  { label: 'True Crime', q: 'true crime nonfiction' },
  { label: 'Sci-Fi 2024', q: 'science fiction 2024' },
  { label: 'Nobel Prize', q: 'nobel prize literature' },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [preview, setPreview] = useState<Book | null>(null);
  const [filters, setFilters] = useState({ language: '', minPages: 0, maxPages: 9999, hasRating: false });
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const books = useStore(s => s.books);
  const addBook = useStore(s => s.addBook);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults([]);
    const found = await searchBooks(q);
    // Apply filters
    const filtered = found.filter(b => {
      if (filters.minPages && (b.pageCount || 0) < filters.minPages) return false;
      if (filters.maxPages < 9999 && (b.pageCount || 9999) > filters.maxPages) return false;
      if (filters.hasRating && !b.averageRating) return false;
      if (filters.language && b.language && !b.language.includes(filters.language)) return false;
      return true;
    });
    setResults(filtered);
    setLoading(false);
  }, [filters]);

  const handleAdd = async (book: Book, status: ReadingStatus) => {
    const userBook: UserBook = {
      ...book, status,
      currentPage: status === 'read' ? (book.pageCount || 0) : 0,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: (status === 'reading' || status === 'read') ? new Date().toISOString().split('T')[0] : undefined,
      finishDate: status === 'read' ? new Date().toISOString().split('T')[0] : undefined,
    };
    await saveBook(userBook);
    addBook(userBook);
    toast.success(`📚 "${book.title}" added!`);
  };

  const bookIds = new Set(books.map(b => b.id));

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-40 px-4 pt-4 pb-3 safe-top space-y-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2 flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Title, author, ISBN..."
              className="input-base pl-9 pr-9"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-faint)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowScanner(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--accent-primary)' }}>
            <Camera size={18} />
          </button>
          <button onClick={() => setShowFilters(f => !f)}
            className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors',
              showFilters ? '' : '')}
            style={{
              background: showFilters ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              borderColor: showFilters ? 'transparent' : 'var(--border)',
              color: showFilters ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}>
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card p-3 space-y-3 animate-fade-up">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Filters</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Min pages</label>
                <input type="number" className="input-base text-xs" placeholder="0"
                  value={filters.minPages || ''}
                  onChange={e => setFilters(f => ({ ...f, minPages: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Max pages</label>
                <input type="number" className="input-base text-xs" placeholder="∞"
                  value={filters.maxPages < 9999 ? filters.maxPages : ''}
                  onChange={e => setFilters(f => ({ ...f, maxPages: parseInt(e.target.value) || 9999 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilters(f => ({ ...f, hasRating: !f.hasRating }))}
                className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-colors')}
                style={{
                  background: filters.hasRating ? 'var(--accent-primary)' : 'transparent',
                  borderColor: filters.hasRating ? 'var(--accent-primary)' : 'var(--border)',
                }}>
                {filters.hasRating && <span className="text-white text-xs">✓</span>}
              </button>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Only rated books</span>
            </div>
          </div>
        )}

        {/* Search button */}
        {query && (
          <button onClick={() => doSearch(query)} disabled={loading}
            className="btn-primary w-full text-sm py-2.5">
            {loading ? 'Searching…' : `Search for "${query}"`}
          </button>
        )}
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Quick searches */}
        {!query && results.length === 0 && (
          <div>
            <p className="section-title mb-3">Quick Searches</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map(qs => (
                <button key={qs.q}
                  onClick={() => { setQuery(qs.label); doSearch(qs.q); }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {qs.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-3 gap-4">
            {Array(9).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="shimmer rounded-lg" style={{ height: '150px' }} />
                <div className="shimmer h-3 rounded w-3/4" />
                <div className="shimmer h-2 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <p className="section-title mb-3">{results.length} results</p>
            <div className="grid grid-cols-3 gap-4 stagger">
              {results.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  size="sm"
                  userBook={books.find(b => b.id === book.id)}
                  onAdd={!bookIds.has(book.id) ? handleAdd : undefined}
                  onClick={() => setPreview(book)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              No results found
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try different keywords or scan an ISBN</p>
          </div>
        )}
      </div>

      <BottomNav />

      {showScanner && (
        <ISBNScanner
          onBookFound={book => { setPreview(book); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {preview && (
        <BookDiscoverModal
          book={preview}
          userBook={books.find(b => b.id === preview.id)}
          onAdd={handleAdd}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
