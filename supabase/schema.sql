-- ─── Readr Supabase Schema ───────────────────────────────────────────────────
-- Run this in your Supabase SQL editor

-- Enable RLS
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- ─── User Books ───────────────────────────────────────────────────────────────
create table if not exists public.user_books (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  authors       text[] default '{}',
  cover         text,
  description   text,
  page_count    int,
  published_date text,
  isbn          text,
  categories    text[] default '{}',
  language      text,
  average_rating float,
  source        text default 'openlibrary',
  status        text not null default 'want_to_read',
  current_page  int default 0,
  user_rating   float,
  review        text,
  start_date    text,
  finish_date   text,
  added_at      timestamptz default now(),
  updated_at    timestamptz default now(),
  reading_time  int default 0,
  favorite      boolean default false,
  tags          text[] default '{}'
);

alter table public.user_books enable row level security;

create policy "Users can CRUD their own books"
  on public.user_books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Book Notes ───────────────────────────────────────────────────────────────
create table if not exists public.book_notes (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  book_id     text not null,
  book_title  text,
  type        text not null default 'note', -- note | highlight | quote
  content     text not null,
  page        int,
  chapter     text,
  color       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.book_notes enable row level security;

create policy "Users can CRUD their own notes"
  on public.book_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Reading Sessions ─────────────────────────────────────────────────────────
create table if not exists public.reading_sessions (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  book_id     text not null,
  book_title  text,
  start_time  timestamptz,
  end_time    timestamptz,
  pages_read  int default 0,
  duration    int default 0, -- seconds
  date        text -- YYYY-MM-DD
);

alter table public.reading_sessions enable row level security;

create policy "Users can CRUD their own sessions"
  on public.reading_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Saved Quotes ─────────────────────────────────────────────────────────────
create table if not exists public.saved_quotes (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  content     text not null,
  author      text,
  tags        text[] default '{}',
  source      text,
  saved_at    timestamptz default now()
);

alter table public.saved_quotes enable row level security;

create policy "Users can CRUD their own quotes"
  on public.saved_quotes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Reading Goals ────────────────────────────────────────────────────────────
create table if not exists public.reading_goals (
  id      text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type    text not null,
  target  int not null,
  current int default 0,
  year    int,
  month   int
);

alter table public.reading_goals enable row level security;

create policy "Users can CRUD their own goals"
  on public.reading_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists user_books_user_id_idx on public.user_books(user_id);
create index if not exists user_books_status_idx on public.user_books(status);
create index if not exists book_notes_book_id_idx on public.book_notes(book_id);
create index if not exists reading_sessions_date_idx on public.reading_sessions(date);
