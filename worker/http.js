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

/** Reads the body as text, refusing anything over `limit` bytes. Returns null if too large.
 *  Reads the stream with a running count and stops just past the limit, so a body sent
 *  without a Content-Length (chunked) is never buffered whole. */
export async function readLimited(request, limit) {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** Structured log line. Never pass names, emails, phone numbers or tokens here. */
export const log = (event, fields = {}) => console.log(JSON.stringify({ event, ...fields }));
export const logError = (event, fields = {}) => console.error(JSON.stringify({ event, ...fields }));
