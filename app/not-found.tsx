import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}>
      <p className="text-7xl mb-4">📚</p>
      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        This chapter doesn't exist in our library.
      </p>
      <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm font-medium inline-flex items-center gap-2">
        ← Back to Library
      </Link>
    </div>
  );
}
