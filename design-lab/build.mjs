// Design lab: the proposed HARA redesign (H), built from the same copy, logo, palette and
// photos as the live site, for client review on a separate URL. A to G were removed 2026-10-01. Plain HTML + CSS per variant;
// this script only expands two shorthands and copies the shared assets into dist/.
//   <i data-icon="broom"></i>           -> inline Phosphor "regular" SVG
//   <x-img id="11-open-office" sizes=".." alt=".." class=".."></x-img> -> <picture> with the webp ladder
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const here = dirname(new URL(import.meta.url).pathname);
const root = resolve(here, '..');
const out = resolve(here, 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(resolve(here, 'public'), out, { recursive: true });

const icon = (name) => readFileSync(resolve(root, `node_modules/@phosphor-icons/core/assets/regular/${name}.svg`), 'utf8').trim()
  .replace('<svg ', '<svg class="icon" aria-hidden="true" focusable="false" ');
const attrs = (s) => Object.fromEntries([...s.matchAll(/([a-z-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? true]));
const SIZES = { '11-open-office': [6240, 3354], '12-glass-offices': [2301, 1536], '13-meeting-room': [4096, 3072], '14-toronto-towers': [4466, 2512], '15-washroom': [3637, 2046], '17-lounge-skyline': [3918, 2939], '18-lobby': [3840, 2160], '19-toronto-dusk': [5142, 3428] };
const picture = ({ id, sizes = '100vw', alt = '', class: cls = '', eager }) => {
  const [w, h] = SIZES[id];
  const set = [960, 1600, 2560].map((x) => `/img/${id}-${x}.webp ${x}w`).join(', ');
  return `<picture class="${cls}"><img src="/img/${id}-960.webp" srcset="${set}" sizes="${sizes}" alt="${alt}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" /></picture>`;
};
const expand = (html) => html
  .replace(/<x-include src="([a-z0-9/._-]+)"><\/x-include>/g, (_, f) => expand(readFileSync(resolve(here, 'src', f), 'utf8').trim()))
  .replace(/<i data-icon="([a-z-]+)"><\/i>/g, (_, n) => icon(n))
  .replace(/<x-img ([^>]*)><\/x-img>/g, (_, a) => picture(attrs(a)));

const pages = readdirSync(resolve(here, 'src')).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
for (const f of pages) {
  const html = expand(readFileSync(resolve(here, 'src', f), 'utf8'));
  const name = f.replace('.html', '');
  const dest = name === 'index' ? out : resolve(out, name);
  mkdirSync(dest, { recursive: true });
  writeFileSync(resolve(dest, 'index.html'), html);
}
for (const f of readdirSync(resolve(here, 'src')).filter((f) => f.endsWith('.css') || f.endsWith('.js'))) cpSync(resolve(here, 'src', f), resolve(out, f));
writeFileSync(resolve(out, '_redirects'), '/h/ / 301\n/h / 301\n/g/ / 301\n/g / 301\n');
writeFileSync(resolve(out, '_headers'), `/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'\n/img/*\n  Cache-Control: public, max-age=86400\n/fonts/*\n  Cache-Control: public, max-age=86400\n`);
console.log('design-lab: built', pages.map((p) => p.replace('.html', '')).join(', '));
