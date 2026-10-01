// Load test: N requests at concurrency C against a list of URLs; reports status counts and latency.
const [base, n = '1500', c = '50', mode = 'static'] = process.argv.slice(2);
const html = await (await fetch(base + '/')).text();
const js = [...html.matchAll(/assets\/[\w-]+\.(?:js|css)/g)].map((m) => '/' + m[0]);
const main = js.find((p) => p.includes('index-'));
const chunk = main ? ((await (await fetch(base + main)).text()).match(/hero-build-[\w-]+\.js/) || [])[0] : null;
const paths = mode === 'static'
  ? ['/', '/privacy.html', '/terms.html', '/accessibility.html', '/brand/hara-logo.svg', '/brand/hara-lockup.svg',
     '/favicon.svg', '/og.jpg', ...js, ...(chunk ? ['/assets/' + chunk] : []), '/img/10-dawn-open-office-1600.avif', '/nope-404']
  : ['/api/walkthrough'];
const origin = base;
const stats = { codes: {}, lat: [], bytes: 0 };
let next = 0;
async function worker() {
  for (;;) {
    const i = next++;
    if (i >= +n) return;
    const p = paths[i % paths.length];
    const t = performance.now();
    try {
      const res = mode === 'static'
        ? await fetch(base + p)
        : await fetch(base + p, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ size: 'x' }) });
      const buf = await res.arrayBuffer();
      stats.bytes += buf.byteLength;
      stats.codes[res.status] = (stats.codes[res.status] || 0) + 1;
    } catch (e) { stats.codes.error = (stats.codes.error || 0) + 1; }
    stats.lat.push(performance.now() - t);
  }
}
const t0 = performance.now();
await Promise.all(Array.from({ length: +c }, worker));
const secs = (performance.now() - t0) / 1000;
const s = stats.lat.sort((a, b) => a - b), q = (x) => s[Math.min(s.length - 1, Math.floor(x * s.length))].toFixed(0);
console.log(JSON.stringify({ mode, requests: +n, concurrency: +c, seconds: +secs.toFixed(1), rps: +(n / secs).toFixed(0), MB: +(stats.bytes / 1e6).toFixed(1), codes: stats.codes, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: s.at(-1).toFixed(0) }));
