// Cross-browser and device pass: Chromium, Firefox and WebKit on desktop, plus iPhone and
// Android emulation. Loads the page, waits for the hero to settle, checks overflow, console
// errors, the CTA, the photo viewer and the first form step, and saves a screenshot per run.
//   node scripts/qa/browsers.mjs <url> <outdir>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const U = process.argv[2];
const OUT = process.argv[3] || '/tmp';
const chromeExe = process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const noise = /challenges\.cloudflare|OTS parsing|private access token|GPU stall|GroupMarkerNotSet|favicon|turnstile|WebGL|IndexedDB|Content-Security-Policy.*report/i;

const RUNS = [
  ['chromium', 'desktop', { viewport: { width: 1440, height: 900 } }],
  ['firefox', 'desktop', { viewport: { width: 1440, height: 900 } }],
  ['webkit', 'desktop', { viewport: { width: 1440, height: 900 } }],
  ['webkit', 'iPhone 14', pw.devices['iPhone 14']],
  ['webkit', 'iPhone SE', pw.devices['iPhone SE']],
  ['chromium', 'Pixel 7', pw.devices['Pixel 7']],
  ['chromium', 'Galaxy S9+', pw.devices['Galaxy S9+']],
  ['firefox', 'phone 390', { viewport: { width: 390, height: 844 }, isMobile: false, hasTouch: true }],
];

for (const [engine, label, device] of RUNS) {
  const opts = engine === 'chromium' ? { executablePath: chromeExe, headless: true, args: ['--headless=new'] } : { headless: true };
  const browser = await pw[engine].launch(opts);
  const ctx = await browser.newContext({ ...device, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
  page.on('console', (m) => { if (m.type() === 'error' && !noise.test(m.text())) errs.push(m.text().slice(0, 140)); });
  const r = {};
  try {
    const res = await page.goto(U, { waitUntil: 'load', timeout: 60000 });
    r.status = res?.status();
    await page.waitForFunction(() => /is-built|is-static/.test(document.querySelector('.hero__stage')?.className || ''), null, { timeout: 15000 }).catch(() => {});
    r.hero = await page.evaluate(() => document.querySelector('.hero__stage')?.className.replace('hero__stage', '').trim());
    r.overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    r.logoVisible = await page.evaluate(() => { const i = document.querySelector('.hero__logo img'); const s = getComputedStyle(i); return i.complete && i.naturalWidth > 0 && s.opacity !== '0' && s.visibility !== 'hidden'; });
    r.ctaVisible = await page.evaluate(() => { const b = document.querySelector('.hero .btn--primary').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; });
    // Photo viewer opens and closes
    await page.locator('.svc__photo').first().scrollIntoViewIfNeeded();
    await page.locator('.svc__photo').first().click();
    await page.waitForTimeout(400);
    r.viewerOpens = await page.evaluate(() => { const v = document.querySelector('.viewer'); return !!v && !v.hidden; });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    r.viewerCloses = await page.evaluate(() => document.querySelector('.viewer')?.hidden !== false);
    // Form: step 1 chip advances to step 2
    await page.locator('#walkthrough').scrollIntoViewIfNeeded();
    await page.locator('label[for="size-m"]').click();
    await page.waitForTimeout(500);
    r.formStep = await page.locator('[data-step-now]').textContent();
    await page.screenshot({ path: `${OUT}/x-${engine}-${label.replace(/\W+/g, '')}.png` });
  } catch (e) { r.error = String(e).slice(0, 160); }
  r.errors = errs;
  console.log(JSON.stringify({ engine, label, ...r }));
  await browser.close();
}
