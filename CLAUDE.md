# HARA Facilities Cleaning: company website

Website for Krishna's friend's office-cleaning company in the Greater Toronto Area. The name is
**HARA Facilities Cleaning** (the client writes HARA in caps). "Afterhours" was the working name;
it survives only in the repo name and the old GitHub Pages URL. Client material lives in
`docs/client/` (gitignored: the repo is public). Read `HANDOFF.md` for where things stand.

- **Production (live, pre-domain):** https://hara-website.chaudharikrishna0415.workers.dev
  (Cloudflare Worker `hara-website` in Krishna's account, version `765c3a63` as of 2026-10-01,
  D1 `hara-walkthroughs`, `noindex`). The old GitHub Pages URL
  (https://kkrishnaac.github.io/afterhours-demo/) redirects to production.
- **Status (2026-10-01):** security gate GO, fixes and stress tests deployed, 60 tests pass.
  Before the domain: SOW Phase 4 pages, real company details, analytics, Phase 5 QA, final gate.
  The working tree holds uncommitted work (some live, one CSS change not yet verified).
  **Read `HANDOFF.md` sections 3 and 6 before changing anything.**
- **Reference only:** the original "Afterhours" design (commit `dea9337`) runs as a separate
  static Worker at https://afterhours-design.chaudharikrishna0415.workers.dev (`noindex`).
- **Krishna wants changes shipped to the live URL**, never handed over as a localhost link.
- Local: `npm run dev` (Vite on :4331, launch config `afterhours`) for design work;
  `npm run dev:worker` (Worker + local D1 on :8787, launch config `hara-worker`) for the form;
  launch config `afterhours-dist` (`vite preview` of `dist/` on :4332) for performance checks.
- Node via nvm: run `source ~/.nvm/nvm.sh` before npm in a fresh shell.

## Session protocol (from ~/.claude/CLAUDE.md, applies here)

1. Run the `engineering-team` skill at the start of every coding session.
2. Design work: `design-md-library` (one brand system) then `design-taste-frontend`; this is an
   existing project, so also `redesign-existing-projects` (audit first, don't break working code).
   Logo work: the `design` skill (its AI generator needs a GEMINI_API_KEY, which isn't set; the
   current logo is hand-built vector, see "Brand" below).
3. Library APIs: pull current docs through the context7 MCP, not memory.
4. Before calling UI done: `web-design-guidelines`, then verify in a real browser (playwright MCP)
   at desktop AND phone widths. Never ask Krishna to check manually.
5. Before any deploy, custom domain or client handoff: `security-protocol` (non-negotiable).
   Anything touching forms, user data, keys or the backend: `build-security` during development.

## Stack

- **Front end:** Vite 8 (vanilla JS modules, plain CSS), Lenis 1.3 (desktop wheel only), Mona Sans
  variable (self-hosted via @fontsource-variable), Phosphor icons inlined at build time. Page JS
  ~10 KB gzip; three.js 0.186 loads lazily, only for the hero logo build. No framework, no Tailwind.
- **Pages:** `index.html`, `privacy.html`, `terms.html`, `accessibility.html`, `404.html`. The
  simple pages share `partials/nav-page.html` and all pages share `partials/footer.html` through
  `<x-include>` tags expanded at build time.
- **Back end:** a Cloudflare Worker (`worker/`) receives every request (`run_worker_first: true`)
  so plain http 301s to https; pages come from `dist/` via `env.ASSETS` (which still applies
  `dist/_headers`). It handles `POST /api/walkthrough` and a 15-minute cron. D1 stores requests,
  Turnstile blocks bots, the Workers rate-limit binding caps abuse (checked before the body is
  read; the body is streamed with an 8 KB cap), the duplicate check and insert are one atomic
  statement, Resend sends email.
  `EMAIL_MODE`: `hold` in production until the domain can send email (requests stored, HARA's
  notifications pending, delivered by the cron once switched to `resend`); `dry-run` locally.
- **Builds from one codebase:** `build:prod` = production (`.env.production-cf`, real Turnstile
  site key; setting `VITE_SITE_URL` at domain launch drops `noindex` and adds sitemap, canonical
  links and security.txt). `build:cf` = local Worker testing (Turnstile test key, `.env.cloudflare`).
  `build` = the old GitHub Pages demo build (not deployed any more). Production CSP and security
  headers are generated into `dist/_headers`.

Commands:

```bash
npm run dev            # design work on :4331
npm run dev:worker     # full stack locally on :8787 (build:cf + local D1 + wrangler dev)
npm test               # 60 Worker tests inside workerd with a local D1 (incl. test/stress.test.js)
npm run contrast       # WCAG check of every palette token pair the site uses
npm run deploy         # tests + production build + wrangler deploy --env production
npm run db:migrate     # apply new D1 migrations to production
npm run leads          # CSV of recent walkthrough requests -> docs/client/leads/ (gitignored)
npm run data-request -- export|delete <email>   # PIPEDA access / deletion requests
node scripts/qa/matrix.mjs <url> /tmp   # browser stress matrix (see scripts/qa/README.md)
```

## File map

| Path | What it is |
|---|---|
| `index.html` | Home page: nav, hero (vision line + logo stage), why HARA (4 linked cards = the client's priorities), any day any time (week grid), what we clean (7 photo cards + 2 service lists as `<details>`), security band, how it works (5 steps), areas (chips + map), walkthrough request form, photo viewer |
| `privacy.html`, `terms.html`, `accessibility.html`, `404.html` | Legal pages (PIPEDA, CASL, AODA) and 404. Entry script `src/page.js` (styles only) |
| `partials/` | `nav-page.html` (header for the simple pages), `footer.html` (all pages; Privacy / Terms / Accessibility links) |
| `vite.config.js` | `static-markup` plugin (`<x-include>`, `<i data-icon>` Phosphor SVGs, `<x-photo>` pictures), CSP + `_headers`, font preload, `siteUrl` (robots/sitemap/canonical/security.txt), multi-page input |
| `src/style.css` | All styles. **Palette and shape tokens in `:root`** |
| `src/main.js` | Home entry: fonts, CSS, Lenis (non-touch, lerp 0.085), in-page link glide, service-list open state, hero logo, motion, form, viewer |
| `src/hero-logo.js`, `src/hero-build.js`, `src/logo-parts.js` | Hero logo: decide 3D or vector; the three.js build (lazy chunk); the traced logo parts (generated) |
| `src/motion.js` | IntersectionObserver reveals (`data-reveal`, staggered by `--i`), week grid wave, map light-up. One-time, no scroll listeners |
| `src/quote.js`, `src/turnstile.js` | 4-step walkthrough form (live build posts to the Worker; demo build sends nothing); Turnstile loaded only at the last step |
| `src/form-options.js`, `src/cities.js` | Form choices shared by page and Worker (tests check `index.html` matches) |
| `src/photos.js`, `src/viewer.js`, `src/map.js` | Photo data (also used by vite.config.js), photo viewer dialog, GTA SVG map |
| `worker/` | `index.js` (router, https redirect, cron), `walkthrough.js` (the endpoint), `validate.js`, `turnstile.js`, `email.js` (escaped templates, Resend, hold, dry-run), `maintenance.js` (retries, 24-month retention), `http.js` (API headers, PII-free logs) |
| `migrations/`, `test/`, `vitest.config.js` | D1 schema (no IPs, CASL consent fields); Worker tests via `@cloudflare/vitest-plugin`; `test/stress.test.js` = concurrency + fuzz |
| `wrangler.jsonc` | Worker config: local defaults at top level, `env.production` for the live Worker |
| `scripts/` | `contrast.mjs` (palette WCAG check), `leads.mjs` (leads/PIPEDA CLI), `optimize-images.mjs` (4K masters -> AVIF/WebP), `qa/` (browser matrix, fake-clock frames, form end to end, load test) |
| `public/` | `brand/` (logo SVGs), `favicon.svg`, `apple-touch-icon.png`, `og.jpg` (branded share image), `img/` photo ladders |
| `src/service-areas.js`, `src/area-pages.js`, `src/business.js`, `scripts/areas.mjs` | The Service areas hub and six city pages (Toronto, Mississauga, Vaughan, Markham, Brampton, Oakville). **Edit `src/service-areas.js`** (unique copy per city; regions list) then `npm run areas`: it writes `service-areas.html` and `office-cleaning-<city>.html` into the root (generated and committed; the build scripts run it first, `test/areas.test.js` fails if they are stale). `area-pages.js` also builds the JSON-LD (LocalBusiness service-area business on `/`, Service + BreadcrumbList + FAQPage per city) that is injected only when `VITE_SITE_URL` is set. To add a city page: add an entry (needs a city already in `src/cities.js`), run `npm run areas`, and the hub, sitemap and schema follow |
| `src/core-pages.js`, `src/site-pages.js`, `src/analytics.js`, `scripts/favicons.mjs` | `core-pages.js` generates Services, Security, FAQ, About, Contact (home page wording only; `test/areas.test.js` fails if they disagree with `index.html`); `site-pages.js` is the index of every generated page and its JSON-LD. `analytics.js`: Cloudflare Web Analytics beacon, off until `VITE_CF_BEACON_TOKEN` is set (opens the CSP and adds a privacy sentence only then). `favicons.mjs` builds the tab icons (logo mark on a white tile: favicon.svg/.ico, 48 and 192 px PNGs) from `public/brand/hara-mark.svg`; re-run it if `export_brand.py` rewrites `favicon.svg`. Icon links carry `?v=2` to beat browser caches |
| `docs/DEPLOY.md` | Production state, launch blockers, connect-the-domain runbook, backups and restore (rehearsed), everyday commands |
| `security/golive/` | Go-live reports; latest full gate `2026-09-28-full-GO.md` |
| `docs/client/` (gitignored) | Client brief + priorities, company notes, SOW (docx + generator), security plan (PDF), logo kit, leads exports |

Photo masters were generated with Higgsfield (GPT Image 2.5 via `marketing-studio/image/flare`,
4K) by `~/higgsfield/sites/afterhours_stills.py`. 9 exist. Stills only: super-clean offices, no
people, no before/after, no video.

## Brand (2026-09-28: the client's own logo, navy palette)

After four rounds of new logo designs, Krishna chose the **client's original logo** (navy H with a
blue swoosh, a perspective office building with lit windows, three sparkles, HARA, FACILITIES
CLEANING between two rules). It was traced to clean vector so every part can be animated.

### Palette (from the logo)

Token structure after the Cohere DESIGN.md (white canvas, one deep band, rounded media cards, pill
actions, flat depth). Values are sampled from the client's logo.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FAFBFD` | Page background |
| `--surface` | `#FFFFFF` | Cards, inputs, the hero logo stage |
| `--stone` | `#EDF1F8` | Soft panels (week grid, service lists, quote panel, map) |
| `--ink` / `--ink-muted` | `#0E1A33` / `#4B5873` | Text / secondary text |
| `--hairline` | `#D8DFEB` | Borders |
| `--accent` / `--accent-hover` | `#0B3A80` / `#03275A` | HARA navy (top of the logo's H / its lettering): buttons, icons, links, focus |
| `--accent-2` | `#0A95EF` | HARA sky (sparkles, swoosh): graphics only, never text |
| `--accent-ink` | `#FFFFFF` | Text on the accent |
| `--wash` | `#E4ECFA` | Icon chips, filled week-grid cells |
| `--band` / `--on-band` / `--on-band-muted` | `#03275A` / `#F4F7FC` / `#B4C3E0` | The one dark section (security) |
| `--error` | `#B3261E` | Form errors (error box background `#FBEAE8`) |

**Where colour lives (change all of them together):** `src/style.css` `:root` plus the `rgba()`
values derived from it (`11, 58, 128` accent, `3, 39, 90` band overlay, `250, 251, 253` nav glass,
`14, 26, 51` shadows, `216, 223, 235` nav hairline, `244, 247, 252` band lines, `#B8C4DB` map dots,
`#FBEAE8`); `<meta name="theme-color">` in all five pages; `worker/email.js` inline colours; the
logo files. After any change: `npm run contrast` (all PASS), then desktop + phone screenshots.

### Logo files (generated, don't hand-edit)

- `public/brand/hara-logo.svg` full logo (hero rest state, footer), `hara-lockup.svg` mark + HARA
  (nav, photo viewer), `hara-mark.svg` = `public/favicon.svg`; `public/apple-touch-icon.png`
  (mark on white, 180px); `public/og.jpg` (source `docs/client/logo/og.html`, 1200x630 via the dev server).
- `src/logo-parts.js`: the 16 traced parts (paths, gradients, boxes) the 3D hero build extrudes.
- Pipeline (in `docs/client/logo/`, gitignored): `client-logo-approved.jpg` (the client's file) ->
  `vectorize_original.py` (ink-coverage masks, seeded split of touching parts, potrace; building
  bars and windows are exact polygons) -> `original-vector/parts.json` + `hara-logo.svg` ->
  `export_brand.py` writes everything listed above. The tracer needs a venv with pillow, numpy,
  scipy and potracer; `export_brand.py` runs on plain python3.
- Earlier explorations (tiles, custom lettering, font rounds) and the green kit are in
  `docs/client/logo/navy/` and `docs/client/logo/archive/`; none of them is in use.

### Hero 3D build

`src/hero-logo.js` (main bundle) decides; `src/hero-build.js` (lazy chunk with three.js) builds.
Each traced part is extruded and arrives in turn over ~3.1s (H flies in, building rises, swoosh
sweeps, letters flip up, sparkles pop, tagline settles) while the logo turns to face the viewer;
the front faces land exactly on the vector `<img>`, which crossfades in, and the WebGL context is
disposed. The vector is shown straight away when motion is reduced, WebGL is missing, the stage is
off screen at load, or three.js takes over 2.5s. The `<img>` is painted from the first frame under
a white `.hero__stage::after` cover (so it is the LCP element at once) that lifts when the build
ends, with a 3.6s CSS-only failsafe for no-JS. Verified on a production build 2026-10-01: CLS 0 at
10 viewports, LCP 80 to 190 ms (2.07s on a throttled 3G/6x CPU phone), JS-off shows the logo. Test frames deterministically with Playwright's fake clock
(`page.clock.install` + `pauseAt` before `goto`, then `runFor`): `scripts/qa/clockframes.mjs`.

## Design decisions (Krishna's calls; don't re-litigate without him)

Client priorities (`docs/client/company-notes.md`): flexible hours (any day, any time), offices
only for now, security conscious, free walkthrough before every quote.
- Vision line / hero: "Every desk ready. Every door locked." (second line in the accent).
  One CTA label everywhere: "Book a free walkthrough" ("Free walkthrough" in the nav under 400px).
- Type: Mona Sans only. Headings at `font-stretch: 112%`, weight 560, tight tracking. Hero lines
  never wrap mid-sentence.
- Shapes: interactive = pill; cards 24px; photos inside cards 16px; panels 32px. Nothing sharp.
- Motion: professional and quiet. Hero rises on load, sections settle in once, cards lift 4px
  (transform + opacity only), week grid wave, map light-up. Removed for good: loader, squeegee
  wordmark, photo wipes, button glint, clock pill, the night story, and any other 3D (the one
  exception is the hero logo build below).
- Header: slim (54px) floating bar, always visible, aligned to the content column, links centred.
- Light theme only ("white gives very clean vibes"). No background gradients.
- Phone: native scroll, no pinning or parallax, `svh` units, services become a swipe row.
- Logo: the client's original (2026-09-28), shown off in the hero. This reverses his earlier "no
  swooshes, sparkles or gradients" wish; it is his call. Four rounds of new designs were rejected.
- 3D: only the one-time hero logo build, which ends on crisp vector (he had rejected 3D as "not
  crisp" before). Previously rejected: sky-blue + warm beige gradient palette.
- The security section's practices are claims: the client must confirm them before launch.

## Conventions

- Visible copy: no em or en dashes. Sentence case. One CTA label per intent.
- Every animation honours `prefers-reduced-motion` (JS checks + CSS override at the end of style.css).
- Contrast: every text pair >= 4.5:1 (`npm run contrast`). `translate="no"` on the brand.
  `[hidden]` is forced to `display: none`.
- Home Areas chips (all 16 cities) are links: a tap scrolls to the form with the city already chosen (`quote.js` `pickCity`; `?city=` from the city pages is matched against the allowlist). City page copy is drafted from public facts about each place and needs HARA's OK; nothing about HARA beyond the stated process (free walkthrough, offices only, any day and time) is claimed.
- Contact details on the site (real, from Krishna 2026-10-01): phone (416) 990-3995 (`tel:+14169903995`), email
  harafacilitiescleaning@gmail.com. Still placeholders: `EMAIL_FROM` and `LEAD_TO_EMAIL` in `wrangler.jsonc`
  (set at the domain step). The footer's demo note is gone.
- Company facts come from the client's docs. Krishna directs the site; the client's layout
  instructions are not followed unless he says so.
- Never record account security status (2FA etc.) or secrets in this public repo.

## Deploy

`npm run deploy` (tests, production build, `wrangler deploy --env production`). Run
`security-protocol` before every deploy (for CSS-only changes, re-run the scan and add a short
re-run note to the latest report). Wrangler is logged in to Krishna's Cloudflare account (OAuth;
scopes include D1, Workers and Turnstile widgets). Connecting the domain: `docs/DEPLOY.md`.

## Gotchas (learned the hard way)

- Production CSP is a real header from `dist/_headers`; only the old demo build uses a `<meta>` CSP.
  No inline scripts or styles in markup (CSSOM changes from JS are fine). Dev server is exempt.
- `env.ASSETS.fetch()` responses DO carry `_headers`; responses built in Worker code do NOT
  (`worker/http.js` sets the API's own headers).
- workers.dev serves plain http unless the Worker redirects it (it does).
- Wrangler environments don't inherit vars, routes or bindings: `env.production` repeats them.
- Turnstile test keys: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`
  (always pass). Siteverify with test keys reports a placeholder hostname, so `TURNSTILE_HOSTNAMES`
  is empty locally. Turnstile's iframe logs console noise (OTS font warning); not ours.
- Lenis honours CSS `scroll-padding-top` and `scroll-margin-top`: never pass a manual offset to
  `lenis.scrollTo`. `.section` uses a negative scroll-margin so nav links land on the heading.
- Never clip an `<img loading="lazy">` fully (clip-path): Chrome won't lazy-load it.
- `.legal a` styles must exclude `.btn` and `.call`, or buttons on the simple pages lose their text colour.
- The security scan greps every file for "webhook"/"claude"; our own docs trigger false positives,
  and `.wrangler/tmp` source maps trip its SQL check. Verify matches are in shipped code first.
- The Browser pane pauses requestAnimationFrame when hidden (Lenis stops, screenshots go blank).
  Use the playwright MCP for scroll/animation tests and screenshots, or `scripts/qa/` when both
  Playwright MCPs are locked by another Claude session ("Browser is already in use"). The pane
  reads the home-level `~/.claude/launch.json`, not the project's.
- Measure LCP, CLS and JS-off behaviour on a production build (`afterhours-dist`, :4332) or the
  live URL, never the Vite dev server: dev injects CSS through JavaScript.
- The Cloudflare rate limiter is approximate (per location, synced with a delay): a burst lets a
  few more than 5 through; Turnstile still stops them. The workerd tests are exact.
- `wrangler tail hara-website` without `--env production` (that appends `-production`).
  `wrangler d1 time-travel restore` has no `-y`. A new `workers.dev` name can 404 for ~1 minute.
- Vite's "chunk over 500 kB" warning for `hero-build` is expected (three.js, lazy loaded).
- Logo pipeline venv doesn't survive sessions: recreate with fonttools, brotli, skia-pathops,
  pillow, numpy, scipy, potracer (`HANDOFF.md` section 7).
- Files in `docs/client/` can be viewed through the dev server (`/docs/client/...`), which is how
  the logo sheets and share image are rendered.
- The Write tool can turn ` `-style escapes in JS source into literal characters; write such
  regexes with Python or check the bytes afterwards.
- `git push` of large image sets 400s without `http.postBuffer 524288000`.
- Higgsfield spend gate: paid runs need Krishna to type `yes` in a terminal. Start them with
  `run_in_terminal` AND show the terminal pane.
