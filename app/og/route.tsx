import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #18181b 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#18181b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.04em',
            lineHeight: '1',
            marginBottom: '16px',
          }}
        >
          StockOS Pro
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: '500',
            color: '#a1a1aa',
            marginBottom: '40px',
          }}
        >
          Gestion commerciale pour PME en Afrique de l&apos;Ouest
        </div>

        {/* Features row */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            fontSize: '20px',
            fontWeight: '500',
            color: '#71717a',
            marginBottom: '48px',
          }}
        >
          <span>Facturation</span>
          <span style={{ color: '#52525b' }}>•</span>
          <span>Gestion de stock</span>
          <span style={{ color: '#52525b' }}>•</span>
          <span>Caisse enregistreuse</span>
          <span style={{ color: '#52525b' }}>•</span>
          <span>Rapports</span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, #22c55e, #3b82f6, #8b5cf6)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            left: '60px',
            fontSize: '20px',
            color: '#52525b',
          }}
        >
          stockos.site
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            right: '60px',
            fontSize: '20px',
            color: '#52525b',
          }}
        >
          Togo • Bénin • Côte d&apos;Ivoire • Sénégal
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
