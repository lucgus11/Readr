import { useEffect, useCallback, useState } from 'react';
import { useStore } from '@/store';
import { getAllBooks, getAllSessions, getAllNotes, computeStats } from '@/lib/db';
import type { ReadingStats } from '@/types';

// ─── useReadingData — load everything from IDB into store ─────────────────────
export function useReadingData() {
  const { setBooks, setNotes, setSessions, books } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [books, sessions, notes] = await Promise.all([
        getAllBooks(),
        getAllSessions(),
        getAllNotes(),
      ]);
      setBooks(books);
      setSessions(sessions);
      setNotes(notes);
      setLoading(false);
    }
    load();
  }, [setBooks, setSessions, setNotes]);

  return { loading, isEmpty: books.length === 0 };
}

// ─── useReadingStats ──────────────────────────────────────────────────────────
export function useReadingStats() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  const refresh = useCallback(() => {
    computeStats().then(setStats);
  }, []);

  return { stats, loading, refresh };
}

// ─── useKeyboardShortcuts ─────────────────────────────────────────────────────
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire inside inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = [
        e.metaKey || e.ctrlKey ? 'cmd' : '',
        e.shiftKey ? 'shift' : '',
        e.key.toLowerCase(),
      ].filter(Boolean).join('+');

      shortcuts[key]?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

// ─── useNotifications ─────────────────────────────────────────────────────────
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const settings = useStore(s => s.settings);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm === 'granted';
  }, []);

  const scheduleReadingReminder = useCallback(async (hour = 20) => {
    if (permission !== 'granted') return;
    if (!settings.notifications) return;

    // Register with Service Worker for background notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        hour,
        title: 'Time to read! 📚',
        body: 'Your daily reading streak is waiting.',
      });
    }
  }, [permission, settings.notifications]);

  const sendNotification = useCallback((title: string, body: string, icon = '/icons/icon-192.png') => {
    if (permission !== 'granted') return;
    new Notification(title, { body, icon });
  }, [permission]);

  return { permission, requestPermission, scheduleReadingReminder, sendNotification };
}

// ─── useOnlineStatus ──────────────────────────────────────────────────────────
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return online;
}

// ─── useDebounce ──────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback((v: T) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);

  return [value, set];
}

// ─── useSwipe — for mobile swipe gestures ────────────────────────────────────
export function useSwipe(onLeft?: () => void, onRight?: () => void, threshold = 50) {
  const startX = useCallback((ref: HTMLElement | null) => {
    if (!ref) return;
    let sx = 0;
    const start = (e: TouchEvent) => { sx = e.touches[0].clientX; };
    const end = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > threshold) {
        if (dx < 0) onLeft?.();
        else onRight?.();
      }
    };
    ref.addEventListener('touchstart', start, { passive: true });
    ref.addEventListener('touchend', end, { passive: true });
    return () => { ref.removeEventListener('touchstart', start); ref.removeEventListener('touchend', end); };
  }, [onLeft, onRight, threshold]);

  return startX;
}
