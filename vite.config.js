import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { srcset, smallest, dimensions } from './src/photos.js';
import { ALL_PAGES, ALL_PATHS, structuredData, ldScript } from './src/area-pages.js';

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
      '  Cross-Origin-Resource-Policy: same-origin',
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
//   <x-include src="partials/x.html">  -> that file's markup (shared header and footer)
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
      // Shared header/footer: <x-include src="partials/footer.html"></x-include>
      .replace(/<x-include src="([a-z0-9/._-]+)"><\/x-include>/g, (_, file) => readFileSync(resolve(import.meta.dirname, file), 'utf8').trim())
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

// The public address. Unset (demo, workers.dev before the domain): every page
// keeps `noindex` and there is no sitemap. Set VITE_SITE_URL=https://domain at
// launch: pages become indexable (404 stays noindex), links become canonical,
// share images absolute, and robots.txt + sitemap.xml are generated.
// VITE_SECURITY_CONTACT (e.g. mailto:security@domain) adds /.well-known/security.txt.
const PAGES = ['index.html', 'privacy.html', 'terms.html', 'accessibility.html', '404.html', ...ALL_PAGES()];
const PATHS = { 'index.html': '/', 'privacy.html': '/privacy', 'terms.html': '/terms', 'accessibility.html': '/accessibility', ...ALL_PATHS() };

const siteUrl = (site, contact) => ({
  name: 'site-url',
  apply: 'build',
  transformIndexHtml(html, { path: p }) {
    const file = p.replace(/^\//, '');
    if (!site || file === '404.html') return html;
    const url = site + (PATHS[file] || '/');
    const ld = structuredData(file, site);
    return html
      .replace(/\s*<meta name="robots" content="noindex" \/>/, '')
      .replace('</head>', `  <link rel="canonical" href="${url}" />\n  <meta property="og:url" content="${url}" />\n${ld ? ldScript(ld) + '\n' : ''}</head>`)
      .replace('<meta property="og:image" content="og.jpg" />', `<meta property="og:image" content="${site}/og.jpg" />`);
  },
  generateBundle() {
    const robots = ['User-agent: *', 'Allow: /'];
    if (site) {
      robots.push(`Sitemap: ${site}/sitemap.xml`);
      const today = new Date().toISOString().slice(0, 10);
      const urls = Object.values(PATHS).map((u) => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    }
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' });
    if (contact) {
      const expires = new Date(Date.now() + 365 * 86_400_000).toISOString();
      const lines = [`Contact: ${contact}`, `Expires: ${expires}`, 'Preferred-Languages: en'];
      if (site) lines.push(`Canonical: ${site}/.well-known/security.txt`, `Policy: ${site}/privacy`);
      this.emitFile({ type: 'asset', fileName: '.well-known/security.txt', source: lines.join('\n') + '\n' });
    }
  },
});

// Live build only: links between pages are written as page.html so they also work
// from the dev server and a plain file preview. On the live site they would cost a
// redirect (the host serves /privacy, not /privacy.html), so they become clean URLs.
const cleanLinks = {
  name: 'clean-links',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => html.replace(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g, 'href="$1$2"'),
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
    plugins: [staticMarkup, liveForm ? cloudflareHeaders(policy) : securityMeta(policy), ...(liveForm ? [cleanLinks] : []), fontPreload, siteUrl(env.VITE_SITE_URL?.replace(/\/$/, ''), env.VITE_SECURITY_CONTACT)],
    build: {
      target: 'es2020', assetsInlineLimit: 0, sourcemap: false,
      rolldownOptions: { input: Object.fromEntries(PAGES.map((f) => [f.replace('.html', ''), resolve(import.meta.dirname, f)])) },
    },
    server: { port: 4331, strictPort: true },
    preview: { port: 4332, strictPort: true },
  };
});
