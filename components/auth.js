// RK GEM AI — Google sign-in (optional) + account menu.
//
// Why optional: the app must work with zero setup. If
// NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are missing the button simply
// doesn't render and the chat stays browser-only.
//
// Sessions are used for two things:
//   1. Name/e-mail greeting + Google avatar.
//   2. Saving the user's own Gemini / provider keys to their account
//      (see app/api/rk/vault) instead of the browser — so the same
//      subscription works on phone and laptop.

'use client';

import { useCallback, useEffect, useState } from 'react';

let supabasePromise = null;

export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

async function getClient() {
  if (!supabaseConfigured()) return null;
  if (!supabasePromise) {
    supabasePromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } },
      ),
    );
  }
  return supabasePromise;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const client = await getClient();
      if (!client) {
        setReady(true);
        return;
      }
      const { data } = await client.auth.getSession();
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setReady(true);
      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
      });
      unsub = () => listener?.subscription?.unsubscribe?.();
    })();
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = await getClient();
    if (!client) throw new Error('Supabase not configured');
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          // Ask Google for an offline refresh token so the app can list the
          // user's own Gemini-enabled Google Cloud projects. If the Google
          // client is not approved for that scope, sign-in still works.
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid email profile https://www.googleapis.com/auth/cloud-platform.read-only',
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const client = await getClient();
    await client?.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return { user, session, ready, configured: supabaseConfigured(), signInWithGoogle, signOut };
}

export function Avatar({ user, size = 28 }) {
  const url = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Guest';
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="rk-avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="rk-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {String(name).slice(0, 1).toUpperCase()}
    </span>
  );
}

export function GoogleButton({ onError, label = 'Google se sign in karein' }) {
  const { signInWithGoogle, configured } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!configured) return null;
  return (
    <button
      type="button"
      className="rk-google"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signInWithGoogle();
        } catch (err) {
          onError?.(err.message);
          setBusy(false);
        }
      }}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C37 41.2 44 36 44 24c0-1.3-.1-2.6-.4-3.9z"/>
      </svg>
      {busy ? 'Google par le ja rahe hain…' : label}
    </button>
  );
}

export function AccountMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
  return (
    <div className="rk-account">
      <button className="rk-account-btn" onClick={() => setOpen((v) => !v)}>
        <Avatar user={user} size={26} />
        <span className="rk-account-name">{String(name || '').split(' ')[0]}</span>
      </button>
      {open && (
        <div className="rk-account-pop">
          <div className="rk-account-head">
            <Avatar user={user} size={34} />
            <div>
              <b>{name}</b>
              <small>{user?.email}</small>
            </div>
          </div>
          <a href="/settings" className="rk-account-item">Providers &amp; keys</a>
          <a href="/chat" className="rk-account-item">Chat</a>
          <button className="rk-account-item" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}

// Convenience for non-React callers (settings page): returns the current
// access token or null. Never throws.
export async function supabaseBrowserSession() {
  try {
    const client = await getClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}
