// JSON responses for the API. Static pages get their headers from _headers;
// Worker responses don't, so every API response carries its own: never cached,
// never sniffed, never framed, no referrer, and no CORS (same-origin only).
const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, ...extra } });
}

/** Reads the body as text, refusing anything over `limit` bytes. Returns null if too large. */
export async function readLimited(request, limit) {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > limit) return null;
  const buf = await request.arrayBuffer();
  if (buf.byteLength > limit) return null;
  return new TextDecoder().decode(buf);
}

/** Structured log line. Never pass names, emails, phone numbers or tokens here. */
export const log = (event, fields = {}) => console.log(JSON.stringify({ event, ...fields }));
export const logError = (event, fields = {}) => console.error(JSON.stringify({ event, ...fields }));
