// Quiet, professional motion. Everything here is a one-time "settle into place"
// as it scrolls into view: cards rise in sequence, the week grid fills in a
// diagonal wave (any day, any time), and the GTA map lights up from Toronto outward.
// IntersectionObserver only: no scroll listeners, nothing pinned, nothing scrubbed.
import { buildMap } from './map.js';

function onceInView(targets, fn, options = {}) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      fn(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15, ...options });
  targets.forEach((t) => io.observe(t));
}

export function initMotion({ reduceMotion }) {
  const { cities } = buildMap(document.querySelector('.map'));
  cities.forEach((c, i) => c.style.setProperty('--i', i));

  const reveals = [...document.querySelectorAll('[data-reveal]')];
  const week = document.querySelector('.week');
  const map = document.querySelector('.map');
  week?.querySelectorAll('.week__cell').forEach((cell, n) => cell.style.setProperty('--i', (n % 7) + Math.floor(n / 7)));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    week?.classList.add('is-on');
    map?.classList.add('is-on');
    return;
  }

  // Hide only once we know we can show again.
  document.documentElement.classList.add('can-reveal');
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.setProperty('--i', Math.max(0, siblings.indexOf(el)));
  });
  onceInView(reveals, (el) => el.classList.add('is-in'));
  if (week) onceInView([week], (el) => el.classList.add('is-on'), { threshold: 0.4 });
  if (map) onceInView([map], (el) => el.classList.add('is-on'), { threshold: 0.3 });
}
