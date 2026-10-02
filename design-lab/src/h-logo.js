// The hero logo's one-time intro (Krishna, 2026-10-01): the H starts complete, a small star
// travels in from behind it along the ring's curve, the H opens in its wake and the star's
// trail becomes the ring; then the three sparkles twinkle into place where they sit and a shine
// passes over the H, like something just cleaned. About 1.6 s, once, on load. Uses Motion's
// vanilla animate() (window.Motion from /motion.js). Nothing else in the logo moves.
(() => {
  const logo = document.querySelector('.logo-cut');
  const M = window.Motion;
  if (!logo) return;
  if (!M || matchMedia('(prefers-reduced-motion: reduce)').matches) { logo.classList.add('is-live', 'is-done'); return; }
  logo.classList.add('is-live'); // takes over from the CSS failsafe

  const { animate } = M;
  const $ = (s) => logo.querySelector(s);
  const ring = $('.logo-cut__ring'); const solid = $('.logo-cut__solid'); const starBox = $('.logo-cut__star'); const star = starBox.querySelector('img');
  const pieceA = $('.logo-cut__a'); const pieceB = $('.logo-cut__b'); const shine = $('.logo-cut__shine');
  const sparks = [...logo.querySelectorAll('.logo-cut__spark')]; const glints = [...logo.querySelectorAll('.logo-cut__glint')];
  // Wrappers carry the position; Motion animates scale and rotate on the image inside, so the two never fight.

  // Logo units (the traced SVG's viewBox) to percentages of the box.
  const VB = [39.5, 163.5, 1174.5, 871.5];
  const px = (x) => ((x - VB[0]) / VB[2]) * 100;
  const py = (y) => ((y - VB[1]) / VB[3]) * 100;
  // The front of the ring, sampled from its path: x -> centre y, in logo units.
  const PATH = [[262, 566], [304, 562], [328, 584], [352, 588], [388, 588], [424, 582], [460, 574], [496, 564], [532, 552], [568, 539], [604, 524], [640, 508], [676, 490], [712, 471], [748, 451], [784, 428], [820, 404], [856, 375], [880, 352], [910, 318]];
  const yAt = (x) => {
    for (let i = 1; i < PATH.length; i++) {
      const [x0, y0] = PATH[i - 1]; const [x1, y1] = PATH[i];
      if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
    return PATH.at(-1)[1];
  };
  const X0 = 262; const X1 = 910; const H_LEFT = 400;

  const place = (el, x, y, extra = '') => {
    el.style.transform = `translate(${(px(x) / 100) * logo.clientWidth}px, ${(py(y) / 100) * logo.clientHeight}px) translate(-50%, -50%) ${extra}`;
  };

  let joltedA = false; let joltedB = false;
  const jolt = (el, dir) => animate(el, { rotate: [0, dir * 1.6, 0], y: [0, 5, 0] }, { duration: 0.5, ease: 'easeOut' });

  const travel = (p) => {
    const x = X0 + (X1 - X0) * p;
    place(starBox, x, yAt(x));
    star.style.transform = `rotate(${p * 160}deg)`;
    // The ring is the star's trail; the H is open everywhere the star has been.
    ring.style.clipPath = `inset(0 ${100 - px(x)}% 0 0)`;
    solid.style.clipPath = `inset(0 0 0 ${Math.max(px(x), px(H_LEFT) - 0.5)}%)`;
    if (!joltedA && x > 470) { joltedA = true; jolt(pieceA, -1); }
    if (!joltedB && x > 760) { joltedB = true; jolt(pieceB, 1); }
  };

  const run = async () => {
    place(starBox, X0, yAt(X0));
    await animate(star, { opacity: [0, 1], scale: [0.3, 1] }, { duration: 0.2, ease: 'easeOut' }).finished;
    await animate(0, 1, { duration: 0.75, ease: [0.55, 0, 0.25, 1], onUpdate: travel }).finished;

    // The star reaches the end of the ring and bursts into the sparkles.
    animate(star, { scale: [1, 1.9, 0], opacity: [1, 1, 0], rotate: [160, 250] }, { duration: 0.35, ease: 'easeOut' });
    sparks.forEach((s, i) => {
      animate(s, { opacity: [0, 1, 1], scale: [0, 1.25, 1], rotate: [-45, 8, 0] }, { duration: 0.55, delay: 0.06 + i * 0.09, ease: 'easeOut' });
      animate(s, { filter: ['drop-shadow(0 0 0 rgba(10,149,239,0))', 'drop-shadow(0 0 10px rgba(10,149,239,0.95))', 'drop-shadow(0 0 0 rgba(10,149,239,0))'] }, { duration: 0.7, delay: 0.06 + i * 0.09 });
    });
    // A shine passes over the H, and two tiny glints flash where it catches the light.
    animate(shine, { opacity: [0, 1, 1, 0], backgroundPosition: ['140% 0', '-40% 0'] }, { duration: 0.7, delay: 0.12, ease: 'easeInOut' });
    const spots = [[455, 300], [585, 538]];
    glints.forEach((g, i) => {
      place(g, spots[i][0], spots[i][1]);
      animate(g.querySelector('img'), { opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 90] }, { duration: 0.45, delay: 0.22 + i * 0.16, ease: 'easeOut' });
    });
    setTimeout(() => logo.classList.add('is-done'), 1000);
  };

  const start = () => setTimeout(run, 150);
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
})();
