import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/rk/comfy/render  { endpoint, workflow }
// Queues any ComfyUI API-format workflow; the browser polls /job for status.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const endpoint = normaliseEndpoint(body && body.endpoint);
  if (!endpoint) return NextResponse.json({ error: 'Endpoint invalid' }, { status: 400 });
  if (!body || !body.workflow || typeof body.workflow !== 'object') {
    return NextResponse.json({ error: 'workflow (API format) required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${endpoint}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: body.workflow, client_id: `rkgem-${Date.now()}` }),
      signal: timeout(20000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error?.message || json?.error || `ComfyUI ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ promptId: json.prompt_id, queued: json.number ?? null });
  } catch (err) {
    return NextResponse.json({ error: `Queue fail: ${err.message}` }, { status: 502 });
  }
}
