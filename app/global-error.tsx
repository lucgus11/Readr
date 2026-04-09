'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Readr Error]', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-amber-50">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Something went wrong
          </h2>
          <p className="text-sm text-stone-500 mb-6 max-w-xs">
            {error.message || 'An unexpected error occurred. Your data is safe in local storage.'}
          </p>
          <div className="flex gap-3">
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: '#8f6540' }}>
              <RefreshCw size={14} /> Try again
            </button>
            <a href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-stone-300">
              <Home size={14} /> Go home
            </a>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs text-stone-400 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
