// Runs on the Worker's cron trigger (every 15 minutes):
// 1. Retries HARA notifications that failed or never went out, up to 5 attempts.
//    The idempotency key is the same as the first attempt, so a retry can't duplicate.
// 2. Deletes requests older than the retention period (privacy policy: 24 months).
import { notificationEmail, sendEmail } from './email.js';
import { log, logError } from './http.js';

const MAX_ATTEMPTS = 5;

export async function runMaintenance(env, now = Date.now()) {
  const settled = new Date(now - 2 * 60 * 1000).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, office_size AS size, timing, city, name, email, phone, marketing_consent AS marketing, notify_attempts
       FROM walkthrough_requests
      WHERE notify_status IN ('pending', 'failed') AND notify_attempts < ?1 AND created_at < ?2
      ORDER BY created_at LIMIT 20`,
  ).bind(MAX_ATTEMPTS, settled).all();

  let retried = 0;
  let failed = 0;
  for (const r of results) {
    const res = await sendEmail(notificationEmail({ ...r, marketing: r.marketing === 1 }, env), env, `notify-${r.id}`);
    await env.DB.prepare('UPDATE walkthrough_requests SET notify_status = ?2, notify_attempts = notify_attempts + 1 WHERE id = ?1')
      .bind(r.id, res.ok ? 'sent' : 'failed').run();
    retried++;
    if (!res.ok) {
      failed++;
      logError('maintenance.notify_failed', { id: r.id, attempt: r.notify_attempts + 1, status: res.status });
    }
  }

  const days = Number(env.RETENTION_DAYS) > 0 ? Number(env.RETENTION_DAYS) : 730;
  const cutoff = new Date(now - days * 86_400_000).toISOString();
  const purge = await env.DB.prepare('DELETE FROM walkthrough_requests WHERE created_at < ?1').bind(cutoff).run();

  log('maintenance.done', { retried, failed, purged: purge.meta?.changes ?? 0 });
  return { retried, failed, purged: purge.meta?.changes ?? 0 };
}
