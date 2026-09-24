// Photo viewer, after alexzarour.com: the photo whole and centred, title at the
// top, a counter, a strip of grey thumbnails, and the pill turned into Close.
import { PHOTOS, imgNo, srcset, smallest } from './photos.js';

export function initViewer({ lenis, reduceMotion }) {
  const root = document.querySelector('.viewer');
  if (!root) return;
  const stage = root.querySelector('.viewer__stage');
  const titleEl = root.querySelector('[data-v-title]');
  const subEl = root.querySelector('[data-v-sub]');
  const countEl = root.querySelector('[data-v-count]');
  const thumbs = root.querySelector('.viewer__thumbs');
  const closeBtn = root.querySelector('.viewer__close');
  let index = 0;
  let lastFocus = null;

  const thumbButtons = PHOTOS.map((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'viewer__thumb';
    b.setAttribute('aria-label', `${imgNo(i)}, ${photo.title}, ${photo.time}`);
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.dataset.src = smallest(photo); // fetched on first open, not on page load
    b.appendChild(img);
    b.addEventListener('click', () => show(i));
    thumbs.appendChild(b);
    return b;
  });

  function picture(photo) {
    const pic = document.createElement('picture');
    for (const ext of ['avif', 'webp']) {
      const s = document.createElement('source');
      s.type = `image/${ext}`;
      s.sizes = '(min-width: 900px) 64vw, 92vw';
      s.srcset = srcset(photo, ext);
      pic.appendChild(s);
    }
    const img = document.createElement('img');
    img.src = smallest(photo);
    img.alt = photo.alt;
    img.decoding = 'async';
    pic.appendChild(img);
    return pic;
  }

  function show(i) {
    index = (i + PHOTOS.length) % PHOTOS.length;
    const photo = PHOTOS[index];
    const pic = picture(photo);
    if (!reduceMotion) pic.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    stage.replaceChildren(pic);
    titleEl.textContent = photo.title;
    subEl.textContent = `${imgNo(index)} / ${photo.time}`;
    countEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(PHOTOS.length).padStart(2, '0')}`;
    thumbButtons.forEach((b, k) => b.toggleAttribute('aria-current', k === index));
    thumbButtons[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function open(i) {
    thumbs.querySelectorAll('img[data-src]').forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add('is-viewing');
    lenis?.stop();
    show(i);
    closeBtn.focus();
  }

  function close() {
    root.hidden = true;
    document.documentElement.classList.remove('is-viewing');
    lenis?.start();
    lastFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-photo]');
    if (!trigger) return;
    const i = PHOTOS.findIndex((p) => p.id === trigger.dataset.photo);
    if (i >= 0) open(i);
  });
  closeBtn.addEventListener('click', close);

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      const f = [...root.querySelectorAll('button')].filter((b) => b.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe between photos on touch screens.
  let startX = null;
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
  });
}
