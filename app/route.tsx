import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title  = searchParams.get('title')  || 'Readr';
  const author = searchParams.get('author') || '';
  const cover  = searchParams.get('cover')  || '';
  const status = searchParams.get('status') || 'reading';

  const STATUS_EMOJI: Record<string, string> = {
    reading:      '📖 Currently Reading',
    read:         '✅ Finished',
    want_to_read: '📚 Want to Read',
    dnf:          '❌ Did Not Finish',
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #4a3326 0%, #8f6540 60%, #d1a070 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}>

        {/* Background texture pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.2) 0%, transparent 50%)',
        }} />

        {/* Book cover */}
        {cover && (
          <div style={{ position: 'absolute', right: 80, top: 80, display: 'flex' }}>
            <img src={cover} width={200} height={300}
              style={{ borderRadius: 16, boxShadow: '8px 8px 40px rgba(0,0,0,0.5)', objectFit: 'cover' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px 80px 80px', flex: 1, gap: 16 }}>
          {/* App badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 32 }}>📚</div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: 600, letterSpacing: 2 }}>READR</span>
          </div>

          {/* Status */}
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 500 }}>
            {STATUS_EMOJI[status] || STATUS_EMOJI.reading}
          </span>

          {/* Title */}
          <div style={{ fontSize: 56, fontWeight: 900, color: 'white', lineHeight: 1.1, maxWidth: 700 }}>
            {title.length > 50 ? title.slice(0, 47) + '…' : title}
          </div>

          {/* Author */}
          {author && (
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24, fontWeight: 400, fontStyle: 'italic' }}>
              by {author}
            </span>
          )}

          {/* Bottom */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>readr.app</span>
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    }
  );
}
