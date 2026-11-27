import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/comfy/job?endpoint=…&id=…
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const endpoint = normaliseEndpoint(searchParams.get('endpoint'));
  const id = searchParams.get('id');
  if (!endpoint) return NextResponse.json({ error: 'Endpoint invalid' }, { status: 400 });
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const res = await fetch(`${endpoint}/history/${encodeURIComponent(id)}`, {
      signal: timeout(10000),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const history = await res.json();
    const entry = history && history[id];
    if (!entry) return NextResponse.json({ done: false, pending: true });

    if (entry.status && entry.status.status_str === 'error') {
      const messages = entry.status.messages || [];
      const found = messages.find((m) => Array.isArray(m) && m[0] === 'execution_error');
      const detail = found && found[1] && found[1].exception_message;
      return NextResponse.json({ error: detail ? String(detail) : 'ComfyUI execution error' });
    }

    const images = [];
    Object.values(entry.outputs || {}).forEach((node) => {
      (node.images || []).forEach((img) => images.push(img));
      (node.gifs || []).forEach((img) => images.push(img));
    });
    return NextResponse.json({ done: images.length > 0, images });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
