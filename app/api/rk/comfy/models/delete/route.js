import { NextResponse } from 'next/server';
import { normaliseEndpoint, timeout } from '@/lib/comfy';
import { deleteModel, validateModelId } from '@/lib/modelControl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST {endpoint, id} → remove that model from the GPU disk
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const endpoint = normaliseEndpoint(body && body.endpoint);
  const model = validateModelId(body && body.id);
  if (!endpoint) return NextResponse.json({ error: 'Endpoint invalid' }, { status: 400 });
  if (!model) return NextResponse.json({ error: 'Unknown model' }, { status: 400 });

  try {
    return NextResponse.json(await deleteModel(endpoint, model.id, timeout));
  } catch (err) {
    const hint = err.status === 404 ? 'GPU agent nahi mila — naya notebook chalayein.' : err.message;
    return NextResponse.json({ error: hint }, { status: 502 });
  }
}
