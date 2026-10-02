// Captures the hero logo intro frame by frame, for checking choreography without guessing.
//   node design-lab/logo-frames.mjs [url] [outDir] [desktop|phone] [ms,ms,...]
// Defaults: the live lab, /tmp/hara-logo-frames, desktop, a spread over the first 2.4 s.
// Each frame is cropped to the logo; the file name carries the time after the load event.
// Uses the same cached playwright-core and Chromium headless shell as scripts/qa/shot.mjs.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const [url = 'https://hara-design-lab.chaudharikrishna0415.workers.dev/', out = '/tmp/hara-logo-frames', mode = 'desktop', list = '60,260,420,580,740,900,1060,1250,1500,2400'] = process.argv.slice(2);
const times = list.split(',').map(Number);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_SHELL || process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage(mode === 'phone' ? { ...devices['iPhone 14'] } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'load' });
const t0 = Date.now();
const box = await page.locator('.logo-cut').boundingBox();
const clip = { x: box.x - 12, y: box.y - 12, width: box.width + 24, height: box.height + 24 };
for (const t of times) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  const file = `${out}/frame-${String(t).padStart(4, '0')}ms.png`;
  await page.screenshot({ path: file, clip });
}
console.log('frames in', out, '| logo classes:', await page.evaluate(() => document.querySelector('.logo-cut').className), '| errors:', errors.length ? errors : 'none');
await browser.close();
