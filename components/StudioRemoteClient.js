'use client';

// RK GEM AI — "Apna GPU" studio.
//
// Sab kuch *humare* platform par hota hai: prompt likho, Image ya Video
// chuno, Render dabao, result yahin dikhta hai + download + gallery.
// Kaggle/ComfyUI sirf parde ke peeche engine hai — user ko wahan jaana hi
// nahi padta.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import ModelManager from '@/components/ModelManager';

const STORE = 'rkgem.gpu.v1';
const LIBRARY = 'rkgem.library.v1';

const IMAGE_MODELS = [
  { id: 'sdxl-t2i', label: 'SDXL Base 1.0', note: 'photo-real, 1024px', ckpt: 'sd_xl_base_1.0.safetensors' },
];

const RATIOS = [
  { label: '1:1', w: 1024, h: 1024 },
  { label: '4:5', w: 832, h: 1024 },
  { label: '9:16', w: 768, h: 1344 },
  { label: '16:9', w: 1344, h: 768 },
];

const VIDEO_SCENES = [
  'a girl walking in a Delhi street, golden hour, cinematic',
  'a chaiwala pouring tea, steam, slow motion, 4k',
  'drone shot of Himalaya mountains at sunrise',
  'a businessman using a laptop in a modern Mumbai office',
  'a wedding couple dancing, bokeh lights, cinematic',
  'a dog running on a beach, slow motion',
];

export default function StudioRemoteClient({ embedded = false } = {}) {
  const [endpoint, setEndpoint] = useState('http://127.0.0.1:8188');
  const [tab, setTab] = useState('image'); // image | video | models
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [ratio, setRatio] = useState(0);
  const [steps, setSteps] = useState(22);
  const [frames, setFrames] = useState(33);
  const [ckpt, setCkpt] = useState('sd_xl_base_1.0.safetensors');
  const [status, setStatus] = useState({ state: 'idle', msg: '' });
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const [library, setLibrary] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [gpuInfo, setGpuInfo] = useState(null);
  const pollRef = useRef(null);

  // ---------- persisted state ----------
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (raw.endpoint) setEndpoint(raw.endpoint);
      if (raw.ckpt) setCkpt(raw.ckpt);
      if (raw.negative) setNegative(raw.negative);
      if (raw.steps) setSteps(raw.steps);
      setLibrary(JSON.parse(localStorage.getItem(LIBRARY) || '[]'));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify({ endpoint, ckpt, negative, steps }));
  }, [endpoint, ckpt, negative, steps]);

  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY, JSON.stringify(library.slice(0, 40)));
    } catch {}
  }, [library]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const push = (line) => setLog((l) => [...l.slice(-60), line]);

  // ---------- connection ----------
  const testConnection = useCallback(async () => {
    setStatus({ state: 'checking', msg: 'GPU check ho raha…' });
    try {
      const res = await fetch('/api/rk/comfy/ping?endpoint=' + encodeURIComponent(endpoint));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'offline');
      setGpuInfo(json);
      setStatus({ state: 'ok', msg: `GPU ready · ${json.version}` });
      push(`✓ connected — ${json.devices?.join(', ') || 'device unknown'}`);
      if (json.checkpoints?.length && !json.checkpoints.includes(ckpt)) {
        setCkpt(json.checkpoints[0]);
        push(`checkpoint: ${json.checkpoints[0]}`);
      }
      return true;
    } catch (err) {
      setGpuInfo(null);
      setStatus({ state: 'err', msg: err.message });
      push(`✗ ${err.message}`);
      return false;
    }
  }, [endpoint, ckpt]);

  useEffect(() => {
    if (!endpoint) return;
    const t = setTimeout(() => {
      if (endpoint.includes('127.0.0.1')) testConnection();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- render ----------
  const render = async () => {
    if (!prompt.trim()) {
      setStatus({ state: 'err', msg: 'Prompt likhein' });
      return;
    }
    const geo = RATIOS[ratio];
    const width = tab === 'video' ? 480 : geo.w;
    const height = tab === 'video' ? 832 : geo.h;

    setResult(null);
    setStatus({ state: 'running', msg: 'GPU ko bhej rahe hain…' });
    push(`→ ${tab === 'video' ? 'Wan 2.1' : 'SDXL'} · ${width}×${height} · ${steps} steps`);

    try {
      const res = await fetch('/api/rk/comfy/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          workflowId: tab === 'video' ? 'wan-t2v' : 'sdxl-t2i',
          params: {
            prompt,
            negative,
            width,
            height,
            steps: tab === 'video' ? Math.min(steps, 30) : steps,
            frames,
            ckpt,
          },
        }),
      });
      const started = await res.json();
      if (!res.ok) throw new Error(started.error || 'submit fail');
      push(`job: ${started.promptId}`);

      const startedAt = Date.now();
      let ticks = 0;
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        ticks += 1;
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        const limit = tab === 'video' ? 900 : 240; // 15 min video, 4 min image
        if (elapsed > limit) {
          clearInterval(pollRef.current);
          setStatus({ state: 'err', msg: 'Timeout — chhota size/steps try karein' });
          return;
        }
        try {
          const r = await fetch(
            `/api/rk/comfy/job?endpoint=${encodeURIComponent(endpoint)}&id=${started.promptId}`,
          );
          const job = await r.json();
          if (job.error) {
            clearInterval(pollRef.current);
            setStatus({ state: 'err', msg: job.error });
            push(`✗ ${job.error}`);
            return;
          }
          setStatus({
            state: 'running',
            msg: tab === 'video' ? `Video ban rahi hai… ${elapsed}s` : `Image ban rahi hai… ${elapsed}s`,
          });
          if (job.done) {
            clearInterval(pollRef.current);
            const files = (job.images || []).map((img) => ({
              ...img,
              url:
                `/api/rk/comfy/view?endpoint=${encodeURIComponent(endpoint)}` +
                `&filename=${encodeURIComponent(img.filename)}` +
                `&subfolder=${encodeURIComponent(img.subfolder || '')}` +
                `&type=${img.type || 'output'}`,
            }));
            const primary = files[0];
            const isVideo = /\.(webp|mp4|gif|webm)$/i.test(primary?.filename || '') || tab === 'video';
            const item = {
              id: started.promptId,
              url: primary?.url,
              filename: primary?.filename,
              kind: isVideo ? 'video' : 'image',
              prompt,
              at: Date.now(),
              all: files,
            };
            setResult(item);
            setLibrary((l) => [item, ...l].slice(0, 40));
            setStatus({ state: 'done', msg: isVideo ? 'Video ready ✅' : 'Image ready ✅' });
            push(`✓ done — ${primary?.filename}`);
          }
        } catch (err) {
          clearInterval(pollRef.current);
          setStatus({ state: 'err', msg: err.message });
        }
      }, 3000);
    } catch (err) {
      setStatus({ state: 'err', msg: err.message });
      push(`✗ ${err.message}`);
    }
  };

  const stop = () => {
    clearInterval(pollRef.current);
    setStatus({ state: 'idle', msg: 'Rok diya' });
  };

  const download = async (item) => {
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = item.filename || 'rkgem-output';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch {
      window.open(item.url, '_blank');
    }
  };

  const busy = status.state === 'running' || status.state === 'checking';
  const connected = status.state === 'ok';

  return (
    <div className={`rk-gpu${embedded ? ' is-embedded' : ''}`}>
      {/* ---------- header ---------- */}
      <header className="rk-gpu-top">
        {!embedded && <Link href="/local" className="rk-back">←</Link>}
        <div className="rk-gpu-title">
          <b>Apna GPU</b>
          <small>{connected ? `connected · ${gpuInfo?.devices?.[0] || 'GPU'}` : 'Kaggle / PC / VPS ka GPU'}</small>
        </div>
        <button className={`rk-gpu-dot ${connected ? 'ok' : status.state === 'err' ? 'err' : ''}`} onClick={testConnection}>
          {status.state === 'checking' ? '…' : connected ? '● online' : '○ check'}
        </button>
        <button className="rk-btn-ghost" onClick={() => setShowSetup((v) => !v)}>
          {showSetup ? 'Band karo' : 'GPU kaise jodein?'}
        </button>
        <button className="rk-btn-ghost" onClick={() => setTab('models')} title="Download / delete / switch models">
          🧩 Models
        </button>
      </header>

      {showSetup && (
        <div className="rk-gpu-setup">
          <ol>
            <li>
              Kaggle notebook kholo →{' '}
              <a href="https://www.kaggle.com/code" target="_blank" rel="noreferrer">kaggle.com/code</a> → GPU P100 + Internet ON
            </li>
            <li>Hamara 1-cell script chalao (<Link href="/local">Local page</Link> par link ya docs/KAGGLE-SIMPLE.md)</li>
            <li>Aakhir mein jo <code>https://xxx.trycloudflare.com</code> mile, neeche Endpoint mein paste karo</li>
            <li>"Test" dabao — 🟢 hone par yahin se image/video banao</li>
          </ol>
          <input
            className="rk-input"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://xxxx.trycloudflare.com"
          />
          <button className="rk-primary" onClick={testConnection}>Test connection</button>
        </div>
      )}

      {/* ---------- tabs ---------- */}
      <div className="rk-gpu-tabs">
        <button className={tab === 'image' ? 'is-active' : ''} onClick={() => { setTab('image'); setResult(null); }}>
          🖼️ Image
        </button>
        <button className={tab === 'video' ? 'is-active' : ''} onClick={() => { setTab('video'); setResult(null); }}>
          🎬 Video
        </button>
        <button className={tab === 'models' ? 'is-active' : ''} onClick={() => setTab('models')}>
          🧩 Models
        </button>
        <span className="rk-gpu-engine">
          {tab === 'image' ? 'SDXL' : tab === 'video' ? 'Wan 2.1 1.3B' : 'download · delete · switch'}
        </span>
      </div>

      {tab === 'models' && (
        <ModelManager
          endpoint={endpoint}
          onUse={(m) => {
            if (m.kind === 'image') {
              setCkpt(m.filename);
              setTab('image');
              push(`model switch → ${m.label}`);
            } else {
              setTab('video');
              push(`video model → ${m.label}`);
            }
            setResult(null);
          }}
        />
      )}

      <div className="rk-gpu-body" style={tab === 'models' ? { display: 'none' } : undefined}>
        {/* ---------- controls ---------- */}
        <section className="rk-gpu-panel">
          <label className="rk-label">Prompt</label>
          <textarea
            className="rk-input rk-textarea"
            rows={4}
            value={prompt}
            placeholder={tab === 'video' ? 'e.g. a girl walking in a Delhi street, golden hour, cinematic' : 'e.g. cinematic portrait of an Indian creator, 35mm'}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {tab === 'video' && (
            <div className="rk-chips">
              {VIDEO_SCENES.slice(0, 3).map((s) => (
                <button key={s} onClick={() => setPrompt(s)}>{s.split(',')[0]}</button>
              ))}
            </div>
          )}

          <details className="rk-gpu-adv">
            <summary>Advanced</summary>
            <label className="rk-label">Negative prompt</label>
            <input
              className="rk-input"
              value={negative}
              placeholder="blurry, low quality, watermark"
              onChange={(e) => setNegative(e.target.value)}
            />
            {tab === 'image' && (
              <>
                <label className="rk-label">Checkpoint</label>
                <input className="rk-input" value={ckpt} onChange={(e) => setCkpt(e.target.value)} />
              </>
            )}
            <label className="rk-label">Steps · {steps}</label>
            <input type="range" min="4" max="40" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="rk-range" />
            {tab === 'video' && (
              <>
                <label className="rk-label">Duration · {frames} frames ≈ {(frames / 16).toFixed(1)}s</label>
                <input type="range" min="17" max="65" step="8" value={frames} onChange={(e) => setFrames(Number(e.target.value))} className="rk-range" />
              </>
            )}
          </details>

          {tab === 'image' && (
            <div className="rk-ratios">
              {RATIOS.map((r, i) => (
                <button key={r.label} className={ratio === i ? 'is-active' : ''} onClick={() => setRatio(i)}>
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <div className="rk-gpu-actions">
            {busy ? (
              <button className="rk-primary rk-stop-btn" onClick={stop}>■ Rok do</button>
            ) : (
              <button className="rk-primary" onClick={render} disabled={!endpoint}>
                {tab === 'video' ? '🎬 Video banao' : '✨ Image banao'}
              </button>
            )}
            <span className={`rk-gpu-status ${status.state}`}>{status.msg}</span>
          </div>
        </section>

        {/* ---------- result ---------- */}
        <section className="rk-gpu-stage">
          {!result && !busy && (
            <div className="rk-gpu-empty">
              <span>{tab === 'video' ? '🎬' : '🖼️'}</span>
              <b>{tab === 'video' ? 'Video yahan dikhegi' : 'Image yahan dikhegi'}</b>
              <small>Prompt likho → {tab === 'video' ? 'Video banao' : 'Image banao'} dabao</small>
            </div>
          )}

          {busy && !result && (
            <div className="rk-gpu-loading">
              <div className="rk-spinner" />
              <b>{status.msg}</b>
              <small>{tab === 'video' ? 'Wan 2.1 ~3–6 min leta hai (P100 par)' : 'SDXL ~20–40 sec'}</small>
            </div>
          )}

          {result && (
            <div className="rk-gpu-result">
              {result.kind === 'video' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.url} alt={result.prompt} className="rk-gpu-media" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.url} alt={result.prompt} className="rk-gpu-media" />
              )}
              <div className="rk-gpu-result-bar">
                <button className="rk-primary" onClick={() => download(result)}>⬇ Download</button>
                <button className="rk-btn-ghost" onClick={() => { setPrompt(result.prompt); }}>↻ Dobara</button>
                <a className="rk-btn-ghost" href={result.url} target="_blank" rel="noreferrer">Full size ↗</a>
              </div>
              <p className="rk-gpu-result-prompt">{result.prompt}</p>
            </div>
          )}
        </section>
      </div>

      {/* ---------- library ---------- */}
      {library.length > 0 && (
        <section className="rk-gpu-lib">
          <div className="rk-gpu-lib-head">
            <b>Meri gallery</b>
            <small>{library.length} items</small>
          </div>
          <div className="rk-gpu-lib-grid">
            {library.map((item) => (
              <div key={item.id} className="rk-gpu-lib-item" onClick={() => setResult(item)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.prompt} />
                <span>{item.kind === 'video' ? '🎬' : '🖼️'}</span>
                <button
                  className="rk-gpu-lib-dl"
                  onClick={(e) => { e.stopPropagation(); download(item); }}
                  title="Download"
                >
                  ⬇
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {log.length > 0 && (
        <details className="rk-gpu-log">
          <summary>GPU log</summary>
          <pre>{log.join('\n')}</pre>
        </details>
      )}

      {!embedded && (
        <footer className="rk-foot">
          <span>{BRAND.name} · {BRAND.founder} &amp; {BRAND.coFounder}</span>
          <span>GPU aapka, interface hamara — Kaggle/PC/VPS dono chalega</span>
        </footer>
      )}
    </div>
  );
}
