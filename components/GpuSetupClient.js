'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const STORE = 'rk-gpu-endpoint';

export default function GpuSetupClient({ script }) {
  const [copied, setCopied] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [saved, setSaved] = useState('');
  const [state, setState] = useState({ kind: 'none', text: '' });

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      if (raw.endpoint) {
        setEndpoint(raw.endpoint);
        setSaved(raw.endpoint);
      }
    } catch {}
  }, []);

  const copy = useCallback(async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const check = useCallback(async (url) => {
    const target = String(url || '').trim().replace(/\/+$/, '');
    if (!target) {
      setState({ kind: 'err', text: 'Pehle URL daalo' });
      return;
    }
    setState({ kind: 'busy', text: 'GPU check ho raha…' });
    try {
      const res = await fetch('/api/rk/comfy/ping?endpoint=' + encodeURIComponent(target));
      const j = await res.json();
      if (j.ok) {
        setState({
          kind: 'ok',
          text: `✓ Online — ${(j.devices || []).join(', ') || 'GPU'} · ${j.vram?.totalGB || '?'} GB VRAM`,
        });
        try {
          const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
          localStorage.setItem(STORE, JSON.stringify({ ...raw, endpoint: target }));
        } catch {}
        setSaved(target);
      } else {
        setState({ kind: 'err', text: j.error || 'connect nahi hua' });
      }
    } catch (err) {
      setState({ kind: 'err', text: err.message });
    }
  }, []);

  return (
    <div className="rk-page">
      <header className="rk-page-head">
        <Link href="/studio" className="rk-back">← Studio</Link>
        <div>
          <h1>Apna GPU jodo</h1>
          <p>Kaggle ka free T4 x2 GPU — ₹0, card nahi, subscription nahi. 3-4 minute.</p>
        </div>
        <Link href="/studio/apna-gpu" className="rk-primary">Kholo →</Link>
      </header>

      {/* ---------------- step 1 ---------------- */}
      <section className="rk-step">
        <span className="rk-step-num">1</span>
        <div>
          <h2>Kaggle notebook kholo</h2>
          <p>
            <a href="https://www.kaggle.com/code" target="_blank" rel="noreferrer">kaggle.com/code</a>{' '}
            → <b>New Notebook</b>. Phone par bhi chalta hai.
          </p>
          <ul className="rk-step-list">
            <li>Right panel → <b>Session options</b> → <b>Accelerator = GPU T4 x2</b></li>
            <li>Usi panel me <b>Internet = ON</b> (ye sabse zaroori hai — iske bina tunnel nahi banega)</li>
            <li>Starter cells (jo pehle se likhe hote hain) — <b>delete</b> kar do</li>
          </ul>
        </div>
      </section>

      {/* ---------------- step 2 ---------------- */}
      <section className="rk-step">
        <span className="rk-step-num">2</span>
        <div>
          <h2>Poora code copy karo</h2>
          <p>Ek hi cell me paste karna hai. Neeche <b>Copy</b> dabao — poora script clipboard me chala jayega.</p>
          <div className="rk-code-actions">
            <button className="rk-primary" onClick={() => copy(script, 'code')}>
              {copied === 'code' ? '✓ Copy ho gaya' : '⧉ Poora code copy karo'}
            </button>
            <button className="rk-mm-btn" onClick={() => copy(script, 'code2')}>
              {copied === 'code2' ? '✓ Done' : '⧉ Phir se copy'}
            </button>
            <span className="rk-code-size">{script.split('\n').length} lines · {(script.length / 1024).toFixed(1)} KB</span>
          </div>
          <pre className="rk-code-block">{script}</pre>
        </div>
      </section>

      {/* ---------------- step 3 ---------------- */}
      <section className="rk-step">
        <span className="rk-step-num">3</span>
        <div>
          <h2>Run dabao — 3-4 minute</h2>
          <p>Pehli baar zyada lagta hai (ComfyUI clone + pip install). Isi liye patience.</p>
          <ol className="rk-step-list">
            <li><code>▶ GPU check</code> — Tesla T4 × 2 dikhega</li>
            <li><code>▶ ComfyUI clone</code></li>
            <li><code>▶ dependencies</code> — ~2 min (sabse lamba step)</li>
            <li><code>▶ agent</code> — model download/delete enable</li>
            <li><code>▶ ComfyUI start</code> — yahan ~1 min rukna normal hai</li>
            <li><code>▶ tunnel</code> — 1/3 cloudflared (http2)</li>
          </ol>
          <p className="rk-note">
            🟢 Aakhir me aisa line aayega:{' '}
            <code>✅ STUDIO URL: https://xxxx.trycloudflare.com</code>
          </p>
          <p className="rk-note is-warn">
            ⏳ <b>“ComfyUI start…” par ruka hua lag raha hai?</b> Ye normal hai — pehli baar 1-2 min lagta hai.
            Notebook band mat karo. <code>▶ tunnel…</code> line aane ka wait karo.
          </p>
        </div>
      </section>

      {/* ---------------- step 4 ---------------- */}
      <section className="rk-step">
        <span className="rk-step-num">4</span>
        <div>
          <h2>URL yahan paste karo</h2>
          <p>Sirf URL bhi chalega, poora Kaggle log bhi chalega — main khud nikaal lunga.</p>
          <div className="rk-code-actions">
            <input
              className="rk-input"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://xxxx.trycloudflare.com  (ya poora log paste karo)"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              style={{ flex: '1 1 260px' }}
            />
            <button className="rk-primary" onClick={() => check(endpoint)}>Jodo + test karo</button>
          </div>
          {state.text && (
            <p className={`rk-note ${state.kind === 'ok' ? 'is-ok' : state.kind === 'err' ? 'is-warn' : ''}`}>
              {state.text}
            </p>
          )}
          {saved && (
            <p className="rk-note is-ok">
              ✓ Saved: <code>{saved}</code> — ab{' '}
              <Link href="/studio/apna-gpu">Studio → Apna GPU</Link> kholo.
            </p>
          )}
        </div>
      </section>

      {/* ---------------- model ---------------- */}
      <section className="rk-step">
        <span className="rk-step-num">5</span>
        <div>
          <h2>Model download karo (app ke andar se)</h2>
          <p>
            <Link href="/studio/apna-gpu">Studio → Apna GPU → 🧩 Models</Link> — wahan{' '}
            <b>“🎯 Aapke GPU ke liye best”</b> khud suggest karega:
          </p>
          <ul className="rk-step-list">
            <li><b>SD 1.5</b> — 4 GB, sabse halka, 4 GB VRAM se chalta hai</li>
            <li><b>SDXL Base</b> — 6.9 GB, best balance</li>
            <li><b>FLUX.1 Schnell</b> — 11.9 GB, top quality (16 GB VRAM)</li>
            <li><b>Wan 2.1 1.3B</b> — 3.6 GB, video</li>
          </ul>
          <p className="rk-note">
            Apna link bhi de sakte ho (HuggingFace / Civitai) — Models → <b>“🔗 Apna link se download karo”</b>.
          </p>
        </div>
      </section>

      {/* ---------------- troubleshoot ---------------- */}
      <section className="rk-step is-wide">
        <span className="rk-step-num">⚠</span>
        <div>
          <h2>Kuch galat ho jaye to</h2>
          <div className="rk-table-wrap">
            <table className="rk-table">
              <thead>
                <tr><th>Dikkat</th><th>Wajah</th><th>Kya karo</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>No GPU</code> line</td>
                  <td>Accelerator off hai</td>
                  <td>Session options → GPU T4 x2 → <b>Run → Restart &amp; Run all</b></td>
                </tr>
                <tr>
                  <td>Tunnel nahi bana</td>
                  <td>Internet OFF hai</td>
                  <td>Session options → Internet ON → notebook restart</td>
                </tr>
                <tr>
                  <td>&quot;ComfyUI start…&quot; par ruka</td>
                  <td>Pehli baar slow</td>
                  <td>1-2 min wait. Phir bhi na ho to <code>main()</code> dobara chalao</td>
                </tr>
                <tr>
                  <td>Website par 🔴 &quot;baat nahi hui&quot;</td>
                  <td>URL purana / notebook so gaya</td>
                  <td>Kaggle me cell dobara chalao → <b>naya URL</b> paste karo</td>
                </tr>
                <tr>
                  <td>Endpoint invalid</td>
                  <td><code>127.0.0.1</code> ya localhost daala</td>
                  <td>Phone se woh kabhi nahi chalega — trycloudflare URL chahiye</td>
                </tr>
                <tr>
                  <td>9-12 ghante baad band</td>
                  <td>Kaggle session limit</td>
                  <td>Notebook restart → naya URL. Model dobara download nahi hote (disk bacha lo)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------- limits ---------------- */}
      <section className="rk-step is-wide">
        <span className="rk-step-num">⏱</span>
        <div>
          <h2>Kaggle ki seema (jaan lena zaroori hai)</h2>
          <ul className="rk-step-list">
            <li><b>30 ghante/week</b> free GPU (T4 x2)</li>
            <li>Ek session <b>9-12 ghante</b> chalta hai — uske baad URL mar jata hai</li>
            <li>Session band → <b>files bhi jaate hain</b> (ComfyUI + models dobara). <i>Isliye 4GB model se shuru karo.</i></li>
            <li>Image: <b>15-25 sec</b> · Video: <b>3-6 min</b></li>
          </ul>
        </div>
      </section>

      <p className="rk-tpl-foot">
        <Link href="/studio/apna-gpu">Studio → Apna GPU</Link> ·{' '}
        <Link href="/templates">Templates</Link> ·{' '}
        <Link href="/local">Local page</Link>
      </p>
    </div>
  );
}
