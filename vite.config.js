import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { srcset, smallest, dimensions } from './src/photos.js';

// Content Security Policy. The demo build (GitHub Pages) allows nothing but the
// site itself. The live build (Cloudflare) also allows Turnstile, the spam check
// on the walkthrough form, and nothing else.
function csp(liveForm) {
  const turnstile = liveForm ? ' https://challenges.cloudflare.com' : '';
  return [
    "default-src 'self'",
    `script-src 'self'${turnstile}`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${turnstile}`,
    liveForm ? 'frame-src https://challenges.cloudflare.com' : "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

// GitHub Pages can't set response headers, so the demo build carries its CSP
// and referrer policy as <meta> tags. Dev is left alone (Vite HMR needs inline scripts).
const securityMeta = (policy) => ({
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
  ],
});

// Cloudflare serves dist/_headers with every static file: real HTTP security
// headers, including the ones a <meta> tag can't set (frame-ancestors, HSTS).
const cloudflareHeaders = (policy) => ({
  name: 'cloudflare-headers',
  apply: 'build',
  generateBundle() {
    const lines = [
      '/*',
      `  Content-Security-Policy: ${policy}; frame-ancestors 'none'`,
      '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
      '  X-Content-Type-Options: nosniff',
      '  X-Frame-Options: DENY',
      '  Referrer-Policy: strict-origin-when-cross-origin',
      '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      '  Cross-Origin-Opener-Policy: same-origin',
      '/assets/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '/img/*',
      '  Cache-Control: public, max-age=2592000',
      '',
    ];
    this.emitFile({ type: 'asset', fileName: '_headers', source: lines.join('\n') });
  },
});

// Keeps index.html readable: short tags expand into static markup before Vite
// processes the page, so the shipped HTML is complete without any JavaScript.
//   <i data-icon="broom"></i>  -> the Phosphor "regular" SVG, inline
//   <x-photo id=".." sizes=".." alt=".." [eager]></x-photo>  -> AVIF/WebP <picture>
const attrs = (s) => Object.fromEntries([...s.matchAll(/([a-z-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? true]));

function icon(name) {
  const svg = readFileSync(`node_modules/@phosphor-icons/core/assets/regular/${name}.svg`, 'utf8').trim();
  return svg.replace('<svg ', '<svg class="icon" aria-hidden="true" focusable="false" ');
}

function picture({ id, sizes, alt = '', eager }) {
  const [w, h] = dimensions(id);
  const load = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<picture>`
    + `<source type="image/avif" sizes="${sizes}" srcset="${srcset(id, 'avif')}" />`
    + `<source type="image/webp" sizes="${sizes}" srcset="${srcset(id, 'webp')}" />`
    + `<img src="${smallest(id)}" alt="${alt}" width="${w}" height="${h}" ${load} decoding="async" />`
    + `</picture>`;
}

const staticMarkup = {
  name: 'static-markup',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html
      .replace(/<i data-icon="([a-z-]+)"><\/i>/g, (_, name) => icon(name))
      .replace(/<x-photo ([^>]*)><\/x-photo>/g, (_, a) => picture(attrs(a))),
  },
};

// Preload the one font file every visitor needs (Latin, variable width + weight),
// so the hero headline paints in Mona Sans instead of flashing a fallback.
const fontPreload = {
  name: 'font-preload',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html, { bundle }) => {
      const file = Object.keys(bundle ?? {}).find((f) => /mona-sans-latin-wdth-normal-.*\.woff2$/.test(f));
      if (!file) return html;
      return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `./${file}`, crossorigin: true }, injectTo: 'head' }];
    },
  },
};

// Two builds from one codebase:
//   npm run build     -> GitHub Pages demo (form is a demo, CSP in <meta>)
//   npm run build:cf  -> Cloudflare (form posts to the Worker, CSP as real headers)
// The live build is switched on by VITE_WALKTHROUGH_API in .env.cloudflare.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const liveForm = Boolean(env.VITE_WALKTHROUGH_API);
  const policy = csp(liveForm);
  return {
    base: liveForm ? '/' : './',  // relative for the GitHub Pages project path
    plugins: [staticMarkup, liveForm ? cloudflareHeaders(policy) : securityMeta(policy), fontPreload],
    build: { target: 'es2020', assetsInlineLimit: 0, sourcemap: false },
    server: { port: 4331, strictPort: true },
    preview: { port: 4332, strictPort: true },
  };
});
