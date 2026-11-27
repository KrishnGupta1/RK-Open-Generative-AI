import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/google/gemini-projects
//   Authorization: Bearer <supabase access token>
//
// Looks at the signed-in user's **own** Google Cloud projects (read-only
// cloud-platform scope, granted at sign-in time) and reports which ones
// already have the Generative Language API enabled. That is the closest a
// web app can get to "use my existing Gemini subscription": Gemini's paid
// plans live inside a Google Cloud project with billing attached, and an
// API key created in that project bills to that plan.
//
// The app never sees the user's Google password or Gemini chat history —
// Google does not expose consumer Gemini subscription data through APIs.

async function googleFetch(path, accessToken) {
  const res = await fetch(`https://cloudresourcemanager.googleapis.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function GET(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return NextResponse.json({ error: 'Sign in with Google first' }, { status: 401 });

  try {
    // serviceusage can read enabled services for projects the user can view.
    const listRes = await fetch(
      'https://cloudresourcemanager.googleapis.com/v1/projects?filter=lifecycleState%3AACTIVE',
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12_000) },
    );

    if (listRes.status === 401 || listRes.status === 403) {
      return NextResponse.json(
        {
          error:
            'Google ne is token ko project list karne ki permission nahi di (cloud-platform.read-only scope missing).',
          hint: 'Dobara sign in karein aur Google consent screen par Cloud project permission allow karein.',
          manual: true,
        },
        { status: 403 },
      );
    }
    if (!listRes.ok) throw new Error(`projects.list ${listRes.status}`);

    const json = await listRes.json();
    const projects = Array.isArray(json?.projects) ? json.projects : [];

    const results = await Promise.all(
      projects.slice(0, 10).map(async (p) => {
        let enabled = false;
        let hasBilling = false;
        try {
          const svc = await googleFetch(
            `projects/${p.projectId}/services/generativelanguage.googleapis.com`,
            token,
          );
          enabled = svc?.state === 'ENABLED';
        } catch {
          enabled = false;
        }
        if (enabled) {
          try {
            const billing = await fetch(
              `https://cloudbilling.googleapis.com/v1/projects/${p.projectId}/billingInfo`,
              { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) },
            );
            if (billing.ok) {
              const info = await billing.json();
              hasBilling = Boolean(info?.billingEnabled);
            }
          } catch {}
        }
        return {
          projectId: p.projectId,
          projectNumber: p.projectNumber,
          name: p.name || p.projectId,
          enabled,
          hasBilling,
        };
      }),
    );

    results.sort((a, b) => Number(b.enabled) - Number(a.enabled) || Number(b.hasBilling) - Number(a.hasBilling));

    return NextResponse.json({
      projects: results,
      ready: results.filter((p) => p.enabled).length,
      note:
        results.some((p) => p.enabled)
          ? 'Generative Language API enabled project mil gaya — wahan se API key banayein, wo aapke Gemini plan par bill hogi.'
          : 'Koi project Gemini API ke saath enabled nahi mila. Neeche 1-click setup follow karein.',
    });
  } catch (err) {
    return NextResponse.json({ error: `Google se baat nahi ho payi: ${err.message}` }, { status: 502 });
  }
}
