// Opening sequence, after alexzarour.com: a white page with one small word in
// the middle that hard-cuts through the GTA and lands on the name. The name
// becomes the cobalt pill and drops into place while the page slides up.
import gsap from 'gsap';

const WORDS = ['Overnight office cleaning', 'Toronto', 'Mississauga', 'Brampton', 'Vaughan',
  'Markham', 'Oakville', 'Pickering', 'Oshawa', 'Afterhours'];
const FIRST_MS = 480;
const CITY_MS = 115;
const LAST_MS = 380;
const SEEN_KEY = 'afterhours-intro-seen';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function seenThisSession() {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode: plays again next time */ }
}

/** Runs the intro. Resolves true if it played, false if it was skipped. */
export async function runLoader({ reduceMotion, lenis, onReveal }) {
  const loader = document.querySelector('.loader');
  const word = loader?.querySelector('.loader__word');
  const clock = document.querySelector('.clock');
  const nav = document.querySelector('.nav');
  const main = document.querySelector('main');
  if (!loader) return false;
  loader.style.animation = 'none'; // JS is running: cancel the no-JS safety fade

  if (reduceMotion || seenThisSession()) {
    loader.remove();
    return false;
  }

  document.documentElement.classList.add('is-intro');
  lenis?.stop();
  window.scrollTo(0, 0);

  for (let i = 0; i < WORDS.length; i++) {
    word.textContent = WORDS[i];
    await wait(i === 0 ? FIRST_MS : i === WORDS.length - 1 ? LAST_MS : CITY_MS);
  }

  const to = clock.getBoundingClientRect();
  const tl = gsap.timeline();
  tl.to(word, {
    color: cssVar('--accent-ink'), backgroundColor: cssVar('--accent'),
    paddingLeft: 18, paddingRight: 18, paddingTop: 10, paddingBottom: 10, duration: 0.25, ease: 'power2.out',
  })
    .add(() => {
      const from = word.getBoundingClientRect();
      gsap.to(word, {
        x: to.left + to.width / 2 - (from.left + from.width / 2),
        y: to.top + to.height / 2 - (from.top + from.height / 2),
        duration: 0.8, ease: 'power3.inOut',
      });
      onReveal?.();
    }, '+=0.1')
    .to(loader, { backgroundColor: 'rgba(248, 250, 252, 0)', duration: 0.45 }, '<+0.1')
    .fromTo(main, { y: () => innerHeight }, { y: 0, duration: 1.0, ease: 'power3.out' }, '<-0.15')
    .to(nav, { opacity: 1, duration: 0.4 }, '<+0.55')
    .to(word, { opacity: 0, duration: 0.2 }, '<+0.2')
    .to(clock, { opacity: 1, duration: 0.2 }, '<');
  await tl.then();

  gsap.set([main, nav, clock], { clearProps: 'transform,opacity' });
  loader.remove();
  document.documentElement.classList.remove('is-intro');
  lenis?.start();
  markSeen();
  return true;
}
