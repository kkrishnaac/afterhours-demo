// Capture the hero at set times after load: node frames.mjs <url> <outprefix> <w> <h> <times,comma,ms>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const [url, out, w = '1440', h = '900', times = '300,900,1500,2100,2700,4200', rm = '0'] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true, args: ['--headless=new', '--use-angle=metal', '--enable-gpu'],
});
const mobile = +w < 768;
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, reducedMotion: rm === '1' ? 'reduce' : 'no-preference' });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e));
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
for (const ms of times.split(',').map(Number)) {
  const wait = ms - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const cls = await page.evaluate(() => document.querySelector('.hero__stage')?.className);
  await page.screenshot({ path: `${out}-${ms}.png` });
  console.log(ms, cls);
}
console.log(logs.join('\n') || 'no console errors');
await browser.close();
