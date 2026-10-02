#!/usr/bin/env node
// `npm run contrast`: reads the Studio colour tokens (src/studio/base.css and h.css :root) and
// checks every text/background pair the site actually uses against WCAG 2.1 AA. Translucent
// text (white at 82% on navy) is blended first. Run it after any palette change.
import { readFileSync } from 'node:fs';

const rootOf = (file) => { const css = readFileSync(new URL(file, import.meta.url), 'utf8'); return css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root'))); };
const tokens = Object.fromEntries([...(rootOf('../src/studio/base.css') + rootOf('../src/studio/h.css')).matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
// Colours used directly in the stylesheets rather than as tokens.
Object.assign(tokens, { 'menu-option': '#DDE4EE', 'error-on-navy': '#FFC4BD', 'invalid-ring': '#D93025', 'pale-sky': '#BFE3FF' });

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const blend = (fg, bg, a) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(fg.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)).toString(16).padStart(2, '0')).join('');
tokens['white-82-on-deep'] = blend(tokens.white, tokens.deep, 0.82);

// [foreground token, background token, minimum, where it is used]
const PAIRS = [
  ['paper', 'bg', 4.5, 'body text'],
  ['navy', 'bg', 4.5, 'headline, labels and links on the white page'],
  ['ink-muted', 'bg', 4.5, 'secondary text on the simple pages'],
  ['white', 'navy', 4.5, 'button labels'],
  ['white', 'deep', 4.5, 'headings and text on the navy sections'],
  ['white-82-on-deep', 'deep', 4.5, 'body text at 82% on the navy sections'],
  ['navy', 'white', 4.5, 'form buttons and the white chips on navy'],
  ['ink', 'white', 4.5, 'text typed into the form'],
  ['error-on-navy', 'deep', 4.5, 'form errors on navy'],
  ['invalid-ring', 'white', 3, 'invalid field ring (non-text 3:1)'],
  ['navy', 'menu-option', 4.5, 'phone menu options'],
  ['deep', 'bg', 4.5, 'phone menu bar text on white'],
  ['deep', 'pale-sky', 4.5, 'phone menu bar text on the pale sky'],
  ['deep', 'sky', 4.5, 'phone menu bar text on the sky (it turns white past this)'],
  ['sky', 'bg', 3, 'logo sparkles, swoosh and focus ring (graphic, 3:1)'],
];

let failed = 0;
console.log('Tokens:', Object.entries(tokens).map(([k, v]) => `${k} ${v}`).join(', '), '\n');
for (const [fg, bg, min, use] of PAIRS) {
  if (!tokens[fg] || !tokens[bg]) { console.log(`SKIP  --${fg} on --${bg}: token missing`); continue; }
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1 (need ${min})  --${fg} on --${bg}  ${use}`);
}
console.log(failed ? `\n${failed} pair(s) below WCAG AA.` : '\nAll pairs meet WCAG AA.');
process.exit(failed ? 1 : 0);
