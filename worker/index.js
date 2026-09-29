// HARA website Worker. Cloudflare serves the static pages directly (from dist/,
// with headers from _headers); this script only runs for /api/* (see
// wrangler.jsonc run_worker_first) and on the cron trigger.
import { handleWalkthrough } from './walkthrough.js';
import { runMaintenance } from './maintenance.js';
import { json, logError } from './http.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/walkthrough') {
      try {
        return await handleWalkthrough(request, env);
      } catch (err) {
        // Generic message out, short detail in the logs (no request data).
        logError('walkthrough.unhandled', { message: String(err?.message || err).slice(0, 200) });
        return json({ ok: false, error: 'server' }, 500);
      }
    }
    if (pathname.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runMaintenance(env).catch((err) => logError('maintenance.unhandled', { message: String(err?.message || err).slice(0, 200) })));
  },
};
