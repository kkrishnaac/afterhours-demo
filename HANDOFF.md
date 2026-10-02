# Handoff: HARA website and print collateral

Updated 2026-10-02, after the long 2026-10-01 session. Read in this order: this file, `CLAUDE.md`
(especially "Studio on production", "Print collateral", "Design decisions", "Gotchas"),
`~/hara-print/README.md` for the print work, and `docs/DEPLOY.md` for the domain.

**State in one paragraph.** The **Studio** design (the coreastudios.com system rebuilt in HARA's
colours, approved by Krishna in the design lab) is **live on production**:
https://hara-website.chaudharikrishna0415.workers.dev (Worker version `4411dbf9`), with the real
four-step form, the legal pages and the same CSP. Security gate GO, Lighthouse phone 97 and
desktop 100, axe 0 violations. The design lab is **offline** (not deleted). The **business card
and tri-fold brochure** in `~/hara-print` were redrawn in the Studio language (commit `e3a2629`,
110 checks PASS, the URL check fails until the domain exists). Krishna likes the template and
**wants to change the business card's colours next** (prompt in section 0). The **domain is not
bought**: `haracleaning.ca` was still free on 2026-10-02 (CIRA WHOIS); Krishna or HARA buys it,
then the site, email and print move onto it (section 3).

## 0. Prompt for the next session (business card colours)

Start a new Claude Code session **in `~/hara-print`** and paste this:

```
You are continuing the HARA Facilities Cleaning print work. Read in full first:
~/afterhours/HANDOFF.md (sections 0, 1 and 6), the "Print collateral" section of
~/afterhours/CLAUDE.md, and ~/hara-print/README.md. Then read haraprint/card.py,
haraprint/colors.py, haraprint/layout.py and haraprint/logo.py before touching anything. Run the
engineering-team skill first.

The job: I like the current business card and brochure template (the website's Studio design,
commit e3a2629). I only want to CHANGE THE COLOURS OF THE BUSINESS CARD. Keep the layout, the
type, the content and the brochure exactly as they are unless I say otherwise. The card today:
front = deep navy flood (web #03275A, CMYK 100/94/40/25) with the logo in white; back = white
paper, a 100K label, "TOMORROW / STARTS CLEAN." in HARA navy Archivo capitals (#0B3A80, CMYK
100/86/18/3), contact details in 100K, the QR in 100K.

How to work:
1. Ask me which colours I want before building. If I'm not sure, show me 2 or 3 options as
   rendered proof images side by side (front and back), using colours from the website's palette
   (white #FAFBFD, navy #0B3A80, deep navy #03275A, sky #0A95EF, pale sky #BFE3FF) or the
   logo's own colours, and let me pick.
2. Convert every new colour from its web hex to CMYK through Coated GRACoL 2006 with the recipe
   in ~/afterhours/HANDOFF.md section 1, add it to haraprint/colors.py with a comment and to
   SWATCH_TABLE, and note it in docs/00-INPUTS_AND_COLOUR_REPORT.md.
3. Keep the print rules the preflight enforces: text under 14pt is 100K or a paper-white
   knockout (never a colour mix); coloured text only at 14pt and up; white knocked-out text 8pt
   or more, medium weight; total ink 280% or less; no transparency, no gradients (the logo's
   flat colours come from colors.LOGO). If a background changes, check the logo still reads on
   it (full colour, or white with mono=colors.PAPER, as the front does now) and that the QR keeps
   its white quiet zone.
4. Rebuild with python3 build.py. Every check must PASS except the URL check, which fails until
   haracleaning.ca is live (the domain isn't bought yet; keep it in the QR and on the card).
5. Show me the business-card PROOF as images (render command in HANDOFF.md section 1) and the
   mockup deliverables/business-card_MOCKUP.png before anything is final. Iterate until I say
   it's done.
6. Commit in ~/hara-print (local repo, not pushed). At the end update ~/afterhours/HANDOFF.md
   (section 1 and the state paragraph), the "Print collateral" section of ~/afterhours/CLAUDE.md
   and memory (hara-print-collateral.md).

Ground rules: I direct the design. Only the website's details on the card (no personal name or
title). No em or en dashes in visible copy, sentence case, the CTA label is "Book a free
walkthrough". Company facts only from the website or me.
```

## 1. Print collateral (`~/hara-print`)

Its own local git repo (not pushed). Business card 3.5 x 2 in and letter tri-fold brochure
(C-fold), drawn with ReportLab in DeviceCMYK, converted to PDF/X-1a:2001 by a user-built
Ghostscript at `~/.local/bin/gs`, 110 preflight checks. `python3 build.py` rebuilds everything into
`deliverables/` (PRINT and PROOF PDFs, mockups, fold diagram and paper fold template, preflight
report, printer spec sheet, client approval form, colour report, how to print, zip with checksums).
It exits non-zero on any FAIL.

**The design (2026-10-01 late, commit `e3a2629`), the website's Studio language:**
- Fonts: Archivo (capitals, width 112, weight 850) for headings and Hanken Grotesk (400, 500,
  600) for text, the website's fonts, SIL OFL 1.1, instanced and renamed at build time
  (`haraprint/fonts.py`, licences in `assets/fonts`).
- Card: front deep navy flood with the logo in white (like the site's footer); back white with a
  small label, "TOMORROW / STARTS CLEAN." in navy, contact details and the QR (`haraprint/card.py`).
- Brochure (`haraprint/brochure.py`): front cover = the white hero (logo, headline, line, navy
  button) over a full-bleed office photo; back cover = navy footer (white logo, booking, QR,
  contact); inside flap = how it works (01 to 05), the 16 cities as chips, a photo card;
  inside left = why HARA, hours with the day tiles and a photo card; inside centre = the site's
  photo cards; inside right flap = navy, security and what a visit includes. No boxes except
  the photos.
- Photo cards: white Archivo titles over a darkened lower edge baked into the pixels
  (`photos.scrim`; PDF/X-1a allows no transparency); captions print under the photo, never on it.
- Photos: the website's Unsplash masters (ids 11 to 19) in `assets/photos`.

**Where things live:** content `haraprint/content.py` (only the website's copy); colours
`haraprint/colors.py`; type styles `haraprint/layout.py`; components `haraprint/column.py` (photo
cards, chips, day tiles, buttons); geometry `haraprint/geometry.py`; logo `haraprint/logo.py`
(`mono=` draws it in one colour).

**Print rules the preflight enforces** (`haraprint/preflight.py`): text at least 7pt; text under
14pt is 100K or a paper-white knockout; light (knockout) text at least 8pt; coloured text only at
14pt and up; total ink at most 280%; everything inside the safe zone and clear of the folds; QR
0.9 to 1.0 in with a 4-module quiet zone; images at least 300 ppi, never upscaled; spell check;
URL answers 200 with no redirect.

**Colour recipe (web hex to print CMYK), Coated GRACoL 2006, relative colorimetric with black
point compensation.** It reproduces every approved value in `colors.py` (#03275A gives 100/94/40/25):
```bash
cd ~/hara-print && python3 -c "
import sys; sys.path.insert(0, '.')
from PIL import Image, ImageCms
from haraprint import photos
hx = '#03275A'
rgb = tuple(int(hx[i:i+2], 16) for i in (1, 3, 5))
px = ImageCms.applyTransform(Image.new('RGB', (1, 1), rgb), photos.transform()).getpixel((0, 0))
print('CMYK', tuple(round(v / 2.55) for v in px), 'TAC', round(sum(px) / 2.55))"
```

**Showing proofs as images** (Krishna's rule: he sees the PROOF before anything is final):
```bash
~/.local/bin/gs -dBATCH -dNOPAUSE -dQUIET -sDEVICE=png16m -r220 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile=<scratch dir>/card_%d.png deliverables/business-card_PROOF.pdf
```
(page 1 = front, page 2 = back; the brochure at `-r110` or `-r130`, page 1 = outside, page 2 = inside).
The mockups in `deliverables/*_MOCKUP*.png` are rendered from the PRINT PDFs.

| Item | State |
|---|---|
| Content | Current: the site's copy, photo-card list and section labels, (437) 980-3464 only, the two security practices HARA confirmed |
| Design | Studio redraw done; Krishna likes the template; **next: new colours for the business card** |
| URL and QR | `https://haracleaning.ca` (domain not bought yet, section 3) |
| Last build | 110 PASS, 1 FAIL (the URL check, expected until the domain is live) |
| Before press | the domain live, a clean rebuild, the client signs `deliverables/CLIENT_APPROVAL_FORM.md` |

Krishna's rules: only the website's details on the card (no personal name or title); show the
PROOF PDFs as images before anything is final; the client signs the approval form before release.

## 2. What is live in production

| Thing | State |
|---|---|
| Production URL | https://hara-website.chaudharikrishna0415.workers.dev (Worker `hara-website`, version `4411dbf9`) |
| Design | The Studio design, source in `src/studio/` (CLAUDE.md "Studio on production") |
| Scope | One page plus privacy, terms, accessibility and 404. The old multi-page build is in git tag `multi-page-archive` |
| Contact | (437) 980-3464 only (page, legal pages, structured data), harafacilitiescleaning@gmail.com |
| Form | Live, stores to D1, `EMAIL_MODE=hold` until the domain can send email |
| Quality | 67 tests; form end to end at 1440 and 390 px; axe 0 violations on every page and form step; Chromium, WebKit, Firefox (grid fallback without scroll timelines); Lighthouse phone 97, desktop 100, accessibility and best practices 100, SEO 100 once `noindex` lifts |
| Gate | GO (the Studio and performance deploys at the end of `security/golive/2026-10-01-full-GO.md`) |
| Indexing | `noindex` until `VITE_SITE_URL` is set at the domain step |
| Design lab | Offline: `workers_dev: false` in `design-lab/wrangler.jsonc` (flip to true and `cd design-lab && npx wrangler deploy` to bring it back). Delete it for good only when Krishna says so |
| Repo | `kkrishnaac/afterhours-demo`, public, `main` pushed |

**What the live site does (Krishna's calls, 2026-10-01):**
- **Hero:** centred, sized to the screen on wide screens; the logo plays a one-time intro (section 4).
- **Wide screens:** a white bar with the reel or grid toggle and the CTA; the photo reel pans
  sideways with the scroll; the dial menu on the left fades in with the intro; at its pivot a
  navy knob that turns into the logo once the hero logo is out of sight (tap: back to the hero).
- **Phones:** no header; past the hero, only while scrolling down, a bar in the page's own
  colour slides in with "Menu" (deep navy or white text); it drops the six options as buttons.
  Its background colour follows the page so iPhone Safari's status-bar tint matches.
- **Below the photos, on deep navy:** why HARA, what a visit includes, hours (live Toronto
  clock), security, how it works, the 16 cities (links that preselect the form), the real form,
  then the footer with the white logo.

## 3. The domain (next after the print work)

**Not bought.** On 2026-10-02 CIRA's WHOIS showed `haracleaning.ca` (and `harafacilitiescleaning.ca`)
as not registered. Buying is Krishna's or HARA's step (it is a purchase in HARA's name):
1. Any CIRA-certified registrar that sells `.ca` (for example Namecheap, GoDaddy, Hover).
2. Registrant **HARA Facilities Cleaning** (a Canadian business, as `.ca` requires), contact
   harafacilitiescleaning@gmail.com, so HARA owns its address after the handoff.
3. Auto-renew, registrar lock and two-factor login on the registrar account. No add-ons (hosting,
   email, SSL, site builder): Cloudflare and Resend cover those.

Then (runbook in `docs/DEPLOY.md`, "Connect the domain"): add the zone to Cloudflare and paste
Cloudflare's two nameservers at the registrar (in Krishna's accounts, he does the clicks); SSL
Full (strict), Always Use HTTPS, DNSSEC; Turnstile hostnames; Resend with SPF, DKIM, DMARC;
`routes` and `vars` in `wrangler.jsonc`; `VITE_SITE_URL` in `.env.production-cf`; deploy; Search
Console; the security gate against the domain. Then rebuild the print files: the URL check passes
and the approval form goes to the client.

## 4. The hero logo intro (live on production)

| File | What it does |
|---|---|
| `design-lab/logo-layers.mjs` | Generates every layer from the traced logo (`src/logo-parts.js`) for the design lab AND the live site (`public/brand/logo-*.svg`, `partials/hero-logo.html`). The H's uprights are clean rectangles (`LEFT`, `RIGHT`, `TOP`, `FOOT`); the star's path is `CENTRE`; the starting crossbar is `CROSSBAR`. Edit the generator, never the generated files |
| `src/studio/logo-intro.js` | The choreography with Motion's `animate()` (imported from npm); sets `html.intro-in` so the wide-screen dial fades in with it |
| `src/studio/h.css` | Resting states, the no-script failsafe (finished logo after 2.4 s), reduced motion (finished logo at once), per-sparkle `transform-origin` (`.logo-cut__spark--1/2/3`) |
| `design-lab/logo-frames.mjs` | Frame capture: `node design-lab/logo-frames.mjs <url> <outDir> desktop\|phone ms,ms,...` |

In time order after the load event: the normal H (0); the star scales in at the ring's sharp left
tip (150 to 300 ms); it follows the ring's path, drawing the ring and turning the H into the
logo's H where it has passed (300 to 1150); it winks out at the end of the curl (1150 to 1390);
the three sparkles twinkle on in place, nearest first (1200 to 1930); `is-done` (~2050).

**Krishna's rules for it:** start from a normal H; the star starts at the ring's sharp left tip
and travels the way the ring is drawn; nothing on the H moves or is laid over it (no jolt, shine,
glints, ledge or seam); the H is straight (plain rectangles, level tops: the traced right upright
looked crooked); sparkles appear in place, never out of the H; about a second and a half; no
loader. The header mark, footer logo, favicon and print still use the traced H with the slanted
top: ask him before changing those.

## 5. Still open with Krishna (dashboard only; nothing in this repo records the result)

1. **Confirm 2FA** on every account that can reach the leads or the site: Cloudflare (My Profile,
   Authentication), GitHub (Settings, Password and authentication), Resend (team Settings,
   Security), Gmail (Google Account, Security, 2-Step Verification), and the registrar once the
   domain is bought.
2. **Analytics token (optional):** Cloudflare Web Analytics, Add a site, hostname
   `hara-website.chaudharikrishna0415.workers.dev`, manual snippet, copy the 32-character token,
   put `CF_BEACON_TOKEN=<token>` in `.env.production-cf`, `npm run deploy`.
3. **Decisions:** keep or delete the Afterhours reference Worker
   (https://afterhours-design.chaudharikrishna0415.workers.dev); delete the design lab for good or
   keep it offline; whether the repo goes private; revise and re-price the SOW in `docs/client/`
   for the one-page scope.
4. **QA left on the Studio site:** `scripts/qa/matrix.mjs` and `keyboard.mjs` still look for the
   old page's selectors (`.hero__stage`, `.svc__photo`, the viewer); `axe.mjs` and `e2e.mjs` are
   updated and pass.

With HARA: a lawyer's review of the privacy policy and terms (recommended). Client documents are
private in `docs/client/` (handoff guide with placeholders for the domain step, SOW, company
notes, the parked Google Business Profile pack).

## 6. How to work with Krishna on this

- He reviews on his **iPhone** and sends **screen recordings** (WhatsApp videos in `~/Downloads`)
  and screenshots. `ffmpeg` is not installed; read videos with Python OpenCV (`cv2`) into a contact sheet:
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
- He often sends follow-ups while you work; treat them as part of the same task.
- He judges by feel and motion, and directs the design. When he points at a site ("mimic this"),
  run `skillui --url` and copy the real choreography with HARA's content and open fonts.
- His screenshots can show a Safari-cached old version: ask him to hard-reload before "fixing"
  something twice. After a deploy, wait 10 to 15 seconds before checking.
- Look at frames or screenshots at desktop and phone widths (or rendered PROOF images for print)
  before telling him something is done; send live links, never localhost.

## 7. Short history

- 09-23/24: "Afterhours" demo. 09-28: renamed HARA, the client's own logo traced, navy palette, Cloudflare backend, legal pages, gate GO.
- 10-01 (day): real contact details, one-page scope, Phase 5 QA, gate GO; print collateral built in `~/hara-print`. Client: "fonts too heavy".
- 10-01 (evening): design lab; A to F rejected; the coreastudios.com system in HARA's colours chosen as the Studio design; the hero logo intro in three versions.
- 10-01 (late night): straight H and in-place sparkles; new menus (phone bar, wide-screen knob); the Studio design ported to production with the real form (gate GO, Lighthouse 97/100); design lab offline; business card and brochure redrawn in the Studio language.
