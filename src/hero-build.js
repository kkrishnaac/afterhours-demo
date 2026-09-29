// The 3D build of the HARA logo (lazy chunk, loaded by hero-logo.js).
// Every part of the traced client logo is extruded and flies, rises or flips into
// place; the whole logo turns to face the viewer and ends exactly on top of the
// vector <img>, which then fades in while the canvas fades out and is disposed.
import {
  AmbientLight, CanvasTexture, Color, DirectionalLight, DoubleSide, ExtrudeGeometry, Group,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { PARTS, VIEWBOX } from './logo-parts.js';

const FOV = 24;
const TOTAL = 3.1; // seconds

// Extrusion depth in logo units (the logo is 1175 units wide).
const depthOf = (p) => (p.group === 'sub' || p.id.startsWith('rule') ? 5
  : p.id.startsWith('spark') ? 16 : p.group === 'word' ? 26 : 34);

// Where each part rotates and scales from: 'base' = bottom centre (things that rise or stand up).
const PIVOT = { bar1: 'base', column: 'base', bar2: 'base', word_h: 'base', word_a1: 'base', word_r: 'base', word_a2: 'base', rule_l: 'right', rule_r: 'left' };

// Choreography: start time, duration, the state it arrives from, how much of the run it takes to fade in.
const PLAN = {
  h:       { t: 0.05, d: 1.35, from: { pz: -900, ry: 1.1, rx: -0.2 }, fade: 0.45 },
  bar1:    { t: 0.25, d: 0.95, from: { sy: 0.001 }, fade: 0.2 },
  column:  { t: 0.40, d: 0.95, from: { sy: 0.001 }, fade: 0.2 },
  bar2:    { t: 0.55, d: 0.95, from: { sy: 0.001 }, fade: 0.2 },
  windows: { t: 1.20, d: 0.60, from: { pz: 60, s: 0.6 }, fade: 0.8 },
  swoosh:  { t: 0.95, d: 1.25, from: { ry: -1.35, rz: 0.3, s: 0.8, pz: 120 }, fade: 0.35 },
  spark1:  { t: 1.75, d: 0.70, from: { s: 0.001, rz: 1.4 }, fade: 0.3, back: true },
  spark2:  { t: 1.89, d: 0.70, from: { s: 0.001, rz: 1.4 }, fade: 0.3, back: true },
  spark3:  { t: 2.03, d: 0.70, from: { s: 0.001, rz: 1.4 }, fade: 0.3, back: true },
  word_h:  { t: 1.25, d: 0.90, from: { rx: 1.45, pz: 40 }, fade: 0.4 },
  word_a1: { t: 1.36, d: 0.90, from: { rx: 1.45, pz: 40 }, fade: 0.4 },
  word_r:  { t: 1.47, d: 0.90, from: { rx: 1.45, pz: 40 }, fade: 0.4 },
  word_a2: { t: 1.58, d: 0.90, from: { rx: 1.45, pz: 40 }, fade: 0.4 },
  rule_l:  { t: 2.15, d: 0.70, from: { sx: 0.001 }, fade: 0.3 },
  rule_r:  { t: 2.15, d: 0.70, from: { sx: 0.001 }, fade: 0.3 },
  sub:     { t: 2.10, d: 0.80, from: { py: 26, pz: 30 }, fade: 0.8 },
};
const WORLD_FROM = { ry: -0.42, rx: 0.2, pz: -80 };

const outCubic = (t) => 1 - (1 - t) ** 3;
const outQuart = (t) => 1 - (1 - t) ** 4;
const outBack = (t) => { const c = 1.6; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function gradientTexture(g, [x0, y0, x1, y1]) {
  const across = g.dir === 'h';
  const c = document.createElement('canvas');
  c.width = across ? 256 : 1;
  c.height = across ? 1 : 256;
  const ctx = c.getContext('2d');
  const lg = across ? ctx.createLinearGradient(0, 0, 256, 0) : ctx.createLinearGradient(0, 0, 0, 256);
  for (const [o, col] of g.stops) lg.addColorStop(o, col);
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.flipY = false;
  // Extruded caps carry UVs in logo units, so map the part's own box onto the gradient.
  if (across) { tex.repeat.set(1 / (x1 - x0), 1); tex.offset.set(-x0 / (x1 - x0), 0); }
  else { tex.repeat.set(1, 1 / (y1 - y0)); tex.offset.set(0, -y0 / (y1 - y0)); }
  return tex;
}

export function buildLogo(stage, box, done) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  stage.append(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 1.5));
  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(-0.6, 0.9, 1);
  scene.add(key);
  const camera = new PerspectiveCamera(FOV, 1, 1, 100000);

  // world: turns as a whole. flip: SVG space (y down) to three space (y up), logo centred on the origin.
  const world = new Group();
  const flip = new Group();
  flip.scale.y = -1;
  flip.position.set(-(VIEWBOX[0] + VIEWBOX[2] / 2), VIEWBOX[1] + VIEWBOX[3] / 2, 0);
  world.add(flip);
  scene.add(world);

  const loader = new SVGLoader();
  const disposables = [];
  const items = PARTS.map((p) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${p.d}"/></svg>`;
    const shapes = loader.parse(svg).paths[0].toShapes(); // even-odd: counters and windows stay open
    const depth = depthOf(p);
    const geometry = new ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 10 });
    const [x0, y0, x1, y1] = p.bbox;
    const pivot = PIVOT[p.id];
    const px = pivot === 'right' ? x1 : pivot === 'left' ? x0 : (x0 + x1) / 2;
    const py = pivot === 'base' ? y1 : (y0 + y1) / 2;
    geometry.translate(-px, -py, -depth); // front face sits at z = 0, exactly where the vector will be

    const base = p.gradient ? p.gradient.stops.at(-1)[1] : p.color;
    const caps = new MeshBasicMaterial({ side: DoubleSide, transparent: true, opacity: 0 });
    if (p.gradient) caps.map = gradientTexture(p.gradient, p.bbox);
    else caps.color = new Color(p.color);
    const sides = new MeshLambertMaterial({ color: new Color(base).multiplyScalar(0.62), side: DoubleSide, transparent: true, opacity: 0 });
    disposables.push(geometry, caps, sides, caps.map);

    const mesh = new Mesh(geometry, [caps, sides]);
    // Windows sit on the column's face: lift them a hair so the two never fight for the same depth.
    const rest = { x: px, y: py, z: p.id === 'windows' ? 1.5 : 0 };
    mesh.position.set(rest.x, rest.y, rest.z);
    flip.add(mesh);
    return { mesh, rest, plan: PLAN[p.id], mats: [caps, sides] };
  });

  const frame = () => {
    const sr = stage.getBoundingClientRect();
    const lr = box.getBoundingClientRect();
    if (!sr.width || !lr.width) return;
    renderer.setSize(sr.width, sr.height, false);
    const s = lr.width / VIEWBOX[2]; // CSS px per logo unit
    camera.aspect = sr.width / sr.height;
    const dist = (sr.height / s / 2) / Math.tan((FOV * Math.PI) / 360);
    const dx = lr.left + lr.width / 2 - (sr.left + sr.width / 2);
    const dy = lr.top + lr.height / 2 - (sr.top + sr.height / 2);
    camera.position.set(-dx / s, dy / s, dist);
    camera.near = dist / 20;
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
  };
  frame();
  const ro = new ResizeObserver(frame);
  ro.observe(stage);

  const pose = (obj, from, k, rest = { x: 0, y: 0, z: 0 }) => {
    const r = 1 - k;
    obj.position.set(rest.x + (from.px || 0) * r, rest.y + (from.py || 0) * r, rest.z + (from.pz || 0) * r);
    obj.rotation.set((from.rx || 0) * r, (from.ry || 0) * r, (from.rz || 0) * r);
    const s = from.s === undefined ? 1 : from.s + (1 - from.s) * k;
    obj.scale.set(s * (from.sx === undefined ? 1 : from.sx + (1 - from.sx) * k), s * (from.sy === undefined ? 1 : from.sy + (1 - from.sy) * k), s);
  };

  let start = 0;
  let finished = false;
  const tick = (now) => {
    if (!start) start = now;
    const t = (now - start) / 1000;
    pose(world, WORLD_FROM, outQuart(clamp01(t / TOTAL)));
    for (const it of items) {
      const { t: t0, d, from, fade, back } = it.plan;
      const raw = clamp01((t - t0) / d);
      pose(it.mesh, from, back ? outBack(raw) : outCubic(raw), it.rest);
      const o = clamp01(raw / fade);
      it.mats[0].opacity = o;
      it.mats[1].opacity = o;
      it.mesh.visible = raw > 0;
    }
    renderer.render(scene, camera);
    if (t < TOTAL + 0.1) return requestAnimationFrame(tick);
    if (finished) return;
    finished = true;
    done();
    // The vector now shows; drop the GPU resources once the crossfade is over.
    setTimeout(() => {
      ro.disconnect();
      for (const d of disposables) d?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    }, 700);
  };
  requestAnimationFrame(tick);
}
