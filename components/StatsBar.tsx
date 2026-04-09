'use client';

import { useEffect, useState } from 'react';
import { Flame, BookOpen, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store';
import { computeStats } from '@/lib/db';
import { formatMinutes } from '@/lib/utils';
import type { ReadingStats } from '@/types';

export function StatsBar() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const goals = useStore(s => s.goals);

  useEffect(() => { computeStats().then(setStats); }, []);

  if (!stats) return null;

  const yearGoal = goals.find(g => g.type === 'yearly_books');
  const yearPct = yearGoal ? Math.min(100, (stats.booksThisYear / yearGoal.target) * 100) : null;

  return (
    <Link href="/stats" className="flex items-center gap-4 px-4 py-3 border-b overflow-x-auto"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      <Stat icon={Flame} value={stats.currentStreak} label="streak" color="#f59e0b" />
      <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />
      <Stat icon={BookOpen} value={stats.booksRead} label="read" color="var(--accent-primary)" />
      <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />
      <Stat icon={Clock} value={formatMinutes(stats.totalMinutes)} label="total" color="#10b981" />
      {yearGoal && yearPct !== null && (
        <>
          <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Target size={13} style={{ color: '#8b5cf6' }} />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {stats.booksThisYear}/{yearGoal.target}
                </span>
              </div>
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${yearPct}%`, background: '#8b5cf6' }} />
              </div>
            </div>
          </div>
        </>
      )}
    </Link>
  );
}

function Stat({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string | number; label: string; color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon size={13} style={{ color }} />
      <div>
        <p className="text-xs font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-[9px] leading-none mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
      </div>
    </div>
  );
}
