# Deploying the HARA site to Cloudflare

The GitHub Pages demo (`npm run build`) has no backend. The production site is
the same code built with `npm run build:cf` and served by a Cloudflare Worker:
static pages from `dist/` (headers from `dist/_headers`), plus
`POST /api/walkthrough` (the walkthrough form), a D1 database and a cron job.
No secret ever goes in this repo.

## What HARA provides first

- A Cloudflare account in HARA's name, with 2FA. Krishna added as a member (with 2FA).
- The domain, with DNS on that Cloudflare account (registrar lock and DNSSEC on).
- A Resend account (or Postmark) with the domain verified (SPF and DKIM records added in Cloudflare DNS).
- The inbox that should receive walkthrough requests.

## Launch blockers (do not switch DNS until all are done)

- [ ] Privacy policy page live and linked next to the form and in the footer (PIPEDA). It must match
      `migrations/0001_walkthrough_requests.sql`: what is stored, why, the 24-month retention, where
      it is stored, and how to ask for access or deletion.
- [ ] Real phone number and email in `index.html` (placeholders today).
- [ ] HARA has confirmed every security practice described on the page.
- [ ] `<meta name="robots" content="noindex">` removed from `index.html`.
- [ ] `security-protocol` gate run against the deployed Worker: verdict GO.

## One-time setup

```bash
npx wrangler login                                   # as Krishna, inside HARA's account
npx wrangler d1 create hara-walkthroughs             # copy the database_id it prints
```

Add a production environment to `wrangler.jsonc`. Routes, vars and bindings
(D1, rate limit) are NOT inherited by environments, so each is repeated here
(cron triggers are inherited; repeating them just keeps it explicit):

```jsonc
"env": {
  "production": {
    "routes": [
      { "pattern": "DOMAIN", "custom_domain": true },
      { "pattern": "www.DOMAIN", "custom_domain": true }
    ],
    "d1_databases": [
      { "binding": "DB", "database_name": "hara-walkthroughs", "database_id": "<from d1 create>", "migrations_dir": "migrations" }
    ],
    "ratelimits": [
      { "name": "WALKTHROUGH_LIMITER", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }
    ],
    "triggers": { "crons": ["*/15 * * * *"] },
    "vars": {
      "ALLOWED_ORIGINS": "https://DOMAIN,https://www.DOMAIN",
      "TURNSTILE_HOSTNAMES": "DOMAIN,www.DOMAIN",
      "EMAIL_MODE": "resend",
      "EMAIL_FROM": "HARA Facilities Cleaning <walkthroughs@DOMAIN>",
      "LEAD_TO_EMAIL": "<HARA's inbox>",
      "RETENTION_DAYS": "730"
    }
  }
}
```

Turnstile: Cloudflare dashboard, Turnstile, add a widget for `DOMAIN` and
`www.DOMAIN` (Managed mode). The site key is public; the secret key is not.

Resend: create an API key with **sending access only**, limited to the domain.

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
npx wrangler secret put RESEND_API_KEY --env production
npx wrangler d1 migrations apply DB --remote --env production
```

## Every deploy

```bash
npm test                                             # 50 Worker tests, all must pass
npm audit --omit=dev                                 # 0 high or critical
VITE_TURNSTILE_SITE_KEY=<real site key> npm run build:cf
npx wrangler deploy --env production
```

## Check after deploying

- Security headers on the page (securityheaders.com): A or better.
- Submit a real walkthrough request from a phone: it arrives in HARA's inbox within
  a minute, the confirmation arrives, and the row exists:
  `npx wrangler d1 execute DB --remote --env production --command "SELECT id, created_at, notify_status, confirm_status FROM walkthrough_requests ORDER BY created_at DESC LIMIT 3"`
- Workers Logs show `walkthrough.stored` lines and no names, emails or phone numbers.
- Set up a Cloudflare notification for Worker errors, and watch for `walkthrough.notify_failed`.

## Local development

```bash
cp .dev.vars.example .dev.vars                       # Turnstile TEST secret, dry-run email
npm run dev:worker                                   # build:cf, local D1 migrations, wrangler dev on :8787
npm test                                             # runs inside workerd with a local D1
```

Local builds use Cloudflare's published Turnstile test site key (`.env.cloudflare`,
gitignored) and `EMAIL_MODE=dry-run`, so nothing is ever emailed from a laptop.
