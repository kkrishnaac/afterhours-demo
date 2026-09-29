// The GTA: real city coordinates projected onto an SVG, with the
// Lake Ontario shoreline traced from approximate lakeshore points.
import { CITIES } from './cities.js';

const NS = 'http://www.w3.org/2000/svg';

const SHORE = [
  [43.265, -79.99], [43.3, -79.8], [43.36, -79.74], [43.43, -79.67], [43.49, -79.61], [43.55, -79.575],
  [43.59, -79.52], [43.62, -79.465], [43.635, -79.4], [43.645, -79.355], [43.665, -79.3], [43.69, -79.25],
  [43.725, -79.2], [43.765, -79.15], [43.8, -79.1], [43.822, -79.05], [43.842, -78.98], [43.858, -78.93],
  [43.865, -78.86], [43.868, -78.74],
];

// Labelled on phones, where all 16 names would collide: the centre and three far
// corners, so the reach reads at a glance. The full list sits above the map.
const MAJOR = new Set(['Toronto', 'Burlington', 'Newmarket', 'Oshawa']);

const BOUNDS = { latMin: 43.2, latMax: 44.12, lonMin: -80.0, lonMax: -78.74 };
const VIEW_W = 1000;
const K = Math.cos((43.7 * Math.PI) / 180);
const SCALE = VIEW_W / ((BOUNDS.lonMax - BOUNDS.lonMin) * K);
const VIEW_H = Math.round((BOUNDS.latMax - BOUNDS.latMin) * SCALE);
const project = (lat, lon) => [((lon - BOUNDS.lonMin) * K * SCALE), ((BOUNDS.latMax - lat) * SCALE)];

const el = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function buildMap(host) {
  const svg = el('svg', { viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, role: 'presentation' });
  const shore = SHORE.map(([la, lo]) => project(la, lo));
  const line = shore.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  svg.appendChild(el('path', { class: 'lake', d: `${line} L${VIEW_W} ${VIEW_H} L0 ${VIEW_H} Z` }));
  svg.appendChild(el('path', { class: 'shore', d: line }));

  // Light up from Toronto outward.
  const [tx, ty] = project(43.6532, -79.3832);
  const placed = CITIES.map(([name, lat, lon, dx, dy, anchor]) => {
    const [x, y] = project(lat, lon);
    return { name, x, y, dx, dy, anchor, d: Math.hypot(x - tx, y - ty) };
  }).sort((a, b) => a.d - b.d);

  const cities = placed.map((c) => {
    const g = el('g', { class: MAJOR.has(c.name) ? 'city city--major' : 'city' });
    g.appendChild(el('circle', { class: 'halo', cx: c.x, cy: c.y, r: 26 }));
    g.appendChild(el('circle', { class: 'dot', cx: c.x, cy: c.y, r: 6 }));
    const t = el('text', { x: c.x + c.dx, y: c.y + c.dy, 'text-anchor': c.anchor });
    t.textContent = c.name;
    g.appendChild(t);
    svg.appendChild(g);
    return g;
  });

  host.appendChild(svg);
  return { cities, list: placed.map((c) => c.name) };
}

export { CITY_NAMES } from './cities.js';
