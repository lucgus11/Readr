import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Cloud Sync ───────────────────────────────────────────────────────────────

export async function syncBooksToCloud(books: unknown[]) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase.from('user_books').upsert(
    books.map((b: unknown) => ({ ...(b as object), user_id: session.user.id })),
    { onConflict: 'id' }
  );
  return error;
}

export async function fetchBooksFromCloud() {
  const session = await getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('user_books')
    .select('*')
    .eq('user_id', session.user.id);
  return data || [];
}

export async function syncNotesToCloud(notes: unknown[]) {
  const session = await getSession();
  if (!session) return;

  const { error } = await supabase.from('book_notes').upsert(
    notes.map((n: unknown) => ({ ...(n as object), user_id: session.user.id })),
    { onConflict: 'id' }
  );
  return error;
}

export async function fetchNotesFromCloud() {
  const session = await getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('book_notes')
    .select('*')
    .eq('user_id', session.user.id);
  return data || [];
}
