# 📚 Readr — Your Offline-First Reading Companion PWA

A beautiful, full-featured Progressive Web App for book lovers. Track your reading, discover books, save highlights and notes — **all offline**.

---

## ✨ Features

### 📱 PWA & Offline
- Full offline support via Service Worker + IndexedDB
- Smart caching of book covers and API responses
- Install banner (Android & iOS)
- App shortcuts in home screen
- Background sync when connection returns

### 📚 Library
- Add books from **Open Library** + **Google Books** (combined search)
- Track reading status: Want to Read / Reading / Read / DNF
- Progress tracking with page numbers
- Star ratings + personal reviews
- Favorites ❤️
- Sort & filter your collection

### 🔍 Discover
- Trending books from Open Library (weekly)
- Browse by genre (Sci-Fi, Fantasy, Mystery, Romance, etc.)
- Full-text search across both APIs
- Author biographies from **Wikipedia API**

### ⏱️ Reading Timer
- Pomodoro-style 25-minute sessions
- Track pages read per session
- Auto-save to reading history
- Streak tracking 🔥

### 📊 Statistics
- Books/pages/minutes overview
- Weekly pages chart (Recharts)
- Monthly reading trend
- Genre breakdown (pie chart)
- Rating distribution
- 🏅 Achievement badges
- Yearly/monthly reading goals

### 📝 Notes & Quotes
- Notes, highlights, and quotes per book
- Color-coded entries
- Daily literary quotes from **Quotable API**
- Save and organize favorite quotes
- Search & filter all notes

### ☁️ Cloud Sync (Supabase)
- Google OAuth sign-in
- Sync library to cloud
- Cross-device reading progress
- Secure RLS policies

---

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/readr
cd readr
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and optionally Google Books API key
```

### 3. Set up Supabase (optional, for cloud sync)
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Google Auth in Authentication > Providers
4. Copy your `URL` and `anon key` to `.env.local`

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
# Push to GitHub, then:
# 1. Import repo at vercel.com
# 2. Add environment variables in project settings
# 3. Deploy!
```

---

## 🔑 APIs Used

| API | Usage | Key Required |
|-----|-------|-------------|
| [Open Library](https://openlibrary.org/dev/docs/api) | Book search, trending, subjects | ❌ Free |
| [Google Books](https://developers.google.com/books) | Enhanced book search | ✅ Optional |
| [Quotable](https://api.quotable.io) | Literary quotes | ❌ Free |
| [Wikipedia](https://en.wikipedia.org/api/) | Author bios | ❌ Free |

---

## 🗂️ Project Structure

```
readr/
├── app/                   # Next.js 14 App Router pages
│   ├── page.tsx           # Library (home)
│   ├── discover/          # Book discovery
│   ├── stats/             # Reading statistics
│   ├── notes/             # Notes & quotes
│   ├── settings/          # Settings & data
│   └── auth/callback/     # Supabase OAuth callback
├── components/
│   ├── books/             # BookCard, Modals
│   ├── layout/            # BottomNav
│   ├── reader/            # ReadingTimer
│   └── ui/                # PWAInstallBanner
├── lib/
│   ├── api.ts             # All external API calls
│   ├── db.ts              # IndexedDB (idb)
│   ├── supabase.ts        # Auth + cloud sync
│   └── utils.ts           # Helpers
├── store/index.ts         # Zustand global state
├── types/index.ts         # TypeScript types
├── supabase/schema.sql    # Database schema
└── public/manifest.json   # PWA manifest
```

---

## 📦 Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — utility styles
- **Zustand** — global state with persistence
- **idb** — IndexedDB wrapper for offline storage
- **next-pwa** — Service Worker generation
- **Recharts** — Statistics charts
- **Framer Motion** — Animations
- **Supabase** — Auth + Postgres cloud sync
- **Radix UI** — Accessible primitives

---

## 🌐 Offline Capabilities

All core features work without internet:
- ✅ View entire library
- ✅ Update reading progress
- ✅ Add/edit/delete notes
- ✅ Use reading timer
- ✅ View all statistics
- ✅ Export/import data
- ⚠️ Searching new books (requires internet)
- ⚠️ Cloud sync (requires internet)

Book covers are cached after first load via Service Worker.
