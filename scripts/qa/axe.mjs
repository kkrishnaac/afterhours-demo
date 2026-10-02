// WCAG 2.1 AA scan with axe-core at desktop and phone widths, on the page as loaded, with
// the phone menu open, and on each form step (including a validation error shown).
//   node scripts/qa/axe.mjs <url>
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const AXE = process.env.AXE || process.env.HOME + '/.npm/_npx/8003d8991b0d346b/node_modules/axe-core/axe.min.js';
const exe = process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const U = process.argv[2];
const axeSrc = readFileSync(AXE, 'utf8');
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--headless=new'] });
const run = async (page, label) => {
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }));
  const v = res.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, help: x.help, targets: x.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  console.log(label, 'violations:', v.length, 'incomplete:', res.incomplete.length, 'passes:', res.passes.length);
  for (const x of v) console.log('   ', x.impact, x.id, 'x' + x.n, '|', x.help, '|', x.targets.join(' ; '));
  return res.incomplete.map((x) => x.id);
};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 768, hasTouch: w < 768, reducedMotion: 'reduce', bypassCSP: true }); // the site's CSP blocks axe's injected script
  const page = await ctx.newPage();
  for (const path of ['', 'privacy.html', 'terms.html', 'accessibility.html', '404.html']) {
    await page.goto(U + path, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const inc = await run(page, `${w}px ${path || 'home'}`);
    if (!path) console.log('    incomplete (manual check):', [...new Set(inc)].join(', '));
  }
  await page.goto(U, { waitUntil: 'load' }); await page.waitForTimeout(400);
  if (w < 1200) {  // the phone menu, opened from its bar at the top
    await page.locator('.tabnav__tab').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    await run(page, `${w}px phone menu open`);
    await page.keyboard.press('Escape');
  }
  await page.locator('#walkthrough').scrollIntoViewIfNeeded();
  await page.locator('[data-next]').click(); await page.waitForTimeout(200);   // step 1 error shown
  await run(page, `${w}px form step 1 with error`);
  await page.locator('label[for="size-m"]').click(); await page.waitForTimeout(500);
  await page.locator('[data-next]').click(); await page.waitForTimeout(200);
  await run(page, `${w}px form step 2 with error`);
  await page.locator('.chips input[name="timing"] + label').first().click(); await page.waitForTimeout(500);
  await page.locator('[data-next]').click(); await page.waitForTimeout(200);
  await run(page, `${w}px form step 3 with error`);
  await page.selectOption('#city', 'Toronto'); await page.locator('[data-next]').click(); await page.waitForTimeout(600);
  await page.locator('[data-submit]').click(); await page.waitForTimeout(300);
  await run(page, `${w}px form step 4 with errors`);
  await ctx.close();
}
await b.close();
