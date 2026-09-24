// Bakes the grime that sits inside the letters before the squeegee pass:
// mottled dust, greasy smudges, drip streaks, coffee rings and dried water
// spots. Deterministic (seeded), written once to public/img/grime.webp.
import sharp from 'sharp';

const W = 1750, H = 320; // 2x the wordmark viewBox (875 x 160)

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const PERM = Array.from({ length: 512 }, () => Math.floor(rand() * 256));
const hash = (x, y) => PERM[(PERM[x & 255] + y) & 511] / 255;
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = smooth(xf), v = smooth(yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 5) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * vnoise(x * f, y * f); f *= 2.03; amp *= 0.5; }
  return v;
}
const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];
const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// Coffee rings and water spots, placed once.
const rings = Array.from({ length: 9 }, () => ({ x: rand() * W, y: rand() * H, r: 40 + rand() * 60, w: 5 + rand() * 4 }));
const spots = Array.from({ length: 34 }, () => ({ x: rand() * W, y: rand() * H, r: 7 + rand() * 14 }));

const buf = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const nx = x / 110, ny = y / 110;
    const film = fbm(nx * 1.6, ny * 1.6);
    const blotch = sstep(0.42, 0.72, fbm(nx * 0.55 + 4, ny * 0.55 + 9));
    const streak = sstep(0.62, 0.92, vnoise(x / 13 + fbm(nx, ny) * 3, y / 170 + fbm(nx * 2, ny * 2) * 2));
    const grain = vnoise(x / 1.6, y / 1.6);

    let c = mix3([48, 37, 26], [150, 128, 98], sstep(0.3, 0.75, film)); // dust film, patchy
    c = mix3(c, [26, 19, 13], blotch * 0.85);                    // grease
    c = mix3(c, [20, 15, 10], streak * 0.42);                    // drips
    for (const r of rings) {
      const d = Math.abs(Math.hypot(x - r.x, y - r.y) - r.r);
      if (d < r.w * 2) c = mix3(c, [74, 42, 18], Math.max(0, 1 - d / r.w) * 0.85);
    }
    for (const s of spots) {
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < s.r) c = mix3(c, [176, 164, 142], 0.45 * (1 - (d / s.r) ** 2));
    }
    const k = 0.9 + grain * 0.2;
    const i = (y * W + x) * 3;
    buf[i] = Math.min(255, c[0] * k); buf[i + 1] = Math.min(255, c[1] * k); buf[i + 2] = Math.min(255, c[2] * k);
  }
}

await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 80 }).toFile('public/img/grime.webp');
console.log('public/img/grime.webp written');
