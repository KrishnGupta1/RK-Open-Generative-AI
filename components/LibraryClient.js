'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { rkdb } from '@/lib/rkdb';

export default function LibraryClient() {
  const [tab, setTab] = useState('creations');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ creations: 0, templates: 0, gpus: 0, sizeKB: 0 });
  const [msg, setMsg] = useState('');

  const refresh = useCallback(() => {
    setRows(rkdb.search(tab, q));
    setStats(rkdb.stats());
  }, [tab, q]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const download = (name, text) => {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (file) => {
    const text = await file.text();
    const out = rkdb.importJSON(text);
    setMsg(out.ok ? `✓ ${out.tables} tables import ho gayi` : `✗ ${out.error}`);
    refresh();
    setTimeout(() => setMsg(''), 3000);
  };

  const tabs = [
    ['creations', '🖼️ Creations'],
    ['templates', '🎞️ Prompts'],
    ['gpus', '🔌 GPUs'],
  ];

  const empty = useMemo(
    () =>
      tab === 'creations'
        ? { icon: '🖼️', title: 'Abhi kuch nahi banaya', body: 'Studio me image/video banao — yahan apne aap aa jayega.', href: '/studio', cta: 'Studio kholo' }
        : tab === 'templates'
          ? { icon: '🎞️', title: 'Koi prompt saved nahi', body: 'Templates page par ⧉ Copy / save se prompts yahan aate hain.', href: '/templates', cta: 'Templates kholo' }
          : { icon: '🔌', title: 'Koi GPU save nahi', body: 'Kaggle ka URL jodo — yahan save rahega, dobara type nahi karna.', href: '/gpu', cta: 'GPU jodo' },
    [tab],
  );

  return (
    <div className="rk-page">
      <header className="rk-page-head">
        <Link href="/studio" className="rk-back">← Studio</Link>
        <div>
          <h1>Meri Library</h1>
          <p>Sab kuch aapke device par — offline bhi. Koi login nahi, koi server nahi.</p>
        </div>
        <span className="rk-lib-size">{stats.sizeKB} KB</span>
      </header>

      <div className="rk-tpl-tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
            {label} <span className="rk-lib-count">{stats[id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="rk-lib-tools">
        <input
          className="rk-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search… (prompt, naam, URL)"
        />
        <button className="rk-mm-btn" onClick={() => download(`rk-backup-${Date.now()}.json`, rkdb.exportJSON())}>
          ⬇ Backup
        </button>
        <label className="rk-mm-btn" style={{ cursor: 'pointer' }}>
          ⬆ Restore
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
        </label>
      </div>

      {msg && <p className="rk-note is-ok">{msg}</p>}

      {rows.length === 0 ? (
        <div className="rk-lib-empty">
          <span>{empty.icon}</span>
          <b>{empty.title}</b>
          <p>{empty.body}</p>
          <Link href={empty.href} className="rk-primary">{empty.cta}</Link>
        </div>
      ) : (
        <div className={`rk-lib-grid ${tab !== 'creations' ? 'is-list' : ''}`}>
          {rows.map((r) => (
            <article key={r.id || r.url || r.k} className="rk-lib-card">
              {tab === 'creations' && r.url && (
                r.kind === 'video' ? (
                  <video src={r.url} muted playsInline preload="metadata" />
                ) : (
                  <img src={r.url} alt={r.prompt || 'creation'} loading="lazy" />
                )
              )}
              <div className="rk-lib-body">
                <b>{r.title || r.label || (r.prompt ? String(r.prompt).slice(0, 46) : r.url || r.id)}</b>
                {tab === 'creations' && (
                  <small>
                    {r.model || '—'} · {new Date(r.created_at).toLocaleDateString()}
                  </small>
                )}
                {tab === 'gpus' && <small>{r.url}</small>}
                {tab === 'templates' && <small>{r.kind || 'image'}</small>}
                <div className="rk-lib-actions">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" download>⬇</a>
                  )}
                  <button
                    onClick={() => {
                      rkdb.remove(tab, tab === 'gpus' ? 'url' : 'id', r.url || r.id || r.k);
                      refresh();
                    }}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="rk-tpl-foot">
        Backup file se aap kisi bhi device par restore kar sakte ho —{' '}
        <Link href="/gpu">GPU jodo</Link> · <Link href="/templates">Templates</Link>
      </p>
    </div>
  );
}
