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

gsap.registerPlugin(ScrollTrigger);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: false, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
}

// In-page links go through Lenis so pinned sections stay in sync.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  else target.scrollIntoView();
  if (a.getAttribute('href') === '#main') target.focus?.();
});

initStory({ reduceMotion });
initQuote();
initViewer({ lenis, reduceMotion });

// three.js loads after first paint. It builds behind the intro, and the clean
// only starts once the page has arrived, so nobody misses the dirty name.
const hero = document.querySelector('.hero');
const heroReady = import('./hero.js')
  .then(({ initHero }) => initHero(hero, { reduceMotion, autoplay: false }))
  .catch(() => { hero.classList.add('no-webgl'); return null; });

runLoader({ reduceMotion, ready: heroReady, lenis })
  .catch(() => document.querySelector('.loader')?.remove())
  .then(() => {
    ScrollTrigger.refresh();
    return heroReady;
  })
  .then((h) => { if (!reduceMotion) h?.play(); });

// Pinned sections change page height once fonts and images settle.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
