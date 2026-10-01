// Stress and fuzz tests for the walkthrough endpoint: many visitors at once, the same
// person double-submitting at the same instant, and thousands of malformed or hostile
// payloads. Runs inside workerd with a local D1, like the other tests.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import worker from '../worker/index.js';
import { validateWalkthrough } from '../worker/validate.js';
import { SIZES, TIMINGS, CITY_NAMES, LIMITS } from '../src/form-options.js';

const valid = {
  size: SIZES[1], timing: TIMINGS[0], city: 'Toronto',
  name: 'Priya Raman', email: 'priya@northwind.ca', phone: '416 555 0123',
  marketing: false, company_site: '', turnstile: 'test-token',
};

let ipCounter = 0;
const nextIp = () => `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter++ & 255}`;

function post(body, ip = nextIp()) {
  return worker.fetch(new Request('https://hara.test/api/walkthrough', {
    method: 'POST',
    headers: { Origin: 'https://hara.test', 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }), env);
}

function network() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'hara.test', action: 'walkthrough' });
    if (url === 'https://api.resend.com/emails') return Response.json({ id: 'x' });
    throw new Error(`Unexpected outbound fetch: ${url}`);
  });
}

const count = async () => (await env.DB.prepare('SELECT COUNT(*) AS n FROM walkthrough_requests').first()).n;

// Small deterministic PRNG so a failing fuzz case can be reproduced.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

afterEach(async () => {
  vi.restoreAllMocks();
  await env.DB.prepare('DELETE FROM walkthrough_requests').run();
});

describe('stress: many visitors at once', () => {
  it('stores 150 simultaneous requests from different visitors, once each', async () => {
    network();
    const statuses = await Promise.all(Array.from({ length: 150 }, (_, i) =>
      post({ ...valid, email: `visitor${i}@northwind.ca` }).then((r) => r.status)));
    expect(statuses.every((s) => s === 201)).toBe(true);
    expect(await count()).toBe(150);
  });

  it('keeps one request when the same person submits 20 times at the same instant', async () => {
    network();
    const statuses = await Promise.all(Array.from({ length: 20 }, () => post({ ...valid }).then((r) => r.status)));
    expect(statuses.every((s) => s === 201)).toBe(true);
    expect(await count()).toBe(1);
  });

  it('holds the rate limit under a burst from one address', async () => {
    network();
    const ip = '10.200.0.1';
    const statuses = await Promise.all(Array.from({ length: 40 }, (_, i) =>
      post({ ...valid, email: `burst${i}@northwind.ca` }, ip).then((r) => r.status)));
    expect(statuses.filter((s) => s === 201).length).toBeLessThanOrEqual(5);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(35);
    expect(statuses.every((s) => s === 201 || s === 429)).toBe(true);
  });
});

describe('fuzz: hostile and malformed payloads', () => {
  const nasty = [
    null, true, 0, -1, 1e308, 'string', [], [valid], {}, { __proto__: { size: SIZES[0] } },
    { ...valid, name: '' }, { ...valid, name: ' '.repeat(50) }, { ...valid, name: 'A'.repeat(LIMITS.name + 1) },
    { ...valid, name: 'Robert\r\nBcc: x@y.z' }, { ...valid, name: 'Zo\u2028ë' }, { ...valid, name: '12345' },
    { ...valid, email: 'no-at-sign' }, { ...valid, email: 'a@b' }, { ...valid, email: '"quoted"@x.ca' },
    { ...valid, email: `${'a'.repeat(250)}@x.ca` }, { ...valid, email: ['a@b.ca'] }, { ...valid, email: { $gt: '' } },
    { ...valid, phone: '12' }, { ...valid, phone: '1'.repeat(40) }, { ...valid, phone: 'call me' },
    { ...valid, size: 'Huge' }, { ...valid, timing: '' }, { ...valid, city: 'Paris' }, { ...valid, city: 'toronto' },
    { ...valid, marketing: 'true' }, { ...valid, marketing: 1 }, { ...valid, turnstile: 42 },
    { ...valid, turnstile: 'x'.repeat(3000) }, { ...valid, size: `${SIZES[0]}' OR 1=1 --` },
  ];

  it('never errors on a catalogue of hostile payloads, and stores only valid ones', async () => {
    network();
    for (const body of nasty) {
      const res = await post(body);
      expect(res.status, JSON.stringify(body)?.slice(0, 80)).toBeLessThan(500);
      const json = await res.json();
      expect(typeof json.ok).toBe('boolean');
    }
    expect(await count()).toBe(0);
  });

  it('never errors on 400 random JSON documents', async () => {
    network();
    const r = rng(20260928);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const junk = () => pick([
      () => pick(SIZES), () => pick(TIMINGS), () => pick(CITY_NAMES), () => '',
      () => String.fromCharCode(...Array.from({ length: 1 + Math.floor(r() * 40) }, () => Math.floor(r() * 0xffff))),
      () => Math.floor(r() * 1e9), () => r() < 0.5, () => null, () => [pick(SIZES)], () => ({ nested: true }),
    ])();
    for (let i = 0; i < 400; i++) {
      const doc = {};
      for (const k of ['size', 'timing', 'city', 'name', 'email', 'phone', 'marketing', 'turnstile', 'extra']) {
        if (r() < 0.85) doc[k] = junk();
      }
      const res = await post(doc);
      expect(res.status, JSON.stringify(doc).slice(0, 120)).toBeLessThan(500);
    }
  });

  it('validator: 5,000 random inputs never throw, and anything it accepts meets every rule', () => {
    const r = rng(7);
    const chars = 'abcAZéßлי漢 @.-+()<>"\'\\;:,\r\n\t\u0000\u2028';
    const str = (n) => Array.from({ length: Math.floor(r() * n) }, () => chars[Math.floor(r() * chars.length)]).join('');
    for (let i = 0; i < 5000; i++) {
      const input = {
        size: r() < 0.7 ? SIZES[Math.floor(r() * SIZES.length)] : str(20),
        timing: r() < 0.7 ? TIMINGS[Math.floor(r() * TIMINGS.length)] : str(20),
        city: r() < 0.7 ? CITY_NAMES[Math.floor(r() * CITY_NAMES.length)] : str(20),
        name: str(120), email: r() < 0.5 ? `${str(10)}@${str(8)}.ca` : str(40), phone: str(35),
        marketing: r() < 0.5 ? r() < 0.5 : str(3),
      };
      const out = validateWalkthrough(input);
      if (!out.ok) continue;
      const d = out.data;
      expect(SIZES).toContain(d.size);
      expect(TIMINGS).toContain(d.timing);
      expect(CITY_NAMES).toContain(d.city);
      expect(d.name.length).toBeLessThanOrEqual(LIMITS.name);
      expect(d.email.length).toBeLessThanOrEqual(LIMITS.email);
      expect(/[\u0000-\u001F\u007F\u2028\u2029]/.test(d.name + d.email + (d.phone || ''))).toBe(false);
      expect(typeof d.marketing).toBe('boolean');
    }
  });
});
