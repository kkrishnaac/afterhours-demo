// The two emails a walkthrough request sends: a notification to HARA (reply
// goes straight to the requester) and a confirmation to the requester. Every
// visitor-supplied value is HTML-escaped.
// EMAIL_MODE:
//   resend   send through Resend's HTTP API (production, once the domain is verified)
//   hold     send nothing yet: requests are stored with the HARA notification
//            'pending', and the cron delivers them all once the mode is switched to resend
//   dry-run  local development: send nothing, log only the idempotency key
export const emailHeld = (env) => env.EMAIL_MODE === 'hold';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const shell = (inner) => `<!doctype html><html><body style="margin:0;padding:24px;background:#FAFBFD;font-family:Arial,Helvetica,sans-serif;color:#0E1A33">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #D8DFEB;border-radius:16px;padding:28px">
<p style="margin:0 0 20px;font-weight:bold;letter-spacing:.14em;color:#0B3A80">HARA</p>${inner}</div></body></html>`;

function rows(r) {
  return [
    ['Name', r.name],
    ['Email', r.email],
    ['Phone', r.phone || 'Not given'],
    ['City', r.city],
    ['Office size', r.size],
    ['Preferred time', r.timing],
    ['Marketing emails', r.marketing ? 'Yes, opted in' : 'No'],
  ];
}

export function notificationEmail(r, env) {
  const list = rows(r);
  return {
    from: env.EMAIL_FROM,
    to: [env.LEAD_TO_EMAIL],
    reply_to: r.email,
    subject: `New walkthrough request: ${r.name}, ${r.city}`,
    html: shell(`<h1 style="font-size:20px;margin:0 0 16px">New walkthrough request</h1>
<table style="border-collapse:collapse;width:100%;font-size:15px">${list.map(([k, v]) =>
      `<tr><td style="padding:8px 12px 8px 0;color:#4B5873;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0">${esc(v)}</td></tr>`).join('')}</table>
<p style="margin:20px 0 0;font-size:14px;color:#4B5873">Reply to this email to answer ${esc(r.name)} directly. Reference ${esc(r.id)}.</p>`),
    text: `New walkthrough request\n\n${list.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nReply to this email to answer directly. Reference ${r.id}.`,
  };
}

export function confirmationEmail(r, env) {
  const first = r.name.split(' ')[0];
  return {
    from: env.EMAIL_FROM,
    to: [r.email],
    reply_to: env.LEAD_TO_EMAIL,
    subject: 'We received your walkthrough request',
    html: shell(`<h1 style="font-size:20px;margin:0 0 12px">Thanks, ${esc(first)}.</h1>
<p style="font-size:15px;line-height:1.5;margin:0 0 12px">We received your request for a free walkthrough of your office in ${esc(r.city)}. We’ll be in touch shortly to book a time that suits you.</p>
<p style="font-size:15px;line-height:1.5;margin:0">If you didn’t make this request, you can ignore this email.</p>`),
    text: `Thanks, ${first}.\n\nWe received your request for a free walkthrough of your office in ${r.city}. We'll be in touch shortly to book a time that suits you.\n\nIf you didn't make this request, you can ignore this email.`,
  };
}

/** Sends one email. `key` makes retries safe: Resend drops a repeat with the same key. */
export async function sendEmail(message, env, key) {
  if (env.EMAIL_MODE !== 'resend') {
    console.log(JSON.stringify({ event: 'email.dry_run', key }));
    return { ok: true, dryRun: true };
  }
  if (!env.RESEND_API_KEY || !message.from || !message.to?.[0]) return { ok: false, status: 'not-configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 'unreachable' };
  }
}
