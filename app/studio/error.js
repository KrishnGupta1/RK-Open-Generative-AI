'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Studio ke andar ka error boundary.
 *
 * Poora app crash hone se bachata hai: sirf ek studio tab fail hota hai,
 * sidebar aur baaki 15 studio chalte rehte hain.
 *
 * Do case:
 *   1) stale chunk (naya deploy, purana tab) → ek baar auto reload
 *   2) koi studio ka apna error (jaise canvas library) → saaf message +
 *      "Studio par wapas jao" — design-agent crash se baaki app na bande
 */
export default function StudioError({ error, reset }) {
  useEffect(() => {
    const text = `${error?.name || ''} ${error?.message || ''} ${error?.stack || ''}`;
    const stale = /ChunkLoadError|Loading chunk .* failed|Failed to fetch dynamically imported module/i.test(text);
    if (stale) {
      const last = Number(sessionStorage.getItem('rk-crash-reload') || 0);
      if (Date.now() - last > 15000) {
        sessionStorage.setItem('rk-crash-reload', String(Date.now()));
        window.location.reload();
      }
    }
    // eslint-disable-next-line no-console
    console.error('[rk-studio]', error);
  }, [error]);

  const isCanvas = /react-konva|konva|Canvas|design-agent/i.test(`${error?.message || ''}`);

  return (
    <div className="rk-studio-error">
      <div className="rk-studio-error-box">
        <div className="rk-studio-error-emoji">🧩</div>
        <h2>{isCanvas ? 'Ye studio abhi load nahi hua' : 'Ye tab atak gaya'}</h2>
        <p>
          {isCanvas
            ? 'Sirf yahi ek studio band hai — baaki sab chal rahe hain. Design Agent ka canvas abhi theek ho raha hai.'
            : 'Sirf yahi tab atka. Baaki studio chal rahe hain.'}
        </p>

        <div className="rk-studio-error-actions">
          <button
            className="rk-primary"
            onClick={() => {
              try {
                reset();
              } catch {
                window.location.reload();
              }
            }}
          >
            ↻ Phir se try karo
          </button>
          <Link href="/studio/image" className="rk-btn-ghost" style={{ textAlign: 'center' }}>
            Image Studio kholo
          </Link>
        </div>

        <details className="rk-crash-details">
          <summary>Technical detail</summary>
          <pre>{error?.message || 'unknown'}</pre>
        </details>
      </div>
    </div>
  );
}
