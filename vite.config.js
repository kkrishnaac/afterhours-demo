import { defineConfig } from 'vite';

// Relative base so the build works on a GitHub Pages project path.
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  server: { port: 4331, strictPort: true },
  preview: { port: 4332, strictPort: true },
});
