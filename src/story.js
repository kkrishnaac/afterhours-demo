// Scroll story: one night, 18:00 to 07:00. Each effect exists to tell that
// story: sky + clock (time passing), the dusk photo dimming (the city leaving), photo wipes
// (a squeegee pass), checklist (the work), map (where we work).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildMap } from './map.js';

gsap.registerPlugin(ScrollTrigger);

// White gallery canvas throughout; only a faint tint of the hour passes over it.
const SKY = [
  { p: 0.0, top: '#F7F8FA', bottom: '#F4EEE8' },  // dusk warmth
  { p: 0.15, top: '#F6F7FA', bottom: '#F2F2F6' },
  { p: 0.35, top: '#F3F5F9', bottom: '#F1F3F8' }, // night, a touch cooler
  { p: 0.75, top: '#F3F5F9', bottom: '#EFF3F8' },
  { p: 0.9, top: '#F6F8FB', bottom: '#F5F7FA' },  // first light
  { p: 1.0, top: '#F9FAFB', bottom: '#F9FAFB' },  // morning
];

function skyAt(p) {
  let i = 0;
  while (i < SKY.length - 2 && p > SKY[i + 1].p) i++;
  const a = SKY[i], b = SKY[i + 1];
  const t = gsap.utils.clamp(0, 1, (p - a.p) / (b.p - a.p));
  return [gsap.utils.interpolate(a.top, b.top, t), gsap.utils.interpolate(a.bottom, b.bottom, t)];
}

function clockAt(p) {
  const minutes = 18 * 60 + Math.round((p * 13 * 60) / 5) * 5;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function initStory({ reduceMotion }) {
  const root = document.documentElement;
  const timeEl = document.querySelector('.clock__time');
  const labelEl = document.querySelector('.clock__label');

  // Section effects first: the pinned dusk section adds scroll length, and triggers
  // further down must be measured after it.
  initDusk(reduceMotion);
  initBands(reduceMotion);
  initShots(reduceMotion);
  initChecklist(reduceMotion);
  initAreas(reduceMotion);

  // Sky and clock follow total page progress.
  let lastTime = '';
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const [top, bottom] = skyAt(self.progress);
      root.style.setProperty('--sky-top', top);
      root.style.setProperty('--sky-bottom', bottom);
      const t = clockAt(self.progress);
      if (t !== lastTime) { timeEl.textContent = t; lastTime = t; }
    },
  });
  document.querySelectorAll('[data-chapter]').forEach((section) => {
    // A pinned section sits inside a pin-spacer that carries its real scroll length.
    const spacer = section.parentElement.classList.contains('pin-spacer') ? section.parentElement : section;
    ScrollTrigger.create({
      trigger: spacer,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) labelEl.textContent = section.dataset.chapter; },
    });
  });
}

// 18:30: pinned on the dusk office. As you scroll the room dims (the city
// goes home), then the turn line arrives.
function initDusk(reduceMotion) {
  const section = document.querySelector('.dusk');
  const night = section.querySelector('.dusk__night');
  const turn = section.querySelector('.dusk__turn');
  if (reduceMotion) {
    gsap.set(night, { opacity: 0.45 });
    return;
  }
  document.documentElement.classList.add('js-motion');
  gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: '+=110%', pin: true, scrub: 0.6 },
  })
    .to(night, { opacity: 0.62, duration: 0.7, ease: 'none' }, 0)
    .fromTo(turn, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.72)
    .to({}, { duration: 0.15 });
}

// Background photos drift a little slower than the page, for depth.
function initBands(reduceMotion) {
  if (reduceMotion) return;
  document.querySelectorAll('.band:not(.dusk) .band__bg').forEach((bg) => {
    gsap.fromTo(bg, { yPercent: -5 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

// Each photo is uncovered by a squeegee stroke: a cover panel shrinks away to the
// right with a bright blade line on its edge. The image itself is never clipped,
// so native lazy-loading still sees it and fetches it.
function initShots(reduceMotion) {
  if (reduceMotion) return;
  document.querySelectorAll('.shot__frame').forEach((frame) => {
    const wipe = frame.querySelector('.shot__wipe');
    gsap.set(frame, { '--cover': 1 });
    gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 82%', once: true } })
      .set(wipe, { opacity: 1, left: 0 })
      .to(frame, { '--cover': 0, duration: 1.3, ease: 'power3.inOut' }, 0)
      .to(wipe, { left: '100%', duration: 1.3, ease: 'power3.inOut' }, 0)
      .to(wipe, { opacity: 0, duration: 0.3 }, '-=0.2');
  });
}

function initChecklist(reduceMotion) {
  const list = document.querySelector('.checklist');
  const items = [...list.children];
  if (reduceMotion) {
    items.forEach((li) => li.classList.add('is-done'));
    list.style.setProperty('--fill', 1);
    return;
  }
  items.forEach((li) => {
    ScrollTrigger.create({ trigger: li, start: 'top 62%', toggleClass: { targets: li, className: 'is-done' } });
  });
  ScrollTrigger.create({
    trigger: list,
    start: 'top 62%',
    end: 'bottom 62%',
    scrub: true,
    onUpdate: (self) => list.style.setProperty('--fill', self.progress.toFixed(3)),
  });
}

function initAreas(reduceMotion) {
  const { cities, list } = buildMap(document.querySelector('.map'));
  const ul = document.querySelector('.areas__list');
  list.forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    ul.appendChild(li);
  });
  const light = (p) => cities.forEach((c, i) => c.classList.toggle('is-on', p >= (i + 1) / (cities.length + 1)));
  if (reduceMotion) {
    light(1);
    return;
  }
  ScrollTrigger.create({
    trigger: '.map',
    start: 'top 75%',
    end: 'bottom 45%',
    scrub: true,
    onUpdate: (self) => light(self.progress),
  });
}
