// Scroll story, one night from 18:00 to 07:00. Kept deliberately light so it
// scrolls natively and smoothly on phones: nothing is pinned, nothing parallaxes.
// Each effect says something: the clock (time passing), photo wipes (a
// squeegee pass), the checklist (the work), the map (where we work).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildMap } from './map.js';

gsap.registerPlugin(ScrollTrigger);

function clockAt(p) {
  const minutes = 18 * 60 + Math.round((p * 13 * 60) / 5) * 5;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function initStory({ reduceMotion }) {
  initNav();
  initTurn(reduceMotion);
  initShots(reduceMotion);
  initChecklist(reduceMotion);
  initAreas(reduceMotion);
  initClock();
}

// The bar stays out of sight while the hero's wordmark is visible, and slides
// in once the name has scrolled up out of view.
function initNav() {
  const nav = document.querySelector('.nav');
  // Sync on every toggle AND every re-measure, so a jump or refresh can't leave it stale.
  const sync = (self) => nav.classList.toggle('is-over-hero', self.isActive);
  ScrollTrigger.create({ trigger: '.hero__name', start: 'top bottom', end: 'bottom 40px', onToggle: sync, onRefresh: sync });
}

function initTurn(reduceMotion) {
  const turn = document.querySelector('.dusk__turn');
  if (reduceMotion || !turn) return;
  gsap.fromTo(turn, { opacity: 0, y: 14 }, {
    opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
    scrollTrigger: { trigger: turn, start: 'top 80%', once: true },
  });
}

// Each photo is uncovered by a squeegee stroke: a cover shrinks away to the right
// with a dark blade line on its edge. The image itself is never clipped, so
// native lazy-loading still sees it.
function initShots(reduceMotion) {
  if (reduceMotion) return;
  document.querySelectorAll('.shot__frame').forEach((frame) => {
    const wipe = frame.querySelector('.shot__wipe');
    gsap.set(frame, { '--cover': 1 });
    gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 85%', once: true } })
      .set(wipe, { opacity: 1, left: 0 })
      .to(frame, { '--cover': 0, duration: 1.1, ease: 'power3.inOut' }, 0)
      .to(wipe, { left: '100%', duration: 1.1, ease: 'power3.inOut' }, 0)
      .to(wipe, { opacity: 0, duration: 0.25 }, '-=0.2');
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
    ScrollTrigger.create({ trigger: li, start: 'top 70%', toggleClass: { targets: li, className: 'is-done' } });
  });
  ScrollTrigger.create({
    trigger: list, start: 'top 70%', end: 'bottom 70%', scrub: true,
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
  if (reduceMotion) { light(1); return; }
  ScrollTrigger.create({ trigger: '.map', start: 'top 80%', end: 'bottom 55%', scrub: true, onUpdate: (self) => light(self.progress) });
}

// The pill keeps the hour of the night and names the chapter you are in.
function initClock() {
  const timeEl = document.querySelector('.clock__time');
  const labelEl = document.querySelector('.clock__label');
  let last = '';
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const t = clockAt(self.progress);
      if (t !== last) { timeEl.textContent = t; last = t; }
    },
  });
  document.querySelectorAll('[data-chapter]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) labelEl.textContent = section.dataset.chapter; },
    });
  });
}
