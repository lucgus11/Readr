'use client';

import { useEffect, useState } from 'react';
import { WifiOff, BookOpen, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const books = useStore(s => s.books);
  const currentlyReading = books.filter(b => b.status === 'reading');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (isOnline) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--bg-secondary)' }}>
        <WifiOff size={36} style={{ color: 'var(--text-faint)' }} />
      </div>

      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        You're Offline
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>
        No internet connection — but don't worry, your entire library and reading sessions are still available offline.
      </p>

      {currentlyReading.length > 0 && (
        <div className="w-full max-w-xs space-y-3 mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Continue Reading
          </p>
          {currentlyReading.map(book => (
            <Link key={book.id} href={`/reading/${book.id}`}
              className="flex items-center gap-3 p-3 rounded-xl w-full text-left transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {book.cover ? (
                <img src={book.cover} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <BookOpen size={16} style={{ color: 'var(--text-faint)' }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {book.title}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {book.authors?.[0]}
                </p>
                {book.pageCount && (
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((book.currentPage / book.pageCount) * 100)}%`,
                      background: 'var(--accent-primary)'
                    }} />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-3 w-full max-w-xs">
        <Link href="/" className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          <BookOpen size={15} />
          Go to Library
        </Link>
        <button onClick={() => window.location.reload()}
          className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
          <RefreshCw size={15} />
          Try reconnecting
        </button>
      </div>

      <div className="mt-12 p-4 rounded-xl max-w-xs" style={{ background: 'var(--bg-secondary)' }}>
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>✅ Available offline:</p>
        <ul className="text-xs space-y-1 text-left" style={{ color: 'var(--text-muted)' }}>
          {[
            'Your full library',
            'Reading progress tracking',
            'Reading timer',
            'Notes & highlights',
            'Statistics',
            'Settings & data export',
          ].map(item => (
            <li key={item} className="flex items-center gap-1.5">
              <span style={{ color: 'var(--accent-primary)' }}>•</span> {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
