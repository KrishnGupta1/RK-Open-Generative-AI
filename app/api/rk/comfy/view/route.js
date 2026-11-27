import { normaliseEndpoint } from '@/lib/comfy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/comfy/view?endpoint=…&filename=…&subfolder=…&type=output
// Streams the generated file back through our origin, so the browser never
// needs CORS from the ComfyUI server.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const endpoint = normaliseEndpoint(searchParams.get('endpoint'));
  const filename = searchParams.get('filename');
  if (!endpoint || !filename) return new Response('Bad request', { status: 400 });

  const qs = new URLSearchParams({
    filename,
    subfolder: searchParams.get('subfolder') || '',
    type: searchParams.get('type') || 'output',
  });

  try {
    const res = await fetch(`${endpoint}/view?${qs}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return new Response('Not found', { status: res.status });
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
