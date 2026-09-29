import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { srcset, smallest, dimensions } from './src/photos.js';

// GitHub Pages cannot set response headers, so the production page carries its
// own CSP and referrer policy. Dev is left alone (Vite HMR needs inline scripts).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityMeta = {
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head-prepend' },
  ],
};

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

// Relative base so the build works on a GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [staticMarkup, securityMeta, fontPreload],
  build: { target: 'es2020', assetsInlineLimit: 0, sourcemap: false },
  server: { port: 4331, strictPort: true },
  preview: { port: 4332, strictPort: true },
});
