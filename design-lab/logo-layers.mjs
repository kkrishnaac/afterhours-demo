// Generates every layer of the hero logo intro from the traced client logo (src/logo-parts.js).
//   node design-lab/logo-layers.mjs        then        node design-lab/build.mjs
// Writes public/brand/logo-*.svg and src/_logo.html (the stacked layers, included by index.html).
//
// The intro (src/h-logo.js) opens on a normal H, then a star follows the ring's centre line from
// its sharp tip by the left upright, draws the ring behind it and turns the H into the logo's H
// where it has passed. To change the star's path, edit CENTRE below. To change the starting H's
// crossbar, edit CROSSBAR. Everything else comes from the logo itself.
import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { PARTS, VIEWBOX } from '../src/logo-parts.js';

const here = dirname(new URL(import.meta.url).pathname);
const brand = resolve(here, 'public/brand');
const VB = VIEWBOX.join(' ');
const part = (id) => PARTS.find((p) => p.id === id);
const stops = (g) => g.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
const gradOf = (id, p) => {
  const [x0, y0, x1, y1] = p.bbox; const v = p.gradient.dir === 'v';
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${v ? x0 : x1}" y2="${v ? y1 : y0}">${stops(p.gradient)}</linearGradient>`;
};
const svg = (defs, body, viewBox = VB) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><defs>${defs}</defs>${body}</svg>\n`;
const draw = (ps) => svg(ps.filter((p) => p.gradient).map((p) => gradOf('g_' + p.id, p)).join(''),
  ps.map((p) => `<path fill-rule="evenodd" d="${p.d}" fill="${p.gradient ? `url(#g_${p.id})` : p.color}"/>`).join(''));
const out = (name, text) => { writeFileSync(resolve(brand, name), text); console.log('wrote', name); };

// 1. Everything that never moves: the logo without the H, the ring and the sparkles.
out('logo-rest.svg', draw(PARTS.filter((p) => !['h', 'swoosh', 'spark1', 'spark2', 'spark3'].includes(p.id))));

// 2. The logo's H as its three pieces (the ring cuts it in two places), one gradient across the H.
const h = part('h');
const hGrad = gradOf('g', h);
h.d.split(/(?=M)/).filter(Boolean).forEach((d, i) => out(`logo-h-${'abc'[i]}.svg`, svg(hGrad, `<path d="${d}" fill="url(#g)"/>`)));

// 3. The starting H: the logo H's own uprights (crossbar clipped away), the two gaps the ring
//    cuts filled from logo-gaps.json (traced from the H path, overlapping by 9 units so no seam
//    shows), the right upright squared through the cut, and a straight crossbar.
const CROSSBAR = { x: 519, y: 443, w: 177, h: 66 };
const gaps = JSON.parse(readFileSync(resolve(here, 'logo-gaps.json'), 'utf8'));
const rightPts = gaps.right.slice(1, -1).split('L').map((s) => s.split(' ').map(Number));
const half = rightPts.length / 2;
const [tl, tr] = [rightPts[0], rightPts[half - 1]];
const bl = rightPts.at(-1);
const squareRight = `M${tl[0]} ${tl[1]}L${tr[0]} ${tr[1]}L808.4 462.5L${bl[0]} ${bl[1]}Z`;
const uprights = '<clipPath id="u"><rect x="390" y="240" width="132.6" height="450"/><rect x="692.2" y="240" width="130" height="450"/></clipPath>';
out('logo-h-normal.svg', svg(hGrad + uprights,
  `<g fill="url(#g)"><g clip-path="url(#u)"><path fill-rule="evenodd" d="${h.d}"/><path d="${gaps.left}"/><path d="${gaps.right}"/><path d="${squareRight}"/></g>` +
  `<rect x="${CROSSBAR.x}" y="${CROSSBAR.y}" width="${CROSSBAR.w}" height="${CROSSBAR.h}"/></g>`));

// 4. The three sparkles, each on its own full-size layer so it can twinkle in place.
for (const id of ['spark1', 'spark2', 'spark3']) out(`logo-${id}.svg`, draw([part(id)]));

// 5. The travelling star: spark1's shape with a white-to-sky radial fill, in its own square.
const s1 = part('spark1'); const [a, b, c, d] = s1.bbox;
out('logo-star.svg', svg('<radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.35" stop-color="#9BDCFF"/><stop offset="1" stop-color="#0A95EF"/></radialGradient>',
  `<path fill-rule="evenodd" d="${s1.d}" fill="url(#s)"/>`, `${a} ${b} ${c - a} ${d - b}`));

// 6. The ring's centre line, in the direction the ring is drawn: from the sharp tip beside the
//    left upright, down round the left end, along the front through the H, into the right curl.
//    Points were sampled from the ring path column by column; smoothed with Catmull-Rom.
const CENTRE = [[400, 417], [390, 422.5], [378, 431.5], [366, 440.5], [354, 450], [342, 460.5], [330, 473], [318, 488], [305, 503], [293, 521], [285, 541], [285, 560], [292, 574], [306, 582], [326, 585], [358, 588.5], [390, 587], [422, 582.5], [454, 575.5], [486, 567], [518, 557], [550, 546], [582, 533.5], [614, 520], [646, 505], [678, 489], [710, 472], [742, 453.5], [774, 434.5], [806, 413], [838, 389.5], [862, 369.5], [880, 351], [895, 336], [906, 321], [910, 307], [905, 294], [893, 286], [877, 280], [862, 276], [850, 273]];
let centre = `M${CENTRE[0][0]} ${CENTRE[0][1]}`;
for (let i = 0; i < CENTRE.length - 1; i++) {
  const p0 = CENTRE[Math.max(0, i - 1)]; const p1 = CENTRE[i]; const p2 = CENTRE[i + 1]; const p3 = CENTRE[Math.min(CENTRE.length - 1, i + 2)];
  centre += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`;
}

// 7. The stacked layers, as a partial for index.html. Order matters: the real H pieces and the
//    ring sit under the starting H; h-logo.js clips the starting H and the pieces to opposite
//    sides of the star, so only one H is ever visible.
const ring = part('swoosh');
const layer = (cls, file) => `                <img class="${cls}" src="/brand/${file}" alt="" width="1175" height="872" />`;
const partial = `              <div class="hero-card__logo logo-cut" role="img" aria-label="HARA Facilities Cleaning">
${layer('logo-cut__rest', 'logo-rest.svg')}
${layer('logo-cut__piece logo-cut__a', 'logo-h-a.svg')}
${layer('logo-cut__piece logo-cut__b', 'logo-h-b.svg')}
${layer('logo-cut__piece logo-cut__c', 'logo-h-c.svg')}
                <svg class="logo-cut__fx" viewBox="${VB}" aria-hidden="true" focusable="false">
                  <defs>
                    <linearGradient id="lc-ring" gradientUnits="userSpaceOnUse" x1="${ring.bbox[0]}" y1="0" x2="${ring.bbox[2]}" y2="0">${stops(ring.gradient)}</linearGradient>
                    <radialGradient id="lc-glow"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.35" stop-color="#9BDCFF" stop-opacity="0.7"/><stop offset="1" stop-color="#0A95EF" stop-opacity="0"/></radialGradient>
                    <mask id="lc-draw" maskUnits="userSpaceOnUse" x="${VIEWBOX[0]}" y="${VIEWBOX[1]}" width="${VIEWBOX[2]}" height="${VIEWBOX[3]}"><path class="logo-cut__draw" d="${centre}" fill="none" stroke="#fff" stroke-width="96" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/></mask>
                  </defs>
                  <path d="${ring.d}" fill="url(#lc-ring)" fill-rule="evenodd" mask="url(#lc-draw)"/>
                  <path class="logo-cut__track" d="${centre}" fill="none"/>
                  <g class="logo-cut__star" transform="translate(${CENTRE[0][0]} ${CENTRE[0][1]}) scale(0)"><circle r="46" fill="url(#lc-glow)"/><image href="/brand/logo-star.svg" x="-28" y="-28" width="56" height="56"/></g>
                </svg>
${layer('logo-cut__solid', 'logo-h-normal.svg')}
${layer('logo-cut__spark', 'logo-spark1.svg')}
${layer('logo-cut__spark', 'logo-spark2.svg')}
${layer('logo-cut__spark', 'logo-spark3.svg')}
              </div>
`;
writeFileSync(resolve(here, 'src/_logo.html'), partial);
console.log('wrote src/_logo.html');
