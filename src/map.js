// The GTA at night: real city coordinates projected onto an SVG, with the
// Lake Ontario shoreline traced from approximate lakeshore points.
const NS = 'http://www.w3.org/2000/svg';

// [name, lat, lon, label dx, label dy, anchor]
const CITIES = [
  ['Toronto', 43.6532, -79.3832, 14, 26, 'start'],
  ['Mississauga', 43.589, -79.6441, -14, 6, 'end'],
  ['Vaughan', 43.8361, -79.4983, -14, 6, 'end'],
  ['Markham', 43.8561, -79.337, 14, 6, 'start'],
  ['Richmond Hill', 43.8828, -79.4403, 0, -18, 'middle'],
  ['Brampton', 43.7315, -79.7624, -14, 6, 'end'],
  ['Oakville', 43.4675, -79.6877, -14, 6, 'end'],
  ['Pickering', 43.8384, -79.0868, -8, -16, 'end'],
  ['Ajax', 43.8509, -79.0204, 6, 26, 'middle'],
  ['Aurora', 44.0065, -79.4504, 14, 6, 'start'],
  ['Newmarket', 44.0592, -79.4613, 14, 6, 'start'],
  ['Milton', 43.5183, -79.8774, -14, 6, 'end'],
  ['Burlington', 43.3255, -79.799, -14, 6, 'end'],
  ['Caledon', 43.8668, -79.858, -14, 6, 'end'],
  ['Whitby', 43.8975, -78.9429, 0, -18, 'middle'],
  ['Oshawa', 43.8971, -78.8658, 12, 26, 'middle'],
];

const SHORE = [
  [43.265, -79.99], [43.3, -79.8], [43.36, -79.74], [43.43, -79.67], [43.49, -79.61], [43.55, -79.575],
  [43.59, -79.52], [43.62, -79.465], [43.635, -79.4], [43.645, -79.355], [43.665, -79.3], [43.69, -79.25],
  [43.725, -79.2], [43.765, -79.15], [43.8, -79.1], [43.822, -79.05], [43.842, -78.98], [43.858, -78.93],
  [43.865, -78.86], [43.868, -78.74],
];

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
    const g = el('g', { class: 'city' });
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

export const CITY_NAMES = CITIES.map((c) => c[0]).sort((a, b) => a.localeCompare(b));
