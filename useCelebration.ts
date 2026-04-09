import { useCallback } from 'react';

// Lightweight confetti without external deps
function launchConfetti(options?: { count?: number; spread?: number; colors?: string[] }) {
  const { count = 80, spread = 70, colors = ['#a97d4f', '#d1a070', '#f2dfc0', '#4a3326', '#8f6540', '#fff'] } = options || {};

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    pointer-events:none; z-index:9999;
  `;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  interface Particle {
    x: number; y: number; vx: number; vy: number;
    color: string; size: number; rotation: number; rotSpeed: number; alpha: number;
  }

  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * spread * 0.1,
    vy: Math.random() * 3 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 10,
    alpha: 1,
  }));

  let frame: number;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.08; // gravity
      p.rotation += p.rotSpeed;
      p.alpha -= 0.008;
      if (p.alpha <= 0 || p.y > canvas.height) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (alive) { frame = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(frame); canvas.remove(); }
  };
  frame = requestAnimationFrame(tick);
}

function launchEmojiRain(emojis = ['📚', '⭐', '🎉', '📖', '🏆'], count = 20) {
  const els: HTMLDivElement[] = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = `
      position:fixed;
      top:-40px;
      left:${Math.random() * 100}%;
      font-size:${Math.random() * 20 + 16}px;
      pointer-events:none;
      z-index:9999;
      animation:emojiRain ${Math.random() * 2 + 1.5}s linear forwards;
      animation-delay:${Math.random() * 0.8}s;
    `;
    document.body.appendChild(el);
    els.push(el);
    setTimeout(() => el.remove(), 3500);
  }
}

// Inject keyframes once
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes emojiRain {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

export function useCelebration() {
  const celebrate = useCallback((type: 'book_finished' | 'streak' | 'goal' | 'milestone' = 'book_finished') => {
    switch (type) {
      case 'book_finished':
        launchConfetti({ count: 120, spread: 90 });
        launchEmojiRain(['📚', '🎉', '✅', '⭐', '🌟']);
        break;
      case 'streak':
        launchConfetti({ count: 60, colors: ['#f59e0b', '#fcd34d', '#fef08a'] });
        launchEmojiRain(['🔥', '⚡', '💪', '🏃']);
        break;
      case 'goal':
        launchConfetti({ count: 100 });
        launchEmojiRain(['🎯', '🏆', '🥇', '✨', '💫']);
        break;
      case 'milestone':
        launchConfetti({ count: 80 });
        launchEmojiRain(['🎊', '🎉', '🌟', '⭐']);
        break;
    }
  }, []);

  const celebrateBookFinished = useCallback(() => celebrate('book_finished'), [celebrate]);
  const celebrateStreak       = useCallback((days: number) => {
    if (days % 7 === 0 || days === 3 || days === 30 || days === 100) celebrate('streak');
  }, [celebrate]);
  const celebrateGoal         = useCallback(() => celebrate('goal'), [celebrate]);

  return { celebrate, celebrateBookFinished, celebrateStreak, celebrateGoal };
}
