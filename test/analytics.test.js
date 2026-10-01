import { describe, expect, it } from 'vitest';
import { validToken, beaconTag, PRIVACY_NOTE, BEACON_SCRIPT_SRC, BEACON_CONNECT_SRC } from '../src/analytics.js';
import privacy from '../privacy.html?raw';

describe('analytics beacon', () => {
  it('accepts only a 32-character hex token', () => {
    expect(validToken('0123456789abcdef0123456789abcdef')).toBe(true);
    for (const bad of ['', undefined, null, 'x', '0123456789abcdef0123456789abcdeg', '0123456789abcdef0123456789abcdef0', '"><script>alert(1)</script>']) expect(validToken(bad), String(bad)).toBe(false);
  });
  it('the tag is one external deferred script with the token as data', () => {
    const tag = beaconTag('0123456789abcdef0123456789abcdef');
    expect(tag).toContain(`src="${BEACON_SCRIPT_SRC}/beacon.min.js"`);
    expect(tag).toContain('defer');
    expect(tag).toContain('"token":"0123456789abcdef0123456789abcdef"');
    expect(tag.match(/<script/g)).toHaveLength(1);
  });
  it('opens exactly two origins in the policy', () => {
    expect(BEACON_SCRIPT_SRC).toBe('https://static.cloudflareinsights.com');
    expect(BEACON_CONNECT_SRC).toBe('https://cloudflareinsights.com');
  });
  it('the privacy policy discloses it only when the beacon is on, and still says no cookies', () => {
    expect(privacy).toContain('<!--analytics-note-->');
    expect(privacy).not.toContain('Cloudflare Web Analytics');
    expect(PRIVACY_NOTE).toContain('Cloudflare Web Analytics');
    expect(PRIVACY_NOTE).toMatch(/sets no cookies/);
    expect(privacy).toContain('We don’t use advertising or analytics cookies');
  });
});
