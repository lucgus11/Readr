import type { Book, OpenLibraryBook, GoogleBook, Quote } from '@/types';
import { getCached, setCached } from './db';

// ─── Open Library ─────────────────────────────────────────────────────────────

export async function searchOpenLibrary(query: string, limit = 20): Promise<Book[]> {
  const cacheKey = `ol-search-${query}-${limit}`;
  const cached = await getCached<Book[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,cover_i,first_publish_year,isbn,subject,language,number_of_pages_median`
    );
    const data = await res.json();
    const books: Book[] = (data.docs || []).map((b: OpenLibraryBook) => ({
      id: `ol-${b.key.replace('/works/', '')}`,
      title: b.title,
      authors: b.author_name || ['Unknown Author'],
      cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : undefined,
      pageCount: b.number_of_pages_median,
      publishedDate: b.first_publish_year?.toString(),
      isbn: b.isbn?.[0],
      categories: b.subject?.slice(0, 5),
      language: b.language?.[0],
      source: 'openlibrary' as const,
    }));
    await setCached(cacheKey, books, 3600000);
    return books;
  } catch {
    return [];
  }
}

export async function getOpenLibraryBook(workId: string): Promise<Partial<Book> | null> {
  const cacheKey = `ol-book-${workId}`;
  const cached = await getCached<Partial<Book>>(cacheKey);
  if (cached) return cached;

  try {
    const [workRes, descRes] = await Promise.all([
      fetch(`https://openlibrary.org/works/${workId}.json`),
      fetch(`https://openlibrary.org/works/${workId}.json`),
    ]);
    const work = await workRes.json();
    const description = typeof work.description === 'string'
      ? work.description
      : work.description?.value || '';
    const result = { description };
    await setCached(cacheKey, result, 86400000);
    return result;
  } catch {
    return null;
  }
}

export async function getTrendingBooks(): Promise<Book[]> {
  const cacheKey = 'ol-trending';
  const cached = await getCached<Book[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('https://openlibrary.org/trending/weekly.json?limit=12');
    const data = await res.json();
    const books: Book[] = (data.works || []).map((b: OpenLibraryBook & { cover_edition_key?: string }) => ({
      id: `ol-${b.key.replace('/works/', '')}`,
      title: b.title,
      authors: b.author_name || ['Unknown Author'],
      cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : undefined,
      source: 'openlibrary' as const,
    }));
    await setCached(cacheKey, books, 3600000);
    return books;
  } catch {
    return [];
  }
}

export async function getBooksBySubject(subject: string, limit = 12): Promise<Book[]> {
  const cacheKey = `ol-subject-${subject}-${limit}`;
  const cached = await getCached<Book[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://openlibrary.org/subjects/${encodeURIComponent(subject.toLowerCase().replace(/ /g, '_'))}.json?limit=${limit}`
    );
    const data = await res.json();
    const books: Book[] = (data.works || []).map((b: { key: string; title: string; authors?: { name: string }[]; cover_id?: number; cover_edition_key?: string }) => ({
      id: `ol-${b.key.replace('/works/', '')}`,
      title: b.title,
      authors: b.authors?.map((a: { name: string }) => a.name) || ['Unknown Author'],
      cover: b.cover_id ? `https://covers.openlibrary.org/b/id/${b.cover_id}-L.jpg` : undefined,
      categories: [subject],
      source: 'openlibrary' as const,
    }));
    await setCached(cacheKey, books, 7200000);
    return books;
  } catch {
    return [];
  }
}

// ─── Google Books ─────────────────────────────────────────────────────────────

export async function searchGoogleBooks(query: string, limit = 20): Promise<Book[]> {
  const cacheKey = `gb-search-${query}-${limit}`;
  const cached = await getCached<Book[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}&key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || ''}`
    );
    const data = await res.json();
    const books: Book[] = (data.items || []).map((b: GoogleBook) => ({
      id: `gb-${b.id}`,
      title: b.volumeInfo.title,
      authors: b.volumeInfo.authors || ['Unknown Author'],
      cover: b.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
      description: b.volumeInfo.description,
      pageCount: b.volumeInfo.pageCount,
      publishedDate: b.volumeInfo.publishedDate,
      isbn: b.volumeInfo.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier,
      categories: b.volumeInfo.categories,
      averageRating: b.volumeInfo.averageRating,
      source: 'google' as const,
    }));
    await setCached(cacheKey, books, 3600000);
    return books;
  } catch {
    return [];
  }
}

// ─── Combined Search ──────────────────────────────────────────────────────────

export async function searchBooks(query: string): Promise<Book[]> {
  const [olResults, gbResults] = await Promise.allSettled([
    searchOpenLibrary(query, 15),
    searchGoogleBooks(query, 15),
  ]);

  const ol = olResults.status === 'fulfilled' ? olResults.value : [];
  const gb = gbResults.status === 'fulfilled' ? gbResults.value : [];

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const combined: Book[] = [];
  for (const book of [...gb, ...ol]) {
    const key = book.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(book);
    }
  }
  return combined.slice(0, 30);
}

// ─── Quotable API ─────────────────────────────────────────────────────────────

export async function getDailyQuote(): Promise<Quote | null> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `quote-daily-${today}`;
  const cached = await getCached<Quote>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch('https://api.quotable.io/random?tags=books|literature|reading|knowledge|wisdom|education&minLength=50&maxLength=200');
    const data = await res.json();
    const quote: Quote = {
      id: data._id || String(Date.now()),
      content: data.content,
      author: data.author,
      tags: data.tags,
      source: 'api',
    };
    await setCached(cacheKey, quote, 86400000);
    return quote;
  } catch {
    // Fallback quotes for offline
    const fallbacks: Quote[] = [
      { id: '1', content: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R.R. Martin', source: 'api' },
      { id: '2', content: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien', source: 'api' },
      { id: '3', content: 'So many books, so little time.', author: 'Frank Zappa', source: 'api' },
      { id: '4', content: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison', source: 'api' },
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export async function getQuotesByTag(tag: string): Promise<Quote[]> {
  try {
    const res = await fetch(`https://api.quotable.io/quotes?tags=${tag}&limit=10`);
    const data = await res.json();
    return (data.results || []).map((q: { _id: string; content: string; author: string; tags: string[] }) => ({
      id: q._id,
      content: q.content,
      author: q.author,
      tags: q.tags,
      source: 'api' as const,
    }));
  } catch {
    return [];
  }
}

// ─── Wikipedia Author Info ────────────────────────────────────────────────────

export async function getAuthorInfo(authorName: string): Promise<{ extract: string; thumbnail?: string; url: string } | null> {
  const cacheKey = `wiki-author-${authorName}`;
  const cached = await getCached<{ extract: string; thumbnail?: string; url: string }>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = {
      extract: data.extract,
      thumbnail: data.thumbnail?.source,
      url: data.content_urls?.desktop?.page,
    };
    await setCached(cacheKey, result, 86400000 * 7);
    return result;
  } catch {
    return null;
  }
}

// ─── Open Library Subjects ────────────────────────────────────────────────────

export const FEATURED_SUBJECTS = [
  { id: 'science_fiction', label: 'Sci-Fi', emoji: '🚀' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🧙' },
  { id: 'mystery', label: 'Mystery', emoji: '🔍' },
  { id: 'romance', label: 'Romance', emoji: '💕' },
  { id: 'biography', label: 'Biography', emoji: '👤' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'philosophy', label: 'Philosophy', emoji: '🤔' },
  { id: 'psychology', label: 'Psychology', emoji: '🧠' },
  { id: 'horror', label: 'Horror', emoji: '👻' },
  { id: 'thriller', label: 'Thriller', emoji: '⚡' },
];
