'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, BookOpen, Plus } from 'lucide-react';
import { getBooksBySubject } from '@/lib/api';
import { saveBook } from '@/lib/db';
import { useStore } from '@/store';
import { BookCard } from '@/components/books/BookCard';
import { BookDiscoverModal } from '@/components/books/BookDiscoverModal';
import { generateId } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Book, UserBook, ReadingStatus } from '@/types';

export function Recommendations() {
  const books = useStore(s => s.books);
  const addBook = useStore(s => s.addBook);
  const [recs, setRecs]           = useState<Book[]>([]);
  const [loading, setLoading]     = useState(false);
  const [preview, setPreview]     = useState<Book | null>(null);
  const [reason, setReason]       = useState('');

  const bookIds = new Set(books.map(b => b.id));

  const buildRecommendations = async () => {
    setLoading(true);

    // Derive favourite genres from library
    const genreCounts: Record<string, number> = {};
    books.filter(b => b.status === 'read').forEach(b =>
      (b.categories || []).forEach(c => { genreCounts[c] = (genreCounts[c] || 0) + 1; })
    );
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

    // Fallback genres if library is small
    const subjects = topGenres.length >= 2
      ? topGenres
      : ['science_fiction', 'fantasy', 'mystery', 'biography', 'history'];

    const pick = subjects[Math.floor(Math.random() * subjects.length)];
    setReason(topGenres.length >= 2
      ? `Based on your love of ${topGenres.slice(0, 2).join(' & ')}`
      : 'Popular across all genres');

    const found = await getBooksBySubject(pick, 12);
    // Filter out books already in library
    setRecs(found.filter(b => !bookIds.has(b.id)).slice(0, 9));
    setLoading(false);
  };

  useEffect(() => {
    if (books.length > 0) buildRecommendations();
  }, []); // eslint-disable-line

  const handleAdd = async (book: Book, status: ReadingStatus) => {
    const userBook: UserBook = {
      ...book, status,
      currentPage: status === 'read' ? (book.pageCount || 0) : 0,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveBook(userBook);
    addBook(userBook);
    toast.success(`📚 "${book.title}" added!`);
  };

  if (recs.length === 0 && !loading) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
          <p className="section-title">Recommended for You</p>
        </div>
        <div className="flex items-center gap-2">
          {reason && (
            <p className="text-[10px] hidden sm:block" style={{ color: 'var(--text-faint)' }}>{reason}</p>
          )}
          <button onClick={buildRecommendations} disabled={loading}
            className="btn-ghost p-1.5 rounded-lg" title="Refresh recommendations">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-28 space-y-2">
              <div className="shimmer rounded-lg" style={{ height: 168 }} />
              <div className="shimmer h-3 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {recs.map(book => (
            <BookCard key={book.id} book={book} size="md"
              userBook={books.find(b => b.id === book.id)}
              onAdd={!bookIds.has(book.id) ? handleAdd : undefined}
              onClick={() => setPreview(book)} />
          ))}
        </div>
      )}

      {preview && (
        <BookDiscoverModal
          book={preview}
          userBook={books.find(b => b.id === preview.id)}
          onAdd={handleAdd}
          onClose={() => setPreview(null)} />
      )}
    </section>
  );
}
