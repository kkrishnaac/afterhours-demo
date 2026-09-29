import { describe, it, expect, vi, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../worker/index.js';
import { runMaintenance } from '../worker/maintenance.js';

const valid = {
  size: '2,000 to 5,000 sq ft', timing: 'Evenings', city: 'Toronto',
  name: 'Priya Raman', email: 'priya@northwind.ca', phone: '416 555 0123',
  marketing: false, company_site: '', turnstile: 'test-token',
};

let ipCounter = 0;
const nextIp = () => `203.0.113.${(ipCounter++ % 250) + 1}`;

function post(body, { origin = 'https://hara.test', ip = nextIp(), type = 'application/json', method = 'POST' } = {}) {
  const init = { method, headers: { Origin: origin, 'CF-Connecting-IP': ip } };
  if (type) init.headers['Content-Type'] = type;
  if (method === 'POST') init.body = typeof body === 'string' ? body : JSON.stringify(body);
  return worker.fetch(new Request('https://hara.test/api/walkthrough', init), env);
}

/** Stubs the only two outside services. Anything else the Worker tries to fetch fails the test. */
function network({ turnstile = { success: true, hostname: 'hara.test', action: 'walkthrough' }, resendStatus = 200 } = {}) {
  const emails = [];
  const verifications = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      verifications.push(Object.fromEntries(init.body.entries()));
      if (turnstile === 'down') throw new TypeError('network down');
      return Response.json(turnstile);
    }
    if (url === 'https://api.resend.com/emails') {
      emails.push({ body: JSON.parse(init.body), headers: new Headers(init.headers) });
      return Response.json({ id: `email-${emails.length}` }, { status: resendStatus });
    }
    throw new Error(`Unexpected outbound fetch: ${url}`);
  });
  return { emails, verifications };
}

const rows = async () => (await env.DB.prepare('SELECT * FROM walkthrough_requests ORDER BY created_at').all()).results;

afterEach(async () => {
  vi.restoreAllMocks();
  await env.DB.prepare('DELETE FROM walkthrough_requests').run();
});

describe('POST /api/walkthrough: happy path', () => {
  it('stores the request, emails HARA and confirms to the requester', async () => {
    const net = network();
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });

    const [row] = await rows();
    expect(row).toMatchObject({
      office_size: '2,000 to 5,000 sq ft', timing: 'Evenings', city: 'Toronto', name: 'Priya Raman',
      email: 'priya@northwind.ca', phone: '416 555 0123', marketing_consent: 0, marketing_consent_at: null,
      consent_version: '2026-09-28', source: 'website:walkthrough-form',
      notify_status: 'sent', notify_attempts: 1, confirm_status: 'sent', status: 'new',
    });

    expect(net.verifications).toHaveLength(1);
    expect(net.verifications[0]).toMatchObject({ secret: 'test-turnstile-secret', response: 'test-token' });

    const [notify, confirm] = net.emails.sort((a, b) => (a.body.to[0] === 'leads@hara.test' ? -1 : 1));
    expect(notify.body).toMatchObject({ to: ['leads@hara.test'], reply_to: 'priya@northwind.ca' });
    expect(notify.body.subject).toBe('New walkthrough request: Priya Raman, Toronto');
    expect(notify.headers.get('Authorization')).toBe('Bearer test-resend-key');
    expect(notify.headers.get('Idempotency-Key')).toBe(`notify-${row.id}`);
    expect(confirm.body).toMatchObject({ to: ['priya@northwind.ca'], reply_to: 'leads@hara.test' });
  });

  it('records marketing consent with a timestamp only when the box was ticked', async () => {
    network();
    await post({ ...valid, marketing: true });
    const [row] = await rows();
    expect(row.marketing_consent).toBe(1);
    expect(row.marketing_consent_at).toBe(row.created_at);
  });

  it('escapes visitor text in the HTML emails', async () => {
    const net = network();
    await post({ ...valid, name: '<b>Priya</b> Raman' });
    const html = net.emails.map((e) => e.body.html).join('');
    expect(html).not.toContain('<b>Priya');
    expect(html).toContain('&lt;b&gt;Priya&lt;/b&gt;');
  });

  it('sends API security headers and no CORS headers', async () => {
    network();
    const res = await post(valid);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('POST /api/walkthrough: refusals', () => {
  it.each([
    ['another site', 'https://evil.example'],
    ['no Origin header', ''],
  ])('refuses a post from %s (403)', async (_, origin) => {
    const net = network();
    const res = await post(valid, { origin });
    expect(res.status).toBe(403);
    expect(await rows()).toHaveLength(0);
    expect(net.emails).toHaveLength(0);
  });

  it('refuses anything that is not JSON (415), which blocks cross-site form posts', async () => {
    network();
    expect((await post('size=x', { type: 'application/x-www-form-urlencoded' })).status).toBe(415);
  });

  it('refuses an oversized body (413)', async () => {
    network();
    expect((await post({ ...valid, name: 'A'.repeat(9000) })).status).toBe(413);
  });

  it('refuses malformed JSON (400)', async () => {
    network();
    expect((await post('{"size":')).status).toBe(400);
  });

  it('returns the invalid field names, stores nothing and sends nothing', async () => {
    const net = network();
    const res = await post({ ...valid, email: 'not-an-email', city: 'Ottawa' });
    expect(res.status).toBe(400);
    expect((await res.json()).fields.sort()).toEqual(['city', 'email']);
    expect(await rows()).toHaveLength(0);
    expect(net.verifications).toHaveLength(0);
    expect(net.emails).toHaveLength(0);
  });

  it('refuses when Turnstile rejects the token', async () => {
    const net = network({ turnstile: { success: false, 'error-codes': ['invalid-input-response'] } });
    const res = await post(valid);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('verification');
    expect(await rows()).toHaveLength(0);
    expect(net.emails).toHaveLength(0);
  });

  it('refuses a token solved on another hostname', async () => {
    network({ turnstile: { success: true, hostname: 'evil.example', action: 'walkthrough' } });
    expect((await post(valid)).status).toBe(400);
  });

  it('refuses a request with no Turnstile token without calling Cloudflare', async () => {
    const net = network();
    const { turnstile, ...noToken } = valid;
    expect((await post(noToken)).status).toBe(400);
    expect(net.verifications).toHaveLength(0);
  });

  it('fails closed when Turnstile is unreachable', async () => {
    network({ turnstile: 'down' });
    const res = await post(valid);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('verification_unavailable');
    expect(await rows()).toHaveLength(0);
  });

  it('gives bots that fill the honeypot a quiet success and does nothing', async () => {
    const net = network();
    const res = await post({ ...valid, company_site: 'https://spam.example' });
    expect(res.status).toBe(201);
    expect(await rows()).toHaveLength(0);
    expect(net.verifications).toHaveLength(0);
    expect(net.emails).toHaveLength(0);
  });

  it('rate limits one visitor to 5 requests a minute', async () => {
    network();
    const ip = '198.51.100.7';
    const statuses = [];
    for (let i = 0; i < 7; i++) statuses.push((await post({ ...valid, email: `p${i}@northwind.ca` }, { ip })).status);
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it('only accepts POST', async () => {
    const res = await post(null, { method: 'GET', type: null });
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });

  it('redirects plain http to https before serving anything', async () => {
    const res = await worker.fetch(new Request('http://hara.test/privacy?x=1'), env);
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://hara.test/privacy?x=1');
  });

  it('returns a JSON 404 for other API paths', async () => {
    const res = await worker.fetch(new Request('https://hara.test/api/admin'), env);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: 'not_found' });
  });
});

describe('abuse and reliability', () => {
  it('treats a double submit as one request with one set of emails', async () => {
    const net = network();
    await post(valid);
    const again = await post({ ...valid, email: 'PRIYA@northwind.ca' });
    expect(again.status).toBe(201);
    expect(await rows()).toHaveLength(1);
    expect(net.emails).toHaveLength(2);
  });

  it('stops confirmation emails to one address after 2 in a day, but still tells HARA', async () => {
    const net = network();
    const hour = 3_600_000;
    for (const [i, age] of [[1, 5 * hour], [2, 3 * hour]]) {
      await env.DB.prepare(`INSERT INTO walkthrough_requests (id, created_at, office_size, timing, city, name, email, consent_version, source, confirm_status)
        VALUES (?1, ?2, 'Not sure', 'Evenings', 'Toronto', 'Victim', 'victim@example.ca', 'x', 'test', 'sent')`)
        .bind(`old-${i}`, new Date(Date.now() - age).toISOString()).run();
    }
    const res = await post({ ...valid, email: 'victim@example.ca' });
    expect(res.status).toBe(201);
    const latest = (await rows()).at(-1);
    expect(latest.confirm_status).toBe('skipped');
    expect(latest.notify_status).toBe('sent');
    expect(net.emails.map((e) => e.body.to[0])).toEqual(['leads@hara.test']);
  });

  it('keeps the request when email is down, and the scheduled job retries it', async () => {
    let net = network({ resendStatus: 500 });
    const res = await post(valid);
    expect(res.status).toBe(201);
    let [row] = await rows();
    expect(row.notify_status).toBe('failed');

    vi.restoreAllMocks();
    net = network();
    const later = Date.now() + 3 * 60 * 1000;
    const result = await runMaintenance(env, later);
    expect(result.retried).toBe(1);
    [row] = await rows();
    expect(row.notify_status).toBe('sent');
    expect(row.notify_attempts).toBe(2);
    expect(net.emails[0].headers.get('Idempotency-Key')).toBe(`notify-${row.id}`);
  });

  it('holds email until it is connected, then the scheduled job delivers every held request', async () => {
    const net = network();
    const held = { ...env, EMAIL_MODE: 'hold' };
    const res = await worker.fetch(new Request('https://hara.test/api/walkthrough', {
      method: 'POST', headers: { Origin: 'https://hara.test', 'CF-Connecting-IP': nextIp(), 'Content-Type': 'application/json' }, body: JSON.stringify(valid),
    }), held);
    expect(res.status).toBe(201);
    let [row] = await rows();
    expect(row).toMatchObject({ notify_status: 'pending', notify_attempts: 0, confirm_status: 'skipped' });
    expect(net.emails).toHaveLength(0);

    // Still held: the cron sends nothing and uses up no attempts.
    await runMaintenance(held, Date.now() + 3 * 60 * 1000);
    [row] = await rows();
    expect(row).toMatchObject({ notify_status: 'pending', notify_attempts: 0 });

    // Email connected: the next cron run delivers the held notification to HARA.
    await runMaintenance(env, Date.now() + 3 * 60 * 1000);
    [row] = await rows();
    expect(row).toMatchObject({ notify_status: 'sent', notify_attempts: 1 });
    expect(net.emails.map((e) => e.body.to[0])).toEqual(['leads@hara.test']);
  });

  it('deletes requests older than the retention period', async () => {
    network();
    await env.DB.prepare(`INSERT INTO walkthrough_requests (id, created_at, office_size, timing, city, name, email, consent_version, source, notify_status)
      VALUES ('ancient', ?1, 'Not sure', 'Evenings', 'Toronto', 'Old', 'old@example.ca', 'x', 'test', 'sent')`)
      .bind(new Date(Date.now() - 731 * 86_400_000).toISOString()).run();
    await post(valid);
    const result = await runMaintenance(env);
    expect(result.purged).toBe(1);
    expect((await rows()).map((r) => r.id)).not.toContain('ancient');
  });

  it('never writes names, emails or phone numbers to the logs', async () => {
    network({ resendStatus: 500 });
    const lines = [];
    vi.spyOn(console, 'log').mockImplementation((...a) => lines.push(a.join(' ')));
    vi.spyOn(console, 'error').mockImplementation((...a) => lines.push(a.join(' ')));
    await post({ ...valid, company_site: '' });
    await post({ ...valid, email: 'bad' });
    await runMaintenance(env, Date.now() + 3 * 60 * 1000);
    const all = lines.join('\n');
    expect(lines.length).toBeGreaterThan(0);
    for (const secret of ['Priya', 'priya@northwind.ca', '416 555 0123', 'test-token', 'test-resend-key']) {
      expect(all).not.toContain(secret);
    }
  });
});
