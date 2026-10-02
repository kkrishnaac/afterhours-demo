# Handoff: HARA website

Updated 2026-10-01 (end of the Phase 5 session). Read in this order: this file, `CLAUDE.md`,
`docs/DEPLOY.md`, `security/golive/2026-10-01-full-GO.md`, and the private SOW in `docs/client/`.

**State: launch-ready apart from the domain, with a redesign pending.** The live one-page site is
done and gated. After seeing it, the client asked for a lighter, more professional template with the
same logo, colours, copy and photos ("fonts too heavy"). The proposed redesign (Studio, the former H) is live for the client at
https://hara-design-lab.chaudharikrishna0415.workers.dev. Everything else tried that day is in git history only. **Section 0 is the prompt for
the next session:** implement the chosen variant on the live site, then refresh the print
collateral (business card and brochure) in `~/hara-print`.

## 0. Prompt for the next session

Paste this into a new Claude Code session started in `~/afterhours`:

```
You are continuing the HARA Facilities Cleaning website in ~/afterhours (live, pre-domain, at
https://hara-website.chaudharikrishna0415.workers.dev) and its print collateral in ~/hara-print.
Read in full first: HANDOFF.md, CLAUDE.md (especially "Design lab", "Print collateral", "Brand",
"Design decisions"), docs/DEPLOY.md, and security/golive/2026-10-01-full-GO.md. Run the
engineering-team skill, then the session protocol in CLAUDE.md (design skills for UI work,
web-design-guidelines and real-browser checks at desktop and phone widths before calling UI done,
security-protocol before every deploy).

Context: the client approved the content but found the fonts too heavy and wants a "super
professional, super user friendly" look with good photos. Logo, navy/blue/white palette, copy,
photos and phone numbers stay exactly as they are. Three alternate layouts are live at
https://hara-design-lab.chaudharikrishna0415.workers.dev (source: design-lab/). I will tell you
which one we chose (A, B or C) and any tweaks.

Work in this order, checking in with me between steps and showing desktop and phone screenshots
before any big visual change:

1. Implement the chosen design-lab variant on the live site: port its layout and type into
   index.html and src/style.css, keep the real four-step form (src/quote.js + Worker), the legal
   pages, the x-photo pipeline, the city chips that preselect the form, the structured data, and
   the tests. Ask me whether to keep the one-time 3D hero logo build or drop it for the new hero.
   Lighter type is the point: no heading heavier than the variant uses.
2. Re-run the Phase 5 QA on a production build: Lighthouse mobile 90+ / 100 / 100 / 100 (SEO on a
   placeholder VITE_SITE_URL build), axe 0 violations, keyboard pass, Chromium + Firefox + WebKit
   + phone emulation (scripts/qa/), form end to end on the local Worker, matrix, npm test. Fix
   everything found.
3. security-protocol re-run (scan + live probes), note in security/golive/, deploy, commit, push.
   Then retire the design lab (npx wrangler delete hara-design-lab) once I confirm.
4. Print collateral in ~/hara-print (read its README.md, docs/, haraprint/content.py and the
   memory file hara-print-collateral.md first): bring the business card and tri-fold brochure in
   line with the site: headline/tagline "Tomorrow starts clean.", both phone numbers, the two
   security practices only (alarms armed and disarmed; responsibility for fobs and access cards),
   the chosen design's type and layout language, the current photos, and the real domain for the
   printed URL and QR once I confirm it (content.py has haracleaning.ca from 2026-10-01). Rebuild
   with python3 build.py, keep all preflight checks passing, show me the PROOF PDFs as images
   before anything is final. Only the website's details on the card: no personal name or title.
5. Update HANDOFF.md, CLAUDE.md, docs/DEPLOY.md and memory.

Ground rules: I direct the site; company facts only from docs/client or me. No em or en dashes in
visible copy, sentence case, quiet motion. Ship to the live URL, never localhost links. Never
write secrets or account security status into this public repo.
```


---

## 0b. Design lab (2026-10-01 evening: A, B, C rejected; D, E, F added)

- Live: https://hara-design-lab.chaudharikrishna0415.workers.dev (Worker `hara-design-lab`). Source
  `design-lab/` (how it builds: `CLAUDE.md`, "Design lab").
- Krishna rejected A, B and C (same template in three skins, not premium enough, type family
  wrong). Photos were fine. Three new directions, each on one DESIGN.md token structure, each with
  its own type, shapes and section skeleton (`base.css` + `d.css` / `e.css` / `f.css`):
  D = Gallery (Apple structure: edge-to-edge photo tiles, centred copy, pills, Hanken Grotesk 520).
  E = Ledger (IBM Carbon structure: utility bar, hairline tiles, 0px corners, numbered index, week
  as a table, IBM Plex Sans 300 display).
  F = Concierge (BMW corporate structure: navy hero band with the photo breaking out, 4-up photo
  cards, spec cells, square buttons, uppercase tracked links, Manrope 500 display / 300 body).
- `/print/` shows the business card and brochure cover in each direction at a quarter of print
  size, so the system is chosen as a whole. The real print files follow in `~/hara-print`.
- Fonts: self-hosted latin variable woff2 in `design-lab/public/fonts` (OFL, from
  `@fontsource-variable/hanken-grotesk`, `ibm-plex-sans`, `manrope`, devDependencies).
- Krishna rejected D, E and F too (2026-10-01, late): wants animated colour gradients, depth, type
  with character ("not 2D everything", fonts "unseasoned"). He then pointed at
  https://www.coreastudios.com and asked for that site mimicked for HARA: its transitions,
  choreography and gradient, "including fonts".
- G = Studio (`g.html`, `g.css`, `g.js`): the Corea system rebuilt for HARA. Dark #161515 canvas,
  cream #f3f1e2 type, blur-in loader (40px backdrop blur fading over 2s), diagonal spectrum glare
  sweep on navigation (Web Animations, 0.9s), arc dial menu that turns to the section in view,
  horizontal reel of uppercase photo cards (CSS scroll-driven animation, grid toggle, stacked on
  phones), drifting gradient blob behind the hero card and the panels, translucent blurred
  buttons, live Toronto clock with the pulsing red dot, giant wordmark footer. Their fonts (TWK
  Lausanne, Record Disc) are commercial: Hanken Grotesk and Archivo (wdth 112, wght 850) stand in.
  Research in the scratchpad was throwaway; the extracted tokens are described in `g.css` comments.
  This reverses the earlier "light theme only, no gradients" rule, on Krishna's instruction.
- **Krishna liked G a lot** ("this is crazy") and asked for H: the same template in the live
  site's own colours (white canvas, navy, sky blue), with the glare as a smooth navy-to-white
  sweep instead of the spectrum. `h.html` is `g.html` with `h.css`, which imports `g.css` and
  overrides the colours.
- **2026-10-01, late:** Krishna chose H and asked for a client link. A to G, the lab menu, the
  switcher and `/print/` were removed from `design-lab/src` (commit history keeps them: see
  `git log -- design-lab/src/g.html`); `h.html` became `index.html`, so the client link is the
  lab root. `/h/` and `/g/` 301 to `/` via `dist/_redirects`. Still noindex. Next: his and the
  client's polish notes, then port H onto the live site (real form, legal pages, tests, QA, gate)
  and redo the print pieces in this language.
- **2026-10-01, later still:** Krishna sent a second inspiration, https://www.collection.industries,
  and asked for its 3D details copied but with a plain zoom instead of their star transition, in
  the live site's colours. Built as B (`b.html`, `b.css`, `b.js`): fixed top and bottom bars that
  slide in on first load and fade the page under them, small-caps serif labels with an underline
  growing from the left, emblem over a headline rising from the fold, four scroll-driven stories
  (photo settles 1.2 to 1, words zoom from nothing over a round white bloom, frame whites out
  into the next; CSS view timelines, stacked cards below 1000px and in browsers without them),
  photo tiles whose text zooms in on hover, the big two-column city list, "Let's talk" opens a
  3D business card that flies in and flips (their keyframes), Lenis smooth scroll (lerp 0.1).
  EB Garamond (small caps) and Outfit stand in for their commercial Doves Type and Good Direction
  Sans. The former H was renamed A (`a.html`); the root is a two-option menu; `/h` and `/g` 301
  to `/a/`.
- **Polish round on the Studio page, same night (all in `h.css` / `index.html`, deployed):** only
  (437) 980-3464 on the site; no colour sweep on navigation; no blur-in loader; white hero with
  no box, centred, bigger original-colour logo; solid white header bar; phone header carries the
  section links as a scrollable row (no hamburger); no boxes below the photos; a fixed gradient
  that stays white until the Reception and lounges card, then runs sky to dark navy; the lower
  sections and footer sit on navy with white type and the white logo; the hero logo plays a
  1.2 s "ring cuts the H" sequence from vector layers (`public/brand/logo-rest.svg`,
  `logo-h-{a,b,c}.svg`, `logo-h-solid.svg`, `logo-ring.svg`, generated from `src/logo-parts.js`;
  CSS in `h.css`, trigger in `g.js`). Nothing else in the logo moves.
- **Then he deleted B** ("nah, delete B"). The Studio page is back at the lab root as the only
  design and the client link; `/a`, `/b`, `/g`, `/h` all 301 to `/`. B's files are in git history
  (commit ab362f1) if ever wanted.

## 1. What is live

| Thing | State |
|---|---|
| Production URL | https://hara-website.chaudharikrishna0415.workers.dev (Worker `hara-website`, version `3ea51993`, deployed 2026-10-01 from commit `main`) |
| Scope | **One page** plus privacy, terms, accessibility and 404. Krishna, 2026-10-01: "the client only wants a simple 1 page website." The multi-page build (Services, Security, FAQ, About, Contact, Service areas, six city pages) and the Google Business Profile pack are out of scope; archived in git tag `multi-page-archive`; the pack is parked in `docs/client/` |
| Contact details | Live site: (416) 990-3995 (+ 437 second), harafacilitiescleaning@gmail.com. **Krishna, 2026-10-01 evening: only (437) 980-3464 should be on the website.** The design lab and print already use it; the live site changes when the redesign is ported |
| Hours | None shown: HARA has no set hours (every day, any time a contract needs). The page's "Any day. Any time." covers it |
| Form | Live, stores to D1, `EMAIL_MODE=hold` until the domain can send email. Requests will go to harafacilitiescleaning@gmail.com (`LEAD_TO_EMAIL` set 2026-10-01; `EMAIL_FROM` waits for the domain). 0 real requests at last check |
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

- ~~Confirm the six security practices~~ settled 2026-10-01: Krishna relayed that HARA's role is
  alarming/disarming and responsibility for fobs and access cards; the band now says only that.
- ~~Approve the illustrative photos~~ settled 2026-10-01: AI stills replaced by Unsplash photos
  Krishna picked (free commercial licence). Real photos of HARA's work can replace them later.
- A lawyer's review of the privacy policy and terms (recommended).

### The domain (runbook: `docs/DEPLOY.md`, "Connect the domain")

Buy it in HARA's name; DNS on Cloudflare (registrar lock, DNSSEC); business email with SPF, DKIM,
DMARC; Resend domain and `RESEND_API_KEY`; `EMAIL_MODE=resend`, real `EMAIL_FROM`; `ALLOWED_ORIGINS`, `TURNSTILE_HOSTNAMES`, the Turnstile widget's hostnames;
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
