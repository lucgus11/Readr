'use client';

import { useState, useCallback } from 'react';
import { Search, X, BookOpen, Plus } from 'lucide-react';
import { searchBooks } from '@/lib/api';
import { saveBook } from '@/lib/db';
import { useStore } from '@/store';
import { generateId } from '@/lib/utils';
import { BookCard } from './BookCard';
import toast from 'react-hot-toast';
import type { Book, ReadingStatus, UserBook } from '@/types';

interface AddBookModalProps {
  onClose: () => void;
  defaultStatus?: ReadingStatus;
}

export function AddBookModal({ onClose, defaultStatus = 'want_to_read' }: AddBookModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [status, setStatus] = useState<ReadingStatus>(defaultStatus);
  const [currentPage, setCurrentPage] = useState(0);
  const addBook = useStore(s => s.addBook);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    const books = await searchBooks(query);
    setResults(books);
    setLoading(false);
  }, [query]);

  const handleAdd = async (book: Book, st: ReadingStatus = status) => {
    const userBook: UserBook = {
      ...book,
      status: st,
      currentPage: st === 'read' ? (book.pageCount || 0) : currentPage,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: (st === 'reading' || st === 'read') ? new Date().toISOString().split('T')[0] : undefined,
      finishDate: st === 'read' ? new Date().toISOString().split('T')[0] : undefined,
    };
    await saveBook(userBook);
    addBook(userBook);
    toast.success(`"${book.title}" added to your library!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--bg-card)', maxHeight: '90svh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Add a Book</h2>
          <button onClick={onClose} className="ml-auto btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90svh - 80px)' }}>
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input
                autoFocus
                type="text"
                className="input-base pl-9"
                placeholder="Search by title, author, ISBN..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <button onClick={search} disabled={loading} className="btn-primary px-4">
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {/* Results */}
          {loading && (
            <div className="grid grid-cols-3 gap-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="shimmer h-[150px] rounded-lg" />
                  <div className="shimmer h-3 rounded w-3/4" />
                  <div className="shimmer h-2 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {results.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  size="sm"
                  onAdd={handleAdd}
                  onClick={() => setSelected(selected?.id === book.id ? null : book)}
                />
              ))}
            </div>
          )}

          {/* Selected book detail */}
          {selected && (
            <div className="card p-4 space-y-3 animate-fade-up">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  {selected.cover && (
                    <img src={selected.cover} alt={selected.title}
                      className="w-16 h-24 rounded object-cover" style={{ boxShadow: 'var(--shadow-book)' }} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{selected.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selected.authors?.join(', ')}</p>
                  {selected.pageCount && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{selected.pageCount} pages</p>
                  )}
                  {selected.publishedDate && (
                    <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{selected.publishedDate}</p>
                  )}
                </div>
              </div>

              {/* Status select */}
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Reading status</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(['want_to_read', 'reading', 'read'] as ReadingStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: status === s ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: status === s ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {s === 'want_to_read' ? '📚 Want to Read' : s === 'reading' ? '📖 Reading' : '✅ Read'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current page */}
              {status === 'reading' && (
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Current page</label>
                  <input
                    type="number" min="0" max={selected.pageCount}
                    className="input-base mt-1"
                    value={currentPage}
                    onChange={e => setCurrentPage(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <button
                onClick={() => handleAdd(selected)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add to Library
              </button>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
              No results found. Try a different search term.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
