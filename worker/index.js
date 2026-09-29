// HARA website Worker. Every request comes here first (run_worker_first: true)
// so plain http can be redirected; pages are then served from dist/ through the
// ASSETS binding (which still applies dist/_headers). It handles the API itself,
// and the cron trigger.
import { handleWalkthrough } from './walkthrough.js';
import { runMaintenance } from './maintenance.js';
import { json, logError } from './http.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    // Plain http never serves a page: permanent redirect to https. (Once the domain
    // is on Cloudflare, "Always Use HTTPS" does this at the edge as well.)
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
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
