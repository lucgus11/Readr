'use client';

import Image from 'next/image';
import { BookOpen, Plus, Check, Clock, X } from 'lucide-react';
import { cn, readingProgress, STATUS_COLORS, STATUS_LABELS, truncate } from '@/lib/utils';
import type { Book, UserBook, ReadingStatus } from '@/types';

interface BookCardProps {
  book: Book | UserBook;
  userBook?: UserBook;
  onAdd?: (book: Book, status: ReadingStatus) => void;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const STATUS_ICONS = {
  want_to_read: Clock,
  reading: BookOpen,
  read: Check,
  dnf: X,
};

export function BookCard({ book, userBook, onAdd, onClick, size = 'md', showProgress = true }: BookCardProps) {
  const progress = userBook ? readingProgress(userBook.currentPage, userBook.pageCount) : 0;
  const StatusIcon = userBook ? STATUS_ICONS[userBook.status] : null;

  const widths = { sm: 'w-[100px]', md: 'w-[140px]', lg: 'w-[180px]' };
  const coverH = { sm: 'h-[150px]', md: 'h-[210px]', lg: 'h-[270px]' };

  return (
    <div
      className={cn('flex-shrink-0 cursor-pointer group', widths[size])}
      onClick={onClick}
    >
      {/* Cover */}
      <div className={cn('relative rounded-lg overflow-hidden', coverH[size], 'book-spine')}
        style={{ boxShadow: 'var(--shadow-book)' }}>
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={size === 'sm' ? '100px' : size === 'md' ? '140px' : '180px'}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)' }}>
            <BookOpen size={size === 'sm' ? 24 : 36} style={{ color: 'var(--text-faint)' }} />
          </div>
        )}

        {/* Status badge */}
        {userBook && StatusIcon && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
            <StatusIcon size={12} />
          </div>
        )}

        {/* Quick add overlay */}
        {!userBook && onAdd && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-1.5">
            {(['want_to_read', 'reading', 'read'] as ReadingStatus[]).map(status => (
              <button
                key={status}
                onClick={(e) => { e.stopPropagation(); onAdd(book, status); }}
                className="px-2 py-1 rounded text-[10px] font-medium text-white"
                style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                title={STATUS_LABELS[status]}
              >
                {status === 'want_to_read' ? '📚' : status === 'reading' ? '📖' : '✅'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {userBook && showProgress && userBook.status === 'reading' && (
        <div className="progress-bar mt-1.5">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Info */}
      <div className="mt-2 space-y-0.5">
        <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          {truncate(book.title, size === 'sm' ? 35 : 50)}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {book.authors?.[0] || 'Unknown'}
        </p>
        {userBook && (
          <span className={cn('badge text-[9px]', STATUS_COLORS[userBook.status])}>
            {STATUS_LABELS[userBook.status]}
          </span>
        )}
      </div>
    </div>
  );
}
