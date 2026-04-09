'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Pause, Play, SkipForward, Moon, Sun } from 'lucide-react';
import { useStore } from '@/store';
import { saveSession, saveBook } from '@/lib/db';
import { generateId, formatDuration } from '@/lib/utils';
import { useCelebration } from '@/hooks/useCelebration';
import toast from 'react-hot-toast';
import type { UserBook } from '@/types';

interface FocusModeProps {
  book: UserBook;
  onClose: () => void;
}

const AMBIENT_SOUNDS = [
  { id: 'none',  label: 'Silence',       emoji: '🔇', url: null },
  { id: 'rain',  label: 'Rain',          emoji: '🌧️', url: 'https://www.soundjay.com/nature/rain-01.mp3' },
  { id: 'cafe',  label: 'Café',          emoji: '☕', url: null }, // web audio API fallback
  { id: 'fire',  label: 'Fireplace',     emoji: '🔥', url: null },
] as const;

// Pomodoro intervals
const INTERVALS = [
  { label: '25 min',  seconds: 1500 },
  { label: '30 min',  seconds: 1800 },
  { label: '45 min',  seconds: 2700 },
  { label: '60 min',  seconds: 3600 },
];

export function FocusMode({ book, onClose }: FocusModeProps) {
  const [seconds, setSeconds]       = useState(1500);
  const [totalSeconds, setTotal]    = useState(1500);
  const [running, setRunning]       = useState(false);
  const [darkBg, setDarkBg]         = useState(true);
  const [pagesRead, setPagesRead]   = useState(0);
  const [sound, setSound]           = useState<string>('none');
  const [phase, setPhase]           = useState<'ready' | 'focus' | 'break' | 'done'>('ready');
  const [quote, setQuote]           = useState('');
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const addSession                  = useStore(s => s.addSession);
  const updateBook                  = useStore(s => s.updateBook);
  const { celebrateStreak }         = useCelebration();
  const sessionStart                = useRef<number>(0);

  // Motivational mini-quotes
  const MINI_QUOTES = [
    'Stay in the zone. 📖',
    'Every page counts.',
    'You\'re doing great!',
    'Keep the momentum.',
    'One page at a time.',
    'Reading is an adventure.',
  ];

  useEffect(() => {
    const idx = Math.floor(Math.random() * MINI_QUOTES.length);
    setQuote(MINI_QUOTES[idx]);
  }, []);

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          handleTimerEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleTimerEnd = useCallback(() => {
    setRunning(false);
    setPhase('done');
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    if (Notification.permission === 'granted') {
      new Notification('Focus session complete! 🎉', {
        body: `Great job reading "${book.title}"`,
        icon: '/icons/icon-192.png',
      });
    }
  }, [book.title]);

  const handleStart = () => {
    sessionStart.current = Date.now();
    setRunning(true);
    setPhase('focus');
  };

  const handleFinish = async () => {
    const duration = Math.floor((Date.now() - sessionStart.current) / 1000);
    const session = {
      id:        generateId(),
      bookId:    book.id,
      bookTitle: book.title,
      startTime: new Date(sessionStart.current).toISOString(),
      endTime:   new Date().toISOString(),
      pagesRead,
      duration,
      date:      new Date().toISOString().split('T')[0],
    };
    await saveSession(session);
    addSession(session);
    if (pagesRead > 0) {
      const newPage = book.currentPage + pagesRead;
      await saveBook({ ...book, currentPage: newPage, readingTime: (book.readingTime || 0) + Math.floor(duration / 60) });
      updateBook(book.id, { currentPage: newPage });
    }
    toast.success(`Focus session saved! ${formatDuration(duration)} read.`);
    celebrateStreak(1);
    onClose();
  };

  const pct     = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 100;
  const radius  = 80;
  const circum  = 2 * Math.PI * radius;

  const bg = darkBg
    ? 'linear-gradient(135deg, #1a1008 0%, #2a1a0e 100%)'
    : 'linear-gradient(135deg, #faf7f2 0%, #f2ebe0 100%)';
  const textColor = darkBg ? '#f2ebe0' : '#2a1a0e';
  const mutedColor = darkBg ? 'rgba(242,235,224,0.5)' : 'rgba(42,26,14,0.5)';

  return (
    <div className="fixed inset-0 z-[400] flex flex-col" style={{ background: bg, transition: 'background 0.5s' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(128,128,128,0.15)', color: textColor }}>
          <X size={18} />
        </button>
        <p className="text-sm font-semibold truncate max-w-[60%] text-center"
          style={{ color: mutedColor, fontFamily: 'var(--font-display)' }}>
          {book.title}
        </p>
        <button onClick={() => setDarkBg(d => !d)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(128,128,128,0.15)', color: textColor }}>
          {darkBg ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Main focus area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">

        {/* Interval selector (only in ready phase) */}
        {phase === 'ready' && (
          <div className="flex gap-2 flex-wrap justify-center">
            {INTERVALS.map(({ label, seconds: s }) => (
              <button key={s} onClick={() => { setSeconds(s); setTotal(s); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: totalSeconds === s ? (darkBg ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') : 'transparent',
                  color:      textColor,
                  border:     `1px solid ${totalSeconds === s ? textColor : 'transparent'}`,
                }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Timer circle */}
        <div className="relative">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none"
              stroke={darkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
              strokeWidth="10" />
            <circle cx="110" cy="110" r={radius} fill="none"
              stroke={darkBg ? '#d1a070' : '#8f6540'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circum}
              strokeDashoffset={circum * (1 - pct / 100)}
              style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black font-mono" style={{ color: textColor }}>
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
            </span>
            <span className="text-xs mt-1" style={{ color: mutedColor }}>
              {phase === 'ready' ? 'ready' : phase === 'focus' ? 'focus' : phase === 'done' ? 'done! 🎉' : 'break'}
            </span>
          </div>
        </div>

        {/* Quote */}
        {running && (
          <p className="text-sm italic text-center max-w-xs animate-fade-in"
            style={{ color: mutedColor, fontFamily: 'var(--font-display)' }}>
            "{quote}"
          </p>
        )}

        {/* Pages counter */}
        {phase !== 'ready' && (
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ color: mutedColor }}>Pages read:</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPagesRead(p => Math.max(0, p - 1))}
                className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                style={{ background: 'rgba(128,128,128,0.2)', color: textColor }}>−</button>
              <span className="text-xl font-black w-10 text-center" style={{ color: textColor }}>{pagesRead}</span>
              <button onClick={() => setPagesRead(p => p + 1)}
                className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                style={{ background: 'rgba(128,128,128,0.2)', color: textColor }}>+</button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {phase === 'ready' ? (
            <button onClick={handleStart}
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl shadow-2xl transition-transform hover:scale-105"
              style={{ background: darkBg ? '#d1a070' : '#8f6540', color: darkBg ? '#1a1008' : '#fff' }}>
              <Play size={28} fill="currentColor" />
            </button>
          ) : phase === 'done' ? (
            <button onClick={handleFinish}
              className="px-8 py-4 rounded-2xl font-bold text-sm shadow-2xl"
              style={{ background: darkBg ? '#d1a070' : '#8f6540', color: darkBg ? '#1a1008' : '#fff' }}>
              🎉 Save Session
            </button>
          ) : (
            <>
              <button onClick={() => setRunning(r => !r)}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105"
                style={{ background: 'rgba(128,128,128,0.2)', color: textColor }}>
                {running ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}
              </button>
              <button onClick={handleFinish}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105"
                style={{ background: darkBg ? '#d1a070' : '#8f6540', color: darkBg ? '#1a1008' : '#fff' }}>
                <SkipForward size={22} />
              </button>
            </>
          )}
        </div>

        {/* Ambient sound picker */}
        {phase === 'ready' && (
          <div className="space-y-2 w-full max-w-xs">
            <p className="text-xs text-center" style={{ color: mutedColor }}>Ambient sound</p>
            <div className="flex gap-2 justify-center">
              {AMBIENT_SOUNDS.map(s => (
                <button key={s.id} onClick={() => setSound(s.id)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: sound === s.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: textColor,
                    border: `1px solid ${sound === s.id ? textColor : 'transparent'}`,
                  }}>
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-[10px]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
