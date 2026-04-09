'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, BookOpen, Star, ExternalLink } from 'lucide-react';
import { getOpenLibraryBook, getAuthorInfo } from '@/lib/api';
import { saveBook } from '@/lib/db';
import { useStore } from '@/store';
import { cn, STATUS_COLORS, STATUS_LABELS, generateId } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Book, ReadingStatus, UserBook } from '@/types';

interface BookDiscoverModalProps {
  book: Book;
  userBook?: UserBook;
  onAdd: (book: Book, status: ReadingStatus) => void;
  onClose: () => void;
}

export function BookDiscoverModal({ book, userBook, onAdd, onClose }: BookDiscoverModalProps) {
  const [description, setDescription] = useState(book.description || '');
  const [authorInfo, setAuthorInfo] = useState<{ extract: string; thumbnail?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch description if missing and book is from Open Library
    if (!book.description && book.source === 'openlibrary') {
      const workId = book.id.replace('ol-', '');
      setLoading(true);
      getOpenLibraryBook(workId).then(data => {
        if (data?.description) setDescription(data.description);
        setLoading(false);
      });
    }
    if (book.authors?.[0]) {
      getAuthorInfo(book.authors[0]).then(setAuthorInfo);
    }
  }, [book]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--bg-card)', maxHeight: '88svh' }}>

        {/* Cover header */}
        <div className="relative h-36 overflow-hidden">
          {book.cover ? (
            <Image src={book.cover} alt={book.title} fill className="object-cover blur-md scale-110" unoptimized />
          ) : (
            <div className="w-full h-full" style={{ background: 'var(--bg-secondary)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.75))' }} />
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            <X size={16} />
          </button>

          <div className="absolute bottom-3 left-4 right-4 flex gap-3 items-end">
            {book.cover && (
              <img src={book.cover} alt="" className="w-14 h-20 rounded object-cover flex-shrink-0"
                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.3)' }} />
            )}
            <div>
              <p className="text-white font-bold text-base leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {book.title}
              </p>
              <p className="text-white/70 text-xs mt-0.5">{book.authors?.join(', ')}</p>
              {book.averageRating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star size={11} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-white/80 text-xs">{book.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meta strip */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Pages', value: book.pageCount || '—' },
            { label: 'Year', value: book.publishedDate?.slice(0, 4) || '—' },
            { label: 'Language', value: book.language?.toUpperCase() || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 text-center py-2.5 border-r last:border-r-0" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(88svh - 260px)' }}>

          {/* Add buttons */}
          {userBook ? (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--accent-light)' }}>
              <BookOpen size={15} style={{ color: 'var(--accent-primary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                In your library: <span className="font-bold">{STATUS_LABELS[userBook.status]}</span>
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              {([
                { status: 'want_to_read' as ReadingStatus, label: '📚 Want to Read' },
                { status: 'reading' as ReadingStatus, label: '📖 Reading' },
                { status: 'read' as ReadingStatus, label: '✅ Read' },
              ]).map(({ status, label }) => (
                <button key={status} onClick={() => { onAdd(book, status); onClose(); }}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {loading && <div className="space-y-2"><div className="shimmer h-3 rounded" /><div className="shimmer h-3 rounded w-4/5" /><div className="shimmer h-3 rounded w-3/5" /></div>}
          {!loading && description && (
            <div>
              <p className="section-title mb-2">Description</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {description.slice(0, 400)}{description.length > 400 ? '…' : ''}
              </p>
            </div>
          )}

          {/* Author */}
          {authorInfo && (
            <div>
              <p className="section-title mb-2">About the Author</p>
              <div className="flex gap-3 rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                {authorInfo.thumbnail && (
                  <img src={authorInfo.thumbnail} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                )}
                <p className="text-xs leading-relaxed line-clamp-5" style={{ color: 'var(--text-secondary)' }}>
                  {authorInfo.extract}
                </p>
              </div>
            </div>
          )}

          {/* Categories */}
          {book.categories && book.categories.length > 0 && (
            <div>
              <p className="section-title mb-2">Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {book.categories.map(c => (
                  <span key={c} className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ISBN */}
          {book.isbn && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>ISBN: {book.isbn}</p>
          )}
        </div>
      </div>
    </div>
  );
}
