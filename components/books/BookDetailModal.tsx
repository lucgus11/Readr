'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, Trash2, Edit3, ExternalLink, Share2, Zap } from 'lucide-react';
import { useStore } from '@/store';
import { saveBook, deleteBook, getNotesByBook } from '@/lib/db';
import { getAuthorInfo } from '@/lib/api';
import {
  cn, readingProgress, STATUS_LABELS, STATUS_COLORS,
  formatDate, estimateReadingTime, formatMinutes
} from '@/lib/utils';
import { ReadingTimer } from '../reader/ReadingTimer';
import { FocusMode } from '../reader/FocusMode';
import { ShareCard } from './ShareCard';
import { useCelebration } from '@/hooks/useCelebration';
import toast from 'react-hot-toast';
import type { UserBook, BookNote } from '@/types';

interface Props { book: UserBook; onClose: () => void; }

export function BookDetailModal({ book, onClose }: Props) {
  const [tab, setTab]         = useState<'info' | 'progress' | 'notes' | 'timer'>('info');
  const [notes, setNotes]     = useState<BookNote[]>([]);
  const [authorInfo, setAuth] = useState<{ extract: string; thumbnail?: string; url: string } | null>(null);
  const [review, setReview]   = useState(book.review || '');
  const [rating, setRating]   = useState(book.userRating || 0);
  const [curPage, setCurPage] = useState(book.currentPage);
  const [showFocus, setFocus] = useState(false);
  const [showShare, setShare] = useState(false);

  const updateBook = useStore(s => s.updateBook);
  const removeBook = useStore(s => s.removeBook);
  const { celebrateBookFinished } = useCelebration();
  const progress = readingProgress(curPage, book.pageCount);

  useEffect(() => {
    getNotesByBook(book.id).then(setNotes);
    if (book.authors?.[0]) getAuthorInfo(book.authors[0]).then(setAuth);
  }, [book.id, book.authors]);

  const saveProgress = async () => {
    await saveBook({ ...book, currentPage: curPage, updatedAt: new Date().toISOString() });
    updateBook(book.id, { currentPage: curPage });
    toast.success('Progress saved!');
  };

  const saveReview = async () => {
    await saveBook({ ...book, review, userRating: rating, updatedAt: new Date().toISOString() });
    updateBook(book.id, { review, userRating: rating });
    toast.success('Review saved!');
  };

  const toggleFav = async () => {
    const fav = !book.favorite;
    await saveBook({ ...book, favorite: fav });
    updateBook(book.id, { favorite: fav });
    toast.success(fav ? '❤️ Favorited!' : 'Removed from favorites');
  };

  const handleDelete = async () => {
    if (!confirm('Remove from library?')) return;
    await deleteBook(book.id); removeBook(book.id);
    toast.success('Removed'); onClose();
  };

  const markRead = async () => {
    const updates = { status: 'read' as const, currentPage: book.pageCount || curPage, finishDate: new Date().toISOString().split('T')[0] };
    await saveBook({ ...book, ...updates }); updateBook(book.id, updates);
    celebrateBookFinished(); toast.success('🎉 Book finished!'); onClose();
  };

  if (showFocus) return <FocusMode book={book} onClose={() => setFocus(false)} />;
  if (showShare) return <ShareCard book={book} onClose={() => setShare(false)} />;

  const TABS = [
    { id: 'info',     label: 'Info' },
    { id: 'progress', label: 'Progress' },
    { id: 'notes',    label: `Notes (${notes.length})` },
    { id: 'timer',    label: 'Timer' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--bg-card)', maxHeight: '92svh' }}>

        {/* Hero */}
        <div className="relative h-40 overflow-hidden">
          {book.cover
            ? <Image src={book.cover} alt={book.title} fill className="object-cover blur-sm scale-110" unoptimized />
            : <div className="w-full h-full" style={{ background: 'var(--bg-secondary)' }} />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,.3),rgba(0,0,0,.75))' }} />

          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ background: 'rgba(0,0,0,.4)' }}><X size={16} /></button>

          <div className="absolute top-3 left-3 flex gap-2">
            {[
              { icon: <Heart size={13} fill={book.favorite ? 'currentColor' : 'none'} />, fn: toggleFav, active: book.favorite },
              { icon: <Share2 size={13} />, fn: () => setShare(true) },
              { icon: <Trash2 size={13} />, fn: handleDelete },
            ].map((btn, i) => (
              <button key={i} onClick={btn.fn}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ background: 'rgba(0,0,0,.4)', color: btn.active ? '#ef4444' : 'white' }}>
                {btn.icon}
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 left-4 right-14 flex gap-3 items-end">
            {book.cover && (
              <img src={book.cover} alt="" className="w-14 h-20 rounded-lg object-cover flex-shrink-0"
                style={{ boxShadow: '3px 3px 0 rgba(0,0,0,.3)' }} />
            )}
            <div>
              <p className="text-white font-bold text-base leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}>{book.title}</p>
              {book.authors?.[0] && (
                <Link href={`/author/${encodeURIComponent(book.authors[0])}`}
                  onClick={e => e.stopPropagation()}
                  className="text-white/70 text-xs hover:text-white flex items-center gap-1 mt-0.5">
                  {book.authors[0]} <ExternalLink size={9} />
                </Link>
              )}
              <span className={cn('badge text-[10px] mt-1', STATUS_COLORS[book.status])}>
                {STATUS_LABELS[book.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Pages',    v: book.pageCount ? `${curPage}/${book.pageCount}` : '—' },
            { label: 'Progress', v: `${progress}%` },
            { label: 'Time',     v: book.readingTime ? formatMinutes(book.readingTime) : '—' },
          ].map(({ label, v }) => (
            <div key={label} className="text-center py-3 border-r last:border-r-0" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{v}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Focus CTA */}
        {book.status === 'reading' && (
          <div className="px-4 pt-3">
            <button onClick={() => setFocus(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              <Zap size={14} /> Start Focus Session
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b mt-3" style={{ borderColor: 'var(--border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className="flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors"
              style={{
                color:       tab === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderColor: tab === t.id ? 'var(--accent-primary)' : 'transparent',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(92svh - 350px)' }}>

          {tab === 'info' && (
            <div className="space-y-4 animate-fade-in">
              {book.description && (
                <div>
                  <p className="section-title mb-2">Description</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{book.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[['Published', book.publishedDate],['Pages', book.pageCount?.toString()],['Language', book.language?.toUpperCase()],['ISBN', book.isbn]]
                  .filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>
              {authorInfo && (
                <div>
                  <p className="section-title mb-2">About the Author</p>
                  <div className="flex gap-3 rounded-xl p-3" style={{ background: 'var(--bg-secondary)' }}>
                    {authorInfo.thumbnail && (
                      <img src={authorInfo.thumbnail} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--text-secondary)' }}>
                        {authorInfo.extract}
                      </p>
                      {book.authors?.[0] && (
                        <Link href={`/author/${encodeURIComponent(book.authors[0])}`}
                          className="text-xs flex items-center gap-1 mt-2 font-semibold"
                          style={{ color: 'var(--accent-primary)' }}>
                          Full biography <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {book.categories && book.categories.length > 0 && (
                <div>
                  <p className="section-title mb-2">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {book.categories.map(c => (
                      <span key={c} className="badge text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'progress' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Progress</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>{progress}%</span>
                </div>
                <div className="progress-bar h-2.5">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                {book.pageCount && curPage < book.pageCount && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {estimateReadingTime(book.pageCount - curPage)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input type="number" min="0" max={book.pageCount} className="input-base flex-1"
                  value={curPage} onChange={e => setCurPage(parseInt(e.target.value) || 0)} />
                <button onClick={saveProgress} className="btn-primary px-5">Save</button>
              </div>
              {book.status !== 'read' && (
                <button onClick={markRead} className="btn-primary w-full flex items-center justify-center gap-2">
                  ✅ Mark as Finished
                </button>
              )}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Your rating</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)}
                      className="text-2xl transition-transform hover:scale-110"
                      style={{ color: s <= rating ? '#f59e0b' : 'var(--border)' }}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Review</label>
                <textarea className="input-base mt-1.5 resize-none" rows={4}
                  placeholder="What did you think?" value={review}
                  onChange={e => setReview(e.target.value)} />
                <button onClick={saveReview} className="btn-secondary mt-2 w-full">Save Review</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Started</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {book.startDate ? formatDate(book.startDate) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Finished</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {book.finishDate ? formatDate(book.finishDate) : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3 animate-fade-in">
              {notes.length === 0 ? (
                <div className="text-center py-10">
                  <Edit3 size={28} className="mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes for this book yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Go to the Notes tab to add highlights</p>
                </div>
              ) : notes.map(note => (
                <div key={note.id} className="rounded-xl p-3"
                  style={{ background: 'var(--bg-secondary)', borderLeft: `3px solid ${note.color || 'var(--accent-primary)'}` }}>
                  <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: 'var(--text-faint)' }}>
                    {note.type}{note.page ? ` · p.${note.page}` : ''}
                  </span>
                  <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--text-primary)' }}>{note.content}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'timer' && (
            <div className="animate-fade-in">
              <ReadingTimer book={book} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
