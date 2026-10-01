import { describe, expect, it } from 'vitest';
import { AREAS, REGIONS, slugOf } from '../src/service-areas.js';
import { areaFile, renderArea, renderHub, HUB_FILE } from '../src/area-pages.js';
import { ALL_PAGES, structuredData, ldScript } from '../src/site-pages.js';
import { CORE_PAGES, renderCore, REGULAR, SPECIALTY, STEPS, SECURITY, PRIORITIES, FAQS } from '../src/core-pages.js';
import home from '../index.html?raw';
import services from '../services.html?raw';
import security from '../security.html?raw';
import faq from '../faq.html?raw';
import about from '../about.html?raw';
import contact from '../contact.html?raw';
import { CITY_NAMES } from '../src/form-options.js';
import hub from '../service-areas.html?raw';
import toronto from '../office-cleaning-toronto.html?raw';
import mississauga from '../office-cleaning-mississauga.html?raw';
import vaughan from '../office-cleaning-vaughan.html?raw';
import markham from '../office-cleaning-markham.html?raw';
import brampton from '../office-cleaning-brampton.html?raw';
import oakville from '../office-cleaning-oakville.html?raw';

const onDisk = { 'office-cleaning-toronto.html': toronto, 'office-cleaning-mississauga.html': mississauga, 'office-cleaning-vaughan.html': vaughan, 'office-cleaning-markham.html': markham, 'office-cleaning-brampton.html': brampton, 'office-cleaning-oakville.html': oakville };
const core = { 'services.html': services, 'security.html': security, 'faq.html': faq, 'about.html': about, 'contact.html': contact };
const SITE = 'https://example.test';
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const copyOf = (a) => [a.intro, a.offices, a.access, ...a.districts.flat(), ...a.faqs.flat()];

describe('service area pages', () => {
  it('the generated files are up to date (run npm run areas)', () => {
    expect(hub).toBe(renderHub());
    for (const a of AREAS) expect(onDisk[areaFile(a)], areaFile(a)).toBe(renderArea(a));
    expect(Object.keys(onDisk)).toEqual(AREAS.map(areaFile));
    expect(Object.keys(core)).toEqual(CORE_PAGES);
    for (const f of CORE_PAGES) expect(core[f], f).toBe(renderCore(f));
  });

  it('the home page and the new pages say the same thing', () => {
    const plain = home.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    for (const item of [...REGULAR, ...SPECIALTY]) expect(plain, item).toContain(item);
    for (const [title, text] of [...SECURITY, ...STEPS, ...PRIORITIES]) { expect(plain, title).toContain(title); expect(plain, text).toContain(text); }
    expect(FAQS.length).toBeGreaterThanOrEqual(8);
  });

  it('every city page is a city the form accepts, in a known region', () => {
    const regionCities = REGIONS.flatMap((r) => r.cities);
    for (const a of AREAS) {
      expect(CITY_NAMES).toContain(a.name);
      expect(regionCities).toContain(a.name);
      expect(REGIONS.find((r) => r.name === a.region).cities).toContain(a.name);
    }
    expect([...regionCities].sort()).toEqual([...CITY_NAMES].sort());
  });

  it('each page has its own substantial copy, not a city name swap', () => {
    for (const a of AREAS) expect(words(copyOf(a).join(' ')), a.name).toBeGreaterThanOrEqual(255);
    const seen = new Map();
    for (const a of AREAS) {
      for (const para of copyOf(a)) {
        expect(seen.get(para), `"${para.slice(0, 50)}" repeated in ${a.name} and ${seen.get(para)}`).toBeUndefined();
        seen.set(para, a.name);
      }
    }
    const titles = AREAS.map((a) => a.description);
    expect(new Set(titles).size).toBe(AREAS.length);
  });

  it('no em or en dashes in visible copy, and one h1 per page', () => {
    for (const html of [hub, ...Object.values(onDisk), ...Object.values(core)]) {
      expect(html).not.toMatch(/[–—]/);
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    }
  });

  it('internal links resolve to real pages and the nearby list is valid', () => {
    const files = new Set([...ALL_PAGES(), 'index.html', 'privacy.html', 'terms.html', 'accessibility.html']);
    for (const html of [home, hub, ...Object.values(onDisk), ...Object.values(core)]) {
      for (const [, href] of html.matchAll(/href="([a-z0-9-]+\.html)"/g)) expect(files.has(href), href).toBe(true);
    }
    for (const a of AREAS) for (const n of a.nearby) expect(AREAS.map((x) => x.name), `${a.name} -> ${n}`).toContain(n);
    expect(AREAS.map((a) => slugOf(a.name))).toEqual(AREAS.map((a) => areaFile(a).replace('.html', '')));
  });

  it('structured data is absent without a site URL and well formed with one', () => {
    for (const f of [...ALL_PAGES(), 'index.html']) expect(structuredData(f, '')).toBeNull();
    for (const f of [...ALL_PAGES(), 'index.html']) {
      const ld = structuredData(f, SITE);
      expect(ld.length).toBeGreaterThan(0);
      for (const tag of ldScript(ld).matchAll(/<script type="application\/ld\+json">(.*)<\/script>/g)) {
        const json = JSON.parse(tag[1]);
        expect(json['@context']).toBe('https://schema.org');
      }
    }
    const home = structuredData('index.html', SITE)[0];
    expect(home['@type']).toBe('LocalBusiness');
    expect(home).not.toHaveProperty('address');
    expect(home.areaServed).toHaveLength(CITY_NAMES.length);
    const city = structuredData('office-cleaning-toronto.html', SITE);
    expect(city.map((x) => x['@type'])).toEqual(['Service', 'BreadcrumbList', 'FAQPage']);
    expect(city[0].provider['@id']).toBe(`${SITE}/#business`);
    expect(HUB_FILE).toBe('service-areas.html');
  });
});
