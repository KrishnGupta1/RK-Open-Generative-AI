import { NextResponse } from 'next/server';
import { PROVIDERS, resolveBaseUrl, envKeyFor } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory rate limit (per process). Free hosting = be nice.
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = Number(process.env.RK_RATE_LIMIT || 30);

function rateLimited(key) {
  const now = Date.now();
  const bucket = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (bucket.length >= MAX_PER_WINDOW) {
    hits.set(key, bucket);
    return true;
  }
  bucket.push(now);
  hits.set(key, bucket);
  if (hits.size > 5000) hits.clear();
  return false;
}

const SYSTEM_PROMPT = `You are RK GEM AI, a friendly, capable assistant made by Krishn Gupta (Founder & CEO) and Riya Gupta (Co-Founder) of RK GEM AI.
Answer clearly and helpfully in the user's language (Hindi, Hinglish or English). Use Markdown for structure and code blocks for code.`;

function sse(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    messages = [],
    provider: providerId = 'openrouter',
    model = '',
    apiKey: clientKey = '',
    baseUrl: clientBaseUrl = '',
    temperature = 0.7,
    maxTokens = 2048,
    systemPrompt = '',
  } = body || {};

  const provider = PROVIDERS[providerId];
  if (!provider) {
    return NextResponse.json({ error: `Unknown provider "${providerId}"` }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages[] is required' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests — thoda ruk kar try karein (1 min).' }, { status: 429 });
  }

  const apiKey = (clientKey || '').trim() || envKeyFor(providerId) || '';
  if (provider.requiresKey && !apiKey) {
    return NextResponse.json(
      { error: `Missing API key for ${provider.label}. Settings → Providers mein key daalein.` },
      { status: 401 },
    );
  }

  const baseUrl = resolveBaseUrl(providerId, clientBaseUrl);
  if (!baseUrl) {
    return NextResponse.json({ error: `Base URL required for ${provider.label}.` }, { status: 400 });
  }

  const msgs = [
    { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
    ...messages
      .filter((m) => m && m.content)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) })),
  ];

  let upstream;
  try {
    upstream =
      provider.kind === 'gemini'
        ? await callGemini({ baseUrl, apiKey, model, msgs, temperature, maxTokens })
        : await callOpenAICompatible({ providerId, baseUrl, apiKey, model, msgs, temperature, maxTokens });
  } catch (err) {
    return NextResponse.json({ error: `Upstream unreachable: ${err.message}` }, { status: 502 });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.error?.message || parsed?.message || text;
    } catch {}
    return NextResponse.json(
      { error: `${provider.label} error (${upstream.status}): ${String(detail).slice(0, 500)}` },
      { status: upstream.status },
    );
  }

  // Normalise both protocols into one SSE stream of {type:"delta"|"done"|"error"}.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(sse(obj)));
      try {
        if (provider.kind === 'gemini') {
          const json = await upstream.json();
          const candidate = json?.candidates?.[0];
          const parts = candidate?.content?.parts || [];
          const text = parts.map((p) => p.text || '').join('');
          // Stream in word groups so the UI still feels live.
          for (const chunk of text.match(/[\s\S]{1,48}/g) || []) {
            send({ type: 'delta', text: chunk });
          }
          send({ type: 'done', usage: json?.usageMetadata || null });
        } else {
          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const raw of lines) {
              const line = raw.trim();
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const parsed = JSON.parse(payload);
                const delta = parsed?.choices?.[0]?.delta || {};
                const text = delta.content || '';
                const reasoning = delta.reasoning || delta.reasoning_content || '';
                if (reasoning) send({ type: 'reasoning', text: reasoning });
                if (text) send({ type: 'delta', text });
              } catch {}
            }
          }
          send({ type: 'done' });
        }
      } catch (err) {
        send({ type: 'error', error: err.message });
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function callOpenAICompatible({ providerId, baseUrl, apiKey, model, msgs, temperature, maxTokens }) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = process.env.RK_PUBLIC_URL || 'https://rkgem.ai';
    headers['X-Title'] = 'RK GEM AI';
  }
  return fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || (PROVIDERS[providerId].staticModels[0] ?? 'llama3.2'),
      messages: msgs,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
    signal: AbortSignal.timeout(120_000),
  });
}

function callGemini({ baseUrl, apiKey, model, msgs, temperature, maxTokens }) {
  const system = msgs.find((m) => m.role === 'system')?.content || '';
  const contents = msgs
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const chosen = model || 'gemini-2.5-flash';
  return fetch(`${baseUrl}/models/${encodeURIComponent(chosen)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: { temperature, maxOutputTokens: Math.min(maxTokens, 8192) },
    }),
    signal: AbortSignal.timeout(120_000),
  });
}
