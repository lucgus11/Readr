'use client';

import { useRef, useCallback } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { useStore } from '@/store';
import { readingProgress } from '@/lib/utils';
import type { UserBook } from '@/types';
import toast from 'react-hot-toast';

interface ShareCardProps {
  book: UserBook;
  onClose: () => void;
}

export function ShareCard({ book, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const settings = useStore(s => s.settings);
  const sessions = useStore(s => s.sessions);

  const pct = readingProgress(book.currentPage, book.pageCount);
  const totalMinutes = sessions.filter(s => s.bookId === book.id).reduce((acc, s) => acc + Math.floor(s.duration / 60), 0);

  const shareText = book.status === 'read'
    ? `Just finished "${book.title}" by ${book.authors?.[0]} ⭐${book.userRating ? '★'.repeat(book.userRating) : ''}\n\n#ReadingChallenge #Readr`
    : `Currently reading "${book.title}" by ${book.authors?.[0]} — ${pct}% through!\n\n#NowReading #Readr`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard!');
      }
    } catch { /* dismissed */ }
  };

  const STATUS_TEXT: Record<string, string> = {
    read:         '✅ Finished',
    reading:      '📖 Currently Reading',
    want_to_read: '📚 Want to Read',
    dnf:          '❌ Did Not Finish',
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm space-y-4 animate-scale-in">
        <button onClick={onClose}
          className="absolute -top-4 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white z-10"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <X size={14} />
        </button>

        {/* The shareable card */}
        <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #4a3326 0%, #8f6540 50%, #d1a070 100%)' }}>
          {/* Cover blurred bg */}
          <div className="relative p-6 pb-0">
            <div className="absolute inset-0 overflow-hidden opacity-20">
              {book.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.cover} alt="" className="w-full h-full object-cover scale-150 blur-xl" />
              )}
            </div>

            {/* Content */}
            <div className="relative flex gap-4 items-start">
              <div className="flex-shrink-0">
                {book.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover} alt="" className="w-20 h-30 rounded-xl object-cover"
                    style={{ height: 120, boxShadow: '4px 4px 20px rgba(0,0,0,0.4)' }} />
                ) : (
                  <div className="w-20 rounded-xl flex items-center justify-center text-4xl"
                    style={{ height: 120, background: 'rgba(255,255,255,0.1)' }}>📚</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold mb-1 opacity-70">{STATUS_TEXT[book.status]}</p>
                <p className="text-white font-bold text-lg leading-tight line-clamp-2"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  {book.title}
                </p>
                <p className="text-white/70 text-sm mt-1">{book.authors?.[0]}</p>
                {book.userRating && (
                  <p className="text-yellow-400 text-lg mt-1">{'★'.repeat(book.userRating)}{'☆'.repeat(5 - book.userRating)}</p>
                )}
              </div>
            </div>

            {/* Progress / stats */}
            <div className="relative mt-5 pb-5">
              {book.status === 'reading' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-white/70 text-xs">
                    <span>Progress</span>
                    <span className="font-bold text-white">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <p className="text-white/60 text-xs">
                    p.{book.currentPage}{book.pageCount ? ` / ${book.pageCount}` : ''}
                    {totalMinutes > 0 ? ` · ${totalMinutes}m reading` : ''}
                  </p>
                </div>
              )}
              {book.status === 'read' && (
                <div className="flex gap-4">
                  {[
                    { label: 'Pages', value: book.pageCount || '—' },
                    { label: 'Minutes', value: totalMinutes || '—' },
                    { label: 'Rating', value: book.userRating ? `${book.userRating}/5` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-white font-bold text-sm">{value}</p>
                      <p className="text-white/60 text-[10px]">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <p className="text-white/50 text-xs font-mono">📚 Readr</p>
            <p className="text-white/40 text-[10px]">{new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Share button */}
        <button onClick={handleShare}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-2xl">
          <Share2 size={16} />
          {'share' in navigator ? 'Share this card' : 'Copy text'}
        </button>

        {book.review && (
          <div className="card p-3">
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Your review</p>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
              "{book.review}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
