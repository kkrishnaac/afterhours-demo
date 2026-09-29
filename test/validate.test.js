import { describe, it, expect } from 'vitest';
import { validateWalkthrough } from '../worker/validate.js';
import { SIZES, TIMINGS, CITY_NAMES } from '../src/form-options.js';
import page from '../index.html?raw';

const valid = {
  size: '2,000 to 5,000 sq ft', timing: 'Evenings', city: 'Toronto',
  name: 'Priya Raman', email: 'priya@northwind.ca', phone: '416 555 0123', marketing: false,
};

describe('validateWalkthrough', () => {
  it('accepts a complete request and trims it', () => {
    const r = validateWalkthrough({ ...valid, name: '  Priya   Raman ', email: ' priya@northwind.ca ' });
    expect(r.ok).toBe(true);
    expect(r.data).toEqual({ ...valid, name: 'Priya Raman' });
  });

  it('treats phone as optional and marketing as off unless it is exactly true', () => {
    const r = validateWalkthrough({ ...valid, phone: '', marketing: undefined });
    expect(r.ok).toBe(true);
    expect(r.data.phone).toBeNull();
    expect(r.data.marketing).toBe(false);
  });

  it('only accepts the exact choices the page offers', () => {
    const r = validateWalkthrough({ ...valid, size: 'Huge', timing: 'Sometimes', city: 'Ottawa' });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['city', 'size', 'timing']);
  });

  it.each([
    ['empty', ''],
    ['too long', 'A'.repeat(101)],
    ['no letters', '12345'],
    ['a line break (email header injection)', 'Priya\r\nBcc: victim@example.com'],
    ['a control character', 'Pri\u0007ya'],
  ])('rejects a name that is %s', (_, name) => {
    expect(validateWalkthrough({ ...valid, name }).errors).toHaveProperty('name');
  });

  it.each(['', 'priya', 'priya@', 'priya@northwind', 'pri ya@northwind.ca', `${'a'.repeat(250)}@x.ca`, 'priya@northwind.ca\nbcc'])(
    'rejects the email %j', (email) => {
      expect(validateWalkthrough({ ...valid, email }).errors).toHaveProperty('email');
    },
  );

  it.each(['12', 'call me maybe', '+1 416 555 0123 ext 99999999999', '4165550123<script>'])('rejects the phone %j', (phone) => {
    expect(validateWalkthrough({ ...valid, phone }).errors).toHaveProperty('phone');
  });

  it('rejects a marketing value that is not a boolean', () => {
    expect(validateWalkthrough({ ...valid, marketing: 'yes' }).errors).toHaveProperty('marketing');
  });

  it.each([null, [], 'text', 42])('rejects a body that is not an object: %j', (body) => {
    expect(validateWalkthrough(body).ok).toBe(false);
  });
});

describe('the page and the server agree on the choices', () => {
  const values = (name) => [...page.matchAll(new RegExp(`name="${name}" value="([^"]+)"`, 'g'))].map((m) => m[1]);

  it('office sizes', () => expect(values('size')).toEqual(SIZES));
  it('timings', () => expect(values('timing')).toEqual(TIMINGS));
  it('cities are the 16 served', () => expect(CITY_NAMES).toHaveLength(16));
});
