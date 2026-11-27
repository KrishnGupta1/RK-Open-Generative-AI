'use client';

// RK GEM AI — Google account ke saath Gemini ko "apna" banane wala panel.
//
// Flow (see docs/GOOGLE-GEMINI.md):
//   1. Google se sign in  → Supabase session
//   2. "Detect" dabayein → hum aapke Google Cloud projects check karte hain
//   3. Project ready hai  → ek click mein AI Studio API-key page khulta hai
//   4. Key paste karein   → account mein save (vault) ya browser mein
//
// Agar aapke paas Gemini subscription (Google AI Pro/Ultra ya Cloud billing
// wala plan) hai to usi project ki key use karne se usage aapke plan/credits
// se chalta hai — bilkul Antigravity/Cloud Code jaisa UX.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';

const STORE_KEY = 'rkgem.settings.v1';

function rememberKey(key, model) {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    raw.provider = 'gemini';
    raw.keys = { ...(raw.keys || {}), gemini: key };
    if (model) raw.model = model;
    localStorage.setItem(STORE_KEY, JSON.stringify(raw));
  } catch {}
}

export default function GoogleGeminiPanel({ onError, onSaved }) {
  const { user, session, configured, signInWithGoogle, signOut } = useAuth();
  const [state, setState] = useState('idle');
  const [data, setData] = useState(null);
  const [key, setKey] = useState('');
  const [saveMode, setSaveMode] = useState<'account' | 'browser'>('account');
  const [msg, setMsg] = useState('');

  // Load a previously saved Gemini key from the account vault.
  useEffect(() => {
    if (!session?.access_token) return;
    (async () => {
      try {
        const res = await fetch('/api/rk/vault', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.keys?.gemini?.apiKey) {
          setKey(json.keys.gemini.apiKey);
          rememberKey(json.keys.gemini.apiKey, json.keys.gemini.model);
          onSaved?.();
        }
      } catch {}
    })();
  }, [session?.access_token, onSaved]);

  const detect = useCallback(async () => {
    if (!session?.access_token) return;
    setState('loading');
    setMsg('');
    try {
      const res = await fetch('/api/rk/google/gemini-projects', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setState('blocked');
        setData(json);
        setMsg(json.error || 'Detect fail ho gaya');
        return;
      }
      setData(json);
      setState('done');
    } catch (err) {
      setState('blocked');
      setMsg(err.message);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user && session?.access_token) detect();
  }, [user, session?.access_token, detect]);

  const saveKey = async () => {
    const value = key.trim();
    if (!value) {
      onError?.('Pehle API key paste karein');
      return;
    }
    rememberKey(value);
    if (saveMode === 'account' && session?.access_token) {
      try {
        const res = await fetch('/api/rk/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ provider: 'gemini', apiKey: value, model: 'gemini-2.5-flash' }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Vault save fail');
        }
        setMsg('Account mein save ho gaya — ab har device par available hai ✅');
      } catch (err) {
        setMsg(`Browser mein save ho gaya, account mein nahi: ${err.message}`);
      }
    } else {
      setMsg('Is browser mein save ho gaya ✅');
    }
    onSaved?.();
  };

  const readyProject = (data?.projects || []).find((p) => p.enabled);
  const aiStudioUrl = readyProject
    ? `https://aistudio.google.com/apikey?project=${readyProject.projectId}`
    : 'https://aistudio.google.com/apikey';
  const enableApiUrl = 'https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com';

  return (
    <section className="rk-gcard">
      <div className="rk-gcard-head">
        <span className="rk-gicon">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C37 41.2 44 36 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
        </span>
        <div className="rk-gcard-title">
          <h2>Apna Google / Gemini account jodein</h2>
          <small>Antigravity jaisa flow — login karein, aapka Gemini plan hi use hoga</small>
        </div>
        <span className="rk-badge-free">subscription-aware</span>
      </div>

      {!configured && (
        <p className="rk-hint">
          Accounts is deployment par off hain (<code>NEXT_PUBLIC_SUPABASE_URL</code> missing). Neeche key
          manually paste karke bhi Gemini chala sakte hain.
        </p>
      )}

      {configured && !user && (
        <>
          <p className="rk-gcard-body">
            Google se sign in karein — hum <b>sirf</b> ye dekhte hain ki aapke Cloud projects mein Gemini API
            enabled hai ya nahi. Aapke password, chats ya billing details kabhi app tak nahi aate.
          </p>
          <button
            className="rk-google"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                onError?.(err.message);
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C37 41.2 44 36 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            Google se sign in karein
          </button>
        </>
      )}

      {user && (
        <>
          <div className="rk-guser">
            <div>
              <b>{user.user_metadata?.full_name || user.email}</b>
              <small>{user.email} · connected</small>
            </div>
            <div className="rk-guser-actions">
              <button className="rk-btn-ghost" onClick={detect}>
                {state === 'loading' ? 'Check ho raha…' : '↻ Gemini projects detect karein'}
              </button>
              <button className="rk-btn-ghost" onClick={signOut}>Sign out</button>
            </div>
          </div>

          {state === 'done' && data && (
            <div className="rk-gresult">
              <p>{data.note}</p>
              {(data.projects || []).length > 0 && (
                <ul className="rk-gprojects">
                  {data.projects.map((p) => (
                    <li key={p.projectId} className={p.enabled ? 'is-ready' : ''}>
                      <b>{p.name}</b>
                      <small>
                        {p.projectId}
                        {p.enabled ? ' · Gemini API ✅' : ' · Gemini API ✗'}
                        {p.hasBilling ? ' · billing ✅' : ''}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
              <div className="rk-gsteps">
                <a href={aiStudioUrl} target="_blank" rel="noreferrer" className="rk-primary">
                  1. AI Studio par API key banayein ↗
                </a>
                <a href={enableApiUrl} target="_blank" rel="noreferrer" className="rk-btn-ghost">
                  2. (agar list khaali) Generative Language API enable karein ↗
                </a>
              </div>
            </div>
          )}

          {state === 'blocked' && (
            <div className="rk-gresult">
              <p className="rk-warn">
                Automatic detect nahi hua — Google ne extra permission nahi di. Koi baat nahi, 2 click ka manual
                rasta:
              </p>
              <div className="rk-gsteps">
                <a href={enableApiUrl} target="_blank" rel="noreferrer" className="rk-btn-ghost">
                  Cloud console mein Gemini API enable karein ↗
                </a>
                <a href={aiStudioUrl} target="_blank" rel="noreferrer" className="rk-primary">
                  AI Studio se key lein ↗
                </a>
              </div>
            </div>
          )}
        </>
      )}

      <div className="rk-gkeyrow">
        <input
          className="rk-input"
          type="password"
          placeholder="AIza… paste karein (Gemini API key)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <select className="rk-select rk-select-sm" value={saveMode} onChange={(e) => setSaveMode(e.target.value)}>
          <option value="account" disabled={!user}>Account mein save</option>
          <option value="browser">Sirf is browser mein</option>
        </select>
        <button className="rk-primary" onClick={saveKey}>Save &amp; use</button>
      </div>
      {msg && <p className="rk-hint">{msg}</p>}

      <details className="rk-gdetails">
        <summary>Sach kya hai — Gemini subscription kaise kaam karta hai?</summary>
        <ul>
          <li>
            Google ki consumer <b>Gemini app</b> (gemini.google.com) ki subscription API access nahi deti. Koi
            bhi third-party app aapki Gemini chat subscription "login karke" use nahi kar sakta.
          </li>
          <li>
            Jo cheez <b>asli</b> hai: Google AI Studio / Vertex AI ki API keys, jo aapke Google Cloud project
            se judi hoti hain. Us project par billing/credits ho to usage aapke plan se jaata hai — free tier
            se zyada limits milti hain.
          </li>
          <li>
            Isliye ye panel aapke account ke projects detect karta hai aur usi project ki key banwata hai —
            exactly jaisa Antigravity/Cloud Code karta hai. Phir wo key vault mein save ho jaati hai aur har
            device par chal jaati hai.
          </li>
        </ul>
      </details>
    </section>
  );
}
