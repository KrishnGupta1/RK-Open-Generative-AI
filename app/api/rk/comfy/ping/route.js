import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/comfy/ping?endpoint=https://xxx.trycloudflare.com
export async function GET(req) {
  const endpoint = normaliseEndpoint(new URL(req.url).searchParams.get('endpoint'));
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: 'Endpoint invalid — http(s) URL chahiye' }, { status: 400 });
  }
  try {
    const statsRes = await fetch(`${endpoint}/system_stats`, { signal: timeout(6000), cache: 'no-store' });
    if (!statsRes.ok) throw new Error(`HTTP ${statsRes.status}`);
    const stats = await statsRes.json().catch(() => ({}));

    let checkpoints = [];
    try {
      const objRes = await fetch(`${endpoint}/object_info/CheckpointLoaderSimple`, {
        signal: timeout(6000),
        cache: 'no-store',
      });
      if (objRes.ok) {
        const obj = await objRes.json();
        const list = obj?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
        if (Array.isArray(list)) checkpoints = list;
      }
    } catch {}

    return NextResponse.json({
      ok: true,
      version: stats?.system?.comfyui_version || stats?.system?.python_version || 'online',
      devices: (stats?.devices || []).map((d) => d.name),
      checkpoints,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: `ComfyUI se connect nahi hua: ${err.message}` }, { status: 502 });
  }
}
