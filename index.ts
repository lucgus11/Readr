// ─── Book & Library ───────────────────────────────────────────────────────────

export type ReadingStatus = 'want_to_read' | 'reading' | 'read' | 'dnf';

export interface Book {
  id: string;
  title: string;
  authors: string[];
  cover?: string;
  description?: string;
  pageCount?: number;
  publishedDate?: string;
  isbn?: string;
  categories?: string[];
  language?: string;
  averageRating?: number;
  source: 'openlibrary' | 'google' | 'manual';
}

export interface UserBook extends Book {
  status: ReadingStatus;
  currentPage: number;
  userRating?: number;
  review?: string;
  startDate?: string;
  finishDate?: string;
  addedAt: string;
  updatedAt: string;
  readingTime?: number; // minutes
  favorite?: boolean;
  tags?: string[];
}

// ─── Notes & Highlights ───────────────────────────────────────────────────────

export type NoteType = 'note' | 'highlight' | 'quote';

export interface BookNote {
  id: string;
  bookId: string;
  bookTitle: string;
  type: NoteType;
  content: string;
  page?: number;
  chapter?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Reading Sessions ─────────────────────────────────────────────────────────

export interface ReadingSession {
  id: string;
  bookId: string;
  bookTitle: string;
  startTime: string;
  endTime?: string;
  pagesRead: number;
  duration: number; // seconds
  date: string; // YYYY-MM-DD
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface ReadingGoal {
  id: string;
  type: 'daily_pages' | 'yearly_books' | 'monthly_books' | 'daily_minutes';
  target: number;
  current: number;
  year?: number;
  month?: number;
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export interface Quote {
  id: string;
  content: string;
  author: string;
  tags?: string[];
  source?: 'api' | 'user';
  savedAt?: string;
}

// ─── User & Settings ──────────────────────────────────────────────────────────

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  fontFamily: string;
  readingGoalPages: number;
  readingGoalBooks: number;
  notifications: boolean;
  language: string;
  colorScheme: 'ink' | 'ocean' | 'forest' | 'rose';
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface ReadingStats {
  totalBooks: number;
  booksRead: number;
  totalPages: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  avgRating: number;
  favoriteGenre?: string;
  booksThisYear: number;
  booksThisMonth: number;
  pagesThisWeek: number[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  language?: string[];
  number_of_pages_median?: number;
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    categories?: string[];
    averageRating?: number;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
  };
}
