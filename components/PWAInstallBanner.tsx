'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShow(false);
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 shadow-2xl animate-fade-up"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <button onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
        <X size={12} />
      </button>

      <div className="flex gap-3 items-start">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'var(--accent-primary)' }}>
          📚
        </div>
        <div className="flex-1 pr-4">
          <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Install Readr
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isIOS
              ? 'Tap the Share button then "Add to Home Screen"'
              : 'Install for offline reading, faster access & a native feel'}
          </p>
        </div>
      </div>

      {!isIOS && prompt && (
        <button onClick={handleInstall}
          className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm">
          <Download size={14} />
          Install App
        </button>
      )}

      {isIOS && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <Smartphone size={14} style={{ color: 'var(--accent-primary)' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Tap <strong>Share ↑</strong> → <strong>"Add to Home Screen"</strong>
          </p>
        </div>
      )}
    </div>
  );
}
