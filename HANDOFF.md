# Session handoff: Afterhours demo -> real client build

## Update 2026-09-28 (second session): HARA redesign, live

- Real name: **HARA Facilities Cleaning**. Client inputs in `docs/client/` (gitignored): the DOCX,
  a priorities note (flexible hours, offices only, security conscious, free walkthroughs), and
  `company-notes.md` (vision line options, the service list we drafted, claims to confirm).
- Krishna directs the site; the client docs are for company facts only.
- Redesign approved and deployed to the Pages URL after a GO gate (`security/golive/2026-09-28-GO.md`).
- Next: Krishna's feedback; client confirms the security claims and real phone/email; then SOW
  (frontend + backend for the walkthrough form) and the security plan, both in `docs/client/`.

## Update 2026-09-28 (latest): production live, domain is the only step left

- Live: https://hara-website.chaudharikrishna0415.workers.dev (Cloudflare, Krishna's account).
  GitHub Pages URL redirects there. Security gate GO: `security/golive/2026-09-28-backend-GO.md`.
- Built this round: privacy policy, terms, accessibility statement, 404, robots.txt, branded
  og.jpg, footer legal links, email hold mode, http→https, production env, leads/PIPEDA scripts.
- Client security plan (PDF): `docs/client/security/HARA-Security-Plan.pdf`.
- Launch blockers: 2FA confirmed on all accounts, real phone/email, HARA confirms security practices,
  lawyer review, photo licence, alerts. Then the domain steps in `docs/DEPLOY.md`.

## Update 2026-09-28 (later): SOW written, backend built

- SOW (editable Word, prices blank for Krishna): `docs/client/HARA-Website-Scope-of-Work.docx`
  (source `docs/client/build-sow.js`). Five phases + optional add-ons + security checklist.
- Krishna's decisions: Cloudflare hosting; requests go to email + database (dashboard later);
  HARA has no domain or business email yet; backend first.
- Phase 3 backend built on branch `backend-walkthrough` (not yet committed or pushed; Krishna to OK):
  Worker + D1 + Turnstile + rate limit + Resend, 50 passing tests, verified end to end locally
  (`npm run dev:worker`): stored row, consent recorded, hostile requests refused, no PII in logs.
- Waiting on HARA: Cloudflare account, domain, Resend, lead inbox. Then `docs/DEPLOY.md`.
- Launch blockers still open: privacy policy page (must match the D1 schema), real phone/email,
  HARA confirming the security practices, remove noindex, security-protocol GO on the Worker.
- Next without accounts: Phase 1 leftovers (404 page, social image), privacy policy + terms drafts,
  Phase 4 pages (Services, Security, FAQ, About, city pages), the detailed security plan (step 4).

## Earlier state (2026-09-24, the old Afterhours design, kept for history)

- **Live demo:** https://kkrishnaac.github.io/afterhours-demo/ (last commit `075e3b4`, "Tighter hero").
  Working tree clean. Verified on phone (390 px, 3x) and desktop (1440 px), 0 console errors.
- **Security:** go-live gate GO (`security/golive/2026-09-24-GO.md`). Static site, no backend,
  no secrets, CSP meta, npm audit 0 vulnerabilities.
- **What the site is today:** one long page telling one night in an office, 18:00 to 07:00.
  1. Intro loader: tiny word flicks through GTA cities, lands on the name, becomes the cobalt pill.
  2. Hero: 2D wordmark arrives dirty, squeegee wipes it clean (auto, ~2.3 s), one line + "Get a quote".
  3. Dusk band ("The city goes home. That's when we start.") on the dusk office photo.
  4. Services on the night-reception photo (two groups: every night / when you need it). PLACEHOLDER list.
  5. Gallery: edge-to-edge photos after alexzarour.com, IMG 01-09 captions, tap opens the photo viewer.
  6. "Nothing gets skipped" checklist on the corridor photo (ticks as you scroll). PLACEHOLDER times.
  7. "Every city in the GTA" map, 16 cities light up from Toronto outward.
  8. "Good morning" dawn band, then a 4-step quote form (office size, frequency, city, name/email).
     DEMO ONLY: it validates and shows a thank-you, sends nothing.
  9. Footer with placeholder phone/email and a "demo site" note.
- **Assets:** 9 Higgsfield 4K stills (masters in `assets/raw/`, gitignored; web ladders in
  `public/img/`). Roughly $5.50 of the Higgsfield API balance used (~$4.60 left of $10.17 on 09-23;
  confirm on console.higgsfield.ai).

## How we got here (so the next session doesn't repeat rejected ideas)

- Started with a 3D (three.js) chrome wordmark on a dark night theme. Krishna moved to a white site,
  then glossy black letters, then rejected 3D entirely as "not crisp" and too slow. It's now 2D SVG.
- He disliked: sky-blue CTA + warm beige gradient palette, empty-looking hero, having to tap the name
  to replay the animation, two "Afterhours" names visible on the hero, janky phone scrolling.
- He liked / asked for: alexzarour.com mechanics (city-name loader, fixed pill, edge-to-edge photo
  placement, viewer), photos as full-screen section backgrounds, super simple + easy to use.
- Hero options offered 2026-09-24: photo below the name / photo behind / tighten text-only. He chose
  **tighten, text-only**. It may still read empty on phones; revisit only if he raises it.
- Phone scroll fix measured: main-thread work while scrolling down 53% (per frame 3.8 ms -> 1.3 ms).

## Next session: goals Krishna set

He now has **the real company name** and **a PDF from the client describing what he wants on the
website**. The next session should:

1. **Absorb the inputs.** Read the PDF fully (use the `pdf` skill). Extract: services, service area,
   pages/sections wanted, features (quote/booking/contact, portals, payments?), brand cues, content
   the client will supply, tone, must-haves vs nice-to-haves, contact details, deadlines/budget if stated.
   Quote the client's own words where requirements are ambiguous.
2. **Design work.** Rename from "Afterhours" to the real name (procedure in `CLAUDE.md`), then
   reconcile the demo with the brief: what stays, what changes, what's new. Follow the design
   protocol (design-md-library + design-taste-frontend + redesign-existing-projects). Keep Krishna's
   locked decisions unless the client's brief contradicts them; if it does, surface the conflict and ask.
3. **Scope of work (SOW)** for the full build, written as a document Krishna can share with the
   client: frontend + backend, split into phases/milestones, each with deliverables, acceptance
   criteria, assumptions, what the client must provide, and what's out of scope. Include hosting,
   domain, email, analytics, SEO basics (local SEO for the GTA), accessibility (AODA/WCAG 2.1 AA),
   and a maintenance/handoff section. Estimate effort per item; leave pricing to Krishna unless he asks.
4. **Security for both ends.** Frontend: CSP/headers, form hardening, dependency hygiene, privacy of
   anything collected. Backend: whatever the SOW introduces (form endpoint, email, database, admin,
   bookings, payments) run through `build-security` (Part A technical + Part B legal: PIPEDA privacy
   policy, CASL consent for any marketing email, cookie consent if analytics, AODA) and the
   `security-protocol` 50-threat gate as a pre-launch plan. Produce a security plan per end, not just a pass/fail.

## Decisions the next session will need from Krishna (ask early, one at a time)

- Where the real site will live: keep static hosting + a small serverless backend, or a full platform?
  Today's host (GitHub Pages) can't run server code or set security headers. Likely candidates:
  Cloudflare Pages + Workers, Netlify + Functions, or Vercel. Let the PDF's features drive this.
- Where quote requests should go (email inbox, CRM, spreadsheet, a simple admin page).
- Custom domain and business email (does the client own them yet?).
- Real photos vs keeping the Higgsfield stills (check the Higgsfield plan's commercial-use terms
  before launch either way).
- Whether the repo should become private once it holds client content (Pages on a free plan
  needs a public repo; moving hosts removes that constraint).

## Known gaps / placeholders to replace for launch

Services list, phone, email, checklist times, business name everywhere, `noindex` meta, quote form
backend + spam protection + privacy policy + consent wording, real testimonials (none exist; do not
invent any), JSON-LD LocalBusiness once details are real, 404 page, favicon/OG image with the real name.
