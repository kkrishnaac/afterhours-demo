// The menu tab (Krishna, 2026-10-01 late). Below 1200px there is no header. Past the hero, while
// scrolling down, a gradient bar slides down at the top with one menu tab (styles in h.css); it
// slides away on scrolling up and on the hero. The tab opens the section links under it. It is a
// disclosure: the tab keeps focus and Tab moves on into the links. The veil, a link, Escape, or
// focus leaving the menu closes it. Keyboard focus on the tab shows the bar even on the hero.
// Reduced motion is handled by base.css (no transitions).
(() => {
  const root = document.querySelector('[data-tabnav]');
  if (!root) return;
  const tab = root.querySelector('.tabnav__tab');
  const label = root.querySelector('.tabnav__label');
  const menu = root.querySelector('.tabnav__menu');
  const veil = root.querySelector('.tabnav__veil');
  const hero = document.querySelector('.project--hero');
  const isOpen = () => root.classList.contains('is-open');
  let pastHero = !hero || !('IntersectionObserver' in window);
  let goingDown = false;
  let timer = 0;

  // Krishna: the bar comes in only while scrolling down past the hero, and goes when scrolling up.
  const show = () => root.classList.toggle('is-shown', (pastHero && goingDown) || isOpen() || root.contains(document.activeElement));

  // Krishna: the bar takes the page's colour wherever it is, and "Menu" the opposite. The bar's
  // background is the page's colour run (--run in h.css), sized and placed to line up with the
  // photo section behind it; past that section it shows the deep navy the rest of the page is on.
  // The text turns white where white reads better than deep navy against the colour at the bar.
  const bar = root.querySelector('.tabnav__bar');
  const wrap = document.querySelector('.reel-wrap');
  const card = wrap && wrap.querySelector('.project:not(.project--hero)');
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [BG, PALE, SKY, NAVY, DEEP] = ['#FAFBFD', '#BFE3FF', '#0A95EF', '#0B3A80', '#03275A'].map(hex);
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  let runTop = 0; let runH = 0; let cardH = 0;
  // The run's stops, in step with --run in h.css (offsets from the section's top, in px).
  const colourAt = (at) => {
    const stops = [[0, BG], [runH - 3 * cardH, BG], [runH - 2.3 * cardH, PALE], [runH - 1.5 * cardH, SKY], [runH - 0.5 * cardH, NAVY], [runH, DEEP]];
    if (at <= 0) return BG;
    for (let i = 1; i < stops.length; i++) {
      const [p1, c1] = stops[i];
      if (at <= p1) { const [p0, c0] = stops[i - 1]; const k = p1 > p0 ? (at - p0) / (p1 - p0) : 1; return c0.map((v, j) => v + (c1[j] - v) * k); }
    }
    return DEEP;
  };
  const paint = () => {
    if (!wrap) return;
    const y = scrollY - runTop;
    bar.style.setProperty('--run-y', `${-y}px`);
    // The bar's own background colour is the page colour at its top edge. iPhone Safari tints the
    // status bar from a fixed top bar's background colour (not its gradient), so this keeps the
    // strip behind the clock the same colour as the page (Krishna saw navy there over white).
    bar.style.backgroundColor = `rgb(${colourAt(y).map(Math.round).join(' ')})`;
    const L = lum(colourAt(y + bar.offsetHeight / 2));
    root.classList.toggle('is-dark', contrast(L, 1) > contrast(L, lum(DEEP))); // the text is deep navy or white
  };
  const measure = () => {
    if (!wrap) return;
    runTop = wrap.getBoundingClientRect().top + scrollY; runH = wrap.offsetHeight;
    cardH = card ? card.offsetHeight + 12 : 0; // a card and the 0.75rem gap, as --card-h
    bar.style.setProperty('--run-h', `${runH}px`);
    paint();
  };
  if (wrap && 'ResizeObserver' in window) new ResizeObserver(measure).observe(wrap);
  addEventListener('load', measure);
  measure();

  // Scroll direction, once a frame, ignoring tiny moves and the iPhone's bounce past either end.
  let lastY = scrollY; let queued = false;
  addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      paint();
      const y = Math.max(0, Math.min(scrollY, document.documentElement.scrollHeight - innerHeight));
      if (Math.abs(y - lastY) < 6) return;
      goingDown = y > lastY; lastY = y; show();
    });
  }, { passive: true });

  // The bar shows once the hero's bottom edge has gone under where the bar sits.
  if (!pastHero) {
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; show(); },
      { rootMargin: '-64px 0px 0px 0px' }).observe(hero);
  }

  const set = (open, focusTab = false) => {
    if (open === isOpen()) return;
    clearTimeout(timer);
    tab.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close' : 'Menu';
    document.documentElement.classList.toggle('tabnav-lock', open);
    if (open) {
      menu.hidden = false; veil.hidden = false;
      void menu.offsetWidth; // lay out the closed state first, so the options drop in
      root.classList.add('is-open');
    } else {
      root.classList.remove('is-open');
      timer = setTimeout(() => { menu.hidden = true; veil.hidden = true; }, 260);
      if (focusTab) tab.focus();
    }
    show();
  };

  tab.addEventListener('click', () => set(!isOpen()));
  veil.addEventListener('click', () => set(false));
  // A link closes the menu before the browser follows it, so the page can scroll again.
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) set(false, true); });
  root.addEventListener('focusin', show);
  root.addEventListener('focusout', (e) => {
    if (isOpen() && e.relatedTarget && !root.contains(e.relatedTarget)) set(false);
    requestAnimationFrame(show);
  });
  // Widening the window past the phone layout hides the tab, so shut the menu with it.
  matchMedia('(min-width: 1200px)').addEventListener('change', (m) => { if (m.matches) set(false); });
})();
