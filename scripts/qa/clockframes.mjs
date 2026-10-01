// Deterministic hero frames: fake clock drives requestAnimationFrame, so each frame is an exact moment.
// node clockframes.mjs <url> <outprefix> <w> <h> <times,ms>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const [url, out, w = '1440', h = '900', times = '0,400,800,1200,1600,2000,2400,2800,3600'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true, args: ['--headless=new', '--use-angle=metal', '--enable-gpu'],
});
const mobile = +w < 768;
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e));
await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));   // frozen before the page loads
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('.hero__stage canvas'), null, { timeout: 15000 }).catch(() => logs.push('no canvas appeared'));
await page.evaluate(() => document.fonts.ready);
let now = 0;
for (const ms of times.split(',').map(Number)) {
  if (ms > now) { await page.clock.runFor(ms - now); now = ms; }
  await page.waitForTimeout(120);
  const cls = await page.evaluate(() => document.querySelector('.hero__stage')?.className);
  await page.screenshot({ path: `${out}-${ms}.png`, clip: { x: 0, y: 0, width: +w, height: Math.min(+h, 900) } });
  console.log(ms, cls);
}
console.log(logs.filter((l) => !l.includes('GPU stall')).join('\n') || 'no console errors');
await browser.close();
