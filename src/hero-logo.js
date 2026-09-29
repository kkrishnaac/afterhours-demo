// The hero logo builds itself once in 3D, then hands over to the crisp vector <img>.
// three.js lives in its own chunk and loads only when motion is welcome, WebGL works
// and the stage is on screen at load. Every other path shows the vector straight away,
// and a slow network never holds the logo back for more than a moment.
export function initHeroLogo({ reduceMotion }) {
  const stage = document.querySelector('.hero__stage');
  if (!stage) return;
  const box = stage.querySelector('.hero__logo');
  const showStatic = () => {
    stage.classList.remove('is-building');
    stage.classList.add('is-static');
  };
  if (reduceMotion || !webgl() || !onScreen(stage)) return showStatic();

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
