import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import './style.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initStory } from './story.js';
import { initQuote } from './quote.js';
import { runLoader } from './loader.js';
import { initViewer } from './viewer.js';
import { initHero } from './hero.js';

gsap.registerPlugin(ScrollTrigger);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Phones and tablets keep native scrolling: it is smoother there than any JS scroller.
const touch = matchMedia('(hover: none), (pointer: coarse)').matches;

// Mobile address bars resize the viewport mid-scroll; re-measuring on each of
// those makes the page jump. Ignore them.
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis = null;
if (!reduceMotion && !touch) {
  lenis = new Lenis({ autoRaf: false, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
}

// In-page links: smooth, and in step with the scroll effects.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  if (a.getAttribute('href') === '#main') target.focus?.();
});

const hero = initHero(document.querySelector('.hero'), { reduceMotion });
initStory({ reduceMotion });
initQuote();
initViewer({ lenis, reduceMotion });

// The intro hands over to the page, and the clean starts as the page settles.
runLoader({ reduceMotion, lenis, onReveal: () => hero?.play(0.8) })
  .then((ran) => {
    ScrollTrigger.refresh();
    if (!ran) hero?.play(0.4);
  })
  .catch(() => {
    document.querySelector('.loader')?.remove();
    hero?.showClean();
  });

document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
