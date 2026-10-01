// Keyboard-only pass: Tab through the whole page recording each stop and whether it shows a
// visible focus style; then complete the four-step form with keys alone; then open and close
// the photo viewer with the keyboard and confirm focus returns.
//   node scripts/qa/keyboard.mjs <url>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const exe = process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const U = process.argv[2];
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--headless=new'] });
const page = await (await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })).newPage();
await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(500);

const describe = () => page.evaluate(() => {
  const e = document.activeElement; if (!e || e === document.body) return null;
  const s = getComputedStyle(e);
  const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || e.matches(':focus-visible') && (s.boxShadow !== 'none');
  // chips: the ring is drawn on the following label
  const lbl = e.matches('.chips input') ? getComputedStyle(e.nextElementSibling) : null;
  const ringOnLabel = lbl ? (lbl.outlineStyle !== 'none' && parseFloat(lbl.outlineWidth) > 0) : false;
  const r = e.getBoundingClientRect();
  const nav = document.querySelector('.nav')?.getBoundingClientRect();
  const hiddenUnderNav = nav ? (r.top < nav.bottom && r.bottom > nav.top && !e.closest('.nav')) : false;
  const text = (e.getAttribute('aria-label') || e.textContent || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return { tag: e.tagName.toLowerCase(), id: e.id, cls: e.className?.toString().split(' ')[0], text, ring: ring || ringOnLabel, hiddenUnderNav, inViewport: r.bottom > 0 && r.top < innerHeight, offscreen: r.width === 0 && r.height === 0 };
});
const stops = []; const seen = new Set();
for (let i = 0; i < 120; i++) {
  await page.keyboard.press('Tab'); await page.waitForTimeout(40);
  const d = await describe(); if (!d) break;
  const key = `${d.tag}#${d.id}.${d.cls}:${d.text}`;
  if (seen.has(key)) break; seen.add(key); stops.push(d);
}
console.log('tab stops:', stops.length);
const noRing = stops.filter((s) => !s.ring); console.log('no visible focus ring:', noRing.map((s) => `${s.tag}.${s.cls}:${s.text}`));
console.log('focused but out of viewport (not scrolled into view):', stops.filter((s) => !s.inViewport && !s.offscreen).map((s) => `${s.tag}.${s.cls}:${s.text}`));
console.log('hidden under the floating nav:', stops.filter((s) => s.hiddenUnderNav).map((s) => `${s.tag}.${s.cls}:${s.text}`));
console.log('zero-size stops:', stops.filter((s) => s.offscreen).map((s) => `${s.tag}.${s.cls}:${s.text}`));
console.log('order:', stops.map((s) => s.text || s.tag).join(' > ').slice(0, 900));

// Form by keyboard: focus the first size chip, choose with arrows, Enter on Next, etc.
await page.focus('#size-s'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
let step = await page.locator('[data-step-now]').textContent(); console.log('after arrow on size chips, step:', step, '| checked:', await page.$eval('input[name="size"]:checked', (e) => e.value));
if (step === '1') { await page.focus('[data-next]'); await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
await page.focus('#timing-any').catch(() => page.focus('input[name="timing"]'));
await page.keyboard.press('Space'); await page.waitForTimeout(400);
step = await page.locator('[data-step-now]').textContent(); console.log('after Space on a timing chip, step:', step);
if (step === '2') { await page.focus('[data-next]'); await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
console.log('focused on step 3:', await describe());
await page.keyboard.type('Mark'); await page.waitForTimeout(100); console.log('select after typing "Mark":', await page.$eval('#city', (e) => e.value));
await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
console.log('step after Enter on Next:', await page.locator('[data-step-now]').textContent(), '| focused:', (await describe())?.id);
await page.keyboard.type('Priya Raman'); await page.keyboard.press('Tab'); await page.keyboard.type('priya@northwind.ca');
await page.keyboard.press('Tab'); await page.keyboard.type('416 555 0123');
let n = 0; while (n++ < 6) { await page.keyboard.press('Tab'); const d = await describe(); if (d?.cls === 'btn' && /Send|Request|Book/i.test(d.text)) break; }
console.log('reached submit by Tab:', (await describe())?.text);

// Viewer by keyboard
await page.focus('.svc__photo'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
console.log('viewer open:', await page.evaluate(() => !document.querySelector('.viewer').hidden), '| focus inside viewer:', await page.evaluate(() => !!document.activeElement.closest('.viewer')));
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
console.log('after ArrowRight, count:', await page.locator('.viewer__count').textContent());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
console.log('viewer closed:', await page.evaluate(() => document.querySelector('.viewer').hidden), '| focus returned to photo:', await page.evaluate(() => document.activeElement.matches('.svc__photo')));
// Skip link
await page.goto(U, { waitUntil: 'load' }); await page.keyboard.press('Tab'); console.log('first Tab:', (await describe())?.text); await page.keyboard.press('Enter'); await page.waitForTimeout(300); console.log('after skip link, focus:', (await describe())?.id || (await describe())?.tag);
await b.close();
