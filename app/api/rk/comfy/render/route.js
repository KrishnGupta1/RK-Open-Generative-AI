import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';
import { WORKFLOWS } from '@/lib/workflows';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/rk/comfy/render
//   { endpoint, workflowId, params }  → builds one of our built-in graphs
//   { endpoint, workflow }            → raw ComfyUI API-format graph
//
// The browser never needs ComfyUI node IDs: it picks Image/Video in our UI
// and we send the right graph.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const endpoint = normaliseEndpoint(body && body.endpoint);
  if (!endpoint) {
    return NextResponse.json(
      { error: 'GPU connected nahi hai — /studio-remote par apna ComfyUI URL daalein.' },
      { status: 400 },
    );
  }

  let graph = null;
  let meta = { kind: 'image', workflowId: 'custom' };

  if (body.workflowId) {
    const wf = WORKFLOWS[body.workflowId];
    if (!wf) return NextResponse.json({ error: `Unknown workflow "${body.workflowId}"` }, { status: 400 });

    const params = body.params || {};
    const prompt = String(params.prompt || '').trim();
    if (!prompt) return NextResponse.json({ error: 'Prompt likhna zaroori hai' }, { status: 400 });
    if (body.workflowId === 'wan-i2v' && !params.image) {
      return NextResponse.json({ error: 'Image-to-video ke liye pehle image chunein' }, { status: 400 });
    }

    try {
      graph = wf.build({
        prompt: prompt.slice(0, 2000),
        negative: String(params.negative || '').slice(0, 800),
        width: Number(params.width) || wf.defaults.width || 1024,
        height: Number(params.height) || wf.defaults.height || 1024,
        steps: Math.min(Math.max(Number(params.steps) || wf.defaults.steps || 20, 1), 60),
        frames: Math.min(Math.max(Number(params.frames) || wf.defaults.frames || 33, 9), 81),
        seed: Number(params.seed) || Math.floor(Math.random() * 1e12),
        ckpt: params.ckpt ? String(params.ckpt) : '',
        image: params.image ? String(params.image) : '',
      });
    } catch (err) {
      return NextResponse.json({ error: `Workflow build fail: ${err.message}` }, { status: 400 });
    }
    meta = { kind: wf.kind, workflowId: wf.id };
  } else if (body.workflow && typeof body.workflow === 'object') {
    graph = body.workflow;
    meta = { kind: body.kind === 'video' ? 'video' : 'image', workflowId: 'custom' };
  } else {
    return NextResponse.json({ error: 'workflowId ya workflow chahiye' }, { status: 400 });
  }

  try {
    const res = await fetch(`${endpoint}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph, client_id: `rkgem-${Date.now()}` }),
      signal: timeout(20000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const nodeErrors = json && json.node_errors
        ? Object.values(json.node_errors)
            .map((n) => n && n.errors && n.errors[0] && n.errors[0].message)
            .filter(Boolean)
            .join('; ')
        : '';
      const msg = (json && json.error && (json.error.message || json.error)) || nodeErrors || `ComfyUI ${res.status}`;
      return NextResponse.json({ error: String(msg).slice(0, 400) }, { status: 502 });
    }
    return NextResponse.json({ promptId: json.prompt_id, kind: meta.kind, workflowId: meta.workflowId });
  } catch (err) {
    return NextResponse.json({ error: `Queue fail: ${err.message}` }, { status: 502 });
  }
}
