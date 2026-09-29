#!/usr/bin/env node
// `npm run contrast`: reads the colour tokens from src/style.css :root and checks
// every text/background pair the site actually uses against WCAG 2.1 AA.
// Run it after any palette change; a FAIL means a real readability problem.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const tokens = Object.fromEntries([...root.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground token, background token, minimum, where it is used]
const PAIRS = [
  ['ink', 'bg', 4.5, 'body text'],
  ['ink', 'surface', 4.5, 'text on cards and inputs'],
  ['ink-muted', 'bg', 4.5, 'secondary text'],
  ['ink-muted', 'stone', 4.5, 'secondary text on stone panels'],
  ['ink-muted', 'surface', 4.5, 'card descriptions'],
  ['accent-ink', 'accent', 4.5, 'button labels'],
  ['accent-ink', 'accent-hover', 4.5, 'button labels on hover'],
  ['accent', 'bg', 3, 'icons, focus ring, links (non-text 3:1; link text needs 4.5)'],
  ['accent', 'bg', 4.5, 'link text'],
  ['accent', 'wash', 3, 'icons on wash chips'],
  ['accent-2', 'bg', 3, 'logo sparkles and swoosh on the page (graphic, 3:1)'],
  ['accent-2', 'surface', 3, 'logo sparkles and swoosh on the nav bar (graphic, 3:1)'],
  ['on-band', 'band', 4.5, 'text in the dark security band'],
  ['on-band-muted', 'band', 4.5, 'secondary text in the band'],
  ['error', 'bg', 4.5, 'field errors'],
  ['error', 'surface', 4.5, 'errors inside the form card'],
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
