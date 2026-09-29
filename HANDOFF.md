# Handoff: HARA website, next session = colour palette and logo

Written 2026-09-28 at the end of the build session. Read `CLAUDE.md` first (stack, file map,
brand section, decisions, gotchas). This file is where things stand and what to do next.

## Where things stand

- **Live (pre-domain):** https://hara-website.chaudharikrishna0415.workers.dev on Cloudflare
  (Worker `hara-website`, version `9c30b59b`, D1 `hara-walkthroughs`, `noindex`). The old GitHub
  Pages URL redirects there. `main` is pushed and matches production.
- **Done:** redesign (green palette, Mona Sans, rounded shapes, quiet motion), content built on the
  client's four priorities, tower logo + full logo kit, walkthrough request backend (validation,
  Turnstile, rate limits, D1, email with hold mode, retries, retention), legal pages (privacy,
  terms, accessibility), 404, share image, security headers, https redirect, operator scripts,
  52 tests, security gate GO (`security/golive/2026-09-28-backend-GO.md`).
- **Client documents (private, `docs/client/`):** SOW (`HARA-Website-Scope-of-Work.docx`),
  security plan (`security/HARA-Security-Plan.pdf`), company notes, logo kit.
- **Waiting on HARA:** domain, business email + Resend, real phone/email, confirmation of the
  security practices on the site, lawyer review of the privacy policy. Then `docs/DEPLOY.md`.
- **Krishna's own action:** confirm 2FA on Cloudflare, GitHub and Resend (details in the private
  security plan).

## Next session: colour palette and logo

Krishna said: "I want to work on colour palette next and the logo of the company."
He didn't say what he dislikes yet, so **ask first, one question at a time**, for example:
1. What should change about the palette: the green itself, how much green there is, the
   neutrals, or a different direction entirely (e.g. back toward the client's navy/blue)?
2. For the logo: refine the tower mark, or explore new directions?
3. Does HARA (the client) want continuity with their original navy-and-blue logo?

### What exists today

- Palette tokens and every place colour lives: `CLAUDE.md` → "Brand" → "Palette".
- Logo description, mark path and every place the logo lives: `CLAUDE.md` → "Brand" → "Logo".
- The client's original logo: `docs/client/logo/original-client-logo.jpg` (deep navy lettering
  about `#0B2A5B`, bright-blue gradient swoosh and sparkles, an H with a building).
- Logo explorations already shown to Krishna:
  - `docs/client/logo/concepts.html`: A Doorway (arched door in the H), **B Tower (his pick)**,
    C Clean pass (diagonal crossbar).
  - `docs/client/logo/tower-variants.html`: he asked to redesign the tower; B2 slanted roof was
    chosen over B1 setback crown, B3 curtain-wall slit, B4 twin towers, B5 slant + slit.
  - Final kit and brand sheet: `docs/client/logo/final/` (`hara-logo-sheet.png`).

### What Krishna has said about brand so far

- Wants: professional, minimal, iconic; elegant brand-grounded type (not robotic defaults);
  "white gives very clean vibes"; smooth, soft shapes rather than sharp edges.
- Rejected before: 3D anything, sky-blue + warm beige gradient palette, swooshes/sparkles/gradients
  in the logo, a showy animated wordmark.
- Green was chosen because "hara" is Hindi for green. Worth confirming he still wants that link.

### How to work (suggested)

1. Run `engineering-team`, then `design-md-library`, `design-taste-frontend`,
   `redesign-existing-projects`; `ui-ux-pro-max` for palette ideas; the `design` skill for logo
   styles (no GEMINI_API_KEY, so build marks as vector like `build_logo.py` does).
2. Show 2 or 3 palette directions side by side before changing the site: a quick way is a sheet
   under `docs/client/` rendered through the dev server (`/docs/client/...`), or temporary
   `:root` overrides injected in the browser for real-page screenshots.
3. Change the palette only through the tokens and the list in `CLAUDE.md`; run
   `npm run contrast` (all PASS) and screenshot desktop + phone with the playwright MCP.
4. For the logo, edit `MARKS` in `docs/client/logo/build_logo.py`, run
   `python3 build_logo.py --final` (from that folder) and `node docs/client/logo/png.mjs`
   (from the repo root), then update the inline mark in `index.html` and `partials/`,
   `public/favicon.svg`, `public/apple-touch-icon.png` and `public/og.jpg`.
5. Ship to the live URL with `npm run deploy` after a security re-run note; tell Krishna the link.

## Other open work (after brand)

- Phase 4 of the SOW: Services, Security, FAQ, About and city pages; structured data.
- Alerts for Worker errors and failed notifications (set up with the domain).
- Dev-only `undici` advisories in wrangler's local tooling: update wrangler when a fix ships.

## Short history

- 09-23/24: "Afterhours" demo (night story, squeegee wordmark, GitHub Pages).
- 09-28: real name HARA; professional redesign; client priorities; tower logo; SOW; backend;
  Cloudflare production; security plan. Git history has the details.
