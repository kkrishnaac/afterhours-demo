// Cloudflare Turnstile for the walkthrough form. The script loads only when a
// visitor reaches the form's last step, so no third-party code runs on page
// view. Explicit rendering from this module means the CSP needs no inline
// scripts. The widget stays invisible unless Cloudflare needs the visitor to
// click (appearance: interaction-only). Tokens are single use: reset() after
// every submission attempt.
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading = null;

function loadScript() {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile-missing')));
    s.onerror = () => { loading = null; reject(new Error('turnstile-blocked')); };
    document.head.appendChild(s);
  });
  return loading;
}

export function createTurnstile(container, sitekey) {
  let widgetId = null;
  let token = '';
  let waiting = [];
  const settle = (t) => { token = t; waiting.forEach((w) => w(t)); waiting = []; };

  async function mount() {
    if (widgetId !== null) return;
    const ts = await loadScript();
    if (widgetId !== null) return;
    widgetId = ts.render(container, {
      sitekey,
      action: 'walkthrough',
      appearance: 'interaction-only',
      size: 'flexible',
      theme: 'light',
      callback: settle,
      'expired-callback': () => { token = ''; },
      'error-callback': () => { token = ''; },
    });
  }

  return {
    mount,
    /** Resolves with a token, or '' if none arrives in time (blocked script, failed challenge). */
    async token(timeoutMs = 12000) {
      if (token) return token;
      try { await mount(); } catch { return ''; }
      if (token) return token;
      return new Promise((resolve) => {
        waiting.push(resolve);
        setTimeout(() => resolve(''), timeoutMs);
      });
    },
    reset() {
      token = '';
      if (widgetId !== null) window.turnstile?.reset(widgetId);
    },
  };
}
