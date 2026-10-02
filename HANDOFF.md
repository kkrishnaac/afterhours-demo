# Handoff: HARA website and print collateral

Updated 2026-10-01, end of the redesign session. Read in this order: this file, `CLAUDE.md`
(especially "Design lab", "Hero logo intro", "Print collateral", "Design decisions"),
`docs/DEPLOY.md`, and `~/hara-print/README.md` when you reach the print work.

**State in one paragraph (updated 2026-10-01, late night).** The **Studio** design (the
coreastudios.com system rebuilt in HARA's colours) is now **live on production**,
https://hara-website.chaudharikrishna0415.workers.dev (version `4411dbf9`), with the real form,
the legal pages and the same CSP; gate GO at the end of `security/golive/2026-10-01-full-GO.md`.
Krishna polished the logo intro and the menus in the design lab first (sections 1 and 2), then
asked for it on the live site. Lighthouse: phone 97, desktop 100 (accessibility and best practices
100; SEO 100 once the domain lifts `noindex`). The design lab is offline (Krishna, "temporarily"):
`workers_dev: false` in `design-lab/wrangler.jsonc`; flip it and deploy to bring it back. **Next: the business card and tri-fold brochure in
`~/hara-print` in the Studio language, then the domain.**

## 0. Prompt for the next session

Paste this into a new Claude Code session started in `~/afterhours`:

```
You are continuing the HARA Facilities Cleaning project. Read in full first: ~/afterhours/HANDOFF.md
and ~/afterhours/CLAUDE.md (especially "Design lab", "Hero logo intro", "Print collateral",
"Design decisions", "Gotchas"). Run the engineering-team skill, then the session protocol in
CLAUDE.md. Use the context7 MCP for library docs (Motion is the animation library).

The Studio design is live on production (https://hara-website.chaudharikrishna0415.workers.dev),
source in src/studio/ (see CLAUDE.md "Studio on production"). If I ask for website changes, make
them there, check frames and screenshots at desktop and phone widths, run security-protocol, then
npm run deploy and send me the live link. I review on my iPhone and send screen recordings to
~/Downloads; read them frame by frame (OpenCV, see HANDOFF.md section 6) before answering.

The print collateral (~/hara-print), the main job for this session:
Read ~/hara-print/README.md, haraprint/content.py, card.py, brochure.py, fonts.py, colors.py and
docs/ first. Redraw the business card (3.5 x 2 in) and letter tri-fold brochure in the Studio
language: Archivo wide black uppercase display, Hanken Grotesk body, white with navy and the
logo's sky blue, no boxes, the photos as the main material, the dark navy end like the site's
footer. Content is already current in content.py (Tomorrow starts clean., (437) 980-3464 only, the
two confirmed security practices). Still to do there: add the two fonts to the build (OFL, files
in ~/afterhours/src/studio/fonts, instance them like Mona Sans in fonts.py), replace the
old AI stills in assets/photos with the Unsplash masters in ~/afterhours/assets/raw (ids 11 to
19), fix the approval-form and build.py wording that still calls the photos generated, and ask me
whether haracleaning.ca is the confirmed domain for the printed URL and QR. Only the website's
details on the card: no personal name or title. Rebuild with python3 build.py, keep every
preflight check passing (the URL check fails until the domain resolves; that is expected), and
show me the PROOF PDFs as images before anything is final. Commit in ~/hara-print (local repo).

Ground rules: I direct the design; company facts only from docs/client or me. No em or en dashes
in visible copy, sentence case, one CTA label ("Book a free walkthrough"). Ship to the live URL,
never localhost links. Never write secrets or account security status into this public repo.
At the end, update HANDOFF.md, CLAUDE.md and memory.
```

## 1. The hero logo intro (Part 1 of the next session)

**Where it lives.** Only on the design lab's Studio page, not on production yet.

| File | What it does |
|---|---|
| `design-lab/logo-layers.mjs` | Generates every layer from the traced logo (`src/logo-parts.js`); the H's uprights are clean rectangles (`LEFT`, `RIGHT`, `TOP`, `FOOT`), only the ring's cut and the crossbar's top come from the trace and writes the stacked markup to `design-lab/src/_logo.html`. Run `node design-lab/logo-layers.mjs`, then `node design-lab/build.mjs` |
| `design-lab/public/brand/logo-*.svg` | Generated layers: `logo-rest` (everything that never moves), `logo-h-a/b/c` (the logo's H in three pieces), `logo-h-normal` (the starting H), `logo-spark1/2/3`, `logo-star` (the traveller) |
| `design-lab/src/_logo.html` | Generated. The layer stack, including an inline SVG with the ring, a mask path that draws it, the star's track and the star |
| `design-lab/src/h-logo.js` | The choreography, with Motion 13.5 (`design-lab/public/motion.js`, the UMD bundle from the `motion` npm package, exposes `window.Motion`) |
| `design-lab/src/h.css` | The resting states, the no-script failsafe (finished logo after 2.4 s) and reduced motion (finished logo at once) |
| `design-lab/logo-frames.mjs` | Frame capture: `node design-lab/logo-frames.mjs [url] [outDir] [desktop\|phone] [ms,ms,...]` |

**How it works, in time order (milliseconds after the load event):**

| When | What |
|---|---|
| 0 | The normal H shows: the same two rectangular uprights as the logo's H, uncut, and a straight crossbar (`CROSSBAR` in `logo-layers.mjs`). The real H pieces and the ring are hidden |
| 150 to 300 | The star scales in at the ring's sharp tip beside the left upright (point 0 of `CENTRE`) |
| 300 to 1150 | The star follows `CENTRE` (ease `[0.42, 0, 0.3, 1]`). The ring is revealed behind it by a 96-unit stroke along the same path in an SVG mask (`stroke-dashoffset` from 1 to 0, `pathLength="1"`). Once the star is past the turn at the left end and right of x 400, the normal H is clipped away left of the star and the real pieces are clipped in, at exactly the same edge, so only one H is ever visible and the uprights never change |
| 1150 to 1390 | The star winks out at the end of the curl (shrinks and fades in place; it no longer swells over the H's corner) |
| 1200 to 1930 | The three sparkles twinkle on in place, nearest the star first (big, low, far), 90 ms apart: opacity, scale 0 to 1.18 to 0.96 to 1, a -30 degree turn, a light glint. Each turns about its own centre (`.logo-cut__spark--1/2/3` in `h.css`) |
| ~2050 | `is-done`: the finished logo stays as plain stacked layers |

**What to tune, and where:** the star's path is `CENTRE` in `logo-layers.mjs` (logo units; sampled from the ring path, so keep its shape); durations and easings in `h-logo.js`; the star's look in `_logo.html` (glow gradient, size) via the generator; the starting crossbar's height and position via `CROSSBAR`.

**Krishna's rules for this animation (from his feedback, in order):**
1. Version 1 (ring sweeping in, rejected) and version 2 (star from behind, shine and glints, the H's legs jolting, rejected) are gone.
2. Start from a **normal H written like a normal H, in this font**, no ring, no sparkles.
3. The star **starts at the sharp start of the ring on the left** and **travels the way the ring is drawn**, then cuts the H from the middle.
4. **Nothing on the H moves.** No jolt, nothing laid over the H, no shine, no glints, no ledge or seam. The H must render perfectly smooth. (The generator builds the starting H and the logo's H from the same rectangles, so only the cut band and the crossbar differ.)
5. Sparkles **appear naturally, in place**, like shine on something just cleaned, after the cut. Never out of the H (2026-10-01 late: the old `:nth-of-type` origins never matched, so they grew from the logo's centre on the H; fixed with per-sparkle classes).
6. Quick: about a second and a half. No blur-in loader before it.
7. **The H is straight** (2026-10-01 late): both uprights are plain rectangles with level tops. The client's traced right upright had a slanted top and a narrower upper half; Krishna called it crooked. The header mark, footer logo, favicon and print still use the traced H with the slanted top: ask him before changing those.

## 2. The Studio design (the client link)

https://hara-design-lab.chaudharikrishna0415.workers.dev. Built from coreastudios.com's system at
Krishna's request, then reshaped by his notes the same night. What it is now:

- White page, navy and sky from the logo. Hanken Grotesk body, Archivo (wide, black, uppercase) display. Their fonts are commercial; these OFL ones stand in.
- **Hero:** no box, centred: the logo (with the intro), "Tomorrow starts clean.", the one-line description, "Book a free walkthrough" and the phone button.
- **Header and menus (Krishna, 2026-10-01 late):** no company name anywhere. **Wide screens:** a white bar with the reel or grid toggle (centred) and the CTA; the hero is sized to the screen and centred on it (logo about 250 px and headline about 84 px on a 1470 px laptop, the headline capped at two lines); the dial menu on the left fades in, one item after another, with the logo intro (`html.intro-in` from `h-logo.js`). At the dial's pivot sits a navy **knob** (notches that turn with the arc, sky pointer, sparkle hub) while the hero logo is on screen; once the hero logo is out of sight it turns into the logo mark (`.is-mark`, set in `g.js`), white over navy, and tapping it glides back to the hero (`#services`). **Phones and narrow windows:** no header. Past the hero, only while scrolling down, a bar slides in at the top painted with the page's own colour run (`--run`, placed by `tab-menu.js`), so it is white, sky or navy like the page behind it, with "Menu" in deep navy or white against it; it slides away on scrolling up and on the hero. Tapping it drops the six options as 48 px buttons over a white veil ("Book a free walkthrough" filled navy); closes on the bar, the veil, a link, Escape or focus leaving.
- **What we clean:** seven photo cards. Desktop: a sideways reel driven by vertical scroll (CSS scroll timeline), clipped at the dial's column. Phone: stacked full-photo cards.
- **Colour run:** fixed gradient, white until the Reception and lounges card, then sky to dark navy by Office buildings. No animation.
- **Below the photos, on dark navy with white type, no boxes:** Why HARA, what a visit includes, Any day any time (with a live Toronto clock), Trusted with your keys, How it works, the 16 cities, the booking form preview (step 1, links to the real form on production), then the footer with the white logo, centred.
- **Removed on his instruction:** the colour sweep on navigation, the blur-in loader, the bottom Toronto clock bar, the giant wordmark, every box except the photos.
- **Phone number:** only (437) 980-3464 (his instruction, 2026-10-01). Production still shows (416) 990-3995 first; it changes when the design is ported.
- Directions tried and dropped the same day (A to G, then a Collection-style B): git history only.

## 3. Print collateral (Part 2 of the next session)

`~/hara-print`, its own local git repo (not pushed). Business card 3.5 x 2 in and letter tri-fold
brochure (C-fold), ReportLab drawing in DeviceCMYK, PDF/X-1a:2001 through a user-built Ghostscript
at `~/.local/bin/gs`, 100+ preflight checks, `python3 build.py` rebuilds everything into
`deliverables/` (PRINT and PROOF PDFs, mockups, fold diagram and template, preflight report,
printer spec sheet, client approval form, colour report, how to print, zip with checksums).

| Item | State |
|---|---|
| Content (`haraprint/content.py`) | Current: the site's copy, its photo-card list and section labels, (437) 980-3464 only, the two confirmed security practices |
| Layout and type | **Redrawn in the Studio language (2026-10-01 late, commit e3a2629):** card front deep navy with the white logo, back white with "TOMORROW / STARTS CLEAN." + contact + QR; brochure: white hero cover over a full-bleed photo, photo cards with Archivo titles, navy back cover and inside right flap, no boxes. Archivo + Hanken Grotesk (OFL) |
| Photos | The website's Unsplash masters (11 to 19); the AI stills are gone; the approval form and notes say so |
| URL and QR | `https://haracleaning.ca`: **waiting for Krishna to confirm the domain** (and buy it in HARA's name) |
| Last build | 110 PASS, 1 FAIL (the URL check: the domain doesn't resolve yet, expected). Proof images were sent to Krishna; waiting for his notes |

Krishna's rules: only the website's details on the card (no personal name or title); show the
PROOF PDFs as images before anything is final; the client signs the approval form before release.

## 4. What is live in production

| Thing | State |
|---|---|
| Production URL | https://hara-website.chaudharikrishna0415.workers.dev (Worker `hara-website`, version `4411dbf9`, 2026-10-01 late) |
| Design | The Studio design (section 2), ported from the design lab with the real form; details in CLAUDE.md "Studio on production" |
| Scope | One page plus privacy, terms, accessibility and 404 (Krishna, 2026-10-01). The multi-page build is in git tag `multi-page-archive` |
| Contact | (437) 980-3464 only (page, legal pages, structured data), harafacilitiescleaning@gmail.com |
| Form | Live, stores to D1, `EMAIL_MODE=hold` until the domain can send email; requests will go to harafacilitiescleaning@gmail.com |
| Gate | GO for the Studio deploy (end of `security/golive/2026-10-01-full-GO.md`): 67 tests, form end to end, axe 0 violations, three engines, Lighthouse phone 97 and desktop 100. The stress matrix was last run on the old design (commit 65ab494) |
| Indexing | `noindex` until `VITE_SITE_URL` is set at the domain step |
| Repo | `kkrishnaac/afterhours-demo`, public, `main` pushed |

## 5. After the print work

1. Done 2026-10-01 late: the Studio design is on production (Motion bundled from npm, 25 KB gzip of page JS; grid fallback where scroll timelines are missing; 437 only).
2. Lighthouse re-run on the live Studio site (phone 97, desktop 100). Still to re-run: `scripts/qa/matrix.mjs`, `keyboard.mjs`. Several `scripts/qa/` scripts still look for the old page's selectors (`.hero__stage`, `.svc__photo`, the viewer); `axe.mjs` and `e2e.mjs` are updated and pass.
3. The design lab is offline (not deleted). Delete it for good (`npx wrangler delete hara-design-lab`) only when Krishna says so; design changes go into `src/studio/`.
4. The domain (runbook in `docs/DEPLOY.md`): buy it in HARA's name, DNS on Cloudflare, business email with SPF, DKIM, DMARC, Resend, `VITE_SITE_URL`, Turnstile hostnames, Search Console, then the gate against the domain.

### Still open with Krishna (dashboard only; nothing in this repo records the result)

1. **Confirm 2FA** on every account that can reach the leads or the site:
   - Cloudflare: top-right profile, **My Profile, Authentication, Two-Factor Authentication**:
     authenticator app or a security key; download the backup codes.
   - GitHub: **Settings, Password and authentication, Two-factor authentication**.
   - Resend: **Settings (team), Security**, enable 2FA.
   - Gmail (the public contact inbox): Google Account, **Security, 2-Step Verification**.
   - Registrar: in its account security settings, once the domain is bought.
2. **Analytics token (optional):** Analytics & Logs, Web Analytics, Add a site, hostname
   `hara-website.chaudharikrishna0415.workers.dev`, manual snippet, copy the 32-character `token`,
   put `CF_BEACON_TOKEN=<token>` in `.env.production-cf`, `npm run deploy`.
3. **Decisions:** keep or delete the Afterhours reference Worker
   (https://afterhours-design.chaudharikrishna0415.workers.dev); whether the repo goes private;
   revise and re-price the SOW in `docs/client/` for the one-page scope.
4. Done already: the Cloudflare Worker-error alert ("HARA website Worker errors", Manage account,
   Alerts).

With HARA: a lawyer's review of the privacy policy and terms (recommended). Client documents are
private in `docs/client/` (handoff guide with yellow placeholders to fill at the domain step, SOW,
company notes, the parked Google Business Profile pack).

## 6. How to work with Krishna on this (learned this session)

- He reviews on his **iPhone** and sends **screen recordings** (WhatsApp videos in `~/Downloads`) and screenshots. `ffmpeg` is not installed; read videos with Python OpenCV (`cv2`, installed) into a contact sheet:
  ```python
  import cv2; from PIL import Image
  cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS); frames = []; i = 0
  while True:
      ok, fr = cap.read()
      if not ok: break
      if i % int(fps / 3) == 0:
          im = Image.fromarray(cv2.cvtColor(fr, cv2.COLOR_BGR2RGB)); im.thumbnail((240, 520)); frames.append(im)
      i += 1
  ```
- He often sends a follow-up while you are working; treat it as part of the same task.
- He judges by feel and motion. When he points at a site ("mimic this"), run `skillui --url`, download its CSS and scripts, and copy the real choreography (durations, easings, layering), with HARA's content and open fonts.
- His screenshots can show a cached old version (Safari). If something he reports is already fixed, tell him to hard-reload before changing anything.
- After `npx wrangler deploy`, the new version can take 10 to 15 seconds to show; wait before checking.
- Always look at frames (`logo-frames.mjs`) or screenshots at desktop and phone widths before telling him something is done, and send the live link.

## 7. Short history

- 09-23/24: "Afterhours" demo. 09-28: renamed HARA, the client's own logo traced, navy palette, Cloudflare backend, legal pages, gate GO.
- 10-01 (day): real contact details, one-page scope, Phase 5 QA, final gate GO; print collateral built in `~/hara-print`. Client: "fonts too heavy".
- 10-01 (evening and night): design lab. A to F rejected; G (coreastudios.com system) loved; H (G in HARA colours) chosen and polished into the Studio design; a Collection-style B built and deleted; print content refreshed; phone set to 437 only; the hero logo intro built in three versions to Krishna's corrections, now generated by `logo-layers.mjs`.
