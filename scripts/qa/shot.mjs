// Isolated headless screenshots (the Playwright MCP profile is locked by another chat).
// usage: node shot.mjs <url> <out.png> [width] [height] [fullPage] [scale] [injectJsFile]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const [url, out, w = '1440', h = '900', full = '1', scale = '2', inject] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: process.env.PW_SHELL || process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell',
});
const mobile = +w < 768;
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale, isMobile: mobile, hasTouch: mobile });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: 'networkidle' });
if (inject) await page.evaluate(readFileSync(inject, 'utf8'));
await page.evaluate(() => document.fonts.ready);
if (full === '1') {
  // walk the page so IntersectionObserver reveals fire, then return to the top
  const hgt = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < hgt; y += Math.round(+h * 0.6)) { await page.mouse.wheel(0, Math.round(+h * 0.6)); await page.waitForTimeout(140); }
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: full === '1' });
if (errors.length) console.log('console errors:', errors);
await browser.close();
console.log('saved', out);
