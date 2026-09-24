// Converts Cormorant Garamond (OFL, via @fontsource) into three.js typeface JSON
// so the hero wordmark can be a real extruded TextGeometry.
// Format follows facetype.js: y-up font units, 'q' = end,ctrl and 'b' = end,c1,c2.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import opentype from 'opentype.js';

const SRC = 'node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff';
const OUT = 'public/fonts/cormorant-600.typeface.json';
const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&'.,-";

const buf = readFileSync(SRC);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = 1000 / font.unitsPerEm;
const r = (n) => Math.round(n * scale);

const glyphs = {};
for (const ch of CHARS) {
  const g = font.charToGlyph(ch);
  if (!g) continue;
  let o = '';
  for (const c of g.path.commands) {
    if (c.type === 'M') o += `m ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'L') o += `l ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Q') o += `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
    else if (c.type === 'C') o += `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;
    else if (c.type === 'Z') o += 'z ';
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o };
}

const head = font.tables.head;
const data = {
  glyphs,
  familyName: 'Cormorant Garamond',
  ascender: r(font.ascender),
  descender: r(font.descender),
  underlinePosition: r(font.tables.post.underlinePosition),
  underlineThickness: r(font.tables.post.underlineThickness),
  boundingBox: { xMin: r(head.xMin), yMin: r(head.yMin), xMax: r(head.xMax), yMax: r(head.yMax) },
  resolution: 1000,
  original_font_information: { license: 'SIL Open Font License 1.1', source: 'Cormorant Garamond by Christian Thalmann' },
};

mkdirSync('public/fonts', { recursive: true });
writeFileSync(OUT, JSON.stringify(data));
console.log(`wrote ${OUT}: ${Object.keys(glyphs).length} glyphs, ${(JSON.stringify(data).length / 1024).toFixed(1)} KB`);
