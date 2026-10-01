// JSON-LD for the home page: the business as a service-area business (no street address:
// HARA goes to its customers), with the cities it serves. Output only when VITE_SITE_URL is
// set (the domain step); until then pages stay noindex and carry no structured data.
// No opening hours (HARA works every day, at any time a contract needs) and no ratings (no reviews yet).
import { CITY_NAMES } from './cities.js';
import { BUSINESS } from './business.js';

export function structuredData(file, site) {
  if (!site || file !== 'index.html') return null;
  return [{
    '@type': 'LocalBusiness',
    '@id': `${site}/#business`,
    name: BUSINESS.name,
    url: `${site}/`,
    image: `${site}/og.jpg`,
    telephone: [BUSINESS.phoneE164, BUSINESS.phone2E164],
    email: BUSINESS.email,
    description: 'Office cleaning across Toronto and the GTA, on any day and at any time, with a free walkthrough before every quote.',
    areaServed: CITY_NAMES.map((c) => ({ '@type': 'City', name: c })),
  }];
}

export const ldScript = (items) => items.map((i) => `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...i }).replace(/</g, '\\u003c')}</script>`).join('\n');
