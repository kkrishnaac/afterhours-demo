// POST /api/walkthrough: one free-walkthrough request from the website form.
// Order matters: cheap checks first (method, origin, content type), then the rate
// limit, then the size-capped body read, validation and Turnstile, then storage.
// The request is stored BEFORE any email is sent, so an email outage never loses
// a lead; the scheduled job (maintenance.js) retries failed notifications.
import { json, readLimited, log, logError } from './http.js';
import { validateWalkthrough } from './validate.js';
import { verifyTurnstile } from './turnstile.js';
import { notificationEmail, confirmationEmail, sendEmail, emailHeld } from './email.js';
import { CONSENT_VERSION } from '../src/form-options.js';

const MAX_BODY = 8 * 1024;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // same email twice in 10 minutes: treat as one request
const CONFIRMATIONS_PER_DAY = 2;            // stops the confirmation email being used to spam someone

const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

export async function handleWalkthrough(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, { Allow: 'POST' });

  // Only HARA's own pages may post here. Browsers always send Origin on a POST.
  const origin = request.headers.get('Origin');
  if (!origin || !list(env.ALLOWED_ORIGINS).includes(origin)) return json({ ok: false, error: 'origin' }, 403);

  // JSON only: a plain HTML form on another site can't send this content type.
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    return json({ ok: false, error: 'content_type' }, 415);
  }

  // Rate limit before reading the body: a limited visitor costs one header check, nothing more.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (env.WALKTHROUGH_LIMITER) {
    const { success } = await env.WALKTHROUGH_LIMITER.limit({ key: ip });
    if (!success) return json({ ok: false, error: 'rate_limited' }, 429, { 'Retry-After': '60' });
  }

  const raw = await readLimited(request, MAX_BODY);
  if (raw === null) return json({ ok: false, error: 'too_large' }, 413);

  let input;
  try { input = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid' }, 400); }

  // Honeypot: a hidden field people never see. Bots fill it; they get a quiet
  // "success" so they learn nothing, and nothing is stored or sent.
  if (input && typeof input === 'object' && typeof input.company_site === 'string' && input.company_site.trim()) {
    log('walkthrough.honeypot');
    return json({ ok: true }, 201);
  }

  const checked = validateWalkthrough(input);
  if (!checked.ok) return json({ ok: false, error: 'invalid', fields: Object.keys(checked.errors) }, 400);

  const human = await verifyTurnstile(input.turnstile, {
    secret: env.TURNSTILE_SECRET_KEY,
    remoteip: ip === 'unknown' ? undefined : ip,
    hostnames: list(env.TURNSTILE_HOSTNAMES),
    action: 'walkthrough',
  });
  if (!human.ok) {
    log('walkthrough.turnstile_failed', { reason: human.reason });
    return json({ ok: false, error: human.reason === 'unreachable' ? 'verification_unavailable' : 'verification' }, 400);
  }

  const d = checked.data;
  const now = Date.now();

  const { sent } = await env.DB.prepare(
    "SELECT COUNT(*) AS sent FROM walkthrough_requests WHERE email = ?1 COLLATE NOCASE AND created_at > ?2 AND confirm_status = 'sent'",
  ).bind(d.email, new Date(now - 86_400_000).toISOString()).first();
  const confirmAllowed = sent < CONFIRMATIONS_PER_DAY;

  // Same person pressing send twice (or twice in ten minutes): one request, one set of emails.
  // The duplicate check and the insert are ONE statement, so requests arriving at the same
  // instant can't both pass the check (a separate SELECT then INSERT let them race).
  const record = { id: crypto.randomUUID(), created_at: new Date(now).toISOString(), ...d };
  const inserted = await env.DB.prepare(
    `INSERT INTO walkthrough_requests
      (id, created_at, office_size, timing, city, name, email, phone, marketing_consent, marketing_consent_at, consent_version, source)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'website:walkthrough-form'
      WHERE NOT EXISTS (SELECT 1 FROM walkthrough_requests WHERE email = ?7 COLLATE NOCASE AND created_at > ?12)`,
  ).bind(
    record.id, record.created_at, d.size, d.timing, d.city, d.name, d.email, d.phone,
    d.marketing ? 1 : 0, d.marketing ? record.created_at : null, CONSENT_VERSION,
    new Date(now - DUPLICATE_WINDOW_MS).toISOString(),
  ).run();
  if (!inserted.meta.changes) {
    log('walkthrough.duplicate');
    return json({ ok: true }, 201);
  }

  // Email not connected yet (no verified domain): keep the HARA notification
  // pending for the cron to deliver later; a days-late confirmation would only
  // confuse the requester, so that one is skipped.
  if (emailHeld(env)) {
    await env.DB.prepare("UPDATE walkthrough_requests SET confirm_status = 'skipped' WHERE id = ?1").bind(record.id).run();
    log('walkthrough.stored', { id: record.id, email: 'held' });
    return json({ ok: true }, 201);
  }

  const [notify, confirm] = await Promise.all([
    sendEmail(notificationEmail(record, env), env, `notify-${record.id}`),
    confirmAllowed ? sendEmail(confirmationEmail(record, env), env, `confirm-${record.id}`) : Promise.resolve(null),
  ]);

  await env.DB.prepare(
    'UPDATE walkthrough_requests SET notify_status = ?2, notify_attempts = 1, confirm_status = ?3 WHERE id = ?1',
  ).bind(record.id, notify.ok ? 'sent' : 'failed', confirm === null ? 'skipped' : confirm.ok ? 'sent' : 'failed').run();

  if (!notify.ok) logError('walkthrough.notify_failed', { id: record.id, status: notify.status });
  log('walkthrough.stored', { id: record.id, notify: notify.ok, confirm: confirm ? confirm.ok : 'skipped' });

  // The request is safely stored even if an email failed, so the visitor gets a success.
  return json({ ok: true }, 201);
}
