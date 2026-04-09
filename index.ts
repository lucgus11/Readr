import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserBook, BookNote, ReadingSession, ReadingGoal, UserSettings, Quote } from '@/types';

interface AppState {
  // Books
  books: UserBook[];
  setBooks: (books: UserBook[]) => void;
  addBook: (book: UserBook) => void;
  updateBook: (id: string, updates: Partial<UserBook>) => void;
  removeBook: (id: string) => void;

  // Notes
  notes: BookNote[];
  setNotes: (notes: BookNote[]) => void;
  addNote: (note: BookNote) => void;
  updateNote: (id: string, updates: Partial<BookNote>) => void;
  removeNote: (id: string) => void;

  // Sessions
  sessions: ReadingSession[];
  setSessions: (sessions: ReadingSession[]) => void;
  addSession: (session: ReadingSession) => void;
  activeSession: ReadingSession | null;
  setActiveSession: (session: ReadingSession | null) => void;

  // Goals
  goals: ReadingGoal[];
  setGoals: (goals: ReadingGoal[]) => void;
  upsertGoal: (goal: ReadingGoal) => void;

  // Saved Quotes
  savedQuotes: Quote[];
  setSavedQuotes: (quotes: Quote[]) => void;
  addSavedQuote: (quote: Quote) => void;
  removeSavedQuote: (id: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;

  // UI State
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  user: { id: string; email: string; name?: string; avatar?: string } | null;
  setUser: (user: AppState['user']) => void;
}

const defaultSettings: UserSettings = {
  theme: 'system',
  fontSize: 16,
  fontFamily: 'Georgia',
  readingGoalPages: 30,
  readingGoalBooks: 24,
  notifications: true,
  language: 'en',
  colorScheme: 'ink',
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      books: [],
      setBooks: (books) => set({ books }),
      addBook: (book) => set((s) => ({ books: [...s.books.filter(b => b.id !== book.id), book] })),
      updateBook: (id, updates) =>
        set((s) => ({ books: s.books.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b) })),
      removeBook: (id) => set((s) => ({ books: s.books.filter(b => b.id !== id) })),

      notes: [],
      setNotes: (notes) => set({ notes }),
      addNote: (note) => set((s) => ({ notes: [...s.notes.filter(n => n.id !== note.id), note] })),
      updateNote: (id, updates) =>
        set((s) => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n) })),
      removeNote: (id) => set((s) => ({ notes: s.notes.filter(n => n.id !== id) })),

      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set((s) => ({ sessions: [...s.sessions, session] })),
      activeSession: null,
      setActiveSession: (session) => set({ activeSession: session }),

      goals: [],
      setGoals: (goals) => set({ goals }),
      upsertGoal: (goal) =>
        set((s) => ({ goals: [...s.goals.filter(g => g.id !== goal.id), goal] })),

      savedQuotes: [],
      setSavedQuotes: (savedQuotes) => set({ savedQuotes }),
      addSavedQuote: (quote) => set((s) => ({ savedQuotes: [...s.savedQuotes.filter(q => q.id !== quote.id), quote] })),
      removeSavedQuote: (id) => set((s) => ({ savedQuotes: s.savedQuotes.filter(q => q.id !== id) })),

      settings: defaultSettings,
      updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),

      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      isOnline: true,
      setIsOnline: (isOnline) => set({ isOnline }),
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'readr-store',
      partialize: (state) => ({
        books: state.books,
        notes: state.notes,
        sessions: state.sessions,
        goals: state.goals,
        savedQuotes: state.savedQuotes,
        settings: state.settings,
        user: state.user,
      }),
    }
  )
);
