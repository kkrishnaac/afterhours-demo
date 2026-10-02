// The hero logo's one-time intro (Krishna, 2026-10-01, third version).
// It opens on a normal H. A small star appears at the ring's sharp tip beside the left
// upright and follows the ring's own path: down and round the left end, along the front
// through the middle of the H, up into the curl at the right. The ring is drawn behind it,
// and the H opens in its wake into the logo's own H. When it reaches the end of the ring the
// star winks out and the three sparkles twinkle on in place. Nothing on the H moves or is laid over it.
// About 1.7 s from the load event, once. Uses Motion's vanilla animate().
// html.intro-in marks the start, so the wide-screen dial menu fades in alongside it (h.css).
import { animate } from 'motion';

(() => {
  const html = document.documentElement;
  html.classList.add('intro-js'); // the dial waits for intro-in rather than its CSS failsafe
  const logo = document.querySelector('.logo-cut');
  if (!logo) { html.classList.add('intro-in'); return; }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { logo.classList.add('is-live', 'is-done'); html.classList.add('intro-in'); return; }
  logo.classList.add('is-live'); // takes over from the CSS failsafe

  const $ = (s) => logo.querySelector(s);
  const solid = $('.logo-cut__solid'); const draw = $('.logo-cut__draw'); const track = $('.logo-cut__track');
  const star = $('.logo-cut__star');
  const pieces = [...logo.querySelectorAll('.logo-cut__piece')];
  const sparks = [...logo.querySelectorAll('.logo-cut__spark')];

  // Logo units (the traced SVG's viewBox) to percentages of the box.
  const VB = [39.5, 163.5, 1174.5, 871.5];
  const pctX = (x) => ((x - VB[0]) / VB[2]) * 100;
  const L = track.getTotalLength();

  const setStar = (x, y, spin, scale, opacity = 1) => {
    star.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${spin.toFixed(1)}) scale(${scale.toFixed(3)})`);
    star.style.opacity = opacity;
  };

  let onFront = false; let cutTo = 0;

  const travel = (p) => {
    const pt = track.getPointAtLength(L * p);
    setStar(pt.x, pt.y, p * 220, 1);
    draw.style.strokeDashoffset = String(1 - p); // the ring is the star's trail
    if (!onFront && pt.y > 575) onFront = true; // past the turn at the left end
    if (onFront && pt.x > 400) {
      cutTo = Math.max(cutTo, pt.x);
      const at = pctX(cutTo).toFixed(2);
      solid.style.clipPath = `inset(0 0 0 ${at}%)`; // the H opens where the star has been
      for (const el of pieces) el.style.clipPath = `inset(0 ${(100 - at).toFixed(2)}% 0 0)`;
    }
  };

  const run = async () => {
    html.classList.add('intro-in');
    const start = track.getPointAtLength(0);
    // The star appears at the ring's sharp tip.
    await animate(0, 1, { duration: 0.15, ease: 'easeOut', onUpdate: (k) => setStar(start.x, start.y, 0, k, k) }).finished;
    await animate(0, 1, { duration: 0.85, ease: [0.42, 0, 0.3, 1], onUpdate: travel }).finished;
    solid.style.clipPath = 'inset(0 0 0 100%)';
    for (const el of pieces) el.style.clipPath = 'none';

    // At the end of the ring the star winks out where it stands (it no longer swells over the
    // H's corner), and the sparkles twinkle on in their own places (Krishna, 2026-10-01: not out
    // of the H). Nearest the star first: the big one, the low one, then the far one. Each opens
    // from its own centre with a small turn, catches the light, and settles; nothing travels.
    const end = track.getPointAtLength(L);
    animate(0, 1, { duration: 0.24, ease: 'easeIn', onUpdate: (k) => setStar(end.x, end.y, 220 + k * 60, 1 - k * 0.7, 1 - k) });
    const glint = (blur, a, b) => `brightness(${b}) drop-shadow(0 0 ${blur}px rgba(155,220,255,${a}))`;
    [0, 2, 1].forEach((n, i) => {
      const s = sparks[n]; const delay = 0.05 + i * 0.09;
      animate(s, { opacity: [0, 1, 1, 1], scale: [0, 1.18, 0.96, 1], rotate: [-30, 0, 0, 0] },
        { duration: 0.55, delay, times: [0, 0.45, 0.75, 1], ease: ['easeOut', 'easeInOut', 'easeOut'] });
      animate(s, { filter: [glint(0, 0, 1), glint(9, 0.95, 1.35), glint(0, 0, 1)] }, { duration: 0.6, delay, times: [0, 0.35, 1] });
    });
    setTimeout(() => logo.classList.add('is-done'), 900);
  };

  const begin = () => setTimeout(run, 150);
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin, { once: true });
})();
