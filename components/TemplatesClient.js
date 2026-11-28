'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GPU_TEMPLATES } from '@/lib/templates';

const STORE = 'rk-gpu-endpoint';
const ENDPOINT_FALLBACK = 'http://127.0.0.1:8188';

function readEndpoint() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
    return raw.endpoint || ENDPOINT_FALLBACK;
  } catch {
    return ENDPOINT_FALLBACK;
  }
}

export default function TemplatesClient() {
  const [endpoint, setEndpoint] = useState(ENDPOINT_FALLBACK);
  const [gpu, setGpu] = useState({ state: 'idle', text: 'check ho raha…', devices: [] });
  const [kind, setKind] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [endpointDraft, setEndpointDraft] = useState('');

  const copyText = useCallback(async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // purane browsers / non-https fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(''), 1600);
  }, []);

  useEffect(() => {
    const ep = readEndpoint();
    setEndpoint(ep);
    (async () => {
      try {
        const res = await fetch('/api/rk/comfy/ping?endpoint=' + encodeURIComponent(ep));
        const json = await res.json();
        if (json.ok) setGpu({ state: 'ok', text: `${(json.devices || []).join(', ') || 'GPU'} · ${json.vram?.totalGB || '?'} GB`, devices: json.devices || [] });
        else setGpu({ state: 'err', text: json.error || 'GPU juda nahi', devices: [] });
      } catch {
        setGpu({ state: 'err', text: 'GPU juda nahi', devices: [] });
      }
    })();
  }, []);

  const list = useMemo(
    () => (kind === 'all' ? GPU_TEMPLATES : GPU_TEMPLATES.filter((t) => t.kind === kind)),
    [kind],
  );

  const openTemplate = (tpl) => {
    setOpenId(tpl.id);
    setPrompt(tpl.params.prompt);
    setError('');
  };

  const run = useCallback(
    async (tpl) => {
      setBusy(tpl.id);
      setError('');
      setProgress(0);
      try {
        const res = await fetch('/api/rk/comfy/render', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            endpoint,
            workflowId: tpl.workflowId,
            params: { ...tpl.params, prompt: prompt || tpl.params.prompt },
          }),
        });
        const started = await res.json();
        if (!res.ok) throw new Error(started.error || 'GPU ne start nahi kiya');

        // progress poll
        const poll = setInterval(async () => {
          try {
            const r = await fetch(`/api/rk/comfy/job?endpoint=${encodeURIComponent(endpoint)}&id=${started.promptId}`);
            const j = await r.json();
            setProgress(j.percent || 0);
            if (j.state === 'done' || j.state === 'error') {
              clearInterval(poll);
              setBusy(null);
              if (j.state === 'error') {
                setError(j.error || 'Render fail hua');
                return;
              }
              const files = j.outputs || [];
              if (files.length) {
                const f = files[0];
                setResults((prev) => ({
                  ...prev,
                  [tpl.id]: {
                    url: `/api/rk/comfy/view?endpoint=${encodeURIComponent(endpoint)}&filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(f.subfolder || '')}&type=${encodeURIComponent(f.type || 'output')}`,
                    kind: tpl.kind,
                  },
                }));
              }
            }
          } catch {
            clearInterval(poll);
            setBusy(null);
          }
        }, 1500);
      } catch (err) {
        setError(err.message);
        setBusy(null);
      }
    },
    [endpoint, prompt],
  );

  const online = gpu.state === 'ok';

  return (
    <div className="rk-page">
      <header className="rk-page-head">
        <Link href="/studio" className="rk-back">← Studio</Link>
        <div>
          <h1>Templates</h1>
          <p>Ek tap — image ya video ban jayega. Aapke apne GPU par, ₹0.</p>
        </div>
        <Link href="/studio/apna-gpu" className={`rk-gpu-dot ${online ? 'ok' : ''}`}>
          {online ? '● GPU online' : '○ GPU jodo'}
        </Link>
      </header>

      <div className="rk-gpu-status is-ok is-idle" style={{ marginBottom: 14 }}>
        <span className="rk-gpu-status-dot" />
        <div className="rk-gpu-status-text">
          <b>{online ? 'GPU juda hua hai' : 'GPU juda nahi hai'}</b>
          <small>{online ? `${gpu.text} — koi bhi template dabao, seedha yahin banega` : 'Kaggle cell chalao → URL paste karo. Template bina key bhi chalte hain.'}</small>
        </div>
        <Link href="/studio/apna-gpu" className="rk-gpu-status-act">{online ? 'Manage' : 'Connect'}</Link>
      </div>

      {!online && (
        <div className="rk-tpl-connect">
          <label>GPU ka URL (Kaggle cell ke aakhir me milta hai)</label>
          <div className="rk-tpl-connect-row">
            <input
              value={endpointDraft}
              onChange={(e) => setEndpointDraft(e.target.value)}
              placeholder="https://xxxx.trycloudflare.com"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              className="rk-primary"
              onClick={() => {
                const url = endpointDraft.trim().replace(/\/+$/, '');
                if (!url) return;
                setEndpoint(url);
                try {
                  const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
                  localStorage.setItem(STORE, JSON.stringify({ ...raw, endpoint: url }));
                } catch { /* ignore */ }
                setGpu({ state: 'idle', text: 'check ho raha…', devices: [] });
                fetch('/api/rk/comfy/ping?endpoint=' + encodeURIComponent(url))
                  .then((r) => r.json())
                  .then((j) => {
                    if (j.ok) setGpu({ state: 'ok', text: `${(j.devices || []).join(', ') || 'GPU'} · ${j.vram?.totalGB || '?'} GB`, devices: [] });
                    else setGpu({ state: 'err', text: j.error || 'connect nahi hua', devices: [] });
                  })
                  .catch(() => setGpu({ state: 'err', text: 'connect nahi hua', devices: [] }));
              }}
            >
              Jodo
            </button>
          </div>
          <small>
            Kaggle cell kahan se milega?{' '}
            <a href="/local">Local page</a> par poora code hai — copy karke Kaggle me chalao.
          </small>
        </div>
      )}

      <div className="rk-tpl-tabs">
        {[['all', 'Sab'], ['image', '🖼️ Image'], ['video', '🎬 Video']].map(([id, label]) => (
          <button key={id} className={kind === id ? 'is-active' : ''} onClick={() => setKind(id)}>{label}</button>
        ))}
      </div>

      {error && <p className="rk-mm-warn">⚠️ {error}</p>}

      <div className="rk-tpl-grid">
        {list.map((tpl) => {
          const result = results[tpl.id];
          const isBusy = busy === tpl.id;
          return (
            <article key={tpl.id} className="rk-tpl-card">
              <div className="rk-tpl-top">
                <span className="rk-tpl-emoji">{tpl.emoji}</span>
                {tpl.badge && <span className="rk-tpl-badge">{tpl.badge}</span>}
              </div>
              <h3>{tpl.title}</h3>
              <p>{tpl.hint}</p>

              {result && (
                <div className="rk-tpl-result">
                  {result.kind === 'video' ? (
                    <video src={result.url} controls playsInline />
                  ) : (
                    <img src={result.url} alt={tpl.title} />
                  )}
                  <div className="rk-tpl-result-bar">
                    <a href={result.url} download={`rk-${tpl.id}`}>⬇ Download</a>
                    <button onClick={() => copyText(window.location.origin + result.url, tpl.id + '-url')}>
                      {copied === tpl.id + '-url' ? '✓ Copied' : '⧉ Copy link'}
                    </button>
                  </div>
                </div>
              )}

              {isBusy && (
                <div className="rk-tpl-progress">
                  <div style={{ width: `${Math.max(progress, 3)}%` }} />
                  <small>{progress > 0 ? `${progress}%` : 'start ho raha…'}</small>
                </div>
              )}

              <div className="rk-tpl-actions">
                <button
                  className="rk-mm-btn"
                  onClick={() => copyText(prompt && openId === tpl.id ? prompt : tpl.params.prompt, tpl.id)}
                  title="Prompt copy karo"
                >
                  {copied === tpl.id ? '✓ Copied' : '⧉ Copy'}
                </button>
                <button className="rk-mm-btn" onClick={() => openTemplate(tpl)}>Edit</button>
                <button className="rk-primary" onClick={() => run(tpl)} disabled={isBusy || !online}>
                  {isBusy ? 'Ban raha…' : result ? 'Phir banao' : '▶ Banao'}
                </button>
              </div>

              {openId === tpl.id && (
                <div className="rk-tpl-editor">
                  <label>Prompt</label>
                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Kya banana hai…"
                  />
                  <div className="rk-tpl-meta">
                    <span>{tpl.params.width}×{tpl.params.height}</span>
                    <span>{tpl.params.steps} steps</span>
                    {tpl.params.frames && <span>{tpl.params.frames} frames</span>}
                  </div>
                  <div className="rk-tpl-editor-actions">
                    <button className="rk-mm-btn" onClick={() => copyText(prompt, tpl.id + '-ed')}>
                      {copied === tpl.id + '-ed' ? '✓ Copied' : '⧉ Copy prompt'}
                    </button>
                    <button className="rk-mm-btn" onClick={() => setPrompt(tpl.params.prompt)}>↺ Reset</button>
                    <button className="rk-btn-ghost" onClick={() => setOpenId(null)}>Band</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="rk-tpl-foot">
        Model download / delete / apna link — <Link href="/studio/apna-gpu">Apna GPU → Models</Link>
      </p>
    </div>
  );
}
