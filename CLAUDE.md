# HARA Facilities Cleaning: company website

Website for Krishna's friend's office-cleaning company in the Greater Toronto Area. The name is
**HARA Facilities Cleaning** (the client writes HARA in caps). "Afterhours" was the working name;
it survives only in the repo name and the old GitHub Pages URL. Client material lives in
`docs/client/` (gitignored: the repo is public). Read `HANDOFF.md` for where things stand.

- **Production (live, pre-domain):** https://hara-website.chaudharikrishna0415.workers.dev
  (Cloudflare Worker `hara-website` in Krishna's account, version `4411dbf9` as of 2026-10-01,
  D1 `hara-walkthroughs`, `noindex`). The old GitHub Pages URL
  (https://kkrishnaac.github.io/afterhours-demo/) redirects to production.
- **The Studio design is live on production (2026-10-01, late):** Krishna chose it in the design
  lab (https://hara-design-lab.chaudharikrishna0415.workers.dev, source `design-lab/`, see "Design
  lab" and "Hero logo intro" below) and asked for it on the live site the same night. The port
  kept the real four-step form, the legal pages, the CSP and the tests (section "Studio on
  production" below). The design lab is offline since that night (`workers_dev: false` in
  `design-lab/wrangler.jsonc`; set it back to true and deploy to bring it back).
  **Next session:** the print collateral in `~/hara-print` in the Studio language
  (`HANDOFF.md` section 0), then the domain.
- **Status (2026-10-01): launch-ready apart from the domain.** Phase 5 QA done (Lighthouse mobile
  92 to 96, desktop 100, axe 0 violations, three engines + phone emulation, load test), full
  security gate GO (`security/golive/2026-10-01-full-GO.md`), 67 tests pass, tree clean.
  Worker-error alert is set in Cloudflare. Left: Krishna's 2FA confirmation (`HANDOFF.md` section 5), then the
  domain (`docs/DEPLOY.md`). One page only: see Scope below.
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

- **Front end:** Vite 8 (vanilla JS modules, plain CSS), the Studio design in `src/studio/`:
  Archivo (display, one static instance) and Hanken Grotesk (body), both OFL and self-hosted in `src/studio/fonts`,
  Motion 13 (`animate`, bundled) for the hero logo intro, Phosphor icons inlined at build time.
  Native scrolling; the desktop photo reel is a CSS scroll timeline with a grid fallback. Page JS
  25 KB gzip, CSS 8.6 KB, fonts 49 KB (Archivo as one static instance, 850 / 112%). No framework, no Tailwind. (Lenis, three.js and Mona Sans went with
  the old design; git history has them.)
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
npm test               # 67 Worker tests inside workerd with a local D1 (incl. test/stress.test.js)
npm run contrast       # WCAG check of every Studio colour pair the site uses
npm run deploy         # tests + production build + wrangler deploy --env production
npm run db:migrate     # apply new D1 migrations to production
npm run leads          # CSV of recent walkthrough requests -> docs/client/leads/ (gitignored)
npm run data-request -- export|delete <email>   # PIPEDA access / deletion requests
node scripts/qa/matrix.mjs <url> /tmp   # browser stress matrix (see scripts/qa/README.md)
```

## File map

| Path | What it is |
|---|---|
| `index.html` | Home page, the Studio design: header (reel or grid toggle, CTA; wide screens), the phone menu bar, the dial menu with its knob, the reel (hero with the logo intro + 7 photo cards), then on navy: why HARA, what a visit includes, hours (live Toronto clock), security, how it works, service area (city links that preselect the form), the walkthrough form |
| `privacy.html`, `terms.html`, `accessibility.html`, `404.html` | Legal pages (PIPEDA, CASL, AODA) and 404, `<body class="page">`. Entry script `src/page.js` (styles only) |
| `partials/` | `nav-page.html` (header for the simple pages), `footer.html` (all pages: white logo on navy, phone, email, legal links), `hero-logo.html` (generated by `design-lab/logo-layers.mjs`, never hand-edit) |
| `vite.config.js` | `static-markup` plugin (`<x-include>`, `<i data-icon>` Phosphor SVGs, `<x-photo>` pictures), CSP + `_headers`, font preload, `siteUrl` (robots/sitemap/canonical/security.txt), multi-page input |
| `src/studio/` | The Studio design. CSS in load order: `base.css` (tokens, Hanken), `g.css` (the coreastudios.com system, Archivo), `h.css` (HARA colours and every change Krishna made, dated), `site.css` (live-site additions: the form on navy, city links, skip link, dial contrast, reel fallback, legal pages). JS: `studio.js` (dial scroll-spy, knob to logo, toggle, image fade, clock), `logo-intro.js` (Motion), `tab-menu.js` (phone menu bar). Kept in step with `design-lab/src/` |
| `src/main.js`, `src/page.js` | Entries: the home page (Studio CSS + JS + the form); the simple pages (CSS only) |
| `src/logo-parts.js` | The traced logo parts; the source for `design-lab/logo-layers.mjs` |
| `src/quote.js`, `src/turnstile.js` | 4-step walkthrough form (live build posts to the Worker; demo build sends nothing); Turnstile loaded only at the last step |
| `src/form-options.js`, `src/cities.js` | Form choices shared by page and Worker (tests check `index.html` matches) |
| `src/photos.js` | Photo data (also used by vite.config.js for `<x-photo>`) |
| `worker/` | `index.js` (router, https redirect, cron), `walkthrough.js` (the endpoint), `validate.js`, `turnstile.js`, `email.js` (escaped templates, Resend, hold, dry-run), `maintenance.js` (retries, 24-month retention), `http.js` (API headers, PII-free logs) |
| `migrations/`, `test/`, `vitest.config.js` | D1 schema (no IPs, CASL consent fields); Worker tests via `@cloudflare/vitest-plugin`; `test/stress.test.js` = concurrency + fuzz |
| `wrangler.jsonc` | Worker config: local defaults at top level, `env.production` for the live Worker |
| `scripts/` | `contrast.mjs` (palette WCAG check), `leads.mjs` (leads/PIPEDA CLI), `optimize-images.mjs` (4K masters -> AVIF/WebP), `favicons.mjs`, `qa/` (viewport matrix, fake-clock frames, cross-browser + device pass, axe scan, keyboard pass, accessibility tree, form end to end, load test; see its README) |
| `public/` | `brand/` (logo SVGs, including the intro's generated `logo-*.svg` layers), `favicon.svg`, `apple-touch-icon.png`, `og.jpg` (branded share image), `img/` photo ladders |
| `src/analytics.js`, `src/structured-data.js`, `src/business.js`, `scripts/favicons.mjs` | `analytics.js`: Cloudflare Web Analytics beacon, off until `CF_BEACON_TOKEN` is set (opens the CSP and adds a privacy sentence only then). `structured-data.js`: the home page's LocalBusiness JSON-LD (service-area business, no address, no hours, no ratings), emitted only when `VITE_SITE_URL` is set. `business.js`: name, phone, email. `favicons.mjs` builds the tab icons (logo mark on a white tile: favicon.svg/.ico, 48 and 192 px PNGs) from `public/brand/hara-mark.svg`; re-run it if `export_brand.py` rewrites `favicon.svg`. Icon links carry `?v=2` to beat browser caches |
| `docs/DEPLOY.md` | Production state, launch blockers, connect-the-domain runbook, backups and restore (rehearsed), everyday commands |
| `security/golive/` | Go-live reports; latest full gate `2026-10-01-full-GO.md` (with the Studio production deploy at its end) |
| `docs/client/` (gitignored) | Client brief + priorities, company notes, SOW (docx + generator), security plan (PDF), logo kit, leads exports |

Photos (since 2026-10-01): Unsplash originals chosen by Krishna (Unsplash License: free for
commercial use, no attribution required; photo ids and page slugs in `src/photos.js` comments
and `/tmp`-free record below). Masters in `assets/raw` (gitignored, 2300 to 6240 px wide), ladders
in `public/img` via `npm run images`, data (id, title, alt, intrinsic size) in `src/photos.js`.
Ids 11 to 19; the old AI-generated Higgsfield stills (01 to 10) are gone. Unsplash photo ids:
11 pYlBAu3de0w, 12 yWwob8kwOCk, 13 rm3PeMyY2GU, 14 8B0LHe9wpX4 (Toronto), 15 Kk9ZMyIDovI,
17 Oo_KFwRGCsg, 18 pQ5hSOrkYgE, 19 tzhtRGvuA0I (Toronto, security band). Spare: W1 hgPtOHE82Ec.
Stills only: no people, no before/after, no video.

## Design lab (`design-lab/`)

The Studio design, for client review, on a separate assets-only Worker (`hara-design-lab`,
noindex): https://hara-design-lab.chaudharikrishna0415.workers.dev. It is a single page,
`design-lab/src/index.html`, which is also the client link. Build: `node design-lab/build.mjs`
expands `<x-include>`, `<i data-icon>` (Phosphor) and `<x-img id sizes alt>` (webp ladder from
`design-lab/public/img`) into `design-lab/dist/`, copies `src/*.css` and `src/*.js`, writes
`_headers` (noindex + CSP, `script-src 'self'`) and `_redirects` (`/a`, `/b`, `/g`, `/h` 301 to `/`).
Deploy: `cd design-lab && npx wrangler deploy` (the new version can take 10 to 15 s to show).
Local preview: `python3 -m http.server 4340 --directory design-lab/dist`.

Files: `index.html` (the page), `_logo.html` (generated hero logo layers, see "Hero logo intro"),
`_form.html` (booking step 1 preview, links to the production form), `base.css` (palette tokens,
Hanken Grotesk), `g.css` (the Studio system after coreastudios.com: dial menu, reel, panels,
gradient blob, clock, buttons; Archivo display; also the loader and glare, now switched off),
`h.css` (imports `g.css`; HARA colours and every change Krishna made, in order, with dated
comments: white hero with no box, centred, solid header, the phone menu tab, no boxes below the
photos, white-to-navy colour run, navy footer with the white logo, the logo intro states),
`g.js` (dial scroll-spy and its white-on-dark switch, reel/grid toggle, image fade, Toronto clock,
the old phone overlay; the loader, glare and overlay code is inert), `h-logo.js` (the logo intro),
`tab-menu.js` (the menu tab below 1200px). Fonts in
`public/fonts`: Hanken Grotesk and Archivo (OFL, from `@fontsource-variable/*`), standing in for
Corea's commercial TWK Lausanne and Record Disc.

History (2026-10-01): directions A to F were rejected; G rebuilt coreastudios.com's system for HARA
and Krishna loved it; H (G in HARA's colours) became the Studio design; a Collection-style B was
built and deleted. All of them are in git history only (B: commit ab362f1; G: `git log --
design-lab/src/g.html`).
**To put the Studio design on production:** see `HANDOFF.md` section 5.

## Hero logo intro (design lab, 2026-10-01)

A one-time intro on the Studio page's hero logo, built to Krishna's corrections over three
versions. It opens on a normal H (the logo H's own uprights, a straight crossbar). A small star
appears at the ring's sharp tip beside the left upright, follows the ring's centre line the way
the ring is drawn (down round the left end, along the front through the middle of the H, into
the right curl), draws the ring behind it, and turns the H into the logo's H where it has passed.
Then it winks out and the three sparkles twinkle on in place. About 1.7 s from the load event.
The H's uprights are clean rectangles with level tops (Krishna, 2026-10-01 late: the traced right
upright looked crooked); the header mark, footer logo and print still carry the traced H.

- `design-lab/logo-layers.mjs` generates every layer from `src/logo-parts.js` and writes
  `design-lab/src/_logo.html`. Edit `CENTRE` (the star's path), `CROSSBAR`, or the uprights
  (`LEFT`, `RIGHT`, `TOP`, `FOOT`) there, never the generated files. Run it, then `node design-lab/build.mjs`.
- `design-lab/src/h-logo.js` is the choreography, on Motion 13.5's vanilla `animate()`
  (`design-lab/public/motion.js` = `node_modules/motion/dist/motion.js`, `window.Motion`). The
  ring is revealed by a stroke along the centre line in an SVG mask (`pathLength="1"`, dashoffset
  1 to 0). The normal H and the real H pieces are clipped to opposite sides of the star with the
  same edge, so only one H is ever visible and the uprights never change.
- `design-lab/src/h.css` holds the resting states, a no-script failsafe (finished logo after
  2.4 s) and reduced motion (finished logo at once).
- `design-lab/logo-frames.mjs [url] [outDir] [desktop|phone] [ms,...]` captures cropped frames.
  Look at them, desktop and phone, before and after every change.
- Krishna's rules: nothing on the H moves or is laid over it (no jolt, shine or glints); the H
  renders perfectly smooth; the star starts at the ring's sharp left tip and travels the way the
  ring is drawn; sparkles appear in place after the cut; quick; no loader before it.

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

The table above is the old design's token set (still in `src/studio/base.css`). The Studio design
uses `h.css` `:root`: `--bg` #FAFBFD, `--paper` #0E1A33 (text), `--navy` #0B3A80, `--sky` #0A95EF,
`--deep` #03275A, `--white`, with navy tints `--paper-20` and `--paper-08`.

**Where colour lives (change all of them together):** `src/studio/h.css` `:root`, the colour run
(`--run` and the `.reel-wrap` gradients in `h.css`), `src/studio/site.css` (form on navy, the
menu-option `#DDE4EE`, error `#FFC4BD`), the stops copied into `src/studio/tab-menu.js` (the phone
bar's colour), `<meta name="theme-color">` in all five pages, `worker/email.js` inline colours,
and the logo files. After any change: `npm run contrast` (all PASS), then desktop + phone screenshots.

### Logo files (generated, don't hand-edit)

- `public/brand/hara-logo.svg` full logo (hero rest state, footer), `hara-lockup.svg` mark + HARA
  (nav, photo viewer), `hara-mark.svg` = `public/favicon.svg`; `public/apple-touch-icon.png`
  (mark on white, 180px); `public/og.jpg` (source `docs/client/logo/og.html`, 1200x630 via the dev server).
- `src/logo-parts.js`: the 16 traced parts (paths, gradients, boxes); `design-lab/logo-layers.mjs`
  builds the hero intro's layers from them.
- Pipeline (in `docs/client/logo/`, gitignored): `client-logo-approved.jpg` (the client's file) ->
  `vectorize_original.py` (ink-coverage masks, seeded split of touching parts, potrace; building
  bars and windows are exact polygons) -> `original-vector/parts.json` + `hara-logo.svg` ->
  `export_brand.py` writes everything listed above. The tracer needs a venv with pillow, numpy,
  scipy and potracer; `export_brand.py` runs on plain python3.
- Earlier explorations (tiles, custom lettering, font rounds) and the green kit are in
  `docs/client/logo/navy/` and `docs/client/logo/archive/`; none of them is in use.

### Studio on production (2026-10-01, late)

The design lab's Studio page, moved onto the live site when Krishna asked for it ("commit and push
this new design onto our live website"). What changed from the design lab, and why:
- The real four-step form (`src/quote.js`, unchanged) sits in the navy "Book" panel instead of the
  step-1 preview; its fields, errors, consent, Turnstile, send error and thank-you are styled in
  `src/studio/site.css`. The city buttons are links (`data-city`) that preselect the form.
- `<x-photo>` (AVIF + WebP ladders) instead of the lab's `<x-img>` (WebP only); a visible skip
  link; the panels are `<section>` landmarks; the hidden "What we clean" heading follows the h1.
- The dial's dimmed items are 65% and 80% (the lab had 20% and 40%, below WCAG AA).
- Where CSS scroll timelines are missing (Firefox, Safari before 26), wide screens get the grid
  layout instead of a reel that cannot move.
- One phone number everywhere: (437) 980-3464. The simple pages wear the Studio header and footer.
- Removed with the old design: the three.js hero build, Lenis, Mona Sans, the reveal script, the
  GTA map, the photo viewer and `src/style.css` (git history has them).
Verified before the deploy: 67 tests, the form end to end at 1440 and 390 px, axe 0 violations on
every page and form step, Chromium, WebKit and Firefox on desktop and phone, the same hero sizes
and menu behaviour as the lab. Lighthouse on the live site afterwards: phone 97 (it was 87 until
Archivo became one static instance and the skyline photo lazy), desktop 100; accessibility and
best practices 100; SEO 100 with a domain set (66 before the domain only because of `noindex`).
The stress matrix was not re-run.

## Design decisions (Krishna's calls; don't re-litigate without him)

Client priorities (`docs/client/company-notes.md`): flexible hours (any day, any time), offices
only for now, security conscious, free walkthrough before every quote.
- Hero headline (Krishna, 2026-10-01): "Tomorrow / starts clean." (second line in the accent). It replaced
  "Every desk ready. Every door locked.", which lives on only in the og.html history.
  The same line is the tagline in the footer under the logo (`.footer__tag`). Earlier candidate "Ready before you
  are." was replaced because it repeated "ready" from the headline.
  One CTA label everywhere: "Book a free walkthrough" ("Free walkthrough" in the nav under 400px).
- Type: production uses Mona Sans (headings `font-stretch: 112%`, weight 560). **Client
  (2026-10-01): too heavy.** The Studio design replaces it with Archivo for display (wide 112%,
  weight 850, uppercase, used for the headline and section titles) and Hanken Grotesk for
  everything else. Hero lines never wrap mid-sentence.
- Shapes: production: pills, 24px cards, 16px photos, 32px panels. Studio: 4px buttons, 7px photo
  cards, and no boxes anywhere except the photos (Krishna, 2026-10-01).
- Motion: professional and quiet. Hero rises on load, sections settle in once, cards lift 4px
  (transform + opacity only), week grid wave, map light-up. Removed for good: loader, squeegee
  wordmark, photo wipes, button glint, clock pill, the night story, and any other 3D (the one
  exception is the hero logo build below).
- Header: production: slim floating bar. Studio (Krishna, 2026-10-01 late, many rounds): no
  company name anywhere. Wide screens: toggle + CTA bar; the hero sized to the screen and centred;
  the dial fades in with the logo intro; a navy knob at the dial's pivot on the hero, turning into
  the logo mark once the hero logo is out of sight (tap: back to the hero). Phones: no header; a
  top bar in the page's own colour (white, sky, navy as the page) with "Menu" in deep navy or white
  slides in only while scrolling down past the hero, and drops the six options as buttons. History:
  an always-open row of section buttons ("super accessible"), then a tab at the bottom, then a
  gradient bar with a white box; each replaced at his request. Details: HANDOFF.md section 2.
- Colour: production is light only. **Studio (Krishna, 2026-10-01):** white page and hero; a fixed
  gradient (no animation) that stays white until the Reception and lounges card, then runs sky to
  dark navy; everything below the photos sits on dark navy with white type; the page ends on navy
  with the white logo. No colour sweep on navigation, no blur-in loader, no bottom clock bar.
- Phone: native scroll, no pinning or parallax, `svh` units. In the Studio design the photo cards
  stack full width and fill with their photo; blur, backdrop filters and the drifting gradient are
  off below 1200px so scrolling stays tight (Krishna reported a "loose" scroll on his iPhone).
- Logo: the client's original (2026-09-28), shown off in the hero. This reverses his earlier "no
  swooshes, sparkles or gradients" wish; it is his call. Four rounds of new designs were rejected.
- 3D: gone with the old design (2026-10-01); the hero now plays the vector logo intro (see "Hero
  logo intro"). The three.js build is in git history.
  Previously rejected: sky-blue + warm beige gradient palette.
- Security section (Krishna, 2026-10-01, from the client): HARA's security role is alarming and
  disarming, and responsibility for key fobs and access cards. The band now makes exactly those
  two claims; the earlier six (same team, confidential by default, lock-up check, visit log) were
  removed as unconfirmed. The "Why HARA" security card matches.

## Print collateral (next session, after the logo intro)

`~/hara-print` (its own local git, not pushed): business card + letter tri-fold brochure,
`python3 build.py`, ReportLab in DeviceCMYK, PDF/X-1a via a user-built Ghostscript, 100+
preflight checks (last run: 103 pass, 1 expected fail, the URL check, until the domain resolves).
Content (`haraprint/content.py`) is current: "Tomorrow starts clean.", (437) 980-3464 only, the two
confirmed security practices. Still old: the layout and type (Mona Sans, rounded cards), the
photos (AI stills; replace with the Unsplash masters in `assets/raw`), and the wording calling the
photos generated (`build.py`, `haraprint/docs.py`). Redraw both pieces in the Studio language
(Archivo display, Hanken Grotesk body, navy and white, no boxes, photos first, navy end). Confirm
`haracleaning.ca` with Krishna for the printed URL and QR. Krishna's rules: only the website's
details on the card (no personal name or title); show PROOF PDFs as images before anything is
final. Details: `HANDOFF.md` section 3. Memory: `hara-print-collateral.md`.

## Conventions

- Visible copy: no em or en dashes. Sentence case. One CTA label per intent.
- Every animation honours `prefers-reduced-motion` (JS checks + the override in `src/studio/base.css`).
- Contrast: every text pair >= 4.5:1 (`npm run contrast`). `translate="no"` on the brand.
  `[hidden]` is forced to `display: none`.
- **Scope (Krishna, 2026-10-01): the client wants a simple ONE-PAGE website, nothing more.** No Services/Security/FAQ/About/Contact pages, no city pages, no Service areas hub, no Google Business Profile or directory listings (the SOW's Phase 4 is out for now). They were built and live briefly, then removed; they are in git under the tag `multi-page-archive` (`git checkout multi-page-archive -- <files>` restores them). Don't rebuild them unless he asks. The legal pages (privacy, terms, accessibility) stay: the SOW requires them.
- Hours: HARA has no set hours; they are available every day of the week, at any time a contract needs. The site shows no hours table and the structured data carries none.
- Home Areas chips (all 16 cities) are links: a tap scrolls to the form with the city already chosen (`quote.js` `pickCity`; `?city=` is matched against the allowlist).
- Contact details (real, from Krishna 2026-10-01): **phone (437) 980-3464 only** (`tel:+14379803464`), his
  instruction that evening ("the only phone number that should be available on the website"); the
  design lab and the print collateral carry it. The live site still shows (416) 990-3995 with the
  437 number second, until the redesign is ported: swap it then (`src/business.js`, `index.html`,
  `partials/footer.html`, `worker/email.js`, structured data). Email harafacilitiescleaning@gmail.com. Still placeholders: `EMAIL_FROM` and `LEAD_TO_EMAIL` in `wrangler.jsonc`
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
- Never clip an `<img loading="lazy">` fully (clip-path): Chrome won't lazy-load it.
- `.legal a` styles must exclude `.button` and `.call`, or buttons on the simple pages lose their text colour.
- The security scan greps every file for "webhook"/"claude"; our own docs trigger false positives,
  and `.wrangler/tmp` source maps trip its SQL check. Verify matches are in shipped code first.
- The Browser pane pauses requestAnimationFrame when hidden (animations stop, screenshots go blank).
  Use the playwright MCP for scroll/animation tests and screenshots, or `scripts/qa/` when both
  Playwright MCPs are locked by another Claude session ("Browser is already in use"). The pane
  reads the home-level `~/.claude/launch.json`, not the project's.
- Measure LCP, CLS and JS-off behaviour on a production build (`afterhours-dist`, :4332) or the
  live URL, never the Vite dev server: dev injects CSS through JavaScript.
- Lighthouse: run it ALONE (parallel browser runs cost 40 points of CPU contention in one
  measurement) and, for the SEO score, on a build with a placeholder `VITE_SITE_URL` so the
  pre-domain `noindex` is not counted. Mobile sits at 92 to 96; the remaining cost is the
  simulated LCP of the nav logo over slow 4G.
- WebKit logs a `style-src-attr` CSP violation on every load. It is WebKit's own `<select>`
  styling (fires with JS off); the select works. Don't add `unsafe-inline` for it.
- The Cloudflare rate limiter is approximate (per location, synced with a delay): a burst lets a
  few more than 5 through; Turnstile still stops them. The workerd tests are exact.
- `wrangler tail hara-website` without `--env production` (that appends `-production`).
  `wrangler d1 time-travel restore` has no `-y`. A new `workers.dev` name can 404 for ~1 minute.
- The local Worker only accepts the form from `http://localhost:8787` (`ALLOWED_ORIGINS`):
  test the form at that address, not `127.0.0.1` (that gets a correct 403).
- axe-core cannot be injected under the real CSP: `scripts/qa/axe.mjs` uses `bypassCSP` (testing
  only). Playwright's screenshots in WebKit log "Refused to apply a stylesheet" for the same
  reason; that is the harness, not the site.
- The hero logo's layers and partial are generated for both the design lab and the live site by
  `node design-lab/logo-layers.mjs`; edit the generator, never `partials/hero-logo.html`.
- `src/studio/` is a copy of the design lab's CSS and JS (fonts, Motion import and `site.css` aside).
  Change the live site there; mirror a change into `design-lab/src/` only while the lab is in use.
- Logo pipeline venv doesn't survive sessions: recreate with fonttools, brotli, skia-pathops,
  pillow, numpy, scipy, potracer.
- Files in `docs/client/` can be viewed through the dev server (`/docs/client/...`), which is how
  the logo sheets and share image are rendered.
- The Write tool can turn ` `-style escapes in JS source into literal characters; write such
  regexes with Python or check the bytes afterwards.
- `git push` of large image sets 400s without `http.postBuffer 524288000`.
- Motion's vanilla `animate()` on `scale`/`rotate`/`x` writes the element's whole `transform`, so
  it wipes any position you set yourself. Keep position on a wrapper (or, for SVG, set the
  `transform` attribute yourself in `onUpdate`, as `h-logo.js` does for the star).
- Sparkles drawn on full-size logo layers must scale from their own centre: `transform-origin`
  per layer in percentages of the logo box (`h.css`), or they fly across the logo. Target them by
  class (`.logo-cut__spark--1`), not `:nth-of-type`: they are the 6th to 8th `img` in the stack.
- Two shapes that only meet edge to edge show a hairline seam when antialiased at small sizes;
  overlap same-colour fills by several units (the starting H's gap fills overlap by 9).
- iPhone Safari tints the strip behind the clock from the background-color of a fixed bar at the
  top (not its background-image). The phone menu bar sets its background-color to the page colour
  at its top edge every frame (`tab-menu.js`); a navy fallback colour once turned that strip navy
  over the white page.
- Krishna reviews on his iPhone and sends WhatsApp screen recordings to `~/Downloads`. `ffmpeg` is
  not installed: read them with Python OpenCV (`cv2`) into a contact sheet (`HANDOFF.md` section 6).
  His screenshots can show a Safari-cached old version; check before "fixing" something twice.
- Higgsfield spend gate: paid runs need Krishna to type `yes` in a terminal. Start them with
  `run_in_terminal` AND show the terminal pane.
