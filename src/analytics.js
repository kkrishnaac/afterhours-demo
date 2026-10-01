// Cloudflare Web Analytics: page views and load performance, no cookies, no tracking of
// individuals. Off until VITE_CF_BEACON_TOKEN is set (the token comes from the Cloudflare
// dashboard, Analytics, Web Analytics, and is public by design: it sits in the page).
// The Content Security Policy opens only as far as the beacon needs, and only when it is on:
//   script-src  static.cloudflareinsights.com   (the beacon script)
//   connect-src cloudflareinsights.com          (where it reports while the site is on
//                                                workers.dev; on the real domain it reports
//                                                to the site itself, which 'self' covers)
export const BEACON_TOKEN = /^[a-f0-9]{32}$/;
export const BEACON_SCRIPT_SRC = 'https://static.cloudflareinsights.com';
export const BEACON_CONNECT_SRC = 'https://cloudflareinsights.com';

export const validToken = (t) => typeof t === 'string' && BEACON_TOKEN.test(t);

export const beaconTag = (token) =>
  `<script defer src="${BEACON_SCRIPT_SRC}/beacon.min.js" data-cf-beacon='${JSON.stringify({ token, spa: false })}'></script>`;

// Added to the privacy policy (at the <!--analytics-note--> marker) only in builds where the
// beacon is on, so the policy never describes collection that is not happening.
export const PRIVACY_NOTE = 'To count visits and measure how fast the pages load, we use Cloudflare Web Analytics. It sets no cookies and does not build a profile of you. ';
