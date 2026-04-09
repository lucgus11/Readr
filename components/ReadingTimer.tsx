'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useStore } from '@/store';
import { saveSession } from '@/lib/db';
import { generateId, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { UserBook } from '@/types';

interface ReadingTimerProps {
  book: UserBook;
  onSessionEnd?: (pagesRead: number, duration: number) => void;
}

export function ReadingTimer({ book, onSessionEnd }: ReadingTimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pagesRead, setPagesRead] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const addSession = useStore(s => s.addSession);
  const updateBook = useStore(s => s.updateBook);

  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const stop = useCallback(async () => {
    setRunning(false);
    if (elapsed === 0) return;

    const session = {
      id: generateId(),
      bookId: book.id,
      bookTitle: book.title,
      startTime: new Date(Date.now() - elapsed * 1000).toISOString(),
      endTime: new Date().toISOString(),
      pagesRead,
      duration: elapsed,
      date: new Date().toISOString().split('T')[0],
    };

    await saveSession(session);
    addSession(session);

    if (pagesRead > 0) {
      const newPage = book.currentPage + pagesRead;
      updateBook(book.id, {
        currentPage: newPage,
        readingTime: (book.readingTime || 0) + Math.floor(elapsed / 60),
      });
    }

    onSessionEnd?.(pagesRead, elapsed);
    toast.success(`Session saved! ${formatDuration(elapsed)} of reading 📚`);
    setElapsed(0);
    setPagesRead(0);
  }, [elapsed, pagesRead, book, addSession, updateBook, onSessionEnd]);

  const progress = elapsed > 0 ? (elapsed % 1500) / 1500 * 100 : 0; // 25 min Pomodoro

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Reading Timer
        </h3>
        <span className="badge text-xs" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
          Pomodoro 25m
        </span>
      </div>

      {/* Timer display */}
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="var(--accent-primary)" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatDuration(elapsed)}
            </span>
          </div>
        </div>
      </div>

      {/* Pages input */}
      <div>
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Pages read this session</label>
        <div className="flex items-center gap-2 mt-1">
          <button onClick={() => setPagesRead(p => Math.max(0, p - 1))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>−</button>
          <input
            type="number" min="0" value={pagesRead}
            onChange={e => setPagesRead(Math.max(0, parseInt(e.target.value) || 0))}
            className="input-base text-center w-20"
          />
          <button onClick={() => setPagesRead(p => p + 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>+</button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setRunning(r => !r)}
          className="btn-primary flex items-center gap-2 flex-1 justify-center"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
        </button>
        {elapsed > 0 && (
          <button onClick={stop} className="btn-secondary flex items-center gap-2 px-3">
            <Square size={14} />
            Save
          </button>
        )}
        {!running && elapsed > 0 && (
          <button onClick={() => { setElapsed(0); setPagesRead(0); }} className="btn-ghost px-3">
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
