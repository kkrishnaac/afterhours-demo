# HARA Facilities Cleaning: company website

Website for Krishna's friend's commercial cleaning company in the Greater Toronto Area. The real
name is **HARA Facilities Cleaning** (the client writes HARA in caps); "Afterhours" was the working
name and is gone from the code. The live demo URL and repo name still say afterhours. Client
material lives in `docs/client/` (gitignored, the repo is public). See `HANDOFF.md` for next steps.

- **Production (live, pre-domain):** https://hara-website.chaudharikrishna0415.workers.dev
  (Cloudflare Worker `hara-website` in Krishna's account, D1 `hara-walkthroughs`, `noindex`).
  Only the domain connection is left: `docs/DEPLOY.md`. The old GitHub Pages URL
  (https://kkrishnaac.github.io/afterhours-demo/) is now a redirect to production.
  Krishna wants updates at the live URL, never a new localhost link.
- Local dev: `npm run dev` (port 4331, launch config `afterhours`); production preview
  `npm run build && npm run preview` (port 4332)
- Node via nvm: run `source ~/.nvm/nvm.sh` before npm in a fresh shell.

## Session protocol (from ~/.claude/CLAUDE.md, applies here)

1. Run the `engineering-team` skill at the start of every coding session.
2. Design work: `design-md-library` (one brand system) then `design-taste-frontend`; this is an
   existing project, so also `redesign-existing-projects` (audit first, don't break working code).
3. Library APIs: pull current docs through the context7 MCP, not memory.
4. Before calling UI done: `web-design-guidelines`, then verify in a real browser (Browser pane or
   playwright MCP) at desktop AND phone widths. Never ask Krishna to check manually.
5. Before any deploy, custom domain or client handoff: `security-protocol` (non-negotiable).
   Anything touching forms, user data, keys or a backend: `build-security` during development.

## Stack

Vite 8 (vanilla JS modules, plain CSS), Lenis 1.3 (desktop wheel only), Mona Sans variable
(self-hosted), Phosphor icons inlined at build time. Page JS ~10 KB gzip. No framework, no Tailwind.
Five pages: `index.html`, `privacy.html`, `terms.html`, `accessibility.html`, `404.html`, sharing
`partials/nav-page.html` and `partials/footer.html` via `<x-include>` (expanded at build time).

Backend: a Cloudflare Worker (`worker/`) receives every request (`run_worker_first: true`) so plain
http 301s to https; pages come from `dist/` via `env.ASSETS` (which still applies `dist/_headers`).
It handles `POST /api/walkthrough` and a 15-minute cron. D1 for requests, Turnstile for spam, the
Workers rate-limit binding, Resend for email. `EMAIL_MODE`: `hold` in production until the domain
can send email (requests stored, HARA notifications pending, delivered by the cron once switched to
`resend`), `dry-run` locally.

Builds (one codebase): `npm run build` = old GitHub Pages demo (no longer deployed), `build:cf` =
local Worker testing (Turnstile test key, `.env.cloudflare`), `build:prod` = production
(`.env.production-cf`, real site key; add `VITE_SITE_URL` at domain launch to drop noindex and
generate sitemap/canonical/security.txt). CSP + security headers go in a generated `dist/_headers`.

Commands: `npm test` (52 tests in workerd), `npm run dev:worker` (local on :8787, launch config
`hara-worker`), `npm run deploy` (tests + build:prod + deploy), `npm run db:migrate`,
`npm run leads`, `npm run data-request -- export|delete <email>`.

## File map

| Path | What it is |
|---|---|
| `index.html` | All markup: nav, hero (vision line), why HARA (4 linked cards = the client's priorities), any day any time (week grid), what we clean (7 photo cards + 2 service lists as `<details>`), security band, how it works (5 steps, walkthrough first), areas (chips + map), walkthrough request form, footer, photo viewer. Uses two build-time shorthands, see `vite.config.js` |
| `vite.config.js` | `static-markup` plugin: `<i data-icon="name"></i>` becomes the Phosphor regular SVG, `<x-photo id sizes alt [eager]>` becomes the full AVIF/WebP `<picture>`. Also the build-only CSP meta and a font preload |
| `src/main.js` | Entry: font + CSS imports, Lenis (non-touch, lerp 0.085), in-page link glide, wires motion, quote, viewer |
| `src/motion.js` | IntersectionObserver reveals (`data-reveal`, staggered by `--i`), week grid wave, map light-up. One-time, no scroll listeners |
| `src/photos.js` | Photo data shared by the page, the viewer and vite.config.js (ladders, srcset, sizes) |
| `src/viewer.js` | Photo viewer dialog (focus trap, Esc, arrows, swipe, thumbnails) for the 7 service photos |
| `src/quote.js` | 4-step walkthrough request (size, timing, city, contact + unticked marketing opt-in, honeypot). Live build posts to the Worker; demo build sends nothing |
| `src/map.js` | GTA SVG map from real lat/long, 16 cities; exports `CITY_NAMES` for the form |
| `src/style.css` | All styles. Tokens in `:root` |
| `scripts/optimize-images.mjs` | `npm run images`: 4K masters in `assets/raw/` (gitignored) -> AVIF/WebP ladders in `public/img/` + `og.jpg` |
| `worker/` | Cloudflare Worker: `index.js` (router + cron), `walkthrough.js` (the endpoint: origin, JSON-only, size, rate limit, honeypot, validation, Turnstile, dedupe, store, email), `validate.js`, `turnstile.js`, `email.js` (escaped templates, Resend, dry-run), `maintenance.js` (retry failed notifications, 24-month retention), `http.js` (API security headers, PII-free logs) |
| `migrations/` | D1 schema (`walkthrough_requests`: form fields + CASL consent + email statuses, no IPs) |
| `test/` | Vitest + `@cloudflare/vitest-plugin`: validation, every refusal path, abuse limits, retry, retention, no PII in logs |
| `src/form-options.js`, `src/cities.js` | Form choices shared by page and Worker (tests check index.html matches) |
| `src/turnstile.js` | Loads Turnstile only at the form's last step (explicit render, invisible unless needed) |
| `wrangler.jsonc`, `.dev.vars.example`, `.env.example` | Worker config (dev defaults; production env goes in per `docs/DEPLOY.md`), secret templates |
| `docs/DEPLOY.md` | Production state, launch blockers, the connect-the-domain runbook, everyday commands |
| `partials/` | Shared page header (simple pages) and footer (with Privacy / Terms / Accessibility links) |
| `privacy.html`, `terms.html`, `accessibility.html`, `404.html` | Legal pages (PIPEDA, CASL, AODA) and 404; entry `src/page.js` (styles only) |
| `scripts/leads.mjs` | Operator CLI: leads CSV export, PIPEDA export/delete by email (output to gitignored docs/client/leads/) |
| `security/golive/` | Go-live reports (2026-09-23, 09-24 old design; 2026-09-28 GO for HARA) |

Photo masters were generated with Higgsfield (GPT Image 2.5 via `marketing-studio/image/flare`,
4K) by `~/higgsfield/sites/afterhours_stills.py`. 9 of 10 exist; `03-boardroom` failed (not charged).

## Design decisions (Krishna approved the redesign 2026-09-28)

Client priorities (docs/client/company-notes.md): flexible hours (any day, any time), offices only
for now, security conscious, free walkthrough before every quote. The page is built around those.
- Vision line / hero: "Every desk ready. Every door locked." (second line in the accent green).
  One CTA label everywhere: "Book a free walkthrough" ("Free walkthrough" in the nav under 400px).
- Token structure after the Cohere DESIGN.md (white canvas, one deep-green band, rounded media
  cards, pill actions, flat depth). Palette is our own, green because "hara" is Hindi for green:
  `--bg #FBFCFB`, `--ink #0E1B17`, `--ink-muted #4A5954`, `--stone #EDF2EE`, ONE accent
  `--accent #13503F` (white text 9.3:1), `--band #0B2F27` for the security section only.
- Type: Mona Sans only. Headings at `font-stretch: 112%`, weight 560, tight tracking; HARA
  logotype at 125% width, 0.14em tracking. Body at normal width. Hero lines never wrap mid-sentence.
- Shapes: interactive = pill; cards 24px; photos inside cards 16px; panels 32px. Nothing sharp.
- Motion: hero rises on load (CSS), sections settle in once, cards lift 4px with a pre-rendered
  shadow fading in (transform + opacity only), week grid fills in a diagonal wave, map lights up.
  Removed for good: loader, squeegee wordmark, photo wipes, button glint, clock pill, night story.
- Nav always visible. Why cards are links to their sections (the hover lift implies a click).
- Logo (2026-09-28, Krishna picked "Tower" and asked for the tower to be redesigned): a rounded
  green square with an H whose right stem rises into an office tower with a slanted roof (echoes
  the rooflines and swoosh of the client's old navy logo). Wordmark HARA in Mona Sans 680 at 125%
  width, 0.12em tracking; subline FACILITIES CLEANING 540 at 108%, 0.2em. Mark path lives inline in
  `index.html` (header, footer, viewer) and in `public/favicon.svg`. Source kit, generator
  (`build_logo.py`, outlines the lettering from the site's font) and SVG/PNG exports:
  `docs/client/logo/` (gitignored).
- Stills only: super-clean offices, no people, no before/after, no video. Hero = 10 dawn office,
  security band = 02 reception, service cards use the other 7.
- Phone: native scroll, no pinning/parallax, `svh` units, services become a swipe row, service
  lists start closed, map labels only Toronto/Burlington/Newmarket/Oshawa.
- Light theme only ("white gives very clean vibes"). No background gradients.
- The security section's practices are claims: the client must confirm them before a real launch.

## Conventions

- Visible copy: no em or en dashes. Sentence case. One CTA label per intent ("Book a free walkthrough").
- Every animation honours `prefers-reduced-motion` (JS checks + CSS override at the end of style.css).
- Contrast: body text >= 4.5:1. `translate="no"` on the brand. `[hidden]` is forced to display:none.
- Placeholders still in the page: phone `(416) 555-0199`, `hello@example.com`. Footer says so.
- Company facts come from the client's DOCX (`docs/client/hara-website-direction.docx`). Krishna
  directs the site; use the doc for company information only, not as layout instructions.

## Deploy

`npm run deploy` (runs tests, builds production, `wrangler deploy --env production`). Run
`security-protocol` before every deploy; latest report `security/golive/2026-09-28-backend-GO.md`.
Wrangler is logged in to Krishna's Cloudflare account (OAuth; token scopes include D1, Workers and
Turnstile widgets). Connecting the domain: `docs/DEPLOY.md`.

## Gotchas (learned the hard way)

- CSP is a build-only `<meta>` (GitHub Pages can't set headers): `default-src 'self'`, no inline
  scripts/styles in markup. CSSOM changes from JS (`el.style.x = ...`, GSAP) are fine. Dev server is exempt.
- Never clip an `<img loading="lazy">` fully (clip-path): Chrome won't lazy-load it. Reveal photos
  with opacity/transform on a wrapper instead.
- `git push` of the 13 MB image set 400s without `http.postBuffer 524288000`.
- Higgsfield spend gate: paid runs need Krishna to type `yes` in a terminal. Start them with
  `run_in_terminal` AND show the terminal pane (he looked in the macOS Terminal app once and never
  saw the prompt). A self-approving `--yes` via Bash is blocked by the auto-mode classifier.
- The security scan greps every file for "webhook"/"claude"; our own reports trigger false positives.
  Verify matches are outside `src/`, `index.html`, `dist/` before treating them as real.
- Lenis already honours CSS `scroll-padding-top` and `scroll-margin-top`: never pass a manual
  offset to `lenis.scrollTo` or it doubles. `.section` uses a negative scroll-margin so nav links
  land on the heading.
- `env.ASSETS.fetch()` responses DO carry `_headers` (verified), so routing every request through
  the Worker for the https redirect keeps the page security headers.
- workers.dev serves plain http unless the Worker redirects it (it does now).
- Before launch, confirm 2FA on every account (Cloudflare `GET /user` shows it); never record
  account security status in this public repo.
- Turnstile's own iframe logs console noise (OTS font warning, "No available adapters"); not ours.
- Worker responses built in code do NOT get `_headers`; `worker/http.js` sets the API's own security headers.
- Wrangler environments don't inherit vars, routes or bindings: `env.production` must repeat them.
- Turnstile test keys: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`
  (always pass). Siteverify with test keys reports a placeholder hostname, so `TURNSTILE_HOSTNAMES`
  is empty locally.
- The home-level `~/.claude/launch.json` (not the project's) is what the Browser pane reads.
- The Browser pane pauses requestAnimationFrame when hidden (Lenis stops, screenshots go blank).
  Use the playwright MCP for scroll/animation tests and final screenshots.
