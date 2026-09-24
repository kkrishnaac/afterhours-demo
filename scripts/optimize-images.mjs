// Turns the 4K masters in assets/raw into responsive AVIF + WebP in public/img,
// plus the social share image. Landscape and portrait get their own width ladders
// to match the srcset lists in index.html.
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const RAW = 'assets/raw';
const OUT = 'public/img';
const LANDSCAPE = [960, 1600, 2560, 3840];
const PORTRAIT = [720, 1200, 1800, 2400];

mkdirSync(OUT, { recursive: true });
const files = existsSync(RAW) ? readdirSync(RAW).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
if (!files.length) {
  console.log('No masters in assets/raw yet.');
  process.exit(0);
}

for (const file of files) {
  const id = parse(file).name;
  const src = sharp(join(RAW, file));
  const { width, height } = await src.metadata();
  const ladder = height > width ? PORTRAIT : LANDSCAPE;
  for (const w of ladder) {
    const img = sharp(join(RAW, file)).resize({ width: Math.min(w, width) });
    await img.clone().avif({ quality: 58, effort: 5 }).toFile(join(OUT, `${id}-${w}.avif`));
    await img.clone().webp({ quality: 80 }).toFile(join(OUT, `${id}-${w}.webp`));
  }
  console.log(`${id}: ${width}x${height} -> ${ladder.join(', ')}`);
}

const share = files.find((f) => f.startsWith('01-'));
if (share) {
  await sharp(join(RAW, share)).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og.jpg');
  console.log('og.jpg written');
}
