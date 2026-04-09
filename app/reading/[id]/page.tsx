'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, BookOpen, ChevronLeft, ChevronRight,
  Minus, Plus, Bookmark, Lightbulb, Share2, Check
} from 'lucide-react';
import { getBook, saveBook, saveSession, saveNote } from '@/lib/db';
import { useStore } from '@/store';
import { ReadingTimer } from '@/components/reader/ReadingTimer';
import { getDailyQuote } from '@/lib/api';
import { cn, generateId, readingProgress, estimateReadingTime, NOTE_COLORS } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UserBook, Quote, BookNote, NoteType } from '@/types';

export default function ReadingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<UserBook | null>(null);
  const [page, setPage] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [notePage, setNotePage] = useState('');
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const updateBook = useStore(s => s.updateBook);
  const addNote = useStore(s => s.addNote);
  const addSession = useStore(s => s.addSession);
  const settings = useStore(s => s.settings);

  useEffect(() => {
    if (id) {
      getBook(id).then(b => {
        if (b) { setBook(b); setPage(b.currentPage); }
      });
    }
    getDailyQuote().then(setQuote);
  }, [id]);

  const progress = book ? readingProgress(page, book.pageCount) : 0;

  const handlePageChange = useCallback(async (newPage: number) => {
    if (!book) return;
    const clamped = Math.max(0, Math.min(newPage, book.pageCount || 9999));
    setPage(clamped);
  }, [book]);

  const saveProgress = useCallback(async () => {
    if (!book) return;
    setSaving(true);
    const updates: Partial<UserBook> = {
      currentPage: page,
      updatedAt: new Date().toISOString(),
    };
    if (page === book.pageCount && book.status !== 'read') {
      updates.status = 'read';
      updates.finishDate = new Date().toISOString().split('T')[0];
      toast.success('🎉 Book finished! Congratulations!');
    }
    await saveBook({ ...book, ...updates });
    updateBook(book.id, updates);
    setSaving(false);
    toast.success(`Progress saved — page ${page}`);
  }, [book, page, updateBook]);

  const handleQuickNote = async () => {
    if (!book || !noteContent.trim()) return toast.error('Write something first!');
    const note: BookNote = {
      id: generateId(),
      bookId: book.id,
      bookTitle: book.title,
      type: noteType,
      content: noteContent.trim(),
      page: notePage ? parseInt(notePage) : page || undefined,
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveNote(note);
    addNote(note);
    setNoteContent('');
    setNotePage('');
    setShowQuickNote(false);
    toast.success('Note saved! 📝');
  };

  const handleShare = async () => {
    if (!book) return;
    const text = `I'm reading "${book.title}" by ${book.authors?.[0]} — ${progress}% through! 📚`;
    if (navigator.share) {
      await navigator.share({ title: book.title, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
    setShowShare(false);
  };

  if (!book) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: 'var(--accent-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {book.title}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{book.authors?.[0]}</p>
        </div>
        <button onClick={() => setShowQuickNote(true)} className="btn-ghost p-2">
          <Bookmark size={18} />
        </button>
        <button onClick={handleShare} className="btn-ghost p-2">
          <Share2 size={18} />
        </button>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Book cover + info */}
        <div className="flex gap-4 items-start animate-fade-up">
          <div className="flex-shrink-0">
            {book.cover ? (
              <div className="relative w-24 h-36 rounded-lg overflow-hidden"
                style={{ boxShadow: 'var(--shadow-book)' }}>
                <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-24 h-36 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-book)' }}>
                <BookOpen size={32} style={{ color: 'var(--text-faint)' }} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            {/* Progress ring */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5" />
                  <circle cx="32" cy="32" r="26" fill="none"
                    stroke="var(--accent-primary)" strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{progress}%</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  p. {page}
                </p>
                {book.pageCount && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>of {book.pageCount} pages</p>
                )}
                {book.pageCount && page < book.pageCount && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    {estimateReadingTime(book.pageCount - page)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page input section */}
        <div className="card p-4 space-y-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Update Progress
          </p>

          {/* Page number control */}
          <div className="flex items-center gap-3">
            <button onClick={() => handlePageChange(page - 10)} className="btn-secondary px-3 py-2 text-xs">
              −10
            </button>
            <button onClick={() => handlePageChange(page - 1)} className="btn-ghost p-2.5 rounded-full border"
              style={{ borderColor: 'var(--border)' }}>
              <Minus size={16} />
            </button>
            <input
              type="number"
              min="0"
              max={book.pageCount}
              value={page}
              onChange={e => handlePageChange(parseInt(e.target.value) || 0)}
              className="input-base text-center text-xl font-bold flex-1"
              style={{ fontFamily: 'var(--font-display)' }}
            />
            <button onClick={() => handlePageChange(page + 1)} className="btn-ghost p-2.5 rounded-full border"
              style={{ borderColor: 'var(--border)' }}>
              <Plus size={16} />
            </button>
            <button onClick={() => handlePageChange(page + 10)} className="btn-secondary px-3 py-2 text-xs">
              +10
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="progress-bar h-2.5 cursor-pointer" onClick={(e) => {
              if (!book.pageCount) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              handlePageChange(Math.round(ratio * book.pageCount));
            }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {book.pageCount && (
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-faint)' }}>
                <span>0</span>
                <span>{Math.round(book.pageCount / 2)}</span>
                <span>{book.pageCount}</span>
              </div>
            )}
          </div>

          {/* Quick jump buttons */}
          {book.pageCount && (
            <div className="flex gap-2 flex-wrap">
              {[25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => handlePageChange(Math.round(book.pageCount! * pct / 100))}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  {pct}%
                </button>
              ))}
            </div>
          )}

          <button onClick={saveProgress} disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check size={15} />}
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>

        {/* Reading Timer */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <ReadingTimer
            book={book}
            onSessionEnd={(pagesRead, duration) => {
              if (pagesRead > 0) handlePageChange(page + pagesRead);
            }}
          />
        </div>

        {/* Daily quote */}
        {quote && (
          <div className="card p-4 space-y-2 animate-fade-up" style={{ animationDelay: '180ms', background: 'var(--accent-light)' }}>
            <div className="flex items-center gap-2">
              <Lightbulb size={14} style={{ color: 'var(--accent-primary)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>Thought for today</p>
            </div>
            <p className="text-sm italic leading-relaxed" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              "{quote.content}"
            </p>
            <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>— {quote.author}</p>
          </div>
        )}

        {/* Reading info */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <div className="card p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time reading</p>
            <p className="font-bold text-lg mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {book.readingTime ? `${book.readingTime}m` : '—'}
            </p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pages remaining</p>
            <p className="font-bold text-lg mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {book.pageCount ? Math.max(0, book.pageCount - page) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick note panel */}
      {showQuickNote && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowQuickNote(false)} />
          <div className="relative w-full max-w-lg rounded-t-2xl p-4 space-y-4 animate-fade-up"
            style={{ background: 'var(--bg-card)' }}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border)' }} />
            <h3 className="font-bold text-center" style={{ fontFamily: 'var(--font-display)' }}>Quick Note</h3>

            {/* Type selector */}
            <div className="flex gap-2">
              {(['note', 'highlight', 'quote'] as NoteType[]).map(t => (
                <button key={t} onClick={() => setNoteType(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: noteType === t ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: noteType === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  }}>
                  {t === 'note' ? '📝' : t === 'highlight' ? '✏️' : '💬'} {t}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              rows={4}
              className="input-base resize-none"
              placeholder={noteType === 'quote' ? 'Enter the quote...' : noteType === 'highlight' ? 'Paste highlighted text...' : 'Your thought...'}
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
            />

            <div className="flex gap-2">
              <input
                type="number"
                className="input-base w-24"
                placeholder={`p.${page}`}
                value={notePage}
                onChange={e => setNotePage(e.target.value)}
              />
              <button onClick={handleQuickNote} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Bookmark size={14} /> Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
