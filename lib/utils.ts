import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(new Date(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m % 60}m`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function readingProgress(currentPage: number, totalPages?: number): number {
  if (!totalPages || totalPages === 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 100));
}

export function estimateReadingTime(remainingPages: number, pagesPerHour = 30): string {
  const hours = remainingPages / pagesPerHour;
  if (hours < 1) return `~${Math.round(hours * 60)} min left`;
  return `~${hours.toFixed(1)}h left`;
}

export function getReadingStreak(sessionDates: string[]): number {
  const today = new Date().toISOString().split('T')[0];
  const unique = Array.from(new Set(sessionDates)).sort().reverse();
  let streak = 0;
  let check = today;
  for (const d of unique) {
    if (d === check) {
      streak++;
      const dt = new Date(check);
      dt.setDate(dt.getDate() - 1);
      check = dt.toISOString().split('T')[0];
    } else if (d < check) break;
  }
  return streak;
}

export function getWeekDays(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });
}

export function ratingToStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const STATUS_LABELS: Record<string, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
};

export const STATUS_COLORS: Record<string, string> = {
  want_to_read: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  reading: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  read: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  dnf: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export const NOTE_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fb923c'];
