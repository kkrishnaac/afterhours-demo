# Handoff: HARA website

Updated 2026-10-01. Read in this order: this file, `CLAUDE.md`, `docs/DEPLOY.md`,
`security/golive/2026-09-28-full-GO.md`, and the private SOW in `docs/client/`.

**Goal of the next session:** finish everything so that the only thing left is buying the domain
and connecting it. The prompt to start that session is in section 9.

---

## 1. Summary

- The site is **live before the domain**, at https://hara-website.chaudharikrishna0415.workers.dev
  (`noindex`, link not shared publicly). It carries the client's own logo, a navy palette
  sampled from it, a one-time 3D build of the logo in the hero, and a working walkthrough request
  form backed by a Cloudflare Worker and D1.
- Security gate: **GO** for the pre-domain deployment, then a round of fixes and stress tests
  (all deployed). 60 tests pass. `npm audit`: 0 vulnerabilities.
- **The working tree is not clean** (section 3): already-deployed work is uncommitted, and one
  CSS change is neither deployed nor verified. Sort that out first.
- Still to do before the domain: the SOW's supporting and city pages, real company details,
  analytics, final QA to SOW standards, a final gate, and the client guide (section 6).

## 2. What is live

| Thing | State |
|---|---|
| Production URL | https://hara-website.chaudharikrishna0415.workers.dev (Worker `hara-website`) |
| Live version | `765c3a63` (deployed 2026-09-29 03:28 UTC from the working tree, see section 3) |
| Database | D1 `hara-walkthroughs`, table `walkthrough_requests`; 0 real requests at last check |
| Email | `EMAIL_MODE=hold`: requests are stored, HARA's notifications wait for the domain. `EMAIL_FROM` and `LEAD_TO_EMAIL` are `example.com` placeholders. No Resend key set |
| Secrets in the Worker | `TURNSTILE_SECRET_KEY` only |
| Indexing | `noindex` on every page until `VITE_SITE_URL` is set at the domain step |
| Old GitHub Pages URL | https://kkrishnaac.github.io/afterhours-demo/ redirects to production |
| Original "Afterhours" design | https://afterhours-design.chaudharikrishna0415.workers.dev: a separate static Worker built from commit `dea9337` (the pre-HARA demo), `noindex`, form sends nothing. Krishna asked for it as a reference; keep or delete (`npx wrangler delete afterhours-design`) on his say |

## 3. Repository state (exact, 2026-10-01)

- `main` at `82cb555` = `origin/main` (public repo `kkrishnaac/afterhours-demo`).
- **Uncommitted but already live in `765c3a63`:**
  - `worker/walkthrough.js`: rate limit runs before the body is read; the double-submit check
    and the insert are one `INSERT ... SELECT ... WHERE NOT EXISTS` statement (stress test showed
    20 simultaneous submits stored 20 rows; now 1).
  - `worker/http.js`: `readLimited` reads the stream with a running count and cancels past 8 KB
    (a chunked 4 MB body used to be buffered whole).
  - `src/quote.js`: a chip click's 260 ms auto-advance only advances from the step it started on
    (chip + quick "Next" used to skip the timing question).
  - `package.json` / lock: `overrides.undici ^7.29.1` (GHSA-3wwx-pv8p-q78v in dev tooling),
    vite 8.3.1, sharp 0.35.5.
  - `test/walkthrough.test.js` (+2 tests), new `test/stress.test.js` (6 stress/fuzz tests).
  - `docs/DEPLOY.md`: "Backups and restore" runbook (rehearsed).
  - `security/golive/2026-09-28-full-GO.md`: the "Fixes and stress tests" addendum.
- **Uncommitted, NOT deployed, NOT verified:** `src/style.css`, the hero "white cover". The
  logo `<img>` is now painted from the first frame under a white `::after` cover (the 3D canvas
  plays above the cover), so the logo counts as the page's main content at once. On the live
  site LCP is ~3.6 s on the animated path because the logo stays hidden until the build ends. On
  the dev server the cover gave LCP ~0.3 s, but dev injects CSS through JS, so its CLS and JS-off
  numbers are meaningless. Verify on a production build (section 6, step 1) and deploy or revert
  (`git checkout src/style.css`).
- **New, uncommitted:** `scripts/qa/` (browser matrix, fake-clock frames, form end to end, load
  test; see its README).
- A stale git worktree registration for the Afterhours build (in a deleted scratch folder):
  run `git worktree prune`. Local branches `backend-walkthrough`, `hara-redesign`, `navy-brand`
  are fully merged into `main` and can be deleted.

## 4. What is done

- **Front end:** one-page site (hero, why HARA, any day any time, what we clean with photo viewer,
  security band, how it works, areas with map, 4-step walkthrough form), legal pages (privacy,
  terms, accessibility), 404, share image. Mona Sans, rounded shapes, quiet motion, light theme.
- **Brand:** the client's original logo traced to 16 vector parts; `public/brand/` lockups;
  favicon, touch icon and share image; palette sampled from the logo (`CLAUDE.md` > Brand).
- **Hero:** the logo builds itself once in 3D (three.js, lazy chunk), then hands over to crisp
  vector; static for reduced motion, no WebGL, off-screen loads, or three.js slower than 2.5 s.
- **Backend:** `POST /api/walkthrough` with origin allowlist, JSON only, 8 KB cap, rate limit
  (5 a minute per IP, approximate by Cloudflare's design), schema allowlist, honeypot, Turnstile
  checked server-side, parameterised D1 writes, CASL consent fields, email hold, retries and
  24-month retention on a 15-minute cron, PII-free logs, `npm run leads` and PIPEDA scripts.
- **Security:** full 50-threat gate GO; fixes since then listed above. Headers live: CSP without
  `unsafe-inline`, HSTS, frame denial, nosniff, referrer and permissions policies, COOP/CORP.
- **Backups:** D1 Time Travel point-in-time restore and export/import both rehearsed on a scratch
  database (deleted afterwards); commands in `docs/DEPLOY.md`.

## 5. Test and audit evidence (latest)

- `npm test`: 60 pass, including `test/stress.test.js`: 150 simultaneous visitors (150 rows),
  20 simultaneous duplicates (1 row), 40-request burst from one address (at most 5 accepted),
  34 hostile payloads + 400 random JSON documents (never a 5xx, nothing invalid stored), 5,000
  random validator inputs (anything accepted meets every rule).
- Production load (2026-09-29): 1,500 page/asset requests at concurrency 50: 214 req/s, p50
  172 ms, p95 387 ms, p99 741 ms, 0 errors. 300-request API burst: 283 x 429, 17 x 400, 0 x 5xx
  (17 got past the approximate limiter and were stopped by validation; Turnstile also guards).
- Browser matrix on production `765c3a63`: 320 to 2560 px wide, the 3D build settles in ~3.5 s,
  no horizontal overflow, CLS 0, WebGL context disposed, CTA above the fold, no console errors.
  LCP ~3.6 s (the open item above). Slow phone (6x CPU, 3G) and no-WebGL fall back to the
  static logo; JS off shows the logo through the CSS failsafe; reduced motion is static.
- Form end to end in a real browser against the local Worker at 1440, 1024, 390 and 320 px:
  empty steps blocked, bad email flagged, request stored with every answer, success panel shown,
  scheduled job clean.
- Not yet done: Safari/WebKit and Firefox engines, Lighthouse, axe/keyboard/screen-reader audit.

## 6. What is left, by who

### A. The next session can do these now (no domain needed)

1. **Settle the working tree.** Measure the `src/style.css` cover on a production build
   (`npm run build:prod`, launch config `afterhours-dist` on :4332,
   `node scripts/qa/matrix.mjs http://localhost:4332/ /tmp`): CLS must stay 0 everywhere, JS-off
   must show the logo with no horizontal overflow, LCP should fall below 1 s. Keep and deploy it
   if it passes, otherwise revert. Commit in logical pieces, deploy, push, prune the worktree.
2. **SOW Phase 4:** Services, Security, FAQ, About, Contact and a Service Areas hub; up to six
   city pages with genuinely unique content; titles, descriptions, headings, internal links;
   JSON-LD (LocalBusiness as a service-area business, Service, FAQPage) and sitemap entries
   that switch on with `VITE_SITE_URL`. Needs the facts in B first.
3. **Cookie-free analytics** (Cloudflare Web Analytics), with the CSP opened only for what it needs.
4. **Favicon** that reads at 16 px (the full mark is wide); ask Krishna before changing brand assets.
5. **Docs for HARA** in `docs/client/`: Google Business Profile content pack and directory listing
   copy (SOW Phase 4), and the handoff guide (how requests arrive, exporting leads, who to call,
   what to update; SOW Phase 5).
6. **SOW Phase 5 QA:** Chromium, WebKit and Firefox plus iPhone/Android emulation; WCAG 2.1 AA
   (axe scan, keyboard-only pass, VoiceOver spot check); Lighthouse mobile targets (performance
   90+, accessibility 95+, best practices 95+, SEO 95+; measure SEO on a build with a placeholder
   `VITE_SITE_URL` so `noindex` isn't counted); `scripts/qa` matrix, e2e and a modest load test.
7. **Final gate:** `security-protocol` (all 50) and `build-security` Part B (privacy policy still
   matches what is collected, CASL, AODA, licences for fonts and photos). Report in
   `security/golive/`, then deploy, commit, push, and update this file, `CLAUDE.md`,
   `docs/DEPLOY.md` and memory.

### B. Needs Krishna

- The company facts in C, passed on from HARA.
- Decisions: the city list, the page plan for Phase 4, the favicon, keep or delete the
  Afterhours demo Worker, whether the repo should become private (the GitHub Pages redirect needs
  it public on a free plan).
- Account actions only he can take: confirm 2FA on Cloudflare, GitHub, the registrar and Resend
  (status deliberately not recorded in this repo); add a Cloudflare notification for Worker errors
  (dashboard; wrangler's login can't create notification rules).

### C. Needs HARA (the client)

- Real phone number and contact email (placeholders today: `(416) 555-0199`,
  `hello@example.com`, plus the "Demo site" line in `partials/footer.html`).
- Confirmation of every security practice described on the page, and anything for the About page
  (only what is true: founding, owner, team, insurance, WSIB, bonding).
- A lawyer's review of the privacy policy and terms (recommended); confirmation of the photo licence.
- Their Google account for the Business Profile.

### D. Needs the domain (leave for last; runbook in `docs/DEPLOY.md`)

Buy the domain in HARA's name; DNS on Cloudflare (registrar lock, DNSSEC); business email with
SPF, DKIM and DMARC; Resend domain verification, `RESEND_API_KEY`, `EMAIL_MODE=resend`, real
`EMAIL_FROM` and `LEAD_TO_EMAIL`; `ALLOWED_ORIGINS`, `TURNSTILE_HOSTNAMES` and the Turnstile
widget's hostnames; `VITE_SITE_URL` (drops `noindex`, adds canonical, sitemap, security.txt);
Search Console and Bing; Google Business Profile website link; final gate against the domain.

## 7. How to work here (quirks that cost time)

- Both Playwright MCP servers can be locked by another Claude session ("Browser is already in
  use"). Use `scripts/qa/` instead: it drives Chrome for Testing through `playwright-core`.
- Measure LCP, CLS and JS-off on a production build, never the Vite dev server.
- The Cloudflare rate limiter is approximate (per location, synced with a delay): a burst lets a
  few more than 5 through. Tests in workerd are exact.
- `wrangler tail hara-website` (no `--env production`: that appends `-production` to the name).
- `wrangler d1 time-travel restore` has no `-y`; it auto-confirms in a non-interactive shell.
- A brand-new `workers.dev` subdomain can answer 404 for about a minute after the first deploy.
- The Vite warning that `hero-build` is over 500 kB is expected (three.js, lazy loaded).
- Logo pipeline venv (scratch venvs don't survive sessions): `python3 -m venv /tmp/hara-venv &&
  /tmp/hara-venv/bin/pip install fonttools brotli skia-pathops pillow numpy scipy potracer`.
  `export_brand.py` itself runs on plain `python3`.
- The security scan's three standing false positives: `.wrangler/tmp` source map (T17),
  preview scripts in `docs/client/logo/navy/` (T19), the words "webhook"/"claude" in our docs.

## 8. Krishna's preferences (apply throughout)

- He directs the site; company facts come only from `docs/client/` or him. Never invent them.
- Check in between steps, one question at a time; show desktop and phone screenshots before big
  visual changes. Ship to the live URL and send the link; never hand over localhost links.
- Professional and quiet: no em or en dashes in visible copy, sentence case, one CTA label
  ("Book a free walkthrough"), white/light theme, rounded shapes, Mona Sans, motion only where it
  explains something (the one-time 3D logo build is the exception he asked for).
- He rejected many logo and font directions before choosing the client's own logo. Don't reopen
  the brand unless he asks.

## 9. Prompt for the next session

Paste this into a new Claude Code session started in `~/afterhours`:

```
You are continuing the HARA Facilities Cleaning website in ~/afterhours: a static Vite site
served by a Cloudflare Worker with a D1-backed walkthrough form, live before the domain at
https://hara-website.chaudharikrishna0415.workers.dev. Goal: finish everything so that the ONLY
remaining work is buying the domain and connecting it (docs/DEPLOY.md, "Connect the domain").

First read, in full: HANDOFF.md, CLAUDE.md, docs/DEPLOY.md, security/golive/2026-09-28-full-GO.md,
and the private SOW at docs/client/HARA-Website-Scope-of-Work.txt (Phases 4 and 5 define
"finished"). Run the engineering-team skill, then follow the session protocol in CLAUDE.md:
design skills for UI work, context7 for library docs, web-design-guidelines plus real-browser
checks at desktop and phone widths before calling UI done, security-protocol before every deploy.

Work in this order. Check in with me between numbered steps, and show desktop and phone
screenshots before any big visual change:

1. Settle the working tree (HANDOFF.md section 3). Verify the uncommitted hero "white cover" in
   src/style.css on a production build (npm run build:prod, launch config afterhours-dist on
   :4332, node scripts/qa/matrix.mjs): CLS 0 at every viewport, JS-off shows the logo with no
   horizontal overflow, LCP under 1 s. Deploy it if it passes, revert it if not. Then commit in
   logical pieces, run npm test, deploy, push, and git worktree prune.
2. Ask me, in one short list, for the facts only HARA can give, and wait: real phone and contact
   email, the six cities for city pages, business hours, true About-page facts, and whether the
   security practices on the page are confirmed. Never invent company facts; anything missing
   stays a clearly marked placeholder on the launch checklist.
3. SOW Phase 4 in the existing design system: Services, Security, FAQ, About, Contact, a Service
   Areas hub and up to six city pages with genuinely unique content; titles, descriptions,
   headings, internal links; JSON-LD (service-area LocalBusiness, Service, FAQPage) and sitemap
   entries that switch on with VITE_SITE_URL. Use the local SEO skills (local-landing-pages,
   local-schema, service-area-seo). Show me the page plan before writing, then the pages.
4. Other pre-domain items: cookie-free Cloudflare Web Analytics (open the CSP only as far as it
   needs); a favicon that reads at 16 px (ask me first); and, in docs/client/, a Google Business
   Profile and directory listing content pack plus the client handoff guide (how requests
   arrive, exporting leads, who to call, what to update).
5. SOW Phase 5 QA on a production build and the live URL: Chromium, WebKit and Firefox plus
   iPhone and Android emulation; WCAG 2.1 AA (axe scan, keyboard-only pass, VoiceOver spot check
   if possible); Lighthouse mobile at performance 90+, accessibility 95+, best practices 95+, SEO
   95+ (measure SEO on a build with a placeholder VITE_SITE_URL so noindex isn't counted); the
   scripts/qa matrix, form end to end on the local Worker, a modest load test; npm test. Fix
   everything found.
6. Full security-protocol gate (all 50) and build-security Part B (privacy policy still matches
   what is collected, CASL, AODA, font and photo licences). Report in security/golive/, then
   deploy, commit and push.
7. Update HANDOFF.md, CLAUDE.md, docs/DEPLOY.md and memory so they show everything done and a
   domain-only checklist, and send me the live link with desktop and phone screenshots.

Ground rules: I direct the site; company facts only from docs/client or me. No em or en dashes in
visible copy, sentence case, professional quiet motion (the one-time 3D hero logo build is the
only exception). Ship to the live URL, never localhost links. Never write secrets or account
security status (2FA and the like) into this public repo. For things only I can do (2FA on
Cloudflare, GitHub, the registrar and Resend; a Cloudflare notification for Worker errors), give
me the exact dashboard steps instead of skipping them.
```

## 10. Short history

- 09-23/24: "Afterhours" demo (night story, squeegee wordmark, GitHub Pages).
- 09-28: renamed HARA; professional redesign around the client's priorities; SOW; backend on
  Cloudflare Workers + D1; legal pages; first security gate.
- 09-28 (evening): four rounds of logo and lettering exploration (tower tile, custom lettering,
  font rounds, structural directions) all set aside; Krishna chose the client's original logo.
  Traced to vector, palette sampled from it, 3D hero build, full security gate GO.
- 09-29: fixes from the gate and stress tests deployed (`765c3a63`); restore rehearsed; the
  Afterhours design republished as a reference Worker.
- 10-01: this handoff.
