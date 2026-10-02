// The hero logo's one-time intro (Krishna, 2026-10-01, third version).
// It opens on a normal H. A small star appears at the ring's sharp tip beside the left
// upright and follows the ring's own path: down and round the left end, along the front
// through the middle of the H, up into the curl at the right. The ring is drawn behind it,
// and the H opens in its wake into the logo's own H. When it reaches the end of the ring the
// star bursts and the three sparkles twinkle into place. Nothing on the H moves or is laid over it.
// About 1.6 s, once, on load. Uses Motion's vanilla animate() (window.Motion from /motion.js).
(() => {
  const logo = document.querySelector('.logo-cut');
  const M = window.Motion;
  if (!logo) return;
  if (!M || matchMedia('(prefers-reduced-motion: reduce)').matches) { logo.classList.add('is-live', 'is-done'); return; }
  logo.classList.add('is-live'); // takes over from the CSS failsafe

  const { animate } = M;
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
    const start = track.getPointAtLength(0);
    // The star appears at the ring's sharp tip.
    await animate(0, 1, { duration: 0.15, ease: 'easeOut', onUpdate: (k) => setStar(start.x, start.y, 0, k, k) }).finished;
    await animate(0, 1, { duration: 0.85, ease: [0.42, 0, 0.3, 1], onUpdate: travel }).finished;
    solid.style.clipPath = 'inset(0 0 0 100%)';
    for (const el of pieces) el.style.clipPath = 'none';

    // At the end of the ring the star bursts, and the sparkles twinkle into place.
    const end = track.getPointAtLength(L);
    animate(0, 1, { duration: 0.3, ease: 'easeOut', onUpdate: (k) => setStar(end.x, end.y, 220 + k * 90, 1 + Math.sin(k * Math.PI) * 0.9 - k * 0.6, 1 - k) });
    sparks.forEach((s, i) => {
      animate(s, { opacity: [0, 1, 1], scale: [0, 1.25, 1], rotate: [-45, 8, 0] }, { duration: 0.5, delay: 0.04 + i * 0.07, ease: 'easeOut' });
      animate(s, { filter: ['drop-shadow(0 0 0 rgba(10,149,239,0))', 'drop-shadow(0 0 10px rgba(10,149,239,0.95))', 'drop-shadow(0 0 0 rgba(10,149,239,0))'] }, { duration: 0.65, delay: 0.04 + i * 0.07 });
    });
    setTimeout(() => logo.classList.add('is-done'), 900);
  };

  const begin = () => setTimeout(run, 150);
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin, { once: true });
})();
