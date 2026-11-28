import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';
import { startDownload, downloadStatus, validateModelId } from '@/lib/modelControl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET ?endpoint=&job= → progress of one download
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const endpoint = normaliseEndpoint(searchParams.get('endpoint'));
  const job = searchParams.get('job');
  if (!endpoint) return NextResponse.json({ error: 'Endpoint invalid' }, { status: 400 });
  if (!job) return NextResponse.json({ error: 'job required' }, { status: 400 });
  try {
    return NextResponse.json(await downloadStatus(endpoint, job, timeout));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

// POST {endpoint, id} → start downloading that model onto the GPU
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const endpoint = normaliseEndpoint(body && body.endpoint);
  if (!endpoint) return NextResponse.json({ error: 'Endpoint invalid' }, { status: 400 });

  // Do raaste: catalog se id, ya user ka apna link (custom)
  const custom = body && body.custom;
  const model = body && body.id ? validateModelId(body.id) : null;
  if (!custom && !model) return NextResponse.json({ error: 'Unknown model' }, { status: 400 });

  try {
    const out = await startDownload(endpoint, model?.id, timeout, custom);
    return NextResponse.json({ ...out, model: { id: model?.id || 'custom', label: model?.label || custom?.filename || 'Custom' } });
  } catch (err) {
    const hint =
      err.status === 404
        ? 'GPU agent nahi mila — naya notebook (docs/kaggle-all-in-one.py) chalayein.'
        : err.message;
    return NextResponse.json({ error: hint }, { status: 502 });
  }
}
