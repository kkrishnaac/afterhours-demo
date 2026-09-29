import '@fontsource-variable/mona-sans/wdth.css';
import './style.css';

import Lenis from 'lenis';
import { initMotion } from './motion.js';
import { initQuote } from './quote.js';
import { initViewer } from './viewer.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Phones and tablets keep native scrolling: it is smoother there than any JS scroller.
const touch = matchMedia('(hover: none), (pointer: coarse)').matches;

// Desktop wheel scrolling glides to a stop instead of stepping. A slightly
// lower lerp than the default (0.1) gives a calmer, heavier settle.
const lenis = !reduceMotion && !touch ? new Lenis({ autoRaf: true, lerp: 0.085 }) : null;

// In-page links: one smooth glide that stops just below the floating nav.
// Both Lenis and scrollIntoView honour the CSS scroll-padding-top, so no offset here.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id === '#top' ? document.body : document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { duration: 1.4 });
  else if (id === '#top') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  if (id === '#main') target.focus?.({ preventScroll: true });
});

// Service lists: closed on phones so the page stays short, always open side by
// side on wider screens (and re-opened if a narrow window is widened).
const wide = matchMedia('(min-width: 821px)');
const lists = document.querySelectorAll('.svc-list');
const syncLists = () => lists.forEach((d) => { d.open = wide.matches; });
syncLists();
wide.addEventListener('change', syncLists);
lists.forEach((d) => d.querySelector('summary').addEventListener('click', (e) => {
  if (wide.matches) e.preventDefault();
}));

initMotion({ reduceMotion });
initQuote();
initViewer({ lenis, reduceMotion });
