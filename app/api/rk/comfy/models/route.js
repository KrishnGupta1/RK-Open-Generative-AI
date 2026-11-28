import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';
import { MODEL_LIST, agentStatus, installedFiles, decorateModels } from '@/lib/modelControl';

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

  return NextResponse.json({
    online,
    agent: installed.source === 'agent',
    warning,
    gpu,
    disk: installed.disk,
    models: decorateModels(installed),
    catalog: MODEL_LIST.length,
  });
}
