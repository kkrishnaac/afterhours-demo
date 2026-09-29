// Worker tests run inside workerd (Cloudflare's runtime) with a local D1
// database built from migrations/. Outside services (Turnstile, Resend) are
// stubbed per test with vi.spyOn(fetch); nothing leaves the machine.
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';

export default defineConfig(async () => {
  const migrations = await readD1Migrations(path.join(import.meta.dirname, 'migrations'));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            ALLOWED_ORIGINS: 'https://hara.test',
            TURNSTILE_HOSTNAMES: 'hara.test',
            TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
            EMAIL_MODE: 'resend',
            RESEND_API_KEY: 'test-resend-key',
            EMAIL_FROM: 'HARA Facilities Cleaning <walkthroughs@hara.test>',
            LEAD_TO_EMAIL: 'leads@hara.test',
          },
        },
      }),
    ],
    test: { include: ['test/**/*.test.js'], setupFiles: ['./test/apply-migrations.js'] },
  };
});
