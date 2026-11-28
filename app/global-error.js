'use client';

import { useEffect } from 'react';

// Root layout crash (bahut rare) — black screen ki jagah saaf message.
export default function GlobalError({ error }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[rk] root error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#050506', color: '#f4f4f5', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>🔧</div>
            <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>Reload karo</h1>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#a1a1aa', margin: '0 0 18px' }}>
              App update hua hoga. Ek reload se theek ho jayega — aapka kaam safe hai.
            </p>
            <a
              href="/studio"
              style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 9, background: 'linear-gradient(135deg,#ef2b3d,#d4a537)', color: '#0a0a0a', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}
            >
              ↻ Studio kholo
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
