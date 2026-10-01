// Full form journey in a real browser against the local Worker (Turnstile test keys always pass).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:8791';
const [w, h] = (process.argv[3] || '1440x900').split('x').map(Number);
const out = process.argv[4];
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  headless: true, args: ['--headless=new'],
});
const mobile = w < 768;
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e));
page.on('console', (m) => { if (m.type() === 'error' && !/challenges\.cloudflare|OTS|font|private access token/i.test(m.text())) errors.push(m.text()); });
const api = [];
page.on('response', (r) => { if (r.url().includes('/api/walkthrough')) api.push(r.status()); });
await page.goto(base + '/#walkthrough', { waitUntil: 'networkidle' });
const form = page.locator('#quote-form');
await form.scrollIntoViewIfNeeded();
const next = form.locator('[data-next]');
// step 1: try to continue without choosing -> must show an error, not advance
await next.click();
const stayed = await form.locator('[data-step-now]').innerText();
await form.locator('label[for="size-m"]').click(); await next.click();
await form.locator('label[for="time-eve"]').click(); await next.click();
await form.locator('#city').selectOption('Toronto'); await next.click();
await form.locator('#name').fill('Ana Test');
await form.locator('#email').fill('bad-email');
await form.locator('[data-submit]').click();
const emailError = await page.locator('#email-error').innerText().catch(() => '');
await form.locator('#email').fill(`e2e+${Date.now()}@example.com`);
await form.locator('#phone').fill('416 555 0100');
// Turnstile (test key) renders at the last step; wait for its token field, then send
await page.waitForFunction(() => document.querySelector('[name="cf-turnstile-response"]')?.value, null, { timeout: 20000 }).catch(() => errors.push('turnstile token never appeared'));
await form.locator('[data-submit]').click();
await page.locator('.quote__done').waitFor({ state: 'visible', timeout: 15000 }).catch(() => errors.push('success panel never shown'));
const done = await page.locator('.quote__done').innerText().catch(() => '');
if (out) await page.screenshot({ path: out });
console.log(JSON.stringify({ viewport: `${w}x${h}`, stepAfterEmptyNext: stayed, emailError: emailError.trim().slice(0, 60), apiStatuses: api, success: done.split('\n')[0], errors }, null, 1));
await browser.close();
