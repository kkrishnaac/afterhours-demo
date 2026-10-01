// Builds the browser icons from the client's logo mark (public/brand/hara-mark.svg):
// the mark on a small white rounded tile, because the navy mark alone disappears on a
// dark browser tab bar. Writes favicon.svg, favicon.ico (16, 32, 48), favicon-48.png
// (Google needs a multiple of 48) and icon-192.png. apple-touch-icon.png is made by the
// logo pipeline (export_brand.py) and is left alone.
// Run: node scripts/favicons.mjs   (re-run it if export_brand.py rewrites favicon.svg)
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pub = resolve(import.meta.dirname, '../public');
const mark = readFileSync(resolve(pub, 'brand/hara-mark.svg'), 'utf8');
const viewBox = mark.match(/viewBox="([^"]+)"/)[1];
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// 64 x 64 tile, the mark filling 88% of it.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"><title>HARA</title><rect width="64" height="64" rx="14" fill="#fff"/><svg x="3.8" y="3.8" width="56.4" height="56.4" viewBox="${viewBox}">${inner}</svg></svg>\n`;
writeFileSync(resolve(pub, 'favicon.svg'), svg);

const png = (px) => sharp(Buffer.from(svg), { density: Math.max(72, px * 6) }).resize(px, px).png({ compressionLevel: 9 }).toBuffer();
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
// ICO container holding PNG images.
const head = Buffer.alloc(6); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const dirs = sizes.map((s, i) => {
  const d = Buffer.alloc(16);
  d.writeUInt8(s, 0); d.writeUInt8(s, 1); d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
  d.writeUInt32LE(images[i].length, 8); d.writeUInt32LE(offset, 12);
  offset += images[i].length;
  return d;
});
writeFileSync(resolve(pub, 'favicon.ico'), Buffer.concat([head, ...dirs, ...images]));
writeFileSync(resolve(pub, 'favicon-48.png'), images[2]);
writeFileSync(resolve(pub, 'icon-192.png'), await png(192));
console.log('favicons written');
