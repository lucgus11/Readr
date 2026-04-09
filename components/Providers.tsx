'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from '@/store';

function OnlineWatcher() {
  const setIsOnline = useStore(s => s.setIsOnline);

  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, [setIsOnline]);

  return null;
}

function ThemeWatcher() {
  const theme = useStore(s => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const update = (e: MediaQueryListEvent | MediaQueryList) => {
        e.matches ? root.classList.add('dark') : root.classList.remove('dark');
      };
      update(mq);
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnlineWatcher />
      <ThemeWatcher />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />
    </>
  );
}
