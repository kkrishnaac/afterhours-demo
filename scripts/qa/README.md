# QA scripts (browser, load and end-to-end checks)

Written during the 2026-09-28/29 stress test. They drive a real Chrome through `playwright-core`
from Node, without the Playwright MCP (which can be locked by another Claude session).

Browser paths are overridable: `PW_CORE` (path to a `playwright-core` package), `PW_CHROME`
(Chrome for Testing binary), `PW_SHELL` (chrome-headless-shell). Defaults point at the copies
cached on Krishna's Mac (`~/.npm/_npx/...` and `~/Library/Caches/ms-playwright/...`). If they
are gone, add `playwright-core` as a devDependency and run `npx playwright install chromium`.

| Script | What it does | Example |
|---|---|---|
| `shot.mjs` | Screenshot (optionally full page, walking the page so reveals fire) | `node scripts/qa/shot.mjs <url> out.png 1440 900 1 2` |
| `frames.mjs` | Real-time frames of the hero at set times; prints stage state and console errors | `node scripts/qa/frames.mjs <url> /tmp/f 390 844 "1500,5000"` |
| `clockframes.mjs` | Deterministic hero frames with a fake clock frozen before load | `node scripts/qa/clockframes.mjs <url> /tmp/c 1440 900 "0,1200,3700"` |
| `matrix.mjs` | Stress matrix: 10 viewports, slow phone (6x CPU + 3G), no WebGL, JS off, reduced motion. Reports build state, settle time, LCP, CLS, overflow, canvases left, errors | `node scripts/qa/matrix.mjs <url> /tmp` |
| `browsers.mjs` | Chromium, Firefox and WebKit on desktop plus iPhone 14 / SE, Pixel 7, Galaxy S9+ and Firefox at 390 px: hero state, overflow, CTA, photo viewer, first form step, console errors, screenshots. Needs `node <playwright-core>/cli.js install firefox webkit` once | `node scripts/qa/browsers.mjs <url> /tmp` |
| `axe.mjs` | axe-core WCAG 2.1 AA scan at 1440 and 390 px: every page, the viewer open, every form step with its error shown | `node scripts/qa/axe.mjs <url>` |
| `keyboard.mjs` | Keyboard-only pass: every Tab stop and its focus ring, the form and the viewer by keys, the skip link | `node scripts/qa/keyboard.mjs <url>` |
| `axtree.mjs` | Accessibility tree dump (landmarks, headings, controls, errors, dialog) as a screen-reader stand-in | `node scripts/qa/axtree.mjs <url>` |
| `e2e.mjs` | The four-step form end to end (needs the local Worker with Turnstile test keys) | `node scripts/qa/e2e.mjs http://127.0.0.1:8791 390x844 /tmp/e2e.png` |
| `load.mjs` | Load test: static pages/assets or the API endpoint at a set concurrency | `node scripts/qa/load.mjs <url> 1500 50 static` |

Measure performance (LCP, CLS) and JS-off behaviour on a **production build** (`npm run build:prod`
then launch config `afterhours-dist` on :4332, or the live URL), never on the Vite dev server:
dev injects CSS through JavaScript, so its layout-shift and no-JS numbers are meaningless.

Lighthouse: `CHROME_PATH=<Chrome for Testing> node <lighthouse>/cli/index.js <url> --chrome-flags="--headless=new"`
(`--preset=desktop` for desktop). Run it alone: anything else using the CPU costs tens of points.
For the SEO score build with a placeholder `VITE_SITE_URL` so the pre-domain `noindex` is not counted.
Cached copies of lighthouse 12.8 and axe-core 4.13 live under `~/.npm/_npx/8003d8991b0d346b/`.

Load tests against production count toward the Workers free plan (100,000 requests a day): keep
runs in the low thousands.
