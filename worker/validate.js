// Server-side validation for a walkthrough request. The page checks the same
// things for convenience; this is the check that counts. Only known fields are
// read, every value is trimmed and length-limited, and choice fields must be
// one of the exact options the page offers.
import { SIZES, TIMINGS, CITY_NAMES, LIMITS } from '../src/form-options.js';

// Control characters (including CR/LF, which could split email headers) and
// Unicode line/paragraph separators are never allowed in any field.
const CONTROL = /[\u0000-\u001F\u007F\u2028\u2029]/;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
const PHONE_CHARS = /^[0-9+()\-.\s]+$/;

const text = (v) => (typeof v === 'string' ? v.trim() : '');

export function validateWalkthrough(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { form: 'invalid' } };
  }

  const size = text(input.size);
  const timing = text(input.timing);
  const city = text(input.city);
  // Control characters are checked on the raw text, before spaces are tidied,
  // so a pasted line break is refused rather than quietly turned into a space.
  const rawName = text(input.name);
  const rawPhone = text(input.phone);
  const name = rawName.replace(/\s+/g, ' ');
  const email = text(input.email);
  const phone = rawPhone.replace(/\s+/g, ' ');
  const marketing = input.marketing === true;

  if (!SIZES.includes(size)) errors.size = 'choose';
  if (!TIMINGS.includes(timing)) errors.timing = 'choose';
  if (!CITY_NAMES.includes(city)) errors.city = 'choose';

  if (!name || name.length > LIMITS.name || CONTROL.test(rawName) || !/\p{L}/u.test(name)) errors.name = 'invalid';

  if (!email || email.length > LIMITS.email || CONTROL.test(email) || !EMAIL.test(email)) errors.email = 'invalid';

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (phone.length > LIMITS.phone || CONTROL.test(rawPhone) || !PHONE_CHARS.test(phone) || digits.length < 7 || digits.length > 15) errors.phone = 'invalid';
  }

  if (input.marketing !== undefined && typeof input.marketing !== 'boolean') errors.marketing = 'invalid';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { size, timing, city, name, email, phone: phone || null, marketing } };
}
