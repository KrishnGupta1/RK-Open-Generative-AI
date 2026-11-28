import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';
import { MODEL_LIST, agentStatus, installedFiles, decorateModels, recommendFor } from '@/lib/modelControl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/comfy/models?endpoint=…
// → what we can install, what is installed, disk + VRAM of the GPU.
export async function GET(req) {
  const endpoint = normaliseEndpoint(new URL(req.url).searchParams.get('endpoint'));
  if (!endpoint) {
    return NextResponse.json({ error: 'GPU connected nahi hai — pehle endpoint daalein.' }, { status: 400 });
  }

  let installed = { source: 'none', files: {}, disk: null };
  let gpu = null;
  let online = false;
  let warning = null;

  try {
    installed = await installedFiles(endpoint, timeout);
    online = true;
  } catch (err) {
    return NextResponse.json(
      { error: `GPU se baat nahi hui: ${err.message}`, online: false },
      { status: 502 },
    );
  }

  try {
    const s = await agentStatus(endpoint, timeout);
    gpu = s.gpu || null;
    if (s.disk) installed.disk = s.disk;
  } catch {
    warning = 'Model agent install nahi hai — download/delete ke liye naya notebook use karein (docs/rkgem_agent.py).';
  }

  const vram = gpu?.totalGB || 0;
  const pick = {
    image: recommendFor({ vramGB: vram, kind: 'image' }),
    video: recommendFor({ vramGB: vram, kind: 'video' }),
  };

  return NextResponse.json({
    online,
    pick: {
      image: pick.image ? { id: pick.image.id, label: pick.image.label, vramGB: pick.image.vramGB } : null,
      video: pick.video ? { id: pick.video.id, label: pick.video.label, vramGB: pick.video.vramGB } : null,
    },
    agent: installed.source === 'agent',
    warning,
    gpu,
    disk: installed.disk,
    models: decorateModels(installed),
    catalog: MODEL_LIST.length,
  });
}
