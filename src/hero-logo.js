// The hero logo builds itself once in 3D, then hands over to the crisp vector <img>.
// three.js lives in its own chunk and loads only when motion is welcome, WebGL works
// and the stage is on screen. Every other path shows the vector straight away, and a
// slow network never holds the logo back for more than a moment.
//
// The decision waits for the page's load event. Two reasons: WebKit can run this module
// before the stylesheet has been applied, which puts the stage below the fold and used to
// send big iPhones and iPads to the static path at random; and the 165 KB chunk should not
// compete with the logo, the font and the stylesheet for bandwidth while the page paints
// (it sat in the LCP's dependency graph and cost Lighthouse mobile about ten points).
export function initHeroLogo({ reduceMotion }) {
  const stage = document.querySelector('.hero__stage');
  if (!stage) return;
  const box = stage.querySelector('.hero__logo');
  // `late`: the CSS failsafe has already lifted the cover (3.6 s), so the logo is on screen
  // and must not rise from nothing a second time.
  const showStatic = (late = false) => {
    stage.classList.remove('is-building');
    stage.classList.add('is-static');
    if (late) stage.classList.add('is-late');
  };
  if (reduceMotion) return showStatic();

  const decide = () => {
    // Loading took so long that the CSS failsafe is about to lift the cover: don't fight it.
    const now = performance.now();
    if (now > 2800 || !webgl() || !onScreen(stage)) return showStatic(now > 3600);

    stage.classList.add('is-building');
    let gaveUp = false;
    const timer = setTimeout(() => { gaveUp = true; showStatic(); }, 2500);
    import('./hero-build.js')
      .then(({ buildLogo }) => {
        if (gaveUp) return;
        clearTimeout(timer);
        buildLogo(stage, box, () => {
          stage.classList.remove('is-building');
          stage.classList.add('is-built');
        });
      })
      .catch(() => {
        clearTimeout(timer);
        if (!gaveUp) showStatic();
      });
  };
  // Two frames after load: the first frame's paint (the page's largest paint) is on screen
  // before the chunk is even requested, so the build never delays what the visitor sees first.
  const afterPaint = () => requestAnimationFrame(() => requestAnimationFrame(decide));
  if (document.readyState === 'complete') afterPaint();
  else addEventListener('load', afterPaint, { once: true });
}

function webgl() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function onScreen(el) {
  const r = el.getBoundingClientRect();
  return r.top < innerHeight && r.bottom > 0;
}
