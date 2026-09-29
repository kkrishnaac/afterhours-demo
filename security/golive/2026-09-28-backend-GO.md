```
GO-LIVE SECURITY REPORT
Project:  HARA Facilities Cleaning website + walkthrough request backend
Target:   https://hara-website.chaudharikrishna0415.workers.dev (Cloudflare Worker "hara-website")
Stack:    Vite static build served by a Cloudflare Worker (static assets), D1 database,
          Turnstile, Workers rate limiting, Resend (email, not yet connected). No user accounts.
Date:     2026-09-28
Auditor:  security-protocol gate

────────────────────────────────────────────────
VERDICT:  GO for the pre-domain deployment (noindex, link not shared yet).
          Account hardening (2FA on every account that holds the data) must be
          confirmed before the domain goes live; details kept in private notes.
────────────────────────────────────────────────

SCORE
  A  Secrets & exposure        10/10 passing
  B  Identity & access          4/4  passing   N/A: 7 (no accounts or sessions)
  C  Data layer & platform      4/4  passing   N/A: 1
  D  Input & injection          7/7  passing   N/A: 4
  E  AI features                            N/A: 2
  F  Hardening & operations     9/10 passing   N/A: 1   (1 open: alerting)
  ─────────────────────────────────────────
  TOTAL                        34/35 applicable   N/A: 15
```

## Attack surface (Phase 1)

| Surface | Access | Notes |
|---|---|---|
| `GET` pages: `/`, `/privacy`, `/terms`, `/accessibility`, assets | Public | Served from `dist/` through the Worker, headers from `dist/_headers` |
| `POST /api/walkthrough` | Public, write-only | The only endpoint. Returns `{ok}` or an error code, never a record |
| Any other `/api/*` | Public | JSON 404 |
| Cron (every 15 min) | Internal | Retries held/failed notifications, deletes rows older than 730 days |
| D1 `hara-walkthroughs` (ENAM) | Worker binding; Cloudflare account | No public access path |
| Outbound | Worker | Only `challenges.cloudflare.com/turnstile/v0/siteverify` and `api.resend.com/emails` (fixed URLs) |
| Input | Form fields | size, timing, city (allowlists), name, email, phone, marketing (boolean), honeypot, Turnstile token |

## Automated scan (Phase 0)

- npm audit (production deps): **0 vulnerabilities**. Dev tooling: 4 moderate in `undici` via
  wrangler/miniflare (local dev server only, never shipped). Revisit on the next wrangler release.
- **T17 flagged (false positive for the live system):** the match is a minified line in
  `.wrangler/tmp/…/index.js.map` (local dev bundle, gitignored). Every Worker query uses bound
  parameters (`.bind()` in `worker/walkthrough.js` x5, `worker/maintenance.js` x3). The one place
  SQL is built from strings is `scripts/leads.mjs`, a local operator CLI (wrangler's CLI has no
  parameters): its inputs are an integer, a date it generates itself, and an email matched against
  `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` (no quotes, spaces or semicolons possible)
  with quotes doubled regardless. Not reachable from the internet.
- **T31 / E flagged (false positives):** the scanner greps for "webhook" and "claude"; matches
  are only in `CLAUDE.md`, `HANDOFF.md` and earlier reports. No webhook, no AI feature.

## Grades (Phase 2)

| # | Threat | Grade | Evidence |
|---|---|---|---|
| 1 | DB credentials | PASS | D1 via binding; no connection strings anywhere |
| 2 | Env files | PASS | `.env*`, `.dev.vars*`, `.wrangler` gitignored; only `.example` templates tracked |
| 3 | Hardcoded keys | PASS | Turnstile secret set with `wrangler secret put` (piped, never written to the repo); Resend key not issued yet. Test keys in templates are Cloudflare's public test keys |
| 11 | Build logs | PASS | Local builds; secrets never enter the Vite build (`VITE_` values are the public site key and API path only) |
| 13 | Public repo / history | PASS | Public by design (GitHub Pages); `git log --all` has no client files or secrets |
| 14 | Secrets in frontend | PASS | Bundle holds the public Turnstile site key only |
| 29 | Public staging | PASS | The workers.dev deployment IS the production Worker, `noindex`, not linked anywhere |
| 30 | Default credentials | PASS | No logins exist |
| 36 | Source maps | PASS | `sourcemap: false`; no `.map` in `dist/` |
| 46 | Internal dashboards | PASS | None exposed; data only via the Cloudflare account |
| 5 | Authorization | PASS | No endpoint returns stored data |
| 15 | Client-only checks | PASS | Server re-validates every field (`worker/validate.js`), 52 tests |
| 33 | IDOR | PASS | No IDs accepted from clients; the server generates the UUID |
| 34 | Trusting client IDs/roles | PASS | `status`, `consent_version`, `marketing_consent_at`, `source` are set server-side only |
| 4, 6, 9, 24, 25, 26, 50 | Accounts, sessions, admin, tenancy | N/A | No user accounts or admin routes |
| 7 | Open DB permissions | PASS | D1 has no public endpoint; reachable only through the Worker binding and the account |
| 41 | Excessive DB permissions | PASS | The binding reaches one database holding one table; D1 has no finer roles |
| 44 | Backups | PASS | D1 Time Travel point-in-time restore (`wrangler d1 time-travel`); `npm run leads` exports CSV |
| 49 | Unencrypted data | PASS | TLS everywhere (HTTP now 301s to HTTPS, HSTS); D1 encrypted at rest by Cloudflare |
| 8 | Buckets | N/A | None |
| 16 | Input validation | PASS | Allowlists, length limits, control-character rejection (incl. CR/LF header injection) |
| 17 | SQL injection | PASS | Bound parameters; see scan note on `scripts/leads.mjs` |
| 19 | XSS | PASS | Visitor text escaped in emails (`esc()`), `textContent` in the page, CSP `script-src 'self' https://challenges.cloudflare.com`, no inline scripts |
| 20 | CSRF | PASS | Origin allowlist + JSON-only content type (a cross-site form post can't send it); verified live: 403 / 415 |
| 23 | SSRF | PASS | Outbound fetches go to two fixed URLs |
| 27 | CORS | PASS | No CORS headers at all (same-origin only); verified live |
| 22 | Path traversal | PASS | No file paths from requests; config files return 404 live (`/wrangler.jsonc`, `/.dev.vars`, `/_headers`) |
| 18, 21, 31, 32 | NoSQL, uploads, webhooks, payments | N/A | None |
| 39, 40 | AI features | N/A | None |
| 10 | Debug pages | PASS | No debug routes or flags |
| 12 | Verbose errors | PASS | Clients get short codes only; unhandled errors return `{"error":"server"}` |
| 28 | Rate limits | PASS | 5 req/min/IP (binding), Turnstile, 10-minute duplicate window, 2 confirmation emails/day/address |
| 35 | Sensitive logs | PASS | Logs carry request IDs only; a test asserts no name/email/phone/token appears |
| 37 | Dependency vulnerabilities | PASS | Production 0; dev-only moderate noted above |
| 38 | Outdated packages | PASS | Current; `vite` 8.3.1 patch available (build tool) |
| 42 | Audit logs | PASS | Every row timestamped with consent version; Cloudflare account audit log records DB access |
| 43 | Monitoring and alerting | **FIX THIS WEEK** | Workers observability is on; no alert yet for `walkthrough.notify_failed` or Worker errors. Add a Cloudflare notification when email is connected |
| 47 | Security headers | PASS | Verified live: CSP (+ `frame-ancestors 'none'`), HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP, CORP; API responses carry their own |
| 48 | Cookies | N/A | The site sets none |
| 51 | Over-trusting generated code | PASS | Every file read; 52 tests; live end-to-end run through real Turnstile into production D1 (test row deleted after) |

## Adversarial pass (Phase 3)

1. **Browser + URL only:** config files 404; API refuses other origins, non-JSON, oversized
   bodies, fake tokens, GET. Nothing to enumerate.
2. **Change an ID:** no endpoint accepts or returns IDs.
3. **What is trusted from the client:** nothing beyond validated form values; consent version,
   status, timestamps and IDs are server-set. `CF-Connecting-IP` is set by Cloudflare's edge and
   can't be spoofed by the client on this route.
4. **Worst thing a hostile visitor can do:** submit junk rows at 5/min/IP after solving Turnstile
   each time (human farms). Contained by rate limits, D1 capacity, and 24-month retention.
   Email bombing through the confirmation email is capped at 2 a day per address (and no
   confirmations are sent while email is on hold).

UNLISTED
- The workers.dev hostname shows the account handle (`chaudharikrishna0415`). Low; goes away
  when the domain is connected and workers.dev is switched off.
- Turnstile token replay is refused by Cloudflare (single-use tokens); hostname is checked.

## Before the domain goes live or the link is shared

- **[Rule 11] Account hardening:** confirm two-factor authentication (security key or
  authenticator app) on Cloudflare, GitHub, the registrar and Resend. The account status was
  checked during this audit; the result is recorded privately, not in this public repo.

## FIX THIS WEEK / at domain connection

- [T43] Cloudflare notification for Worker errors; watch `walkthrough.notify_failed`.
- Legal (build-security Part B): privacy policy, terms and accessibility statement are live and
  match the stored data; HARA must confirm the security practices on the site, replace placeholder
  contact details, and have a lawyer review the policy. The generated photos' commercial licence
  should be confirmed before launch.

This is a structured audit against 50 attack classes, not a penetration test.

## Also deployed

The GitHub Pages address (kkrishnaac.github.io/afterhours-demo) now serves only a static redirect
page to the production URL: no scripts, CSP `default-src 'none'`, `noindex`, `no-referrer`.

## Re-run 2026-09-28 (evening): client logo, navy palette, 3D hero logo build: GO

Change set: the client's logo traced to SVG (`public/brand/`, favicon, touch icon, share image),
palette tokens, a hero whose logo builds itself once in 3D (`src/hero-logo.js`, lazy chunk
`src/hero-build.js`), colour values in `worker/email.js`. No new forms, endpoints, data flows,
keys or third-party origins.

- `golive_scan.sh`: 2 BLOCK + 1 CRITICAL, all false positives, checked by hand: T17 matched a
  local `.wrangler/tmp` source map (gitignored, never shipped; every D1 query binds `?1`/`?2`);
  T19 matched preview scripts in `docs/client/` (gitignored; no `innerHTML` in `src/` or the built
  bundles); T31 and the AI-feature notice match words in our own docs (no webhook handler, no AI code).
- T37/T38 dependency: `three@0.186.1` (MIT, github.com/mrdoob/three.js), pinned with an integrity
  hash in `package-lock.json`, no install scripts, `npm audit --omit=dev`: 0 vulnerabilities.
  Loaded as a same-origin lazy chunk only when the build plays.
- T19/T47: the 3D build parses only the logo paths bundled in `src/logo-parts.js` (no user input
  reaches `DOMParser`); the brand SVGs contain paths, gradients and a title, no scripts or links.
  CSP unchanged (`script-src 'self'`, no inline script or style); the hero was run under the real
  `_headers` on the local Worker: build completes, no CSP violations or console errors.
- T36: no source maps in `dist/`. Worker tests: 52 passed.
- Follow-up (same evening): one CSS line so the vector appears under the canvas at handoff (no colour dip). CSS only; redeployed.
