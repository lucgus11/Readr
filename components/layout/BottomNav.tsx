'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, BarChart2, StickyNote, Trophy } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',            label: 'Library',  icon: BookOpen },
  { href: '/discover',   label: 'Discover', icon: Compass },
  { href: '/stats',      label: 'Stats',    icon: BarChart2 },
  { href: '/notes',      label: 'Notes',    icon: StickyNote },
  { href: '/challenges', label: 'Goals',    icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const isOnline = useStore(s => s.isOnline);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
      {!isOnline && (
        <div className="text-center py-1 text-[11px] font-medium"
          style={{ background: '#92400e', color: '#fef3c7' }}>
          📴 Offline — data saved locally
        </div>
      )}
      <div className="flex items-center justify-around px-1 py-1"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 min-w-[52px]"
              style={{
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                opacity: active ? 1 : 0.65,
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
