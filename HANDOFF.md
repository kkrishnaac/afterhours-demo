# Handoff: HARA website

Updated 2026-10-01 (end of the Phase 5 session). Read in this order: this file, `CLAUDE.md`,
`docs/DEPLOY.md`, `security/golive/2026-10-01-full-GO.md`, and the private SOW in `docs/client/`.

**State: launch-ready apart from the domain.** The only engineering left is buying the domain and
connecting it (`docs/DEPLOY.md`, "Connect the domain"). Before that, Krishna has two dashboard
actions and HARA owes three confirmations (section 3).

---

## 1. What is live

| Thing | State |
|---|---|
| Production URL | https://hara-website.chaudharikrishna0415.workers.dev (Worker `hara-website`, version `3ea51993`, deployed 2026-10-01 from commit `main`) |
| Scope | **One page** plus privacy, terms, accessibility and 404. Krishna, 2026-10-01: "the client only wants a simple 1 page website." The multi-page build (Services, Security, FAQ, About, Contact, Service areas, six city pages) and the Google Business Profile pack are out of scope; archived in git tag `multi-page-archive`; the pack is parked in `docs/client/` |
| Contact details | Real: (416) 990-3995, harafacilitiescleaning@gmail.com (from Krishna, 2026-10-01), on every page |
| Hours | None shown: HARA has no set hours (every day, any time a contract needs). The page's "Any day. Any time." covers it |
| Form | Live, stores to D1, `EMAIL_MODE=hold` until the domain can send email. 0 real requests at last check |
| Secrets in the Worker | `TURNSTILE_SECRET_KEY` only |
| Indexing | `noindex` everywhere until `VITE_SITE_URL` is set at the domain step |
| Analytics | Cloudflare Web Analytics wired, **off until `CF_BEACON_TOKEN`** is set (`docs/DEPLOY.md`, "Analytics"). Optional; the SOW lists it |
| Reference Worker | https://afterhours-design.chaudharikrishna0415.workers.dev (the original Afterhours design, commit `dea9337`). Keep or `npx wrangler delete afterhours-design` on Krishna's say |
| Repo | `kkrishnaac/afterhours-demo`, public, `main` clean and pushed, 67 tests pass |

## 2. Evidence this is done (SOW Phase 5)

- **Security gate (all 50): GO**, `security/golive/2026-10-01-full-GO.md`, with live probes and
  the build-security Part B legal review inside it.
- **Lighthouse**, placeholder-domain production build (so `noindex` is not counted): mobile 96,
  95, 94, 92 performance across runs, 100 / 100 / 100 for accessibility, best practices, SEO;
  desktop 100 / 100 / 100 / 100. Live URL: mobile 92, desktop 100 (SEO 66 only from `noindex`).
- **Accessibility:** axe-core 0 violations on every page, the viewer and every form step with
  errors; keyboard-only pass (22 stops, all with visible focus; form and viewer by keys; skip link);
  accessibility tree reviewed (VoiceOver itself not driven).
- **Browsers:** Chromium, Firefox, WebKit desktop; WebKit iPhone 14 / SE; Chromium Pixel 7 /
  Galaxy S9+; Firefox 390 px. All pass.
- **Matrix:** 320 to 2560 px, CLS 0, LCP 64 to 208 ms; slow phone, no WebGL, JS off and reduced
  motion all fall back cleanly.
- **Form end to end** on the local Worker at 320, 390, 1440 px: stored (201), success shown.
- **Load (live):** 1,500 requests at 50 concurrent: 769 req/s, p95 109 ms, 0 errors; API burst
  300: 276 x 429, 24 x 400, 0 x 5xx.
- **Fixes made during QA:** hero decides 3D-or-static two frames after `load` (fixes a WebKit
  stylesheet race that sent big iPhones to the static logo at random, and takes the three.js
  chunk out of the LCP path: Lighthouse mobile went from 87-90 to 92-96); `is-late` stops a
  second rise of the logo on very slow connections; minor dependency updates.

## 3. What is left, by who

### Krishna (dashboard only; nothing in this repo records the result)

1. **Confirm 2FA** on every account that can reach the leads or the site:
   - Cloudflare: top-right profile, **My Profile, Authentication, Two-Factor Authentication**:
     authenticator app or a security key; download the backup codes.
   - GitHub: **Settings, Password and authentication, Two-factor authentication**.
   - Resend: **Settings (team), Security**, enable 2FA.
   - Gmail (the public contact inbox): Google Account, **Security, 2-Step Verification**.
   - Registrar: in its account security settings, once the domain is bought.
2. ~~Cloudflare notification for Worker errors~~ **done 2026-10-01**: alert policy "HARA website
   Worker errors" (type Workers Observability "Real-time issue", account-wide, enabled, email to
   the account address). The dashboard form for this alert type has no email section and its
   Save stays disabled, so it was created through the dashboard's own API from Krishna's
   signed-in session; it shows in Manage account, Alerts. Issues are listed under Observability,
   Issues.
3. **Analytics token (optional):** Analytics & Logs, Web Analytics, Add a site, hostname
   `hara-website.chaudharikrishna0415.workers.dev`, manual snippet, copy the 32-character
   `token`, put `CF_BEACON_TOKEN=<token>` in `.env.production-cf`, `npm run deploy`.
4. **Decisions:** keep or delete the Afterhours reference Worker; whether the repo goes private
   (the GitHub Pages redirect needs it public on a free plan); revise and re-price the SOW
   document in `docs/client/` for the one-page scope (Phase 4 is out).

### HARA (through Krishna)

- Confirm the six security practices on the page are true (keys and fobs, alarm codes, same
  team, confidential by default, lock-up check, every visit logged). They appear once, on the
  home page.
- Approve the illustrative photos for launch, or supply real ones.
- Which inbox receives walkthrough requests (`LEAD_TO_EMAIL`, set at the domain step).
- A lawyer's review of the privacy policy and terms (recommended).

### The domain (runbook: `docs/DEPLOY.md`, "Connect the domain")

Buy it in HARA's name; DNS on Cloudflare (registrar lock, DNSSEC); business email with SPF, DKIM,
DMARC; Resend domain and `RESEND_API_KEY`; `EMAIL_MODE=resend`, real `EMAIL_FROM` and
`LEAD_TO_EMAIL`; `ALLOWED_ORIGINS`, `TURNSTILE_HOSTNAMES`, the Turnstile widget's hostnames;
`VITE_SITE_URL` (drops `noindex`, adds canonical, JSON-LD, sitemap, security.txt); Search Console
and Bing; then the gate again against the domain.

## 4. Client documents (private, `docs/client/`)

- `HARA-Handoff-Guide.html` / `.pdf`: the short written guide the SOW promises (one-page scope;
  yellow placeholders: domain, request inbox, Dispatch contact). Fill them at the domain step.
- `GBP-and-directories-pack.md` + `gbp-logo-1024.png`: parked (out of scope).
- `HARA-Website-Scope-of-Work.*`: needs Krishna's revision for one page.
- `company-notes.md`: client priorities and the drafted service list.

## 5. How to work here (quirks that cost time)

- Lighthouse: run it alone, nothing else using the CPU; SEO on a placeholder `VITE_SITE_URL`
  build. `scripts/qa/README.md` has the commands and where the cached tools live.
- Both Playwright MCP servers can be locked by another Claude session; `scripts/qa/` drives
  Chrome for Testing, Firefox and WebKit through `playwright-core` instead.
- Measure LCP, CLS and JS-off on a production build, never the Vite dev server.
- The Cloudflare rate limiter is approximate: a burst lets a few more than 5 through.
- `wrangler tail hara-website` (no `--env production`). A new `workers.dev` name can 404 for a minute.
- The Vite "chunk over 500 kB" warning (three.js, lazy) is expected.
- WebKit logs one CSP `style-src-attr` violation per load: its own `<select>` styling. Ignore.
- The security scan's standing false positives: preview scripts in `docs/client/logo/navy/`
  (T19) and the word "webhook" in our docs (T31). Anything else is new.
- `.wrangler/tmp` source maps can trip the SQL check when the local Worker has run; they are ignored files.

## 6. Krishna's preferences (apply throughout)

- He directs the site; company facts come only from `docs/client/` or him. Never invent them.
- One page. Don't add pages or a Google profile unless he asks.
- Check in between steps, one question at a time; desktop and phone screenshots before big
  visual changes; ship to the live URL and send the link, never localhost.
- Quiet and professional: no em or en dashes in visible copy, sentence case, one CTA label
  ("Book a free walkthrough"), light theme, rounded shapes, Mona Sans, motion only where it
  explains something (the one-time 3D hero logo build is the exception he asked for).
- Don't reopen the brand: he chose the client's own logo after rejecting many directions.

## 7. Short history

- 09-23/24: "Afterhours" demo. 09-28: renamed HARA, redesign, SOW, Cloudflare backend, legal
  pages, first gate; client's original logo traced, navy palette, 3D hero build; full gate GO.
- 09-29: stress-test fixes, restore rehearsed. 10-01: hero LCP cover verified and shipped; real
  contact details; multi-page build (then removed on the one-page decision); tab icon; analytics
  wiring; client guide; Phase 5 QA with fixes; final gate GO. Launch-ready apart from the domain.
