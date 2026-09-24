// Four-step quote request. Demo only: nothing leaves the browser.
// Tapping a chip moves on by itself; keyboard users use Next.
import { CITY_NAMES } from './map.js';

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
    updateNext();
    if (focus) steps[i].querySelector('input, select')?.focus({ preventScroll: true });
  }

  function updateNext() {
    const need = ['size', 'frequency'][i];
    next.disabled = need ? !valueOf(need) : false;
  }

  function setError(input, errId, bad) {
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    form.querySelector(`#${errId}`).hidden = !bad;
    return !bad;
  }

  function stepValid() {
    if (i === 2) return setError(city, 'city-error', !city.value);
    if (i === 3) {
      const nameOk = setError(form.elements.name, 'name-error', !valueOf('name'));
      const emailOk = setError(form.elements.email, 'email-error', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valueOf('email') || ''));
      if (!nameOk) form.elements.name.focus();
      else if (!emailOk) form.elements.email.focus();
      return nameOk && emailOk;
    }
    return true;
  }

  form.addEventListener('change', updateNext);
  form.querySelectorAll('.chips label').forEach((label) => {
    label.addEventListener('pointerup', () => setTimeout(() => { if (i < 2) show(i + 1); }, 260));
  });
  next.addEventListener('click', () => { if (stepValid()) show(i + 1); });
  back.addEventListener('click', () => show(i - 1));
  city.addEventListener('change', () => { if (city.value) setError(city, 'city-error', false); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!stepValid()) return;
    steps.forEach((s) => s.classList.remove('is-active'));
    progress.hidden = true;
    actions.hidden = true;
    form.querySelector('[data-done-name]').textContent = valueOf('name').split(' ')[0];
    done.hidden = false;
    done.focus();
  });

  show(0, false);
}
