// Hero: the Afterhours wordmark in flat, crisp 2D. It arrives caked in grime
// (a baked texture clipped to the letter outlines), a squeegee wipes it clean
// in one stroke, and one glint runs across the glossy black. Plays by itself;
// no tapping. The whole clean takes about 2.3 seconds.
import gsap from 'gsap';

export function initHero(root, { reduceMotion = false } = {}) {
  const svg = root.querySelector('.wordmark');
  if (!svg) return null;
  const wipe = svg.querySelector('.wm-wipe');
  const dirt = svg.querySelector('.wm-dirt');
  const edge = svg.querySelector('.wm-edge');
  const glint = svg.querySelector('.wm-glint');
  const squeegee = svg.querySelector('.wm-squeegee');
  const { x: vx, width: vw } = svg.viewBox.baseVal;
  const START = vx - 6;
  const END = vx + vw + 6;

  dirt.style.animation = 'none'; // JS is running: cancel the no-JS safety fade
  const blade = { x: START };
  const setBlade = () => {
    wipe.setAttribute('x', blade.x);
    edge.setAttribute('x', blade.x - 1.2);
    squeegee.setAttribute('transform', `translate(${blade.x} 0)`);
  };

  function showClean() {
    blade.x = END;
    setBlade();
    squeegee.setAttribute('opacity', '0');
    edge.setAttribute('opacity', '0');
  }

  let tl;
  function play(delay = 0) {
    if (reduceMotion) { showClean(); return; }
    tl?.kill();
    blade.x = START - 70;
    setBlade();
    const shine = { x: vx - 200 };
    tl = gsap.timeline({ delay })
      .set(squeegee, { attr: { opacity: 1 } })
      .to(blade, { x: START, duration: 0.25, ease: 'power2.out', onUpdate: setBlade })
      .set(edge, { attr: { opacity: 0.7 } })
      .to(blade, { x: END, duration: 1.0, ease: 'power2.inOut', onUpdate: setBlade })
      .to(blade, { x: END + 90, duration: 0.3, ease: 'power2.in', onUpdate: setBlade })
      .to(squeegee, { attr: { opacity: 0 }, duration: 0.2 }, '<+0.1')
      .set(edge, { attr: { opacity: 0 } }, '<')
      .to(shine, {
        x: vx + vw + 60, duration: 0.75, ease: 'power2.inOut',
        onUpdate: () => glint.setAttribute('x', shine.x),
      }, '<-0.15');
  }

  if (reduceMotion) showClean();
  else { blade.x = START; setBlade(); }
  return { play, showClean };
}
