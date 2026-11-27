import { NextResponse } from 'next/server';
import { supabaseEnv, getUserFromRequest } from '@/lib/vault';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET  /api/rk/vault        → { keys: { provider: {key, model, baseUrl} } }
// POST /api/rk/vault        → upsert one provider key  { provider, apiKey, model, baseUrl }
// DELETE /api/rk/vault?provider=gemini → remove
//
// Security: the caller's own Supabase JWT is used end-to-end; RLS on
// public.rkgem_user_keys guarantees a user can only read/write their rows.
// The service-role key is never used here.

function guard() {
  if (!supabaseEnv()) {
    return NextResponse.json({ error: 'Accounts not configured on this deployment' }, { status: 501 });
  }
  return null;
}

export async function GET(req) {
  const blocked = guard();
  if (blocked) return blocked;
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { data, error } = await auth.client
    .from('rkgem_user_keys')
    .select('provider, api_key, model, base_url');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const keys = {};
  for (const row of data || []) {
    keys[row.provider] = { apiKey: row.api_key, model: row.model || '', baseUrl: row.base_url || '' };
  }
  return NextResponse.json({ keys });
}

export async function POST(req) {
  const blocked = guard();
  if (blocked) return blocked;
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const provider = String(body?.provider || '').trim();
  const apiKey = String(body?.apiKey || '').trim();
  if (!provider) return NextResponse.json({ error: 'provider is required' }, { status: 400 });

  if (!apiKey) {
    const { error } = await auth.client.from('rkgem_user_keys').delete().eq('provider', provider);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, removed: true });
  }

  const { error } = await auth.client.from('rkgem_user_keys').upsert(
    {
      user_id: auth.user.id,
      provider,
      api_key: apiKey,
      model: body?.model || null,
      base_url: body?.baseUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const blocked = guard();
  if (blocked) return blocked;
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const provider = new URL(req.url).searchParams.get('provider');
  if (!provider) return NextResponse.json({ error: 'provider is required' }, { status: 400 });
  const { error } = await auth.client.from('rkgem_user_keys').delete().eq('provider', provider);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
