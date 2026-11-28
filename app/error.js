'use client';

import { useEffect, useState } from 'react';

/**
 * App-level error boundary.
 *
 * Sabse common "Application error: a client-side exception" ki wajah:
 * Vercel par naya deploy hua, aur purana tab ab bhi purane chunk
 * (/ _next/static/chunks/…-OLDHASH.js) maang raha hai → 404 →
 * React crash. User ko sirf reload karna hota hai.
 *
 * Isliye: chunk/loading error ho to khud ek baar reload kar dete hain,
 * warna ek saaf RK page dikhate hain (black screen nahi).
 */

const RELOAD_KEY = 'rk-crash-reload';

function looksLikeStaleChunk(error) {
  const text = `${error?.name || ''} ${error?.message || ''} ${error?.stack || ''}`;
  return /ChunkLoadError|Loading chunk .* failed|Importing a module script failed|Failed to fetch dynamically imported module|dynamically imported module/i.test(
    text,
  );
}

export default function Error({ error, reset }) {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const isStale = looksLikeStaleChunk(error);
    setStale(isStale);

    // Ek hi baar auto-reload (loop na ho)
    if (isStale && typeof window !== 'undefined') {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (Date.now() - last > 15000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    }
  }, [error]);

  const hardReload = () => {
    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {}
    window.location.href = '/studio';
    window.location.reload();
  };

  return (
    <div className="rk-crash">
      <div className="rk-crash-card">
        <div className="rk-crash-emoji">🔧</div>
        <h1>{stale ? 'Naya version aa gaya' : 'Kuch gadbad ho gayi'}</h1>
        <p>
          {stale
            ? 'App update hua tha, isliye purana tab atak gaya. Ek reload se theek ho jayega.'
            : 'Ghabrao mat — aapka kaam safe hai (browser me save hai). Neeche se reload karo.'}
        </p>

        <div className="rk-crash-actions">
          <button className="rk-primary" onClick={hardReload}>
            ↻ Reload karo
          </button>
          <button
            className="rk-btn-ghost"
            onClick={() => {
              try {
                reset();
              } catch {
                window.location.reload();
              }
            }}
          >
            Phir se try karo
          </button>
        </div>

        <details className="rk-crash-details">
          <summary>Technical detail (screenshot bhejne ke liye)</summary>
          <pre>{error?.message || 'unknown error'}</pre>
        </details>

        <p className="rk-crash-foot">
          Baar-baar aaye to <a href="/studio">Studio</a> kholo ya browser ka cache clear karo.
        </p>
      </div>
    </div>
  );
}
