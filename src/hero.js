// Hero: the Afterhours wordmark as real 3D letters. It loads caked in grime,
// gets a mist of cleaner, a squeegee pass, and comes up glossy piano black
// with one glint, standing off a white wall like a lobby sign. All dirt is procedural (shader), so renaming is one string.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';

const WORD = 'Afterhours';

const GRIME_PARS = /* glsl */ `
varying vec3 vObjPos;
varying vec3 vObjNormal;
uniform float uClean;
uniform float uWet;
uniform float uGlint;
uniform float uDirt;
uniform float uEdgeOn;

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n)); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }
vec2 voro(vec2 p){
  vec2 i = floor(p), f = fract(p); float md = 8.0; float id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 r = g + h22(i + g) - f; float d = dot(r, r);
    if (d < md) { md = d; id = h21(i + g + 3.7); }
  }
  return vec2(sqrt(md), id);
}
`;

const GRIME_MAIN = /* glsl */ `
float ahClean = 0.0;
{
  vec2 gp = vObjPos.xy + vObjPos.z * 0.35;
  float film   = fbm(gp * 2.2);
  float blotch = smoothstep(0.3, 0.72, fbm(gp * 0.9 + 4.0));
  float streak = smoothstep(0.55, 0.92, vnoise(vec2(gp.x * 22.0, gp.y * 1.1 + fbm(gp * 3.0) * 2.0)));
  vec2  cell   = voro(gp * 4.5);
  float rr     = 0.2 + 0.14 * cell.y;
  float ring   = smoothstep(0.045, 0.0, abs(cell.x - rr)) * step(0.5, cell.y);
  float spots  = smoothstep(0.1, 0.0, voro(gp * 13.0 + 7.0).x);
  float up     = clamp(vObjNormal.y, 0.0, 1.0);
  float dust   = clamp(film * 0.95 + up * 0.8, 0.0, 1.0);

  float mottle = fbm(gp * 7.0 + 2.0);
  vec3 g = mix(vec3(0.05, 0.036, 0.024), vec3(0.17, 0.13, 0.09), dust * (0.5 + 0.5 * mottle));
  g = mix(g, vec3(0.014, 0.01, 0.006), smoothstep(0.3, 0.7, blotch) * 0.95);
  g = mix(g, vec3(0.012, 0.009, 0.006), streak * 0.85);
  g = mix(g, vec3(0.07, 0.035, 0.012), ring * 0.95);
  g = mix(g, vec3(0.26, 0.24, 0.2), spots * 0.25);
  float gRough = mix(0.97, 0.6, blotch * 0.8);
  gRough = mix(gRough, 0.45, spots * 0.4);

  // Cleaner mist: surface darkens and beads up ahead of the blade.
  vec2 b = voro(gp * 24.0 + 11.0);
  float bead = (1.0 - smoothstep(0.16 + 0.12 * b.y, 0.3 + 0.12 * b.y, b.x)) * step(b.y, uWet);
  g *= mix(1.0, 0.8, uWet * 0.7);
  gRough = mix(gRough, 0.35, uWet * 0.5);
  g = mix(g, g * 0.7, bead);
  gRough = mix(gRough, 0.05, bead);

  float sweep = 1.0 - smoothstep(uClean - 0.012, uClean + 0.012, vObjPos.x);
  float clean = max(sweep, 1.0 - uDirt);
  float edge  = exp(-pow((vObjPos.x - uClean) * 30.0, 2.0)) * uEdgeOn;
  float film2 = smoothstep(uClean - 0.5, uClean, vObjPos.x) * sweep * uEdgeOn;

  ahClean = clean;
  diffuseColor.rgb = mix(g, vec3(0.008, 0.009, 0.012), clean);   // piano black
  roughnessFactor  = mix(gRough, 0.3, clean);
  roughnessFactor  = mix(roughnessFactor, 0.02, max(edge, film2 * 0.8));
  metalnessFactor  = 0.0;

  float gl = exp(-pow((vObjPos.x + vObjPos.y * 0.55 - uGlint) * 5.5, 2.0));
  totalEmissiveRadiance += vec3(0.92, 0.95, 1.0) * gl * 0.55 * clean;
  totalEmissiveRadiance += vec3(0.75, 0.88, 1.0) * edge * 0.3;
}
`;

// A white product studio. Chrome only reads as chrome if it has something dark
// to reflect: the wall behind the camera is a horizon (dark below, bright above),
// so every letter face runs bright at the top to deep at the bottom.
function horizonTexture() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#9aa6b4');
  g.addColorStop(0.3, '#b9c3cf');
  g.addColorStop(0.445, '#dde4ec');
  g.addColorStop(0.458, '#ffffff');
  g.addColorStop(0.464, '#ffffff');
  g.addColorStop(0.47, '#2a3242');
  g.addColorStop(0.56, '#101522');
  g.addColorStop(1, '#070a12');
  x.fillStyle = g;
  x.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeStudio() {
  const studio = new THREE.Scene();
  studio.add(new THREE.Mesh(
    new THREE.BoxGeometry(20, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0xd9dee5, side: THREE.BackSide }),
  ));
  const panel = (w, h, color, strength, pos, rot) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    studio.add(m);
  };
  const horizon = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 12),
    new THREE.MeshBasicMaterial({ map: horizonTexture(), color: new THREE.Color(1.5, 1.5, 1.5), side: THREE.DoubleSide }),
  );
  horizon.position.set(0, 0.06, 9.9);   // puts the horizon line at about letter mid-height
  horizon.rotation.y = Math.PI;
  studio.add(horizon);
  panel(3, 9, 0x0b1020, 1, [-9.9, 0, 1], [0, Math.PI / 2, 0]);         // black flag, left
  panel(20, 12, 0x8e97a3, 1, [0, -5.9, 0], [-Math.PI / 2, 0, 0]);      // grey floor
  panel(14, 1.8, 0xffffff, 5, [0, 5.8, 2], [Math.PI / 2, 0, 0]);       // overhead strip
  panel(2.4, 7, 0xffffff, 3.5, [9.8, 1, 1], [0, -Math.PI / 2, 0]);     // right softbox
  return studio;
}

function makeStarTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,250,240,0.9)');
  g.addColorStop(0.35, 'rgba(210,235,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'lighter';
  for (const [w, h] of [[128, 5], [5, 128]]) {
    const lg = x.createLinearGradient(64 - w / 2, 64 - h / 2, 64 + w / 2, 64 + h / 2);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = lg;
    x.fillRect(64 - w / 2, 64 - h / 2, w, h);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function initHero(root, { reduceMotion = false, autoplay = true, onCleaned } = {}) {
  const canvas = root.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    root.classList.add('no-webgl');
    onCleaned?.();
    return null;
  }

  const lowPower = matchMedia('(pointer: coarse)').matches && (navigator.hardwareConcurrency || 4) <= 4;
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.25 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeStudio(), 0.02).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xfff1e2, 0.6);
  key.position.set(3, -2, 4);
  const rim = new THREE.DirectionalLight(0xbfe3ff, 1.2);
  rim.position.set(-4, 3, 2);
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(-1.1, 2.2, 8);
  sun.castShadow = true;
  scene.add(key, rim, sun, new THREE.HemisphereLight(0xffffff, 0x9aa3ad, 0.8));

  let font;
  try {
    font = await new FontLoader().loadAsync(`${import.meta.env.BASE_URL}fonts/cormorant-600.typeface.json`);
  } catch {
    root.classList.add('no-webgl');
    onCleaned?.();
    return null;
  }

  const geo = new TextGeometry(WORD, {
    font, size: 1, depth: 0.2,
    curveSegments: lowPower ? 6 : 10,
    bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.012,
    bevelSegments: lowPower ? 2 : 4,
  });
  geo.center();
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const W = bb.max.x - bb.min.x;
  const H = bb.max.y - bb.min.y;
  const frontZ = bb.max.z;
  const START = bb.min.x - 0.25;
  const END = bb.max.x + 0.25;

  const uniforms = {
    uClean: { value: START },
    uWet: { value: 0 },
    uGlint: { value: bb.min.x - 2 },
    uDirt: { value: 1 },
    uEdgeOn: { value: 1 },
  };
  // Clear coat only where the surface is clean, so grime stays matte and dull.
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.3, specularIntensity: 0.12, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.1 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;\nvObjNormal = normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GRIME_PARS}`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${GRIME_MAIN}`)
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\nmaterial.clearcoat *= ahClean;');
  };

  const word = new THREE.Mesh(geo, mat);
  word.castShadow = true;
  const wordGroup = new THREE.Group();
  wordGroup.add(word);
  scene.add(wordGroup);

  // The wall the sign stands off. Only the shadow is drawn; the page shows through.
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.ShadowMaterial({ color: 0x0b1020, opacity: 0.1 }));
  wall.position.z = bb.min.z - 0.32;
  wall.receiveShadow = true;
  scene.add(wall);
  const sc = sun.shadow.camera;
  sc.left = -W / 2 - 2; sc.right = W / 2 + 2; sc.top = H / 2 + 1.5; sc.bottom = -H / 2 - 1.5; sc.near = 1; sc.far = 20;
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 512 : 1024);
  sun.shadow.radius = 18;
  sun.shadow.blurSamples = 20;
  sun.shadow.bias = -0.0004;

  // Squeegee: rubber blade, steel channel, graphite handle with a glass-blue grip ring.
  const squeegee = new THREE.Group();
  const bladeLen = H * 1.45;
  const rubber = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.55, metalness: 0 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.28, metalness: 1 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.45, metalness: 0.2 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x6cc4e8, roughness: 0.35, metalness: 0.1 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, bladeLen, 0.05), rubber);
  const channel = new THREE.Mesh(new THREE.BoxGeometry(0.075, bladeLen * 1.02, 0.075), steel);
  channel.position.set(-0.05, 0, 0.01);
  const dir = new THREE.Vector3(-0.75, -0.1, 0.9).normalize();
  const handleLen = 1.1;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, handleLen, 24), graphite);
  handle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  handle.position.copy(channel.position).addScaledVector(dir, handleLen / 2 + 0.03);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.08, 24), accent);
  grip.quaternion.copy(handle.quaternion);
  grip.position.copy(channel.position).addScaledVector(dir, 0.18);
  squeegee.add(blade, channel, handle, grip);
  squeegee.traverse((o) => { o.castShadow = true; });
  squeegee.rotation.z = -0.08;
  squeegee.position.set(START - 1.5, 0, frontZ + 0.035);
  squeegee.visible = false;
  wordGroup.add(squeegee);

  // Cleaner mist: points flying in from a sprayer off to the right.
  const N = lowPower ? 220 : 480;
  const pos = new Float32Array(N * 3);
  const from = new Float32Array(N * 3);
  const to = new Float32Array(N * 3);
  const delay = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    from.set([bb.max.x + 1.1 + Math.random() * 0.2, 0.35 + Math.random() * 0.15, frontZ + 1.2], i * 3);
    to.set([bb.min.x + Math.random() * W, bb.min.y + Math.random() * H, frontZ + 0.01], i * 3);
    delay[i] = Math.random() * 0.45;
  }
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mistMat = new THREE.PointsMaterial({ color: 0xeaf6ff, size: 0.022, transparent: true, opacity: 0, depthWrite: false });
  const mist = new THREE.Points(mistGeo, mistMat);
  mist.frustumCulled = false;
  wordGroup.add(mist);
  const mistState = { t: 0 };
  function updateMist() {
    for (let i = 0; i < N; i++) {
      const k = gsap.utils.clamp(0, 1, (mistState.t - delay[i]) / 0.55);
      const e = 1 - Math.pow(1 - k, 2);
      for (let a = 0; a < 3; a++) pos[i * 3 + a] = from[i * 3 + a] + (to[i * 3 + a] - from[i * 3 + a]) * e;
      pos[i * 3 + 1] += Math.sin(k * Math.PI) * 0.25;
    }
    mistGeo.attributes.position.needsUpdate = true;
  }

  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeStarTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  star.position.set(bb.min.x + W * 0.93, bb.max.y * 0.72, frontZ + 0.08);
  star.scale.setScalar(0.001);
  wordGroup.add(star);

  function fit() {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const frac = w < 700 ? 0.86 : 0.62;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const dist = Math.max((W / 2 / frac) / Math.tan(hfov / 2), (H / 2 / 0.3) / Math.tan(vfov / 2));
    const visibleH = 2 * dist * Math.tan(vfov / 2);
    camera.position.set(0, -visibleH * (w < 700 ? 0.015 : 0.08), dist + frontZ);
    camera.updateProjectionMatrix();
  }
  fit();
  new ResizeObserver(fit).observe(root);

  // Pointer moves the chrome so reflections slide across it.
  const target = { x: 0, y: 0 };
  root.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  root.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });

  function tick() {
    // Only the visitor's pointer moves the sign; no endless idle motion.
    wordGroup.rotation.y += (target.x * 0.1 - wordGroup.rotation.y) * 0.06;
    wordGroup.rotation.x += (target.y * 0.06 - wordGroup.rotation.x) * 0.06;
    renderer.render(scene, camera);
  }

  let running = false;
  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    renderer.setAnimationLoop(on ? tick : null);
  };
  new IntersectionObserver(([e]) => setRunning(e.isIntersecting && !document.hidden)).observe(root);
  document.addEventListener('visibilitychange', () => setRunning(!document.hidden && root.getBoundingClientRect().bottom > 0));

  let tl;
  function play() {
    tl?.kill();
    uniforms.uDirt.value = 1;
    uniforms.uClean.value = START;
    uniforms.uWet.value = 0;
    uniforms.uEdgeOn.value = 1;
    uniforms.uGlint.value = bb.min.x - 2;
    mistState.t = 0;
    squeegee.position.x = START - 1.5;
    squeegee.visible = false;
    star.scale.setScalar(0.001);

    tl = gsap.timeline({ onComplete: () => onCleaned?.() });
    tl.to(canvas, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0)
      // 1. Hold on the dirt so it registers.
      .to({}, { duration: 1.5 })
      // 2. Mist of cleaner.
      .to(mistMat, { opacity: 0.75, duration: 0.15 }, 'spray')
      .to(mistState, { t: 1.0, duration: 1.0, ease: 'none', onUpdate: updateMist }, 'spray')
      .to(uniforms.uWet, { value: 1, duration: 0.9, ease: 'power1.in' }, 'spray+=0.2')
      .to(mistMat, { opacity: 0, duration: 0.3 }, 'spray+=0.8')
      // 3. Squeegee pass, blade edge drives the clean line.
      .set(squeegee, { visible: true }, 'spray+=0.7')
      .to(squeegee.position, { x: START, duration: 0.45, ease: 'power2.out' }, 'spray+=0.7')
      .to(uniforms.uClean, {
        value: END, duration: 1.5, ease: 'power2.inOut',
        onUpdate: () => { squeegee.position.x = uniforms.uClean.value; },
      }, '>')
      .to(squeegee.position, { x: END + 1.8, duration: 0.5, ease: 'power2.in', onComplete: () => { squeegee.visible = false; } }, '>')
      .to(uniforms.uEdgeOn, { value: 0, duration: 0.5 }, '<')
      // 4. Chrome comes up with one glint and a sparkle.
      .to(uniforms.uGlint, { value: bb.max.x + 2, duration: 1.1, ease: 'power2.inOut' }, '<+0.1')
      .to(star.scale, { x: 0.42, y: 0.42, duration: 0.25, ease: 'power2.out' }, '<+0.75')
      .to(star.material, { rotation: Math.PI / 4, duration: 0.7, ease: 'none' }, '<')
      .to(star.scale, { x: 0.001, y: 0.001, duration: 0.45, ease: 'power2.in' }, '<+0.25')
      .set(squeegee, { visible: false });
  }

  function showClean() {
    tl?.kill();
    uniforms.uDirt.value = 0;
    uniforms.uEdgeOn.value = 0;
    squeegee.visible = false;
    canvas.style.opacity = '1';
    onCleaned?.();
  }

  root.querySelector('.hero__replay')?.addEventListener('click', () => (reduceMotion ? showClean() : play()));

  // Compile before the first visible frame so the dirt shows instantly.
  renderer.compile(scene, camera);
  root.classList.add('is-3d');
  setRunning(true);
  if (reduceMotion) showClean();
  else if (autoplay) play();
  else {
    // Waiting behind the intro: show the grimy name, still, until play().
    canvas.style.opacity = '1';
  }
  return { play };
}
