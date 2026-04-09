/**
 * lib/sync.ts
 * Offline-first sync queue — stores mutations locally and replays them
 * when the user comes back online. Works with Supabase.
 */

import { getDB } from './db';
import { supabase, getSession } from './supabase';

export type SyncOperation = 'upsert' | 'delete';
export type SyncTable     = 'user_books' | 'book_notes' | 'reading_sessions' | 'reading_goals' | 'saved_quotes';

export interface SyncItem {
  id:        string;
  table:     SyncTable;
  operation: SyncOperation;
  data:      Record<string, unknown>;
  createdAt: string;
  retries:   number;
}

const SYNC_STORE_KEY = 'readr-sync-queue';

function loadQueue(): SyncItem[] {
  try { return JSON.parse(localStorage.getItem(SYNC_STORE_KEY) || '[]'); }
  catch { return []; }
}

function saveQueue(q: SyncItem[]) {
  try { localStorage.setItem(SYNC_STORE_KEY, JSON.stringify(q)); }
  catch {}
}

/** Enqueue an operation to be synced when online */
export function enqueueSync(
  table: SyncTable,
  operation: SyncOperation,
  data: Record<string, unknown>
) {
  const queue = loadQueue();
  const item: SyncItem = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    table,
    operation,
    data,
    createdAt: new Date().toISOString(),
    retries:   0,
  };
  // Deduplicate: if same table+data.id upsert exists, replace it
  const filtered = operation === 'upsert'
    ? queue.filter(q => !(q.table === table && q.data.id === data.id && q.operation === 'upsert'))
    : queue.filter(q => !(q.table === table && q.data.id === data.id));
  saveQueue([...filtered, item]);
}

/** Process the sync queue — call this when app goes online */
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const session = await getSession();
  if (!session) return { synced: 0, failed: 0 };

  const queue = loadQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  const remaining: SyncItem[] = [];

  for (const item of queue) {
    try {
      if (item.operation === 'upsert') {
        const { error } = await supabase
          .from(item.table)
          .upsert({ ...item.data, user_id: session.user.id }, { onConflict: 'id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.data.id)
          .eq('user_id', session.user.id);
        if (error) throw error;
      }
      synced++;
    } catch (err) {
      console.warn('[Sync] Failed to sync item:', item.id, err);
      failed++;
      if (item.retries < 3) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    }
  }

  saveQueue(remaining);
  return { synced, failed };
}

/** Sync count for UI badge */
export function getPendingSyncCount(): number {
  return loadQueue().length;
}

/** Pull remote changes and merge with local */
export async function pullFromCloud(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const db = await getDB();

  // Fetch all user data from Supabase
  const [booksRes, notesRes, sessionsRes] = await Promise.all([
    supabase.from('user_books').select('*').eq('user_id', session.user.id),
    supabase.from('book_notes').select('*').eq('user_id', session.user.id),
    supabase.from('reading_sessions').select('*').eq('user_id', session.user.id),
  ]);

  if (booksRes.data) {
    const tx = db.transaction('books', 'readwrite');
    for (const b of booksRes.data) await tx.store.put(b);
    await tx.done;
  }

  if (notesRes.data) {
    const tx = db.transaction('notes', 'readwrite');
    for (const n of notesRes.data) await tx.store.put(n);
    await tx.done;
  }

  if (sessionsRes.data) {
    const tx = db.transaction('sessions', 'readwrite');
    for (const s of sessionsRes.data) await tx.store.put(s);
    await tx.done;
  }
}

/** Hook into window online event to auto-sync */
export function initAutoSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('[Sync] Back online — processing queue…');
    const result = await processSyncQueue();
    if (result.synced > 0) {
      console.log(`[Sync] ✅ Synced ${result.synced} items`);
    }
  });
}

/** Full export to JSON (for download) */
export async function fullExport(): Promise<string> {
  const db = await getDB();
  const [books, notes, sessions, goals, quotes] = await Promise.all([
    db.getAll('books'),
    db.getAll('notes'),
    db.getAll('sessions'),
    db.getAll('goals'),
    db.getAll('quotes'),
  ]);
  return JSON.stringify(
    { books, notes, sessions, goals, quotes, exportedAt: new Date().toISOString(), version: '1.0' },
    null, 2
  );
}
