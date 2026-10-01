// G: Studio. The small behaviours copied from coreastudios.com: the loader blur that clears
// once the page is in, the spectrum glare that sweeps on navigation, the dial menu that turns
// to the current section, the list / grid toggle, images that fade in, the live Toronto clock,
// and the phone menu overlay. No libraries; everything honours prefers-reduced-motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

  // Loader blur: fade over 2s after load (the CSS animation is the no-JS fallback).
  const loader = document.getElementById('loader-blur');
  const clearLoader = () => {
    if (!loader || loader.classList.contains('is-complete')) return;
    loader.style.animation = 'none';
    const anim = loader.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 10 : 2000, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' });
    anim.onfinish = () => loader.classList.add('is-complete');
  };
  if (document.readyState === 'complete') clearLoader(); else addEventListener('load', clearLoader, { once: true });
  setTimeout(clearLoader, 2500);

  // Glare: beam rotated to one of four diagonals, wipes across in 0.9s, fades at the end.
  const overlay = document.getElementById('glare-overlay');
  const beam = overlay && overlay.querySelector('.glare-beam');
  let glareRunning = null;
  const glare = () => {
    if (!beam || reduce) return;
    if (glareRunning) glareRunning.cancel();
    const dirs = [[-45, '-60vmax, 60vmax', '60vmax, -60vmax'], [-45, '60vmax, -60vmax', '-60vmax, 60vmax'], [45, '60vmax, 60vmax', '-60vmax, -60vmax'], [45, '-60vmax, -60vmax', '60vmax, 60vmax']];
    const [rot, from, to] = dirs[Math.floor(Math.random() * dirs.length)];
    overlay.classList.add('is-on');
    glareRunning = beam.animate([
      { transform: `translate(${from}) rotate(${rot}deg)`, opacity: 0 },
      { transform: `translate(${from}) rotate(${rot}deg)`, opacity: 0.94, offset: 0.09 },
      { opacity: 0.55, offset: 0.78 },
      { transform: `translate(${to}) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 900, easing: EASE, fill: 'forwards' });
    glareRunning.onfinish = () => { overlay.classList.remove('is-on'); glareRunning = null; };
  };
  document.querySelectorAll('[data-glare]').forEach((a) => a.addEventListener('click', () => glare()));

  // Dial menu: the item for the section in view sits at 0deg; neighbours dim by distance.
  const menu = document.querySelector('[data-dial]');
  if (menu) {
    const items = [...menu.children];
    const angles = [-44, -22, 0, 22, 44];
    const targets = items.map((li) => document.querySelector(li.querySelector('a').getAttribute('href')));
    const setActive = (i) => {
      menu.style.setProperty('--dial', `${-angles[i]}deg`);
      items.forEach((li, j) => {
        const d = Math.abs(i - j);
        li.classList.toggle('is-active', d === 0);
        li.classList.toggle('inactive-stage-one', d === 1);
        li.querySelector('a').toggleAttribute('aria-current', d === 0);
      });
    };
    const ratios = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
      let best = 0; let bi = 0;
      targets.forEach((t, i) => { const r = ratios.get(t) || 0; if (r > best) { best = r; bi = i; } });
      setActive(bi);
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75] });
    targets.forEach((t) => t && io.observe(t));
    setActive(0);
    // While the page moves, only the active item and the logo stay (their .scrolling state).
    let scrollTimer = 0;
    const dial = menu.closest('.main-menu');
    addEventListener('scroll', () => {
      if (!scrollTimer) dial.classList.add('scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { dial.classList.remove('scrolling'); scrollTimer = 0; }, 260);
    }, { passive: true });
  }

  // List / grid toggle.
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    const grid = b.dataset.view === 'grid';
    document.body.classList.toggle('is-grid', grid);
    document.querySelectorAll('[data-view]').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', String(on)); });
    if (grid) document.getElementById('services').scrollIntoView({ block: 'start' });
  }));

  // Images fade in once decoded.
  document.querySelectorAll('.project-thumbnail img').forEach((img) => {
    const on = () => img.classList.add('is-loaded');
    if (img.complete) on(); else { img.addEventListener('load', on, { once: true }); img.addEventListener('error', on, { once: true }); }
  });

  // Live Toronto time, every second.
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = () => {
    const parts = fmt.formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
    const time = `${get('hour')}:${get('minute')}:${get('second')}`;
    const ampm = (get('dayPeriod') || '').replace(/\./g, '').toUpperCase();
    document.querySelectorAll('[data-time]').forEach((el) => { el.textContent = time; });
    document.querySelectorAll('[data-ampm]').forEach((el) => { el.textContent = ampm; });
  };
  tick(); setInterval(tick, 1000);

  // Phone menu overlay.
  const trigger = document.querySelector('.menu-trigger');
  const nav = document.getElementById('nav-overlay');
  if (trigger && nav) {
    const open = (on) => { nav.hidden = !on; trigger.setAttribute('aria-expanded', String(on)); document.body.style.overflow = on ? 'hidden' : ''; if (on) nav.querySelector('.nav-overlay__close').focus(); else trigger.focus(); };
    trigger.addEventListener('click', () => open(true));
    nav.querySelector('.nav-overlay__close').addEventListener('click', () => open(false));
    nav.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => { open(false); glare(); }));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !nav.hidden) open(false); });
  }
})();
