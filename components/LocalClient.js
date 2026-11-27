'use client';

// RK GEM AI — local engines dashboard.
// Answers one question: "kya mere PC par local AI chal raha hai, aur kaunsa?"
// Everything is a live probe from /api/rk/local/status — no fake states.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

const VRAM_GUIDE = [
  { vram: 'CPU only', image: 'SD1.5 / SDXL-Turbo', video: 'nahi (ya 1 fps experiment)', time: '~1–3 min/image' },
  { vram: '6 GB', image: 'SDXL, FLUX.1-schnell', video: 'Wan 2.1 1.3B (480p, 3s)', time: '~2–4 min/clip' },
  { vram: '8 GB', image: 'FLUX dev, Qwen-Image', video: 'Wan 2.1 1.3B faster / LTX-Video', time: '~2 min/clip' },
  { vram: '12 GB', image: 'FLUX + upscale', video: 'Wan 2.1 14B (480p)', time: '~4–6 min/clip' },
  { vram: '24 GB', image: 'sab kuch', video: 'Wan 2.2 14B 720p, HunyuanVideo', time: '~3–5 min/clip' },
];

export default function LocalClient() {
  const [state, setState] = useState({ loading: true, engines: [], anyOnline: false });
  const [copied, setCopied] = useState('');

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch('/api/rk/local/status', { cache: 'no-store' });
      const json = await res.json();
      setState({ loading: false, engines: json.engines || [], anyOnline: json.anyOnline });
    } catch {
      setState({ loading: false, engines: [], anyOnline: false });
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 1500);
    } catch {}
  };

  return (
    <div className="rk-page">
      <header className="rk-page-top">
        <Link href="/chat" className="rk-back">← Chat</Link>
        <h1>Local models</h1>
        <button className="rk-primary" onClick={refresh}>{state.loading ? 'Checking…' : '↻ Re-check'}</button>
      </header>

      <p className="rk-lead">
        Chat, image aur <b>video</b> — sab aapke apne computer par. Bina internet, bina API key, bina paisa.
        Neeche har engine ka live status hai (har 15 second mein check hota hai).
      </p>

      {!state.loading && !state.anyOnline && (
        <div className="rk-local-banner">
          <b>Abhi koi local engine nahi mila.</b> Ye normal hai — hosted site aapke PC ke ports tak nahi pahunch sakti.
          Do options: (1) app ko apne PC par `npm run dev` se chalao, ya (2) engine ko tunnel se public karo
          (<code>cloudflared tunnel --url http://127.0.0.1:7860</code>).
        </div>
      )}

      <div className="rk-local-grid">
        {state.engines.map((e) => (
          <section key={e.id} className={`rk-local-card ${e.online ? 'is-online' : ''}`}>
            <div className="rk-local-head">
              <span className="rk-local-emoji">{e.emoji}</span>
              <div>
                <h2>{e.name}</h2>
                <small>port {e.port} · {e.kind}</small>
              </div>
              <span className={`rk-pill ${e.online ? 'ok' : 'off'}`}>{e.online ? '● online' : '○ offline'}</span>
            </div>
            <p>{e.note}</p>
            <div className="rk-local-foot">
              <a href={e.url} target="_blank" rel="noreferrer" className="rk-btn-ghost">Docs ↗</a>
              <button className="rk-btn-ghost" onClick={() => copy(e.install)}>
                {copied === e.install ? 'Copied ✓' : 'Copy install'}
              </button>
            </div>
            <pre className="rk-snippet">{e.install}{'\n'}{e.model ? `# ${e.model}` : ''}</pre>
          </section>
        ))}
      </div>

      <section className="rk-card rk-card-wide">
        <div className="rk-card-head">
          <span className="rk-card-emoji">🎬</span>
          <div>
            <h2>Video generation — hardware guide</h2>
            <small>Kitne VRAM par kya banega</small>
          </div>
        </div>
        <div className="rk-table-wrap">
          <table className="rk-table">
            <thead>
              <tr><th>VRAM</th><th>Image</th><th>Video</th><th>Time</th></tr>
            </thead>
            <tbody>
              {VRAM_GUIDE.map((r) => (
                <tr key={r.vram}>
                  <td><b>{r.vram}</b></td>
                  <td>{r.image}</td>
                  <td>{r.video}</td>
                  <td>{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rk-card-actions">
          <Link href="/studio" className="rk-primary">Video Studio kholo</Link>
          <Link href="/studio-remote" className="rk-primary">Apna GPU website se use karo →</Link>
          <Link href="/studio" className="rk-btn-ghost">Video Studio</Link>
          <Link href="/settings" className="rk-btn-ghost">Provider settings</Link>
        </div>
      </section>

      <section className="rk-card rk-card-wide">
        <div className="rk-card-head">
          <span className="rk-card-emoji">⚡</span>
          <div>
            <h2>One-command setup</h2>
            <small>Repo ke saath aata hai</small>
          </div>
        </div>
        <pre className="rk-snippet rk-snippet-wide">{`# video ke liye (Wan2GP — 6 GB VRAM se chalega)
bash scripts/setup-local-video.sh --wan2gp

# image + video dono (ComfyUI)
bash scripts/setup-local-video.sh --comfyui

# sirf chat (Ollama)
bash scripts/setup-local-video.sh --ollama`}</pre>
      </section>

      <footer className="rk-foot">
        <span>{BRAND.name} · {BRAND.founder} &amp; {BRAND.coFounder}</span>
        <span>Poora guide: docs/LOCAL-GENERATION.md</span>
      </footer>
    </div>
  );
}
