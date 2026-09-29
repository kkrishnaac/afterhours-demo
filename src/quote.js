// Four-step walkthrough request.
// Live mode (VITE_WALKTHROUGH_API + VITE_TURNSTILE_SITE_KEY set, the Cloudflare
// build): the request is posted to the Worker, which checks it again, stores it
// and emails HARA. Demo mode (the GitHub Pages build): nothing leaves the browser.
// Tapping a chip moves on by itself; keyboard users use Next, which is never
// disabled: an empty step explains what it needs instead.
import { CITY_NAMES } from './form-options.js';
import { createTurnstile } from './turnstile.js';

const API = import.meta.env.VITE_WALKTHROUGH_API || '';
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const LIVE = Boolean(API && SITE_KEY);

// Same rules the server applies (worker/validate.js), checked early for convenience.
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const phoneOk = (v) => !v || (/^[0-9+()\-.\s]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15);

const SEND_ERRORS = {
  rate_limited: 'Too many requests from this connection. Please wait a minute and try again.',
  verification: 'We couldn’t confirm the request came from a person. Please try again.',
  invalid: 'Something in the form needs another look. Please check your answers.',
  default: 'We couldn’t send your request just now. Please try again, or call us.',
};

export function initQuote() {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const nowEl = form.querySelector('[data-step-now]');
  const back = form.querySelector('[data-back]');
  const next = form.querySelector('[data-next]');
  const submit = form.querySelector('[data-submit]');
  const done = form.querySelector('.quote__done');
  const progress = form.querySelector('.quote__progress');
  const actions = form.querySelector('.quote__actions');
  const city = form.querySelector('#city');
  const sendError = form.querySelector('#send-error');
  const sendErrorText = sendError.querySelector('[data-send-error-text]');
  const human = LIVE ? createTurnstile(form.querySelector('[data-turnstile]'), SITE_KEY) : null;
  if (LIVE) form.querySelector('.quote__demo')?.remove();

  for (const name of CITY_NAMES) city.add(new Option(name, name));

  let i = 0;
  const valueOf = (n) => (form.elements[n] instanceof RadioNodeList ? form.elements[n].value : form.elements[n]?.value?.trim());

  function show(n, focus = true) {
    i = n;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    nowEl.textContent = String(i + 1);
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    sendError.hidden = true;
    if (human && i === steps.length - 1) human.mount().catch(() => {});
    if (focus) steps[i].querySelector('input, select')?.focus({ preventScroll: true });
  }

  function setError(input, errId, bad) {
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    form.querySelector(`#${errId}`).hidden = !bad;
    return !bad;
  }

  function stepValid() {
    const choice = ['size', 'timing'][i];
    if (choice) {
      const ok = Boolean(valueOf(choice));
      form.querySelector(`#${choice}-error`).hidden = ok;
      if (!ok) steps[i].querySelector('input')?.focus();
      return ok;
    }
    if (i === 2) return setError(city, 'city-error', !city.value);
    if (i === 3) {
      const nameOk = setError(form.elements.name, 'name-error', !valueOf('name'));
      const emailOk = setError(form.elements.email, 'email-error', !EMAIL.test(valueOf('email') || ''));
      const phoneValid = setError(form.elements.phone, 'phone-error', !phoneOk(valueOf('phone')));
      const first = [[nameOk, 'name'], [emailOk, 'email'], [phoneValid, 'phone']].find(([ok]) => !ok);
      if (first) form.elements[first[1]].focus();
      return !first;
    }
    return true;
  }

  function finish() {
    steps.forEach((s) => s.classList.remove('is-active'));
    progress.hidden = true;
    actions.hidden = true;
    form.querySelector('[data-done-name]').textContent = valueOf('name').split(' ')[0];
    done.hidden = false;
    done.focus();
  }

  function showSendError(code) {
    sendErrorText.textContent = SEND_ERRORS[code] || SEND_ERRORS.default;
    sendError.hidden = false;
    sendError.focus();
  }

  function setSending(on) {
    submit.disabled = on;
    back.disabled = on;
    submit.querySelector('[data-label]').textContent = on ? 'Sending…' : 'Request walkthrough';
    form.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  async function send() {
    setSending(true);
    sendError.hidden = true;
    try {
      const turnstile = await human.token();
      if (!turnstile) { showSendError('verification'); return; }
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          size: valueOf('size'), timing: valueOf('timing'), city: valueOf('city'),
          name: valueOf('name'), email: valueOf('email'), phone: valueOf('phone'),
          marketing: form.elements.marketing.checked,
          company_site: form.elements.company_site.value,
          turnstile,
        }),
      });
      if (res.status === 201) { finish(); return; }
      const out = await res.json().catch(() => ({}));
      showSendError(out.error);
    } catch {
      showSendError('default');
    } finally {
      setSending(false);
      human.reset();
    }
  }

  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') form.querySelector(`#${e.target.name}-error`).hidden = true;
  });
  form.querySelectorAll('.chips label').forEach((label) => {
    label.addEventListener('pointerup', () => setTimeout(() => { if (i < 2) show(i + 1); }, 260));
  });
  next.addEventListener('click', () => { if (stepValid()) show(i + 1); });
  back.addEventListener('click', () => show(i - 1));
  city.addEventListener('change', () => { if (city.value) setError(city, 'city-error', false); });
  // A field's error clears as soon as the visitor starts fixing it.
  for (const n of ['name', 'email', 'phone']) {
    form.elements[n].addEventListener('input', () => {
      if (form.elements[n].getAttribute('aria-invalid') === 'true') setError(form.elements[n], `${n}-error`, false);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled || !stepValid()) return;
    if (LIVE) send();
    else finish();
  });

  show(0, false);
}
