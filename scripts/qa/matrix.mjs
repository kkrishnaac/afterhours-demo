import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const U = process.argv[2];
const OUT = process.argv[3];
const exe = process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const noise = /challenges\.cloudflare|OTS parsing|private access token|GPU stall|GroupMarkerNotSet/i;
async function run(name, { w = 1440, h = 900, args = ['--use-angle=metal', '--enable-gpu'], js = true, rm = 'no-preference', slow = false, waitMs = 5000, shot = false } = {}) {
  const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--headless=new', ...args] });
  const mobile = w < 768;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, javaScriptEnabled: js, reducedMotion: rm });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  page.on('console', (m) => { if (m.type() === 'error' && !noise.test(m.text())) errs.push(m.text().slice(0, 120)); });
  if (slow) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024 });
  }
  await page.addInitScript(() => {
    window.__cls = 0; window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); if (e) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  const t0 = Date.now();
  await page.goto(U, { waitUntil: 'domcontentloaded', timeout: 120000 });
  let settledAt = null, state = null;
  while (Date.now() - t0 < waitMs + (slow ? 25000 : 0)) {
    state = await page.evaluate(() => document.querySelector('.hero__stage')?.className || 'none').catch(() => state);
    if (js && /is-built|is-static/.test(state) && settledAt === null) settledAt = Date.now() - t0;
    if (!js && Date.now() - t0 > waitMs) break;
    if (settledAt !== null && Date.now() - t0 > settledAt + 900) break;
    await page.waitForTimeout(100);
  }
  const m = await page.evaluate(() => {
    const img = document.querySelector('.hero__logo img');
    return {
      overflowX: document.documentElement.scrollWidth - innerWidth,
      logoOpacity: +getComputedStyle(img).opacity,
      logoLoaded: img.complete && img.naturalWidth > 0,
      canvases: document.querySelectorAll('canvas').length,
      ctaVisible: (() => { const r = document.querySelector('.hero .btn--primary').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; })(),
      cls: +window.__cls.toFixed(3), lcp: Math.round(window.__lcp),
    };
  });
  if (shot) await page.screenshot({ path: `${OUT}/m-${name}.png` });
  await browser.close();
  return { name, state: state.replace('hero__stage', '').trim(), settledMs: settledAt, ...m, errors: errs };
}
const results = [];
for (const [w, h] of [[320, 640], [375, 667], [390, 844], [414, 896], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]]) {
  results.push(await run(`${w}x${h}`, { w, h, shot: [320, 768, 2560].includes(w) }));
}
results.push(await run('slow-phone-3G-6xCPU', { w: 390, h: 844, slow: true }));
results.push(await run('no-webgl', { args: ['--disable-webgl', '--disable-3d-apis', '--disable-gpu'] }));
results.push(await run('js-off', { js: false, waitMs: 4600 }));
results.push(await run('reduced-motion', { rm: 'reduce' }));
for (const r of results) console.log(JSON.stringify(r));
