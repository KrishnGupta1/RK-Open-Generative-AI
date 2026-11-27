'use client';

// RK GEM AI — test renderer for *remote* ComfyUI.
//
// Why this exists: a hosted website cannot run a graphics card. The honest
// way to give website visitors "your own GPU" is to let the browser talk to
// a ComfyUI instance the owner exposes (tunnel / VPS / RunPod). This page is
// the working proof: pick a workflow, hit Render, watch the job.
//
// It is deliberately a *thin* client: ComfyUI does the work, the browser only
// queues a prompt and polls history. No keys, no server cost.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

const STORE = 'rkgem.comfy.v1';

// Minimal text-to-image graph. ComfyUI users can edit this JSON to run any
// workflow (video, upscale, lipsync…) — the page just posts it as-is.
function workflowFor({ prompt, negative, steps, width, height, seed, ckpt }) {
  return {
    3: {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg: 7,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: ckpt } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: 'rkgem', images: ['8', 0] } },
  };
}

export default function StudioRemoteClient() {
  const [endpoint, setEndpoint] = useState('http://127.0.0.1:8188');
  const [prompt, setPrompt] = useState('a cinematic portrait of an Indian creator, golden hour, 35mm');
  const [negative, setNegative] = useState('blurry, low quality, watermark');
  const [ckpt, setCkpt] = useState('sd_xl_base_1.0.safetensors');
  const [steps, setSteps] = useState(20);
  const [size, setSize] = useState(1024);
  const [status, setStatus] = useState({ state: 'idle', msg: '' });
  const [images, setImages] = useState([]);
  const [log, setLog] = useState([]);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (raw.endpoint) setEndpoint(raw.endpoint);
      if (raw.ckpt) setCkpt(raw.ckpt);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify({ endpoint, ckpt }));
  }, [endpoint, ckpt]);

  const push = (line) => setLog((l) => [...l.slice(-40), line]);

  const checkServer = useCallback(async () => {
    setStatus({ state: 'checking', msg: '' });
    try {
      const res = await fetch('/api/rk/comfy/ping?endpoint=' + encodeURIComponent(endpoint));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'offline');
      setStatus({ state: 'ok', msg: `ComfyUI online (${json.version || 'unknown version'})` });
      push(`✓ ping ok — ${json.version || ''}`);
      if (json.checkpoints?.length) {
        push(`checkpoints: ${json.checkpoints.slice(0, 4).join(', ')}${json.checkpoints.length > 4 ? '…' : ''}`);
        if (!json.checkpoints.includes(ckpt)) setCkpt(json.checkpoints[0]);
      }
    } catch (err) {
      setStatus({ state: 'err', msg: err.message });
      push(`✗ ping fail — ${err.message}`);
    }
  }, [endpoint, ckpt]);

  const render = async () => {
    setStatus({ state: 'running', msg: 'Queue ho gaya…' });
    setImages([]);
    push(`→ job submit (${size}×${size}, ${steps} steps)`);
    try {
      const body = {
        endpoint,
        workflow: workflowFor({
          prompt,
          negative,
          steps,
          width: size,
          height: size,
          seed: Math.floor(Math.random() * 1e12),
          ckpt,
        }),
      };
      const start = await fetch('/api/rk/comfy/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const started = await start.json();
      if (!start.ok) throw new Error(started.error || 'submit failed');
      push(`job id: ${started.promptId}`);

      for (let i = 0; i < 120; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const res = await fetch(
          `/api/rk/comfy/job?endpoint=${encodeURIComponent(endpoint)}&id=${started.promptId}`,
        );
        const job = await res.json();
        if (job.error) throw new Error(job.error);
        if (job.done) {
          push(`✓ done — ${job.images?.length || 0} image(s)`);
          setImages(
            (job.images || []).map((img) =>
              `/api/rk/comfy/view?endpoint=${encodeURIComponent(endpoint)}&filename=${encodeURIComponent(
                img.filename,
              )}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${img.type || 'output'}`,
            ),
          );
          setStatus({ state: 'done', msg: 'Image ready ✅' });
          return;
        }
        if (i % 3 === 0) setStatus({ state: 'running', msg: `Render ho raha… (${i * 2}s)` });
      }
      throw new Error('timeout (4 min) — chhota size ya steps try karein');
    } catch (err) {
      setStatus({ state: 'err', msg: err.message });
      push(`✗ ${err.message}`);
    }
  };

  const busy = status.state === 'running' || status.state === 'checking';

  return (
    <div className="rk-page">
      <header className="rk-page-top">
        <Link href="/local" className="rk-back">← Local</Link>
        <h1>Apna GPU, website se</h1>
        <button className="rk-primary" onClick={checkServer} disabled={busy}>Test connection</button>
      </header>

      <p className="rk-lead">
        Ye page <b>remote ComfyUI</b> se image banata hai — matlab aapke PC/VPS ka GPU website ke through chalta hai.
        Video ka bhi same tarika hai: ComfyUI mein Wan 2.2 workflow banao, uska JSON yahan paste karo.
      </p>

      <div className="rk-callout">
        <b>Setup (5 min):</b>
        <pre className="rk-snippet">{`# apne PC par ComfyUI chalao
python main.py --listen 0.0.0.0 --port 8188

# internet se access (free tunnel)
cloudflared tunnel --url http://127.0.0.1:8188
# → jo https URL mile, wo neeche Endpoint mein daalo`}</pre>
        <p className="rk-hint">
          ⚠️ Tunnel URL public hota hai — ComfyUI par password/basic-auth laga dena, warna koi aapka GPU free mein
          use kar lega. Jab kaam na ho to tunnel band kar do.
        </p>
      </div>

      <section className="rk-card rk-card-wide">
        <div className="rk-card-head">
          <span className="rk-card-emoji">🖥️</span>
          <div>
            <h2>Connection</h2>
            <small>ComfyUI endpoint (local ya tunnel)</small>
          </div>
          <span className={`rk-pill ${status.state === 'ok' ? 'ok' : status.state === 'err' ? 'off' : ''}`}>
            {status.state === 'ok' ? '● online' : status.state === 'err' ? '○ offline' : '…'}
          </span>
        </div>
        <div className="rk-row">
          <input className="rk-input" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://xxx.trycloudflare.com" />
        </div>
        <p className="rk-hint">Local test: <code>http://127.0.0.1:8188</code> · Tunnel: jo cloudflared/ngrok ne diya</p>
      </section>

      <section className="rk-card rk-card-wide">
        <div className="rk-card-head">
          <span className="rk-card-emoji">🎨</span>
          <div>
            <h2>Text → Image</h2>
            <small>ComfyUI default workflow</small>
          </div>
        </div>
        <label className="rk-label">Prompt</label>
        <textarea className="rk-input rk-textarea" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <label className="rk-label">Negative</label>
        <input className="rk-input" value={negative} onChange={(e) => setNegative(e.target.value)} />
        <div className="rk-grid2">
          <div>
            <label className="rk-label">Checkpoint</label>
            <input className="rk-input" value={ckpt} onChange={(e) => setCkpt(e.target.value)} />
          </div>
          <div>
            <label className="rk-label">Size · {size}px</label>
            <input type="range" min="512" max="1536" step="128" value={size} onChange={(e) => setSize(Number(e.target.value))} className="rk-range" />
          </div>
          <div>
            <label className="rk-label">Steps · {steps}</label>
            <input type="range" min="4" max="40" step="1" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="rk-range" />
          </div>
        </div>
        <div className="rk-card-actions">
          <button className="rk-primary" onClick={render} disabled={busy}>
            {status.state === 'running' ? 'Render ho raha…' : 'Render karo'}
          </button>
          {status.msg && <span className="rk-hint">{status.msg}</span>}
        </div>
        {images.length > 0 && (
          <div className="rk-results">
            {images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="generated" />
            ))}
          </div>
        )}
        {log.length > 0 && <pre className="rk-snippet rk-log">{log.join('\n')}</pre>}
      </section>

      <section className="rk-card rk-card-wide">
        <div className="rk-card-head">
          <span className="rk-card-emoji">🎬</span>
          <div>
            <h2>Video kaise?</h2>
            <small>Same page, different workflow</small>
          </div>
        </div>
        <p className="rk-hint">
          ComfyUI mein <b>Wan 2.2 / LTX-Video</b> ka template kholo → “Save (API format)” → us JSON ko yahan bhejo.
          Humara renderer koi bhi graph chalata hai; output mp4 bhi aayega. Detail: docs/LOCAL-GENERATION.md
        </p>
        <pre className="rk-snippet">{`# GPU na ho to cloud GPU rent karo (per-hour, free credits)
# RunPod / Vast.ai / Modal par ComfyUI template 1-click milta hai
# phir wahi tunnel URL yahan daal do`}</pre>
      </section>

      <footer className="rk-foot">
        <span>{BRAND.name} · {BRAND.founder} &amp; {BRAND.coFounder}</span>
        <span>Ye page aapke browser se seedha aapke ComfyUI se baat karta hai</span>
      </footer>
    </div>
  );
}
