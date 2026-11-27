'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { PROVIDER_UI as PROVIDERS } from '@/lib/providerUi';
import GoogleGeminiPanel from './GoogleGeminiPanel';
import { useAuth, Avatar } from './auth';

const STORE_KEY = 'rkgem.settings.v1';

export default function SettingsClient() {
  const [settings, setSettings] = useState({ provider: 'openrouter', model: '', baseUrl: '', keys: {}, systemPrompt: '', temperature: 0.7 });
  const [saved, setSaved] = useState(false);
  const [test, setTest] = useState({ state: 'idle', msg: '' });
  const { user, signOut, configured } = useAuth();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      setSettings((s) => ({ ...s, ...raw, keys: { ...(raw.keys || {}) } }));
    } catch {}
  }, []);

  // Signed in? Merge the account vault over browser settings.
  useEffect(() => {
    if (!configured) return;
    (async () => {
      const { supabaseBrowserSession } = await import('@/components/auth');
      const token = await supabaseBrowserSession();
      if (!token) return;
      try {
        const res = await fetch('/api/rk/vault', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        const vaultKeys = {};
        Object.entries(json.keys || {}).forEach(([p, v]) => {
          if (v && v.apiKey) vaultKeys[p] = v.apiKey;
        });
        if (Object.keys(vaultKeys).length) {
          setSettings((s) => ({ ...s, keys: { ...s.keys, ...vaultKeys } }));
        }
      } catch {}
    })();
  }, [configured, user?.id, reload]);

  const save = () => {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const testKey = async (id) => {
    setTest({ state: 'loading', msg: '' });
    try {
      const params = new URLSearchParams({ provider: id });
      if (settings.keys[id]) params.set('key', settings.keys[id]);
      if (id === 'custom' && settings.baseUrl) params.set('baseUrl', settings.baseUrl);
      const res = await fetch(`/api/rk/models?${params}`);
      const json = await res.json();
      setTest({
        state: json.source === 'live' ? 'ok' : 'warn',
        msg:
          json.source === 'live'
            ? `✅ Connected — ${json.models.length} models mile.`
            : `⚠️ Live list nahi mili (${json.note || 'offline'}). Static models use honge.`,
      });
    } catch (e) {
      setTest({ state: 'err', msg: `❌ ${e.message}` });
    }
  };

  const setKey = (id, val) => setSettings((s) => ({ ...s, keys: { ...s.keys, [id]: val } }));

  return (
    <div className="rk-page">
      <header className="rk-page-top">
        <Link href="/chat" className="rk-back">← Chat</Link>
        <h1>Providers &amp; keys</h1>
        <button className="rk-primary" onClick={save}>{saved ? 'Saved ✓' : 'Save'}</button>
      </header>

      {configured && (
        <div className="rk-acctstrip">
          {user ? (
            <>
              <Avatar user={user} size={26} />
              <span>
                <b>{user.user_metadata?.full_name || user.email}</b> · signed in — keys aapke account ke saath sync
                hongi
              </span>
              <button className="rk-btn-ghost" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <span>
              <b>Tip:</b> Google se sign in karein to aapki Gemini key account mein safe rahegi (phone + laptop
              dono par).
            </span>
          )}
        </div>
      )}

      <GoogleGeminiPanel
        onError={(m) => setTest({ state: 'err', msg: m })}
        onSaved={() => setReload((n) => n + 1)}
      />

      <p className="rk-lead">
        RK GEM AI kisi bhi ek provider se bandha nahi hai. Neeche apni keys daalein — sab kuch sirf aapke
        browser mein store hota hai. Keys ke bina bhi free demo pool chal sakta hai (agar host ne configure kiya ho).
      </p>

      <div className="rk-grid">
        {PROVIDERS.map((p) => {
          const active = settings.provider === p.id;
          return (
            <section key={p.id} className={`rk-card ${active ? 'is-active' : ''}`}>
              <div className="rk-card-head">
                <span className="rk-card-emoji" style={{ background: `${p.color}22`, borderColor: `${p.color}55` }}>{p.emoji}</span>
                <div>
                  <h2>{p.short}</h2>
                  <small>{p.note}</small>
                </div>
                <button
                  className={`rk-chip ${active ? 'is-active' : ''}`}
                  onClick={() => setSettings((s) => ({ ...s, provider: p.id, model: '' }))}
                >
                  {active ? 'Default ✓' : 'Set default'}
                </button>
              </div>

              <label className="rk-label">{p.requiresKey ? 'API key' : 'Base URL'}</label>
              {p.requiresKey ? (
                <input
                  className="rk-input"
                  type="password"
                  value={settings.keys[p.id] || ''}
                  placeholder={p.keyHint}
                  onChange={(e) => setKey(p.id, e.target.value)}
                />
              ) : (
                <input
                  className="rk-input"
                  value={settings.baseUrl || ''}
                  placeholder={p.keyHint || p.defaultBaseUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, baseUrl: e.target.value }))}
                />
              )}

              <div className="rk-card-actions">
                <button className="rk-btn-ghost" onClick={() => testKey(p.id)}>Test connection</button>
                {p.docs && <a className="rk-btn-ghost" href={p.docs} target="_blank" rel="noreferrer">Get free key ↗</a>}
              </div>
              {p.id === 'ollama' && (
                <pre className="rk-snippet">{`# Install Ollama, then:
ollama pull llama3.2
# Make sure it listens on all interfaces (hosted deploy):
OLLAMA_HOST=0.0.0.0 ollama serve`}</pre>
              )}
              {p.id === 'gemini' && (
                <p className="rk-hint">Google AI Studio se free API key milti hai — Gemini 2.5 Flash ka free tier kaafi generous hai.</p>
              )}
            </section>
          );
        })}
      </div>

      <section className="rk-card rk-card-wide">
        <div className="rk-card-head">
          <span className="rk-card-emoji">🧠</span>
          <div>
            <h2>Behaviour</h2>
            <small>System prompt & creativity</small>
          </div>
        </div>
        <label className="rk-label">Custom system prompt (optional)</label>
        <textarea
          className="rk-input rk-textarea"
          rows={3}
          value={settings.systemPrompt}
          placeholder={`e.g. Tum ${BRAND.name} ho, Hinglish mein jawab do, short rakho.`}
          onChange={(e) => setSettings((s) => ({ ...s, systemPrompt: e.target.value }))}
        />
        <label className="rk-label">Temperature · {Number(settings.temperature).toFixed(1)}</label>
        <input
          type="range" min="0" max="1.5" step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings((s) => ({ ...s, temperature: e.target.value }))}
          className="rk-range"
        />
      </section>

      {test.msg && <div className={`rk-test rk-test-${test.state}`}>{test.msg}</div>}

      <footer className="rk-foot">
        <span>{BRAND.name} · {BRAND.founder} ({BRAND.founderRole}) &amp; {BRAND.coFounder} ({BRAND.coFounderRole})</span>
        <span>MIT licensed · your keys never touch our database</span>
      </footer>
    </div>
  );
}
