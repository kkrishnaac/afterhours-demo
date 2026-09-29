# HARA Facilities Cleaning: company website

Website for Krishna's friend's office-cleaning company in the Greater Toronto Area. The name is
**HARA Facilities Cleaning** (the client writes HARA in caps). "Afterhours" was the working name;
it survives only in the repo name and the old GitHub Pages URL. Client material lives in
`docs/client/` (gitignored: the repo is public). Read `HANDOFF.md` for where things stand.

- **Production (live, pre-domain):** https://hara-website.chaudharikrishna0415.workers.dev
  (Cloudflare Worker `hara-website` in Krishna's account, D1 `hara-walkthroughs`, `noindex`).
  Only the domain connection is left: `docs/DEPLOY.md`. The old GitHub Pages URL
  (https://kkrishnaac.github.io/afterhours-demo/) redirects to production.
- **Krishna wants changes shipped to the live URL**, never handed over as a localhost link.
- Local: `npm run dev` (Vite on :4331, launch config `afterhours`) for design work;
  `npm run dev:worker` (Worker + local D1 on :8787, launch config `hara-worker`) for the form.
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
  ~10 KB gzip. No framework, no Tailwind.
- **Pages:** `index.html`, `privacy.html`, `terms.html`, `accessibility.html`, `404.html`. The
  simple pages share `partials/nav-page.html` and all pages share `partials/footer.html` through
  `<x-include>` tags expanded at build time.
- **Back end:** a Cloudflare Worker (`worker/`) receives every request (`run_worker_first: true`)
  so plain http 301s to https; pages come from `dist/` via `env.ASSETS` (which still applies
  `dist/_headers`). It handles `POST /api/walkthrough` and a 15-minute cron. D1 stores requests,
  Turnstile blocks bots, the Workers rate-limit binding caps abuse, Resend sends email.
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
npm test               # 52 Worker tests inside workerd with a local D1
npm run contrast       # WCAG check of every palette token pair the site uses
npm run deploy         # tests + production build + wrangler deploy --env production
npm run db:migrate     # apply new D1 migrations to production
npm run leads          # CSV of recent walkthrough requests -> docs/client/leads/ (gitignored)
npm run data-request -- export|delete <email>   # PIPEDA access / deletion requests
```

## File map

| Path | What it is |
|---|---|
| `index.html` | Home page: nav, hero (vision line), why HARA (4 linked cards = the client's priorities), any day any time (week grid), what we clean (7 photo cards + 2 service lists as `<details>`), security band, how it works (5 steps), areas (chips + map), walkthrough request form, photo viewer |
| `privacy.html`, `terms.html`, `accessibility.html`, `404.html` | Legal pages (PIPEDA, CASL, AODA) and 404. Entry script `src/page.js` (styles only) |
| `partials/` | `nav-page.html` (header for the simple pages), `footer.html` (all pages; Privacy / Terms / Accessibility links) |
| `vite.config.js` | `static-markup` plugin (`<x-include>`, `<i data-icon>` Phosphor SVGs, `<x-photo>` pictures), CSP + `_headers`, font preload, `siteUrl` (robots/sitemap/canonical/security.txt), multi-page input |
| `src/style.css` | All styles. **Palette and shape tokens in `:root`** |
| `src/main.js` | Home entry: fonts, CSS, Lenis (non-touch, lerp 0.085), in-page link glide, service-list open state, motion, form, viewer |
| `src/motion.js` | IntersectionObserver reveals (`data-reveal`, staggered by `--i`), week grid wave, map light-up. One-time, no scroll listeners |
| `src/quote.js`, `src/turnstile.js` | 4-step walkthrough form (live build posts to the Worker; demo build sends nothing); Turnstile loaded only at the last step |
| `src/form-options.js`, `src/cities.js` | Form choices shared by page and Worker (tests check `index.html` matches) |
| `src/photos.js`, `src/viewer.js`, `src/map.js` | Photo data (also used by vite.config.js), photo viewer dialog, GTA SVG map |
| `worker/` | `index.js` (router, https redirect, cron), `walkthrough.js` (the endpoint), `validate.js`, `turnstile.js`, `email.js` (escaped templates, Resend, hold, dry-run), `maintenance.js` (retries, 24-month retention), `http.js` (API headers, PII-free logs) |
| `migrations/`, `test/`, `vitest.config.js` | D1 schema (no IPs, CASL consent fields); Worker tests via `@cloudflare/vitest-plugin` |
| `wrangler.jsonc` | Worker config: local defaults at top level, `env.production` for the live Worker |
| `scripts/` | `contrast.mjs` (palette WCAG check), `leads.mjs` (leads/PIPEDA CLI), `optimize-images.mjs` (4K masters -> AVIF/WebP) |
| `public/` | `favicon.svg`, `apple-touch-icon.png`, `og.jpg` (branded share image), `img/` photo ladders |
| `docs/DEPLOY.md` | Production state, launch blockers, connect-the-domain runbook, everyday commands |
| `security/golive/` | Go-live reports; latest `2026-09-28-backend-GO.md` |
| `docs/client/` (gitignored) | Client brief + priorities, company notes, SOW (docx + generator), security plan (PDF), logo kit, leads exports |

Photo masters were generated with Higgsfield (GPT Image 2.5 via `marketing-studio/image/flare`,
4K) by `~/higgsfield/sites/afterhours_stills.py`. 9 exist. Stills only: super-clean offices, no
people, no before/after, no video.

## Brand (next up: palette and logo work)

### Palette (current, 2026-09-28)

Token structure after the Cohere DESIGN.md (white canvas, one deep band, rounded media cards, pill
actions, flat depth). Values are our own; green because "hara" is Hindi for green.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FBFCFB` | Page background |
| `--surface` | `#FFFFFF` | Cards, inputs |
| `--stone` | `#EDF2EE` | Soft panels (week grid, service lists, quote panel, map) |
| `--ink` / `--ink-muted` | `#0E1B17` / `#4A5954` | Text / secondary text |
| `--hairline` | `#D9E2DC` | Borders |
| `--accent` / `--accent-hover` | `#13503F` / `#0F3D32` | The one accent: buttons, icons, links, focus ring, logo square |
| `--accent-ink` | `#FFFFFF` | Text on the accent |
| `--wash` | `#DDEEE4` | Icon chips, filled week-grid cells |
| `--band` / `--on-band` / `--on-band-muted` | `#0B2F27` / `#F3F7F4` / `#B5C9C0` | The one dark section (security) |
| `--error` | `#B3261E` | Form errors (error box background `#FBEAE8`) |

**Where colour lives (change all of them together):**
- `src/style.css` `:root` tokens, plus literal `rgba()` values derived from them (search for
  `19, 80, 63` accent, `11, 47, 39` band overlay, `251, 252, 251` nav glass, `14, 27, 23` shadows,
  `217, 226, 220` nav hairline, `243, 247, 244` band lines) and `#B9C8C0` (map dots), `#FBEAE8`.
- `<meta name="theme-color">` in all five HTML pages.
- `worker/email.js` inline email colours (`#13503F`, `#0E1B17`, `#FBFCFB`, `#D9E2DC`, `#4A5954`).
- Logo: the mark SVGs (see below), `public/favicon.svg`, `public/apple-touch-icon.png`, `public/og.jpg`.
- Client documents in `docs/client/`: `build-sow.js`, `security/HARA-Security-Plan.html`, logo kit.
- After any change: `npm run contrast` (must be all PASS), then check desktop and phone.

### Logo (current, 2026-09-28)

Tower mark: a rounded green square (64-unit grid, `rx 15`) holding an H whose right stem rises into
an office tower with a slanted roof. Mark path: `M15 22H25.5V31H38.5V16L49 10V51H38.5V37.5H25.5V51H15Z`.
Wordmark: HARA in Mona Sans 680 at 125% width, 0.12em tracking (0.14em in the nav, set live in CSS);
subline FACILITIES CLEANING, 540 at 108%, 0.2em. Stacked lockup keeps the client's thin side rules.

**Where the logo lives (change all of them together):**
- Inline SVG mark in `index.html` (header + viewer), `partials/nav-page.html`, `partials/footer.html`
  (`<svg class="brand__mark">`; colours come from CSS: rect = `--accent`, path = `--on-band`).
- `public/favicon.svg` (colours inline), `public/apple-touch-icon.png` (180px, full-bleed square).
- `public/og.jpg` (share image; source `docs/client/logo/og.html`, render at 1200x630 via the dev
  server `/docs/client/logo/og.html`, then JPEG via sharp).
- Logo kit (gitignored): `docs/client/logo/build_logo.py` (outlines the wordmark from the site's
  Mona Sans with fontTools, composes mark + lockups; `python3 build_logo.py --final`),
  `docs/client/logo/png.mjs` (SVG -> PNG via sharp, run from the repo root), exports in
  `docs/client/logo/final/` (SVG + PNG, stacked / horizontal / mark, normal + reversed),
  brand sheet `final/sheet.html` / `hara-logo-sheet.png`.
- Explored and not chosen: `concepts.html` (A Doorway, B Tower, C Clean pass),
  `tower-variants.html` (setback crown, curtain wall, twin towers, slant + wall).
- The client's original logo for reference: `docs/client/logo/original-client-logo.jpg`
  (deep navy lettering ~#0B2A5B, bright-blue gradient swoosh, sparkles, H + building).

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
  wordmark, photo wipes, button glint, clock pill, the night story, anything 3D.
- Header: slim (54px) floating bar, always visible, aligned to the content column, links centred.
- Light theme only ("white gives very clean vibes"). No background gradients.
- Phone: native scroll, no pinning or parallax, `svh` units, services become a swipe row.
- Logo wishes: minimal, iconic, professional. No swooshes, sparkles or gradients.
- Previously rejected: 3D ("not crisp"), sky-blue + warm beige gradient palette.
- The security section's practices are claims: the client must confirm them before launch.

## Conventions

- Visible copy: no em or en dashes. Sentence case. One CTA label per intent.
- Every animation honours `prefers-reduced-motion` (JS checks + CSS override at the end of style.css).
- Contrast: every text pair >= 4.5:1 (`npm run contrast`). `translate="no"` on the brand.
  `[hidden]` is forced to `display: none`.
- Placeholders still in the site: phone `(416) 555-0199`, `hello@example.com`; the footer says so.
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
  Use the playwright MCP for scroll/animation tests and screenshots. The pane reads the home-level
  `~/.claude/launch.json`, not the project's.
- Files in `docs/client/` can be viewed through the dev server (`/docs/client/...`), which is how
  the logo sheets and share image are rendered.
- The Write tool can turn ` `-style escapes in JS source into literal characters; write such
  regexes with Python or check the bytes afterwards.
- `git push` of large image sets 400s without `http.postBuffer 524288000`.
- Higgsfield spend gate: paid runs need Krishna to type `yes` in a terminal. Start them with
  `run_in_terminal` AND show the terminal pane.
