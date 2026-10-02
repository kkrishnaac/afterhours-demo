// B: Editorial. The behaviours copied from collection.industries: first-load choreography
// (bars slide in, emblem settles, headline rises), Lenis smooth scrolling with their lerp,
// and the "Let's talk" business card that flies in and flips open in 3D. Scroll-driven
// zooms are pure CSS (view timelines) and need no script.
import Lenis from '/lenis.mjs';

const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// First load: the frame arrives, then the page is "ready" and the headline rises.
const ready = () => {
  html.classList.add('is-first-loaded');
  setTimeout(() => html.classList.add('is-ready'), reduce ? 0 : 150);
};
if (document.readyState === 'complete') ready(); else addEventListener('load', ready, { once: true });
setTimeout(ready, 1800);

// Smooth scroll, desktop pointers only, their settings (lerp 0.1, smooth wheel).
let lenis = null;
if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.2, easing: (x) => Math.min(1, 1.001 - Math.pow(2, -10 * x)) });
  }));
}

// Let's talk: the card modal.
const modal = document.getElementById('modal-contact');
const openers = document.querySelectorAll('[data-modal-contact-open]');
let closing = false; let lastFocus = null;
const open = () => {
  if (!modal.hidden) return;
  lastFocus = document.activeElement;
  modal.hidden = false;
  html.classList.remove('is-leaving');
  requestAnimationFrame(() => html.classList.add('has-modal-contact-open'));
  lenis && lenis.stop();
  document.body.style.overflow = 'hidden';
  modal.querySelector('.c-modal-contact_button').focus();
};
const close = () => {
  if (modal.hidden || closing) return;
  closing = true;
  html.classList.add('is-leaving');
  const finish = () => {
    html.classList.remove('has-modal-contact-open', 'is-leaving');
    modal.hidden = true; closing = false;
    lenis && lenis.start();
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  if (reduce) finish(); else setTimeout(finish, 1000);
};
openers.forEach((b) => b.addEventListener('click', open));
modal.querySelectorAll('[data-modal-contact-close]').forEach((b) => b.addEventListener('click', close));
addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
