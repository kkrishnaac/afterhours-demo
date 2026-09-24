import { defineConfig } from 'vite';

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

// Relative base so the build works on a GitHub Pages project path.
export default defineConfig({
  base: './',
  plugins: [securityMeta],
  // three.js is one lazy chunk loaded after first paint, so its size is expected.
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 700, sourcemap: false },
  server: { port: 4331, strictPort: true },
  preview: { port: 4332, strictPort: true },
});
