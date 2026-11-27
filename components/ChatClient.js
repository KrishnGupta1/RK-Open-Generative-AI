'use client';

// RK GEM AI chat client.
//
// Design decisions:
//  - All provider settings (keys, base URLs, model choice) live in
//    localStorage on the user's device. Nothing is stored server-side; keys
//    are only forwarded per-request to the provider through our proxy.
//  - One conversation list, streamed Markdown answers, a provider/model
//    switcher in the header, and a floating "Providers" panel so a first
//    time user can get going in under a minute.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { PROVIDER_UI as PROVIDERS } from '@/lib/providerUi';

const STORE_KEY = 'rkgem.settings.v1';
const CHATS_KEY = 'rkgem.chats.v1';

const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  model: '',
  baseUrl: '',
  keys: {},
  systemPrompt: '',
  temperature: 0.7,
};

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadChats() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
  } catch {
    return [];
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

const SUGGESTIONS = [
  { icon: '⚡', title: 'Free model chuno', body: 'OpenRouter ke free models se shuru karein — key free milti hai.' },
  { icon: '🦙', title: 'Local Ollama chalayein', body: 'Bina internet, bina paisa — llama3.2 ya qwen2.5 on-device.' },
  { icon: '🎬', title: 'Image & video banao', body: 'Studio kholiye: Flux, Kling, Veo aur 200+ models.' },
  { icon: '🧑‍💻', title: 'Code likhwao', body: 'Hinglish mein poochhiye — RK GEM AI code likhega.' },
];

export default function ChatClient() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState([]);
  const [modelsNote, setModelsNote] = useState('');
  const [panel, setPanel] = useState(false);
  const [copied, setCopied] = useState('');
  const [sideOpen, setSideOpen] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  // ---- hydrate ----
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    const list = loadChats();
    setChats(list);
    setActiveId(list[0]?.id || null);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(CHATS_KEY, JSON.stringify(chats.slice(0, 60)));
  }, [chats]);

  const active = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);
  const provider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0];

  // ---- model catalogue ----
  const loadModels = useCallback(async () => {
    setModelsNote('Models load ho rahe hain…');
    const params = new URLSearchParams({ provider: settings.provider });
    if (settings.keys[settings.provider]) params.set('key', settings.keys[settings.provider]);
    if (settings.baseUrl) params.set('baseUrl', settings.baseUrl);
    try {
      const res = await fetch(`/api/rk/models?${params}`);
      const json = await res.json();
      const list = json.models || [];
      setModels(list);
      setModelsNote(json.source === 'live' ? `${list.length} live models` : 'Curated free list');
      setSettings((s) =>
        s.model && list.some((m) => m.id === s.model) ? s : { ...s, model: list[0]?.id || '' },
      );
    } catch (e) {
      setModels(provider.staticModels.map((id) => ({ id, label: id })));
      setModelsNote('Offline list');
    }
  }, [settings.provider, settings.keys, settings.baseUrl, provider.staticModels]);

  useEffect(() => {
    if (settings.provider) loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider, settings.baseUrl]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages?.length, busy]);

  const patch = (p) => setSettings((s) => ({ ...s, ...p }));

  const newChat = () => {
    const chat = { id: uid(), title: 'New chat', createdAt: Date.now(), messages: [] };
    setChats((c) => [chat, ...c]);
    setActiveId(chat.id);
    setError('');
  };

  const deleteChat = (id) => {
    setChats((c) => c.filter((x) => x.id !== id));
    if (id === activeId) setActiveId(null);
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    let chatId = activeId;
    let history = active?.messages || [];
    if (!chatId) {
      chatId = uid();
      setChats((c) => [{ id: chatId, title: content.slice(0, 48), createdAt: Date.now(), messages: [] }, ...c]);
      setActiveId(chatId);
      history = [];
    }
    setInput('');

    const userMsg = { role: 'user', content };
    const assistantMsg = { role: 'assistant', content: '', reasoning: '' };
    setChats((cs) =>
      cs.map((c) =>
        c.id !== chatId
          ? c
          : {
              ...c,
              title: c.messages.length ? c.title : content.slice(0, 48),
              messages: [...c.messages, userMsg, assistantMsg],
            },
      ),
    );
    setBusy(true);
    setError('');

    const controller = new AbortController();
    abortRef.current = controller;

    const append = (field, chunk) =>
      setChats((cs) =>
        cs.map((c) => {
          if (c.id !== chatId) return c;
          const msgs = [...c.messages];
          const last = { ...msgs[msgs.length - 1] };
          last[field] = (last[field] || '') + chunk;
          msgs[msgs.length - 1] = last;
          return { ...c, messages: msgs };
        }),
      );

    try {
      const res = await fetch('/api/rk/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.keys[settings.provider] || '',
          baseUrl: settings.provider === 'custom' ? settings.baseUrl : '',
          temperature: Number(settings.temperature) || 0.7,
          systemPrompt: settings.systemPrompt,
          messages: [...history, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          let parsed;
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }
          if (parsed.type === 'delta') append('content', parsed.text);
          else if (parsed.type === 'reasoning') append('reasoning', parsed.text);
          else if (parsed.type === 'error') setError(parsed.error);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text.slice(0, 24));
      setTimeout(() => setCopied(''), 1400);
    } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const needsKey = provider.requiresKey && !settings.keys[provider.id];

  return (
    <div className="rk-shell">
      {/* ---------------- sidebar ---------------- */}
      <aside className={`rk-side ${sideOpen ? 'is-open' : ''}`}>
        <Link href="/" className="rk-brand">
          <span className="rk-logo">RK</span>
          <span>
            <b>{BRAND.name}</b>
            <i>by {BRAND.founder}</i>
          </span>
        </Link>

        <button className="rk-new" onClick={() => { newChat(); setSideOpen(false); }}>
          <span>＋</span> New chat
        </button>

        <div className="rk-side-label">Recent</div>
        <div className="rk-chatlist custom-scrollbar">
          {chats.length === 0 && <p className="rk-empty-side">Koi chat nahi — shuru karein 👇</p>}
          {chats.map((c) => (
            <div
              key={c.id}
              className={`rk-chatitem ${c.id === activeId ? 'is-active' : ''}`}
              onClick={() => { setActiveId(c.id); setSideOpen(false); }}
            >
              <span className="rk-chatitem-title">{c.title || 'Untitled'}</span>
              <button
                className="rk-chatitem-del"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="rk-side-foot">
          <Link href="/studio" className="rk-side-link">
            🎨 Media Studio
          </Link>
          <Link href="/settings" className="rk-side-link">
            ⚙️ Providers & keys
          </Link>
          <a href="https://github.com/KrishnGupta1/RK-Open-Generative-AI" target="_blank" rel="noreferrer" className="rk-side-link">
            ⭐ Star on GitHub
          </a>
          <div className="rk-credits">
            <div>
              <b>{BRAND.founder}</b>
              <span>{BRAND.founderRole}</span>
            </div>
            <div>
              <b>{BRAND.coFounder}</b>
              <span>{BRAND.coFounderRole}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------------- main ---------------- */}
      <main className="rk-main">
        <header className="rk-top">
          <button className="rk-burger" onClick={() => setSideOpen((v) => !v)} aria-label="Menu">☰</button>
          <button className="rk-menu-btn" onClick={() => setPanel((p) => !p)}>
            <span className="rk-dot" style={{ background: provider.color }} />
            <b>{provider.emoji} {provider.short}</b>
            <small>{settings.model || provider.staticModels[0] || 'choose model'}</small>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div className="rk-top-right">
            <Link href="/studio" className="rk-ghost">Studio</Link>
            <Link href="/settings" className="rk-ghost">Settings</Link>
          </div>
        </header>

        {panel && (
          <div className="rk-panel animate-fade-in-up">
            <div className="rk-panel-head">
              <b>Provider & model</b>
              <button onClick={() => setPanel(false)}>✕</button>
            </div>
            <div className="rk-providers">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className={`rk-prov ${settings.provider === p.id ? 'is-active' : ''}`}
                  onClick={() => {
                    patch({ provider: p.id, model: '' });
                    setModels([]);
                  }}
                >
                  <span>{p.emoji}</span>
                  <b>{p.short}</b>
                  <small>{p.note}</small>
                </button>
              ))}
            </div>

            <div className="rk-field">
              <label>Model <em>{modelsNote}</em></label>
              <div className="rk-row">
                <select
                  value={settings.model}
                  onChange={(e) => patch({ model: e.target.value })}
                  className="rk-select"
                >
                  {!models.length && <option value="">Loading…</option>}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label || m.id}{m.free ? ' · free' : ''}
                    </option>
                  ))}
                </select>
                <button className="rk-btn-ghost" onClick={loadModels}>↻</button>
              </div>
            </div>

            <div className="rk-field">
              <label>
                {provider.id === 'ollama' ? 'Ollama base URL' : `${provider.short} API key`}
                {!provider.requiresKey && <em> optional</em>}
              </label>
              <div className="rk-row">
                <input
                  type={provider.requiresKey ? 'password' : 'text'}
                  placeholder={provider.keyHint}
                  defaultValue={provider.requiresKey ? settings.keys[provider.id] || '' : settings.baseUrl || provider.defaultBaseUrl}
                  onChange={(e) =>
                    provider.requiresKey
                      ? patch({ keys: { ...settings.keys, [provider.id]: e.target.value } })
                      : patch({ baseUrl: e.target.value })
                  }
                  className="rk-input"
                />
                {provider.docs && (
                  <a className="rk-btn-ghost" href={provider.docs} target="_blank" rel="noreferrer" title="Get a free key">
                    get key ↗
                  </a>
                )}
              </div>
              <p className="rk-hint">
                Key sirf aapke browser mein rehti hai (localStorage) aur seedha provider ko jaati hai.
              </p>
            </div>

            <div className="rk-field">
              <label>Reasoning effort · {Number(settings.temperature).toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => patch({ temperature: e.target.value })}
                className="rk-range"
              />
            </div>
          </div>
        )}

        <div className="rk-scroll custom-scrollbar" ref={scrollRef}>
          {!active?.messages?.length ? (
            <div className="rk-welcome">
              <div className="rk-hero-badge">100% free · open source</div>
              <h1>
                Namaste, main <span className="rk-grad">{BRAND.name}</span> hoon 👋
              </h1>
              <p>
                Free models se baat karein — OpenRouter, Groq, Gemini ya apna local Ollama.
                Koi subscription nahi, koi lock-in nahi.
              </p>
              <div className="rk-sugg">
                {SUGGESTIONS.map((s) => (
                  <button key={s.title} className="rk-sugg-card" onClick={() => setInput(s.body)}>
                    <span>{s.icon}</span>
                    <b>{s.title}</b>
                    <small>{s.body}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rk-thread">
              {active.messages.map((m, i) => (
                <div key={i} className={`rk-msg rk-msg-${m.role}`}>
                  <div className="rk-avatar">{m.role === 'user' ? '🧑' : '💎'}</div>
                  <div className="rk-bubble">
                    {m.reasoning ? <details className="rk-reason"><summary>Thinking…</summary><pre>{m.reasoning}</pre></details> : null}
                    <div className="rk-md">{renderMarkdown(m.content)}</div>
                    {m.role === 'assistant' && m.content && (
                      <div className="rk-msg-actions">
                        <button onClick={() => copy(m.content)}>{copied && copied === m.content.slice(0, 24) ? 'Copied ✓' : 'Copy'}</button>
                      </div>
                    )}
                    {m.role === 'assistant' && busy && i === active.messages.length - 1 && !m.content && (
                      <span className="rk-typing"><i /><i /><i /></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rk-error">
            <b>Oops:</b> {error}
            {needsKey && <> — <Link href="/settings">key add karein</Link></>}
          </div>
        )}

        <div className="rk-composer-wrap">
          <div className="rk-composer">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              placeholder={`${provider.emoji} ${BRAND.name} se poochhiye…  (Shift+Enter = nayi line)`}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 220) + 'px';
              }}
              onKeyDown={onKeyDown}
            />
            {busy ? (
              <button className="rk-send rk-stop" onClick={stop} title="Stop">■</button>
            ) : (
              <button className="rk-send" onClick={() => send()} disabled={!input.trim()} title="Send">↑</button>
            )}
          </div>
          <p className="rk-disclaimer">
            {BRAND.name} free hai — model ke outputs galat ho sakte hain, important cheezein verify karein.
            {' '}Built by {BRAND.founder} &amp; {BRAND.coFounder}.
          </p>
        </div>
      </main>
    </div>
  );
}

// Tiny markdown renderer (no extra deps): headings, bold, italics, code,
// lists, links. Falls back to escaped text.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderMarkdown(text = '') {
  const blocks = String(text).split(/```/);
  let html = '';
  blocks.forEach((block, idx) => {
    if (idx % 2 === 1) {
      const nl = block.indexOf('\n');
      const lang = nl > -1 ? block.slice(0, nl).trim() : '';
      const code = nl > -1 ? block.slice(nl + 1) : block;
      html += `<pre class="rk-code"><span class="rk-code-lang">${escapeHtml(lang || 'code')}</span><code>${escapeHtml(code)}</code></pre>`;
      return;
    }
    const lines = escapeHtml(block).split(/\n/);
    let list = null;
    const flush = () => {
      if (list) {
        html += `<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`;
        list = null;
      }
    };
    for (const raw of lines) {
      const line = raw.trimEnd();
      const ul = line.match(/^\s*[-*•]\s+(.*)$/);
      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (ul) {
        if (!list || list.tag !== 'ul') { flush(); list = { tag: 'ul', items: [] }; }
        list.items.push(ul[1]);
      } else if (ol) {
        if (!list || list.tag !== 'ol') { flush(); list = { tag: 'ol', items: [] }; }
        list.items.push(ol[1]);
      } else {
        flush();
        if (h) html += `<h${h[1].length + 2}>${inline(h[2])}</h${h[1].length + 2}>`;
        else if (line.trim()) html += `<p>${inline(line)}</p>`;
      }
    }
    flush();
  });
  return html;
}
