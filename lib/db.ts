import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { UserBook, BookNote, ReadingSession, ReadingGoal, Quote, UserSettings } from '@/types';

interface ReadrDB extends DBSchema {
  books: {
    key: string;
    value: UserBook;
    indexes: { 'by-status': string; 'by-addedAt': string };
  };
  notes: {
    key: string;
    value: BookNote;
    indexes: { 'by-bookId': string; 'by-createdAt': string };
  };
  sessions: {
    key: string;
    value: ReadingSession;
    indexes: { 'by-bookId': string; 'by-date': string };
  };
  goals: {
    key: string;
    value: ReadingGoal;
  };
  quotes: {
    key: string;
    value: Quote;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  cache: {
    key: string;
    value: { key: string; data: unknown; expiresAt: number };
  };
}

let db: IDBPDatabase<ReadrDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ReadrDB>> {
  if (db) return db;
  db = await openDB<ReadrDB>('readr-db', 1, {
    upgrade(db) {
      // Books store
      const bookStore = db.createObjectStore('books', { keyPath: 'id' });
      bookStore.createIndex('by-status', 'status');
      bookStore.createIndex('by-addedAt', 'addedAt');

      // Notes store
      const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
      noteStore.createIndex('by-bookId', 'bookId');
      noteStore.createIndex('by-createdAt', 'createdAt');

      // Sessions store
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('by-bookId', 'bookId');
      sessionStore.createIndex('by-date', 'date');

      // Goals store
      db.createObjectStore('goals', { keyPath: 'id' });

      // Quotes store
      db.createObjectStore('quotes', { keyPath: 'id' });

      // Settings store
      db.createObjectStore('settings', { keyPath: 'key' });

      // Cache store
      db.createObjectStore('cache', { keyPath: 'key' });
    },
  });
  return db;
}

// ─── Books ────────────────────────────────────────────────────────────────────

export async function getAllBooks(): Promise<UserBook[]> {
  const db = await getDB();
  return db.getAll('books');
}

export async function getBooksByStatus(status: UserBook['status']): Promise<UserBook[]> {
  const db = await getDB();
  return db.getAllFromIndex('books', 'by-status', status);
}

export async function getBook(id: string): Promise<UserBook | undefined> {
  const db = await getDB();
  return db.get('books', id);
}

export async function saveBook(book: UserBook): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('books', id);
}

export async function updateBookProgress(id: string, page: number, readingTime?: number): Promise<void> {
  const db = await getDB();
  const book = await db.get('books', id);
  if (book) {
    book.currentPage = page;
    book.updatedAt = new Date().toISOString();
    if (readingTime) book.readingTime = (book.readingTime || 0) + readingTime;
    await db.put('books', book);
  }
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getAllNotes(): Promise<BookNote[]> {
  const db = await getDB();
  return db.getAll('notes');
}

export async function getNotesByBook(bookId: string): Promise<BookNote[]> {
  const db = await getDB();
  return db.getAllFromIndex('notes', 'by-bookId', bookId);
}

export async function saveNote(note: BookNote): Promise<void> {
  const db = await getDB();
  await db.put('notes', note);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}

// ─── Reading Sessions ─────────────────────────────────────────────────────────

export async function getAllSessions(): Promise<ReadingSession[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function getSessionsByDate(date: string): Promise<ReadingSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-date', date);
}

export async function saveSession(session: ReadingSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function getAllGoals(): Promise<ReadingGoal[]> {
  const db = await getDB();
  return db.getAll('goals');
}

export async function saveGoal(goal: ReadingGoal): Promise<void> {
  const db = await getDB();
  await db.put('goals', goal);
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export async function getSavedQuotes(): Promise<Quote[]> {
  const db = await getDB();
  return db.getAll('quotes');
}

export async function saveQuote(quote: Quote): Promise<void> {
  const db = await getDB();
  await db.put('quotes', { ...quote, savedAt: new Date().toISOString() });
}

export async function deleteQuote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('quotes', id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings | undefined> {
  const db = await getDB();
  const result = await db.get('settings', 'user-settings');
  return result as unknown as UserSettings | undefined;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'user-settings', ...settings } as unknown as UserSettings);
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export async function getCached<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const entry = await db.get('cache', key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    await db.delete('cache', key);
    return null;
  }
  return entry.data as T;
}

export async function setCached<T>(key: string, data: T, ttlMs = 3600000): Promise<void> {
  const db = await getDB();
  await db.put('cache', { key, data, expiresAt: Date.now() + ttlMs });
}

// ─── Stats computation ────────────────────────────────────────────────────────

export async function computeStats() {
  const [books, sessions] = await Promise.all([getAllBooks(), getAllSessions()]);

  const booksRead = books.filter(b => b.status === 'read').length;
  const totalPages = books.filter(b => b.status === 'read').reduce((s, b) => s + (b.pageCount || 0), 0);
  const totalMinutes = sessions.reduce((s, sess) => s + Math.floor(sess.duration / 60), 0);

  const ratings = books.filter(b => b.userRating).map(b => b.userRating!);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  // Streak calculation
  const today = new Date().toISOString().split('T')[0];
  const sessionDates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();
  let streak = 0;
  let checkDate = today;
  for (const date of sessionDates) {
    if (date === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    } else break;
  }

  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth();
  const booksThisYear = books.filter(b => b.finishDate?.startsWith(String(thisYear))).length;
  const booksThisMonth = books.filter(b => {
    if (!b.finishDate) return false;
    const d = new Date(b.finishDate);
    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
  }).length;

  // Pages this week (last 7 days)
  const pagesThisWeek = Array(7).fill(0);
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.date === dateStr);
    pagesThisWeek[6 - i] = daySessions.reduce((s, sess) => s + sess.pagesRead, 0);
  }

  const genreCounts: Record<string, number> = {};
  books.forEach(b => b.categories?.forEach(c => { genreCounts[c] = (genreCounts[c] || 0) + 1; }));
  const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    totalBooks: books.length,
    booksRead,
    totalPages,
    totalMinutes,
    currentStreak: streak,
    longestStreak: streak, // simplified
    avgRating,
    favoriteGenre,
    booksThisYear,
    booksThisMonth,
    pagesThisWeek,
  };
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export async function exportData(): Promise<string> {
  const [books, notes, sessions, goals, quotes] = await Promise.all([
    getAllBooks(), getAllNotes(), getAllSessions(), getAllGoals(), getSavedQuotes()
  ]);
  return JSON.stringify({ books, notes, sessions, goals, quotes, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  const db = await getDB();
  const tx = db.transaction(['books', 'notes', 'sessions', 'goals', 'quotes'], 'readwrite');
  for (const book of data.books || []) await tx.objectStore('books').put(book);
  for (const note of data.notes || []) await tx.objectStore('notes').put(note);
  for (const session of data.sessions || []) await tx.objectStore('sessions').put(session);
  for (const goal of data.goals || []) await tx.objectStore('goals').put(goal);
  for (const quote of data.quotes || []) await tx.objectStore('quotes').put(quote);
  await tx.done;
}
