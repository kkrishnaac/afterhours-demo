// Screen-reader spot check without a screen reader: dumps the accessibility tree Chrome
// exposes (landmarks, headings, links, buttons, form fields, the dialog) so names, roles
// and states can be read as VoiceOver would announce them.
//   node scripts/qa/axtree.mjs <url>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || process.env.HOME + '/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core');
const exe = process.env.PW_CHROME || process.env.HOME + '/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--headless=new'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto(process.argv[2], { waitUntil: 'load' }); await page.waitForTimeout(400);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Accessibility.enable');
const dump = async (label) => {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const keep = new Set(['banner', 'navigation', 'main', 'contentinfo', 'region', 'heading', 'link', 'button', 'radio', 'combobox', 'textbox', 'checkbox', 'dialog', 'group', 'list', 'img', 'status', 'alert', 'figure', 'DisclosureTriangle', 'progressbar']);
  const lines = [];
  for (const n of nodes) {
    if (n.ignored) continue;
    const role = n.role?.value; if (!keep.has(role)) continue;
    const name = n.name?.value || ''; const desc = n.description?.value || '';
    const props = (n.properties || []).filter((p) => ['level', 'expanded', 'checked', 'invalid', 'required', 'hidden', 'modal', 'hiddenRoot', 'live'].includes(p.name)).map((p) => `${p.name}=${p.value.value}`).join(' ');
    if (role === 'img' && !name) continue; // decorative
    lines.push(`${role}${props ? ' [' + props + ']' : ''}: ${name}${desc ? ' (' + desc + ')' : ''}`.slice(0, 120));
  }
  console.log(`\n=== ${label}: ${lines.length} nodes`); lines.forEach((l) => console.log('  ' + l));
};
await dump('page as loaded');
await page.locator('#walkthrough').scrollIntoViewIfNeeded(); await page.locator('[data-next]').click(); await page.waitForTimeout(200);
const { nodes } = await cdp.send('Accessibility.getFullAXTree');
const form = nodes.filter((n) => !n.ignored && ['radio', 'button', 'status', 'group', 'alert', 'combobox'].includes(n.role?.value) && /sq ft|Next|Step|big|office/i.test(n.name?.value || ''));
console.log('\n=== form step 1 with error:'); form.forEach((n) => console.log('  ', n.role.value, ':', n.name?.value, '|', (n.properties || []).filter((p) => ['invalid', 'checked', 'live', 'describedby'].includes(p.name)).map((p) => `${p.name}=${JSON.stringify(p.value.value).slice(0, 60)}`).join(' ')));
const errs = nodes.filter((n) => !n.ignored && /Choose|Enter|needs/i.test(n.name?.value || '') && n.role?.value !== 'button');
console.log('   error text nodes exposed:', errs.map((n) => `${n.role.value}: ${n.name.value}`));
await page.locator('.svc__photo').first().click(); await page.waitForTimeout(400);
const t2 = (await cdp.send('Accessibility.getFullAXTree')).nodes.filter((n) => !n.ignored && ['dialog', 'button', 'img', 'heading'].includes(n.role?.value) && n.name?.value);
console.log('\n=== viewer open (dialog subtree names):'); t2.slice(0, 16).forEach((n) => console.log('  ', n.role.value, ':', n.name.value.slice(0, 80), (n.properties || []).filter((p) => p.name === 'modal').map((p) => 'modal=' + p.value.value).join('')));
await b.close();
