// Scroll story: one night, 18:00 to 07:00. Each effect exists to tell that
// story: sky + clock (time passing), tower (the city leaving), photo wipes
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

  // Section effects first: the pinned tower adds scroll length, and triggers
  // further down must be measured after it.
  initTower(reduceMotion);
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
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) labelEl.textContent = section.dataset.chapter; },
    });
  });
}

function initTower(reduceMotion) {
  const grid = document.querySelector('.tower__grid');
  const turn = document.querySelector('.dusk__turn');
  const COLS = 7, ROWS = 13;
  const crew = new Set([24, 52, 80]); // three floors where our crew is working
  const windows = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const w = document.createElement('span');
    if (crew.has(i)) w.classList.add('is-crew');
    grid.appendChild(w);
    windows.push({ el: w, off: crew.has(i) ? 0.62 + Math.random() * 0.12 : Math.random() * 0.6, crew: crew.has(i) });
  }

  const render = (p) => {
    for (const w of windows) {
      if (w.crew) {
        w.el.classList.toggle('is-off', p > w.off && p < w.off + 0.08);
        w.el.classList.toggle('is-crewlit', p >= w.off + 0.08);
      } else {
        w.el.classList.toggle('is-off', p > w.off);
      }
    }
  };

  if (reduceMotion) {
    render(1);
    return;
  }
  document.documentElement.classList.add('js-motion');
  const section = document.querySelector('.dusk');
  gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=120%',
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => render(self.progress),
    },
  }).to(turn, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.8)
    .fromTo(turn, { y: 16 }, { y: 0, duration: 0.2 }, 0.8)
    .to({}, { duration: 0.2 });
}

function initShots(reduceMotion) {
  if (reduceMotion) return;
  document.querySelectorAll('.shot__frame').forEach((frame) => {
    const wipe = frame.querySelector('.shot__wipe');
    const media = frame.querySelector('picture');
    gsap.set(media, { clipPath: 'inset(0 100% 0 0)' });
    gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 82%', once: true } })
      .set(wipe, { opacity: 1, left: 0 })
      .to(media, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power3.inOut' }, 0)
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
