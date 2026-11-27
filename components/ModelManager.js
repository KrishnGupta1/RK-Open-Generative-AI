'use client';

// RK GEM AI — "Models" tab: poora control hamare app se.
//
// Yahan se user decide karta hai kaunsa model GPU par rahega:
//   • Download  → seedha GPU par utarta hai (progress live)
//   • Delete    → GPU disk se hata deta hai (trash me, recoverable)
//   • Switch    → "Use karo" se wahi model studio me lag jata hai
//
// Kaggle notebook me kuch type nahi karna — bas ek baar tunnel URL.

import { useCallback, useEffect, useRef, useState } from 'react';

const KIND_LABEL = { image: 'Image', video: 'Video', helper: 'Helper file' };

export default function ModelManager({ endpoint, onUse }) {
  const [rows, setRows] = useState([]);
  const [disk, setDisk] = useState(null);
  const [gpu, setGpu] = useState(null);
  const [agent, setAgent] = useState(true);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState({}); // id → {percent, state, speedMBs, error}
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState(null);
  const timers = useRef({});

  const load = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rk/comfy/models?endpoint=${encodeURIComponent(endpoint)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'models load fail');
      setRows(json.models || []);
      setDisk(json.disk || null);
      setGpu(json.gpu || null);
      setAgent(Boolean(json.agent));
      setWarning(json.warning || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      Object.values(timers.current).forEach((t) => clearInterval(t));
    },
    [],
  );

  const pollJob = (id, jobId) => {
    clearInterval(timers.current[id]);
    timers.current[id] = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/rk/comfy/models/download?endpoint=${encodeURIComponent(endpoint)}&job=${jobId}`,
        );
        const job = await res.json();
        if (!res.ok) throw new Error(job.error || 'progress fail');
        setJobs((j) => ({ ...j, [id]: job }));
        if (job.state === 'done' || job.state === 'error') {
          clearInterval(timers.current[id]);
          setTimeout(load, 800);
        }
      } catch (err) {
        clearInterval(timers.current[id]);
        setJobs((j) => ({ ...j, [id]: { state: 'error', error: err.message } }));
      }
    }, 2000);
  };

  const download = async (model) => {
    setError(null);
    setJobs((j) => ({ ...j, [model.id]: { state: 'starting', percent: 0 } }));
    try {
      const res = await fetch('/api/rk/comfy/models/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, id: model.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'download fail');
      if (json.already) {
        setJobs((j) => ({ ...j, [model.id]: { state: 'done', percent: 100 } }));
        load();
        return;
      }
      setJobs((j) => ({ ...j, [model.id]: { state: 'downloading', percent: 0 } }));
      pollJob(model.id, json.jobId);
    } catch (err) {
      setJobs((j) => ({ ...j, [model.id]: { state: 'error', error: err.message } }));
      setError(err.message);
    }
  };

  const remove = async (model) => {
    setConfirmId(null);
    setError(null);
    try {
      const res = await fetch('/api/rk/comfy/models/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, id: model.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'delete fail');
      setJobs((j) => ({ ...j, [model.id]: undefined }));
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const grouped = ['image', 'video', 'helper'].map((kind) => ({
    kind,
    items: rows.filter((r) => r.kind === kind),
  }));

  return (
    <div className="rk-mm">
      <div className="rk-mm-head">
        <div>
          <b>GPU Models</b>
          <small>
            {gpu ? `${gpu.name} · ${gpu.freeGB}/${gpu.totalGB} GB VRAM free` : 'GPU info loading…'}
            {disk ? ` · disk ${disk.freeGB}/${disk.totalGB} GB free` : ''}
          </small>
        </div>
        <button className="rk-btn-ghost" onClick={load} disabled={loading}>
          {loading ? '…' : '↻ Refresh'}
        </button>
      </div>

      {disk && (
        <div className="rk-mm-disk" title={`${disk.usedGB} GB used`}>
          <span style={{ width: `${Math.min(100, (disk.usedGB / disk.totalGB) * 100)}%` }} />
        </div>
      )}

      {!agent && warning && <p className="rk-mm-warn">⚠️ {warning}</p>}
      {error && <p className="rk-mm-warn">✗ {error}</p>}

      {grouped.map(
        ({ kind, items }) =>
          items.length > 0 && (
            <section key={kind} className="rk-mm-group">
              <h4>{KIND_LABEL[kind]} models</h4>
              <div className="rk-mm-grid">
                {items.map((m) => {
                  const job = jobs[m.id];
                  const busy = job && (job.state === 'downloading' || job.state === 'starting');
                  return (
                    <article key={m.id} className={`rk-mm-card ${m.installed ? 'is-on' : ''}`}>
                      <div className="rk-mm-card-top">
                        <span className="rk-mm-emoji">{m.emoji}</span>
                        <div>
                          <b>{m.label}</b>
                          <small>
                            {m.totalGB || m.sizeGB} GB · {m.vramGB} GB VRAM
                            {m.installed ? ' · ✅ GPU par hai' : ''}
                          </small>
                        </div>
                        {m.recommend && <span className="rk-mm-badge">recommended</span>}
                      </div>

                      <p className="rk-mm-note">{m.note}</p>

                      {m.missingHelpers?.length > 0 && (
                        <p className="rk-mm-missing">
                          Saath me chahiye: {m.missingHelpers.join(', ')}
                        </p>
                      )}

                      {job && (job.state === 'downloading' || job.state === 'starting') && (
                        <div className="rk-mm-progress">
                          <div className="rk-mm-bar">
                            <span style={{ width: `${job.percent || 0}%` }} />
                          </div>
                          <small>
                            {job.percent != null ? `${job.percent}%` : 'shuru…'}
                            {job.speedMBs ? ` · ${job.speedMBs} MB/s` : ''}
                          </small>
                        </div>
                      )}

                      {job?.state === 'error' && <p className="rk-mm-warn">✗ {job.error}</p>}
                      {job?.state === 'done' && <p className="rk-mm-ok">✅ Download ho gaya</p>}

                      <div className="rk-mm-actions">
                        {!m.installed && !busy && (
                          <button className="rk-primary rk-mm-btn" onClick={() => download(m)}>
                            ⬇ Download
                          </button>
                        )}
                        {busy && <span className="rk-mm-status">Download ho raha…</span>}
                        {m.installed && kind !== 'helper' && (
                          <button className="rk-primary rk-mm-btn" onClick={() => onUse?.(m)}>
                            ✓ Use karo
                          </button>
                        )}
                        {m.installed && (
                          <>
                            {confirmId === m.id ? (
                              <button className="rk-mm-btn rk-mm-danger" onClick={() => remove(m)}>
                                Pakka delete?
                              </button>
                            ) : (
                              <button className="rk-mm-btn" onClick={() => setConfirmId(m.id)}>
                                🗑 Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ),
      )}

      <p className="rk-mm-foot">
        Delete karne par file GPU ke <code>models/.rkgem-trash/</code> me chali jaati hai — galti ho to wapas mil
        sakti hai. Free quota bachane ke liye jo model use nahi ho raha, delete kar do.
      </p>
    </div>
  );
}
