import { NextResponse } from 'next/server';
import { PROVIDERS, resolveBaseUrl, envKeyFor } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/models?provider=openrouter&key=...&baseUrl=...
// Returns the live model catalogue for a provider (falls back to the
// curated static list when the upstream listing isn't available).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('provider') || 'openrouter';
  const provider = PROVIDERS[providerId];
  if (!provider) {
    return NextResponse.json({ error: `Unknown provider "${providerId}"` }, { status: 400 });
  }

  const fallback = (provider.staticModels || []).map((id) => ({ id, label: id, free: id.includes(':free') }));
  if (!provider.supportsListModels) {
    return NextResponse.json({ models: fallback, source: 'static' });
  }

  const apiKey = (searchParams.get('key') || '').trim() || envKeyFor(providerId) || '';
  const baseUrl = resolveBaseUrl(providerId, searchParams.get('baseUrl') || '');
  if (!baseUrl) return NextResponse.json({ models: fallback, source: 'static' });
  if (provider.requiresKey && !apiKey) return NextResponse.json({ models: fallback, source: 'static' });

  try {
    const headers = {};
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const res = await fetch(`${baseUrl}/models`, { headers, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = await res.json();
    const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : [];
    let models = raw
      .map((m) => {
        const id = typeof m === 'string' ? m : m.id || m.name || m.model;
        const name = (typeof m === 'object' && (m.name || m.id)) || id;
        return { id, label: name || id, free: /:free$|-free$|free/i.test(id || '') };
      })
      .filter((m) => m.id);
    if (providerId === 'openrouter') models = models.filter((m) => m.free);
    models.sort((a, b) => a.label.localeCompare(b.label));
    if (!models.length) throw new Error('empty');
    return NextResponse.json({ models, source: 'live' });
  } catch (err) {
    return NextResponse.json({ models: fallback, source: 'static', note: err.message });
  }
}
