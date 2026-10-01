import { describe, expect, it } from 'vitest';
import { structuredData, ldScript } from '../src/structured-data.js';
import { CITY_NAMES } from '../src/cities.js';

const SITE = 'https://example.test';

describe('home page structured data', () => {
  it('is absent without a site URL, and only for the home page', () => {
    expect(structuredData('index.html', '')).toBeNull();
    expect(structuredData('privacy.html', SITE)).toBeNull();
  });
  it('describes a service-area business: no street address, hours or ratings', () => {
    const [biz] = structuredData('index.html', SITE);
    expect(biz['@type']).toBe('LocalBusiness');
    expect(biz.telephone).toBe('+14169903995');
    expect(biz).not.toHaveProperty('address');
    expect(biz).not.toHaveProperty('openingHoursSpecification');
    expect(biz).not.toHaveProperty('aggregateRating');
    expect(biz.areaServed.map((a) => a.name).sort()).toEqual([...CITY_NAMES].sort());
  });
  it('serialises to valid JSON that cannot close the script tag', () => {
    const tag = ldScript([{ '@type': 'LocalBusiness', name: '</script><b>' }]);
    expect(tag).not.toContain('</script><b>');
    const json = JSON.parse(tag.match(/>(.*)<\/script>/)[1]);
    expect(json.name).toBe('</script><b>');
  });
});
