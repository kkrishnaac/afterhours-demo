# Afterhours: office-cleaning company website

Demo site for Krishna's friend's commercial office-cleaning company in the Greater Toronto Area.
"Afterhours" is a WORKING NAME; the real name and a client brief (PDF) now exist. See `HANDOFF.md`
for where the last session stopped and what comes next.

- Live demo: https://kkrishnaac.github.io/afterhours-demo/ (GitHub Pages, public repo
  `kkrishnaac/afterhours-demo`, `robots: noindex`)
- Local dev: `npm run dev` (port 4331, launch config `afterhours`); production preview
  `npm run build && npm run preview` (port 4332, launch config `afterhours-dist`)
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

Static site, no backend yet. Vite 8 (vanilla JS modules, plain CSS), GSAP 3.15 + ScrollTrigger,
Lenis 1.3 (desktop only), self-hosted fonts via @fontsource (Cormorant Garamond 500/600/700 for
display, Hanken Grotesk 400/500 for text). Page JS is ~55 KB gzip. No framework, no Tailwind.

## File map

| Path | What it is |
|---|---|
| `index.html` | All markup. Sections: hero, dusk band, services band, work gallery, checklist band, areas map, dawn + quote form, footer, photo viewer dialog, loader |
| `src/main.js` | Entry: Lenis (non-touch only), `ScrollTrigger.config({ ignoreMobileResize: true })`, wires hero, story, quote, viewer, loader |
| `src/hero.js` | 2D wordmark animation: dirt clip rect + squeegee + glint, GSAP timeline, auto-plays (~2.3 s) |
| `src/loader.js` | Intro: tiny centred word hard-cuts through GTA cities, lands on the name, name becomes the cobalt pill while the page slides up. Once per browser session (`sessionStorage`), skipped for reduced motion |
| `src/story.js` | Scroll behaviour: top bar hidden until the hero wordmark leaves view, dusk turn-line fade, photo squeegee reveals, checklist ticks, map lighting, clock pill time + chapter |
| `src/viewer.js` | Photo viewer dialog (focus trap, Esc, arrows, swipe, counter, thumbnail strip; pill becomes Close) |
| `src/photos.js` | Single list of all 9 photos (IMG 01-09 order, titles, times, alt text) used by captions + viewer |
| `src/quote.js` | 4-step quote form. DEMO ONLY: nothing is sent anywhere |
| `src/map.js` | GTA SVG map from real lat/long, 16 cities, shoreline; exports `CITY_NAMES` for the form |
| `src/style.css` | All styles. Tokens in `:root` |
| `src/wordmark.json` | Generated wordmark outline data |
| `scripts/make-wordmark.mjs` | `npm run wordmark`: font outlines for WORD -> rewrites the whole `<svg class="wordmark">` in index.html |
| `scripts/make-grime.mjs` | `npm run grime`: bakes `public/img/grime.webp` (dirt inside the letters) |
| `scripts/optimize-images.mjs` | `npm run images`: 4K masters in `assets/raw/` (gitignored) -> AVIF/WebP ladders in `public/img/` + `og.jpg` |
| `vite.config.js` | `base: './'`; build-only plugin injecting CSP + referrer meta tags |
| `security/golive/` | Go-live reports (2026-09-23 GO, 2026-09-24 GO re-run) |

Photo masters were generated with Higgsfield (GPT Image 2.5 via `marketing-studio/image/flare`,
4K) by `~/higgsfield/sites/afterhours_stills.py`. 9 of 10 exist; `03-boardroom` failed (not charged).

## Locked design decisions (Krishna's calls; don't re-litigate without him)

- Whole site on a light background ("white gives very clean vibes"). No background gradients.
- Palette: `--bg #F8FAFC`, `--ink #0F172A`, `--ink-muted #475569`, `--hairline #E2E8F0`,
  ONE accent `--accent #1D4ED8` cobalt (white text) for the pill and buttons only. Picked via
  ui-ux-pro-max "B2B Service" + his gallery-mono/electric-blue choice. On dark photos use white, not blue.
- Hero: 2D ONLY (he rejected 3D as "not crisp"). Wordmark arrives dirty, squeegee wipes it clean
  AUTOMATICALLY (no tap-to-replay), ends crisp glossy black. Tight centred group: name, one line, button.
- Only one company name visible on the hero: the WHOLE top bar is hidden until the wordmark scrolls
  out of view, then slides down; hides again on scroll back up.
- Stills only: super-clean offices, no people, no before/after or "transformation" shots, no video.
- Photos used as full-bleed section backgrounds with text on top (dusk, services, checklist, dawn),
  plus an edge-to-edge gallery after alexzarour.com (full-width 3:2 plates + one-screen pairs,
  "IMG 03 Kitchen, 01:30" captions). Infinite-loop scroll deliberately not copied.
- Brief (2026-09-24): super simple, very easy to use, plus one or two standout touches.
- Phone scrolling must stay smooth: native scroll on touch (no Lenis), no pinning, no parallax,
  `svh` units (never `dvh` for section heights), solid nav on touch (no backdrop blur).

## Conventions

- Visible copy: no em or en dashes (taste rule). Sentence case. One CTA label per intent ("Get a quote").
- Shapes: every interactive element is a pill; photos are square-cornered.
- Every animation honours `prefers-reduced-motion` (JS checks + CSS override at the end of style.css).
- Contrast: body text >= 4.5:1. Accessible names on icon-less buttons; `translate="no"` on the brand.
- Placeholders still in the page: services list, phone `(416) 555-0199`, `hello@example.com`,
  checklist times, the working name. Footer says so.

## Deploy (GitHub Pages)

```bash
source ~/.nvm/nvm.sh && npm run build && touch dist/.nojekyll
D=$(mktemp -d) && cp -R dist/. "$D"/ && cd "$D" && git init -q -b gh-pages && git add -A \
  && git commit -qm "Deploy" && git config http.postBuffer 524288000 \
  && git push -qf https://github.com/kkrishnaac/afterhours-demo.git gh-pages; cd - && rm -rf "$D"
```
Source goes to `main` as normal commits. Pages rebuilds in ~45 s; confirm by curling the live
index for the new hashed CSS filename. Run `security-protocol` before every deploy.

## Gotchas (learned the hard way)

- CSP is a build-only `<meta>` (GitHub Pages can't set headers): `default-src 'self'`, no inline
  scripts/styles in markup. CSSOM changes from JS (`el.style.x = ...`, GSAP) are fine. Dev server is exempt.
- ScrollTrigger: create triggers in page order; a pinned section adds scroll length that earlier
  triggers won't see. Nav state syncs on `onToggle` AND `onRefresh`.
- Never clip an `<img loading="lazy">` fully (clip-path): Chrome won't lazy-load it. Photo reveals use
  a `::after` cover scaled by the `--cover` CSS var instead.
- opentype.js 2.x `toPathData()` emits NaN; the wordmark script serialises commands by hand.
- `git push` of the 13 MB image set 400s without `http.postBuffer 524288000`.
- Higgsfield spend gate: paid runs need Krishna to type `yes` in a terminal. Start them with
  `run_in_terminal` AND show the terminal pane (he looked in the macOS Terminal app once and never
  saw the prompt). A self-approving `--yes` via Bash is blocked by the auto-mode classifier.
- The security scan greps every file for "webhook"/"claude"; our own reports trigger false positives.
  Verify matches are outside `src/`, `index.html`, `dist/` before treating them as real.
- Rename the business: edit `WORD` in `scripts/make-wordmark.mjs`, run `npm run wordmark`, then
  update the loader's last word (`src/loader.js`), titles/meta, nav/footer brand, alt text and copy.
