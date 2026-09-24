// Opening sequence, after alexzarour.com: a white page with one small word in
// the middle that hard-cuts through the GTA, lands on the name, and the name
// travels down into the pill while the page slides up from below.
import gsap from 'gsap';

const WORDS = ['Overnight office cleaning', 'Toronto', 'Mississauga', 'Brampton', 'Vaughan',
  'Markham', 'Oakville', 'Pickering', 'Oshawa', 'Afterhours'];
const FIRST_MS = 650;
const CITY_MS = 170;
const LAST_MS = 600;
const SEEN_KEY = 'afterhours-intro-seen';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function seenThisSession() {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode: replay next time */ }
}

/**
 * Runs the intro and resolves once the page is revealed.
 * `ready` is a promise for the 3D hero; the intro waits for it (up to a cap)
 * so the name is already on screen when the page arrives.
 */
export async function runLoader({ reduceMotion, ready, lenis }) {
  const loader = document.querySelector('.loader');
  const word = loader?.querySelector('.loader__word');
  const clock = document.querySelector('.clock');
  const nav = document.querySelector('.nav');
  const main = document.querySelector('main');
  if (!loader) return;
  loader.style.animation = 'none'; // JS is running: cancel the no-JS safety fade

  if (reduceMotion || seenThisSession()) {
    loader.remove();
    return;
  }

  document.documentElement.classList.add('is-intro');
  lenis?.stop();
  window.scrollTo(0, 0);

  for (let i = 0; i < WORDS.length; i++) {
    word.textContent = WORDS[i];
    await wait(i === 0 ? FIRST_MS : i === WORDS.length - 1 ? LAST_MS : CITY_MS);
  }
  await Promise.race([ready, wait(2500)]);

  // The name becomes the pill, then travels to where the pill lives.
  const to = clock.getBoundingClientRect();
  const tl = gsap.timeline();
  tl.to(word, { color: '#F7F8FA', backgroundColor: '#0E1320', paddingLeft: 18, paddingRight: 18, paddingTop: 10, paddingBottom: 10, duration: 0.3, ease: 'power2.out' })
    .add(() => {
      const from = word.getBoundingClientRect();
      gsap.to(word, {
        x: to.left + to.width / 2 - (from.left + from.width / 2),
        y: to.top + to.height / 2 - (from.top + from.height / 2),
        duration: 0.9, ease: 'power3.inOut',
      });
    }, '+=0.15')
    .to(loader, { backgroundColor: 'rgba(247, 248, 250, 0)', duration: 0.5 }, '<+0.15')
    .fromTo(main, { y: () => innerHeight }, { y: 0, duration: 1.1, ease: 'power3.out' }, '<-0.2')
    .to(nav, { opacity: 1, duration: 0.5 }, '<+0.6')
    .to(word, { opacity: 0, duration: 0.25 }, '<+0.25')
    .to(clock, { opacity: 1, duration: 0.25 }, '<');
  await tl.then();

  gsap.set([main, nav, clock], { clearProps: 'transform,opacity' });
  loader.remove();
  document.documentElement.classList.remove('is-intro');
  lenis?.start();
  markSeen();
}
