-- Run this in your Supabase SQL editor
-- https://app.supabase.com/project/<your-project>/sql

-- ─── User books ──────────────────────────────────────────────────────────────
create table if not exists public.user_books (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  authors text[] default '{}',
  cover text,
  description text,
  page_count integer,
  published_date text,
  isbn text,
  categories text[] default '{}',
  language text,
  average_rating real,
  source text default 'openlibrary',
  status text not null default 'want_to_read',
  current_page integer default 0,
  user_rating integer,
  review text,
  start_date text,
  finish_date text,
  added_at timestamptz default now(),
  updated_at timestamptz default now(),
  reading_time integer default 0,
  favorite boolean default false,
  tags text[] default '{}'
);

alter table public.user_books enable row level security;

create policy "Users can manage their own books"
  on public.user_books
  for all
  using (auth.uid() = user_id);

-- ─── Book notes ───────────────────────────────────────────────────────────────
create table if not exists public.book_notes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id text not null,
  book_title text,
  type text not null default 'note',
  content text not null,
  page integer,
  chapter text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.book_notes enable row level security;

create policy "Users can manage their own notes"
  on public.book_notes
  for all
  using (auth.uid() = user_id);

-- ─── Reading sessions ─────────────────────────────────────────────────────────
create table if not exists public.reading_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id text not null,
  book_title text,
  start_time timestamptz,
  end_time timestamptz,
  pages_read integer default 0,
  duration integer default 0,
  date text
);

alter table public.reading_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.reading_sessions
  for all
  using (auth.uid() = user_id);

-- ─── Saved quotes ─────────────────────────────────────────────────────────────
create table if not exists public.saved_quotes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  author text,
  tags text[] default '{}',
  source text,
  saved_at timestamptz default now()
);

alter table public.saved_quotes enable row level security;

create policy "Users can manage their own quotes"
  on public.saved_quotes
  for all
  using (auth.uid() = user_id);

-- ─── Reading goals ────────────────────────────────────────────────────────────
create table if not exists public.reading_goals (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  target integer not null,
  current integer default 0,
  year integer,
  month integer
);

alter table public.reading_goals enable row level security;

create policy "Users can manage their own goals"
  on public.reading_goals
  for all
  using (auth.uid() = user_id);
