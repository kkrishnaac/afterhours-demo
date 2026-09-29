// Server-side Turnstile check. The browser widget only produces a token; the
// token means nothing until Cloudflare confirms it here. Fails closed: if
// Cloudflare can't be reached, the request is refused and the visitor is
// pointed to the phone number.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token, { secret, remoteip, hostnames = [], action } = {}) {
  if (typeof token !== 'string' || !token || token.length > 2048) return { ok: false, reason: 'missing' };
  if (!secret) return { ok: false, reason: 'not-configured' };

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteip) body.append('remoteip', remoteip);
  body.append('idempotency_key', crypto.randomUUID());

  let out;
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(5000) });
    out = await res.json();
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
  if (!out || out.success !== true) return { ok: false, reason: 'rejected' };
  // Tokens are only valid on HARA's own hostnames (skipped in local testing,
  // where Cloudflare's test keys report a placeholder hostname).
  if (hostnames.length && !hostnames.includes(out.hostname)) return { ok: false, reason: 'hostname' };
  if (action && out.action && out.action !== action) return { ok: false, reason: 'action' };
  return { ok: true };
}
