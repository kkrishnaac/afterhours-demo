// Turns the wordmark into vector outlines (Cormorant Garamond 700, OFL) and
// writes src/wordmark.json { d, viewBox }. The outlines are the crisp edge of
// both the clean black name and the grime clipped inside it.
// Rename the business: change WORD, run `npm run wordmark`, then `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
// Also rewrites the two outline paths and the viewBox inside index.html.
import opentype from 'opentype.js';

const WORD = 'Afterhours';
const SIZE = 200;
const PAD = 6;

const buf = readFileSync('node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff');
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const path = font.getPath(WORD, 0, SIZE, SIZE, { kerning: true });
const bb = path.getBoundingBox();
const x = Math.floor(bb.x1 - PAD), y = Math.floor(bb.y1 - PAD);
const w = Math.ceil(bb.x2 - bb.x1 + PAD * 2), h = Math.ceil(bb.y2 - bb.y1 + PAD * 2);

// Serialise by hand: opentype.js 2.x toPathData() emits NaN for some contours.
const n = (v) => Math.round(v * 100) / 100;
const d = path.commands.map((c) => {
  if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
  if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
  if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
  return 'Z';
}).join('');
if (/NaN/.test(d)) throw new Error('wordmark path contains NaN');
writeFileSync('src/wordmark.json', JSON.stringify({ word: WORD, viewBox: [x, y, w, h], d }));
const cy = Math.round(y + h / 2);
const svg = `<svg class="wordmark" viewBox="${x} ${y} ${w} ${h}" role="img" aria-labelledby="wm-title">
          <title id="wm-title">${WORD}</title>
          <defs>
            <clipPath id="wm-letters"><path d="${d}" /></clipPath>
            <clipPath id="wm-dirty"><rect class="wm-wipe" x="${x - 6}" y="${y - 40}" width="${w + 60}" height="${h + 80}" /></clipPath>
            <pattern id="wm-grime" patternUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">
              <image href="img/grime.webp" width="${w}" height="${h}" preserveAspectRatio="none" />
            </pattern>
            <linearGradient id="wm-ink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#1E293B" /><stop offset="0.55" stop-color="#0B1120" /><stop offset="1" stop-color="#020617" />
            </linearGradient>
            <linearGradient id="wm-shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset="0.5" stop-color="#fff" stop-opacity="0.8" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path class="wm-clean" d="${d}" fill="url(#wm-ink)" />
          <g clip-path="url(#wm-letters)">
            <rect class="wm-glint" x="${x - 200}" y="${y - 10}" width="90" height="${h + 20}" fill="url(#wm-shine)" transform="skewX(-20)" />
          </g>
          <g class="wm-dirt" clip-path="url(#wm-dirty)">
            <path class="wm-smudge" d="${d}" fill="none" stroke="url(#wm-grime)" stroke-width="9" stroke-linejoin="round" opacity="0.55" />
            <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#wm-grime)" clip-path="url(#wm-letters)" />
          </g>
          <rect class="wm-edge" x="${x - 6}" y="${y - 12}" width="3" height="${h + 24}" fill="#fff" opacity="0" clip-path="url(#wm-letters)" />
          <g class="wm-squeegee" opacity="0">
            <rect x="-16" y="${y - 26}" width="12" height="${h + 52}" rx="3" fill="#CBD5E1" />
            <rect x="-6" y="${y - 22}" width="9" height="${h + 44}" rx="4.5" fill="#0F172A" />
            <g transform="rotate(-28 -12 ${cy})">
              <rect x="-160" y="${cy - 8}" width="150" height="16" rx="8" fill="#1E293B" />
              <rect x="-74" y="${cy - 10}" width="28" height="20" rx="5" fill="#1D4ED8" />
            </g>
          </g>
        </svg>`;
let html = readFileSync('index.html', 'utf8');
const a = html.indexOf('<svg class="wordmark"');
const b = html.indexOf('</svg>', a) + '</svg>'.length;
if (a < 0) throw new Error('wordmark <svg> not found in index.html');
html = html.slice(0, a) + svg + html.slice(b);
writeFileSync('index.html', html);
console.log(`wordmark "${WORD}": viewBox ${x} ${y} ${w} ${h}, ${d.length} chars, index.html updated`);
