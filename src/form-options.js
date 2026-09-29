// The walkthrough form's choices and limits, shared by the page (src/quote.js)
// and the server (worker/validate.js) so the server accepts exactly what the
// page offers. index.html's radio values are checked against these in tests.
export { CITY_NAMES } from './cities.js';

export const SIZES = ['Under 2,000 sq ft', '2,000 to 5,000 sq ft', '5,000 to 15,000 sq ft', 'Over 15,000 sq ft', 'Not sure'];
export const TIMINGS = ['Early mornings', 'During the day', 'Evenings', 'Overnight', 'Weekends', 'Not sure yet'];
export const LIMITS = { name: 100, email: 254, phone: 30 };

// Bump when the consent wording next to the form changes; stored with each request.
export const CONSENT_VERSION = '2026-09-28';
