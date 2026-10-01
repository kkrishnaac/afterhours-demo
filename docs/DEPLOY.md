# HARA website: deployment

**Production is live** on Cloudflare at
https://hara-website.chaudharikrishna0415.workers.dev (Worker `hara-website`, version `765c3a63` as of 2026-10-01).
Pre-domain work still open (analytics token, HARA's security confirmation, final QA and gate) is
listed in `HANDOFF.md` section 6; the domain steps are below. Infrastructure state:

| Piece | State |
|---|---|
| Worker (pages + `POST /api/walkthrough` + 15-minute cron) | Deployed, `env.production` in `wrangler.jsonc` |
| D1 `hara-walkthroughs` (ENAM, id `e055cd87-…`) | Schema applied (`migrations/`) |
| Turnstile widget "HARA website" (managed) | Site key in `.env.production-cf` (gitignored), secret in Worker secrets |
| Rate limit, security headers, http→https, legal pages, 404, robots.txt | Live |
| Email | `EMAIL_MODE=hold`: requests are stored; HARA's notifications wait (no confirmations) until the domain can send email |
| Indexing | `noindex` on every page until `VITE_SITE_URL` is set |

No secret ever goes in this repo. Local secrets live in `.dev.vars` and `.env.*` (gitignored).

## Before the domain goes live (launch blockers)

- [ ] **2FA confirmed** on Cloudflare, GitHub, registrar, Resend and the business email.
- [x] Real phone number and email on every page (2026-10-01); "Demo site" footer line removed.
      Still open: HARA's inbox for `LEAD_TO_EMAIL` (placeholder in `wrangler.jsonc`).
- [ ] HARA confirms every security practice described on the page.
- [ ] Lawyer review of the privacy policy and terms (recommended), photo licence confirmed.

## Analytics (Cloudflare Web Analytics, cookie-free)

Wired but **off until a token exists** (`src/analytics.js`). To switch it on:
1. Cloudflare dashboard, **Analytics & Logs, Web Analytics, Add a site**. Hostname: the workers.dev
   address now (later the real domain: add it as a second site and use its token). Choose the
   manual JavaScript snippet and copy the 32-character `token` from `data-cf-beacon`. It is public
   by design (it sits in the page), not a secret.
2. Put it in `.env.production-cf` (gitignored): `CF_BEACON_TOKEN=<token>`
3. `npm run deploy`. The build then adds the beacon to every page, opens the CSP for exactly two
   origins (`static.cloudflareinsights.com` in `script-src`, `cloudflareinsights.com` in
   `connect-src`) and adds one sentence to the privacy policy. With no token none of that happens.
   A malformed token is ignored with a warning.
4. After the domain is connected: Cloudflare reports to the site's own address (already allowed by
   `'self'`), so `cloudflareinsights.com` can be removed from `connect-src` in `src/analytics.js`.
   Re-run the security gate after any change to the CSP.

## Connect the domain (the remaining step)

Replace `DOMAIN` with the real one, e.g. `harafacilities.ca`.

1. **DNS on Cloudflare.** Add `DOMAIN` as a site in this Cloudflare account (or HARA's, see
   below) and switch the registrar's nameservers to Cloudflare. Then in the zone: SSL/TLS
   **Full (strict)**, **Always Use HTTPS** on, **DNSSEC** on, registrar lock on.
2. **Turnstile.** Cloudflare dashboard, Turnstile, "HARA website": add `DOMAIN` and `www.DOMAIN`.
3. **Email (Resend).** Add `DOMAIN` in Resend, add the DNS records it lists (SPF, DKIM) in the
   Cloudflare zone, verify. Create an API key with **sending access only**, limited to `DOMAIN`:
   ```bash
   npx wrangler secret put RESEND_API_KEY --env production
   ```
4. **`wrangler.jsonc`, `env.production`:**
   ```jsonc
   "routes": [
     { "pattern": "DOMAIN", "custom_domain": true },
     { "pattern": "www.DOMAIN", "custom_domain": true }
   ],
   "vars": {
     "ALLOWED_ORIGINS": "https://DOMAIN,https://www.DOMAIN",
     "TURNSTILE_HOSTNAMES": "DOMAIN,www.DOMAIN",
     "EMAIL_MODE": "resend",
     "EMAIL_FROM": "HARA Facilities Cleaning <walkthroughs@DOMAIN>",
     "LEAD_TO_EMAIL": "<HARA's inbox>",
     "RETENTION_DAYS": "730"
   }
   ```
   Once the domain works, set `"workers_dev": false` so the workers.dev address stops serving.
5. **`.env.production-cf`** (gitignored), add (and the analytics token, see above):
   ```
   VITE_SITE_URL=https://DOMAIN
   VITE_SECURITY_CONTACT=mailto:security@DOMAIN
   ```
   This removes `noindex`, adds canonical links, absolute share-image URLs, JSON-LD (LocalBusiness as a
   service-area business on the home page), `sitemap.xml`,
   `robots.txt` with the sitemap, and `/.well-known/security.txt`.
6. **Deploy:** `npm run deploy` (runs the 60 tests, builds, deploys). On the next cron run
   (within 15 minutes) every request stored while email was on hold is emailed to HARA.
7. **Check:**
   - https://DOMAIN and https://www.DOMAIN load; http redirects to https.
   - securityheaders.com: A or better.
   - Submit a real request from a phone: HARA's inbox gets it within a minute, the
     confirmation arrives, and `npm run leads` shows it.
   - Search Console and Bing Webmaster Tools: add the site, submit `https://DOMAIN/sitemap.xml`.
   - Cloudflare Notifications: alert on Worker errors.
8. **Security gate:** run `security-protocol` against `https://DOMAIN`. Launch only on GO.

### Moving to HARA's own Cloudflare account instead

`npx wrangler login` as HARA's account, then `npx wrangler d1 create hara-walkthroughs --location enam`,
put the new id in `wrangler.jsonc`, `npm run db:migrate`, create a new Turnstile widget
(site key in `.env.production-cf`, secret via `wrangler secret put TURNSTILE_SECRET_KEY --env production`),
then follow the steps above. Existing requests: `npx wrangler d1 export hara-walkthroughs --remote --output leads.sql`
from the old account, `npx wrangler d1 execute DB --remote --env production --file leads.sql` in the new
one (then delete `leads.sql`, it contains personal data). Retire the old Worker and database.

## Backups and restore (rehearsed 2026-09-28)

D1 keeps a point-in-time history of the last 30 days (Time Travel); nothing to switch on. Both
recovery paths were rehearsed on a scratch database (`hara-restore-drill`, since deleted):
a row was written, deleted, and brought back by restoring to a bookmark; and a full export of
production was imported into an empty database and rebuilt the table and all three indexes.

**Undo a mistake in the last 30 days** (overwrites the database: everything after the bookmark is lost):

```bash
npx wrangler d1 time-travel info hara-walkthroughs --env production                  # current bookmark
npx wrangler d1 time-travel info hara-walkthroughs --env production --timestamp 2026-10-01T12:00:00Z  # bookmark at a time
npx wrangler d1 time-travel restore hara-walkthroughs --env production --bookmark=<bookmark>
```

Before restoring, note the current bookmark so the restore itself can be undone.

**Longer-term copy** (contains personal data: keep it off the repo and delete it when done):

```bash
npx wrangler d1 export hara-walkthroughs --remote --env production --output ~/Desktop/hara-backup.sql
npx wrangler d1 execute <empty-database> --remote --file ~/Desktop/hara-backup.sql
```

## Everyday commands

```bash
npm test                     # 60 Worker tests inside workerd with a local D1
npm run dev:worker           # local: build:cf + local migrations + wrangler dev on :8787
npm run deploy               # tests, production build, deploy
npm run db:migrate           # apply new migrations to production D1
npm run leads                # CSV of the last 30 days -> docs/client/leads/ (gitignored)
npm run data-request -- export someone@example.com   # PIPEDA access request
npm run data-request -- delete someone@example.com   # deletion request (asks to confirm)
npx wrangler tail hara-website --format pretty        # live logs (request IDs only, no PII)
```

Restore after a mistake: `npx wrangler d1 time-travel restore hara-walkthroughs --timestamp <ISO time>`.

## Local development

```bash
cp .dev.vars.example .dev.vars   # Turnstile TEST secret, dry-run email
npm run dev:worker
```

Local builds use Cloudflare's published Turnstile test site key (`.env.cloudflare`) and
`EMAIL_MODE=dry-run`, so nothing is ever emailed from a laptop.
