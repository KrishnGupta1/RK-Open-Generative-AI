// Shared helpers for talking to a (possibly remote) ComfyUI server.
// Security note: we only ever accept http(s) URLs and never follow
// redirects to file:// — SSRF surface is intentionally minimal, but on a
// public deployment you should still proxy through a host allowlist
// (COMFY_ALLOWED_HOSTS).

export function normaliseEndpoint(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol)) return null;
  const allowed = (process.env.COMFY_ALLOWED_HOSTS || '').split(',').map((h) => h.trim()).filter(Boolean);
  if (allowed.length) {
    const host = url.hostname;
    const ok = allowed.some((a) => host === a || host.endsWith(`.${a}`));
    if (!ok) return null;
  }
  return url.origin;
}

export function timeout(ms) {
  return AbortSignal.timeout(ms);
}
