# HARA website: deployment

**Production is live** on Cloudflare at **https://haracleaning.ca** (Worker `hara-website`, version
`d31549ec` deployed 2026-10-14 with the domain; the Studio design). The workers.dev address
(https://hara-website.chaudharikrishna0415.workers.dev) still serves the same Worker until
`workers_dev` is switched off. Domain progress and what is still open: the checklist under
"Connect the domain" below and `HANDOFF.md` sections 3 and 5. Infrastructure state:

| Piece | State |
|---|---|
| Worker (pages + `POST /api/walkthrough` + 15-minute cron) | Deployed, `env.production` in `wrangler.jsonc` |
| D1 `hara-walkthroughs` (ENAM, id `e055cd87-…`) | Schema applied (`migrations/`) |
| Turnstile widget "HARA website" (managed) | Site key in `.env.production-cf` (gitignored), secret in Worker secrets |
| Rate limit, security headers, http→https, legal pages, 404, robots.txt | Live |
| Email | `EMAIL_MODE=hold`: requests are stored; HARA's notifications wait (no confirmations) until the domain can send email |
| Domain | `haracleaning.ca`, registered 2026-10-14 at GoDaddy (renews 2027-10-15, domain lock on); nameservers `robert` / `rosa.ns.cloudflare.com`; zone `92d6d4ea…` on the Free plan; Worker custom domains for the apex and `www` (www 301s to the apex in `worker/index.js`) |
| Indexing | Indexable since 2026-10-14 (`VITE_SITE_URL=https://haracleaning.ca`): canonical links, sitemap, robots, JSON-LD, security.txt |

No secret ever goes in this repo. Local secrets live in `.dev.vars` and `.env.*` (gitignored).

## Before the domain goes live (launch blockers)

- [ ] **2FA confirmed** on Cloudflare, GitHub, registrar, Resend and the Gmail inbox (steps: `HANDOFF.md` section 5).
- [x] **Cloudflare notification for Worker errors** (alert policy "HARA website Worker errors", 2026-10-01).
- [x] Security claims reduced to the two HARA confirmed (alarms; fobs and cards); photos replaced with licensed Unsplash originals (2026-10-01).
- [ ] Lawyer review of the privacy policy and terms (recommended).
- [x] Walkthrough requests go to harafacilitiescleaning@gmail.com (`LEAD_TO_EMAIL`, set 2026-10-01).
- [x] Real phone number and email on every page. Legal pages reviewed 1 October 2026.
- [x] Phase 5 QA and the full security gate (GO), see `security/golive/2026-10-01-full-GO.md`.

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

## Connect the domain

`DOMAIN` = `haracleaning.ca`. Progress (2026-10-14):
- [x] Zone added in Krishna's Cloudflare account (Free, DNS records entered manually so GoDaddy's
  parking records were never imported); GoDaddy nameservers switched to Cloudflare's.
- [x] SSL/TLS Full (strict), Always Use HTTPS, minimum TLS 1.2.
- [x] Turnstile widget "HARA website": `haracleaning.ca` added (covers `www`).
- [x] `routes` and `vars` in `wrangler.jsonc`; `VITE_SITE_URL` and `VITE_SECURITY_CONTACT`
  (HARA's Gmail, no domain mailbox yet) in `.env.production-cf`; deployed (`d31549ec`).
- [x] Zone active (2026-10-14 20:40 ET, once CIRA published the delegation); step 7 checks pass
  (https, redirects, certificate, headers, robots, sitemap, security.txt, origin check).
- [x] Security gate against the domain: GO (`security/golive/2026-10-14-domain-GO.md`).
- [ ] Cloudflare's auto-injected Web Analytics beacon (blocked by the CSP, logs a console error):
  disable it once the site shows in Web Analytics, or switch analytics on with `CF_BEACON_TOKEN`.
- [ ] A real walkthrough request from a phone on the domain.
- [ ] DNSSEC: enable in Cloudflare, paste the DS record in GoDaddy (DNS, DNSSEC).
- [ ] `workers_dev: false` and the workers.dev origin out of `ALLOWED_ORIGINS` / `TURNSTILE_HOSTNAMES`.
- [ ] Email (step 3): no Resend account yet, so `EMAIL_MODE` stays `hold`.
- [ ] Search Console, Bing; print rebuild in `~/hara-print`.

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
     "LEAD_TO_EMAIL": "harafacilitiescleaning@gmail.com",   // already set (2026-10-01)
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
6. **Deploy:** `npm run deploy` (runs the 67 tests, builds, deploys). On the next cron run
   (within 15 minutes) every request stored while email was on hold is emailed to HARA.
7. **Check:**
   - https://DOMAIN and https://www.DOMAIN load; http redirects to https.
   - securityheaders.com: A or better.
   - Submit a real request from a phone: HARA's inbox gets it within a minute, the
     confirmation arrives, and `npm run leads` shows it.
   - Search Console and Bing Webmaster Tools: add the site, submit `https://DOMAIN/sitemap.xml`.
   - Lighthouse against the domain (mobile 90+ / 100 / 100 / 100 expected now that `noindex` is off).
   - If `LEAD_TO_EMAIL` is a Gmail address, the privacy policy already names Google as a provider.
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
npm test                     # 67 tests inside workerd with a local D1
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
