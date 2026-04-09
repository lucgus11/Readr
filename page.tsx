'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, BookOpen, Star } from 'lucide-react';
import { getAuthorInfo, searchOpenLibrary } from '@/lib/api';
import { useStore } from '@/store';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookCard } from '@/components/books/BookCard';
import { BookDiscoverModal } from '@/components/books/BookDiscoverModal';
import { saveBook } from '@/lib/db';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Book, UserBook, ReadingStatus } from '@/types';

export default function AuthorPage() {
  const { name } = useParams<{ name: string }>();
  const router   = useRouter();
  const decoded  = decodeURIComponent(name);

  const [bio, setBio]       = useState<{ extract: string; thumbnail?: string; url?: string } | null>(null);
  const [books, setBooks]   = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Book | null>(null);
  const [expanded, setExpanded] = useState(false);

  const libraryBooks = useStore(s => s.books);
  const addBook      = useStore(s => s.addBook);
  const bookIds      = new Set(libraryBooks.map(b => b.id));

  // Books by this author in the user's library
  const ownedBooks = libraryBooks.filter(b =>
    b.authors?.some(a => a.toLowerCase().includes(decoded.toLowerCase()))
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAuthorInfo(decoded),
      searchOpenLibrary(`author:${decoded}`, 18),
    ]).then(([bioData, bookData]) => {
      setBio(bioData);
      setBooks(bookData.filter(b => !ownedBooks.find(o => o.id === b.id)));
      setLoading(false);
    });
  }, [decoded]);

  const handleAdd = async (book: Book, status: ReadingStatus) => {
    const userBook: UserBook = {
      ...book, status,
      currentPage: status === 'read' ? (book.pageCount || 0) : 0,
      addedAt:     new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      startDate:   (status === 'reading' || status === 'read') ? new Date().toISOString().split('T')[0] : undefined,
      finishDate:  status === 'read' ? new Date().toISOString().split('T')[0] : undefined,
    };
    await saveBook(userBook);
    addBook(userBook);
    toast.success(`📚 "${book.title}" added!`);
  };

  const avgRating = ownedBooks.filter(b => b.userRating).length
    ? (ownedBooks.reduce((s, b) => s + (b.userRating || 0), 0) / ownedBooks.filter(b => b.userRating).length).toFixed(1)
    : null;

  return (
    <div className="min-h-svh pb-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="relative">
        {/* Blurred background */}
        <div className="absolute inset-0 h-48 overflow-hidden">
          {bio?.thumbnail && (
            <img src={bio.thumbnail} alt="" className="w-full h-full object-cover blur-2xl scale-125 opacity-30" />
          )}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--bg-primary) 90%)' }} />
        </div>

        {/* Back button */}
        <div className="relative z-10 safe-top px-4 pt-4 pb-2">
          <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2 flex items-center gap-2">
            <ArrowLeft size={18} />
            <span className="text-sm">Back</span>
          </button>
        </div>

        {/* Author info */}
        <div className="relative z-10 px-4 pb-6 flex gap-4 items-end">
          <div className="flex-shrink-0">
            {bio?.thumbnail ? (
              <img src={bio.thumbnail} alt={decoded}
                className="w-24 h-24 rounded-2xl object-cover"
                style={{ boxShadow: 'var(--shadow-lg)' }} />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}>
                ✍️
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {decoded}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {ownedBooks.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                  📚 {ownedBooks.length} in library
                </span>
              )}
              {avgRating && (
                <span className="text-xs flex items-center gap-1" style={{ color: '#f59e0b' }}>
                  <Star size={11} fill="currentColor" /> {avgRating} avg
                </span>
              )}
              {bio?.url && (
                <a href={bio.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1"
                  style={{ color: 'var(--accent-primary)' }}>
                  Wikipedia <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Biography */}
        {bio?.extract && (
          <div className="card p-4">
            <p className="section-title mb-2">Biography</p>
            <p className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              {expanded ? bio.extract : bio.extract.slice(0, 280) + (bio.extract.length > 280 ? '…' : '')}
            </p>
            {bio.extract.length > 280 && (
              <button onClick={() => setExpanded(e => !e)}
                className="text-xs mt-2 font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Books in your library */}
        {ownedBooks.length > 0 && (
          <section>
            <p className="section-title mb-3">In Your Library</p>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
              {ownedBooks.map(book => (
                <BookCard key={book.id} book={book} userBook={book} size="sm"
                  onClick={() => setPreview(book)} />
              ))}
            </div>
          </section>
        )}

        {/* More books */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="shimmer rounded-lg" style={{ height: 150 }} />
                <div className="shimmer h-3 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : books.length > 0 ? (
          <section>
            <p className="section-title mb-3">More by {decoded.split(' ').pop()}</p>
            <div className="grid grid-cols-3 gap-3 stagger">
              {books.map(book => (
                <BookCard key={book.id} book={book} size="sm"
                  userBook={libraryBooks.find(b => b.id === book.id)}
                  onAdd={!bookIds.has(book.id) ? handleAdd : undefined}
                  onClick={() => setPreview(book)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <BottomNav />
      {preview && (
        <BookDiscoverModal
          book={preview as Book}
          userBook={libraryBooks.find(b => b.id === preview.id)}
          onAdd={handleAdd}
          onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
