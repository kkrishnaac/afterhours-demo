#!/usr/bin/env node
// Operator tools for the production walkthrough database (until there is a dashboard).
//
//   npm run leads                          CSV of the last 30 days -> docs/client/leads/ (gitignored)
//   npm run leads -- --days 90
//   npm run data-request -- export someone@example.com   (PIPEDA access request)
//   npm run data-request -- delete someone@example.com   (deletion request; asks to confirm)
//
// Runs `wrangler d1 execute --remote --env production` with execFile (no shell), and
// only ever interpolates values that passed a strict check first.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const OUT = 'docs/client/leads';
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const COLUMNS = 'id, created_at, name, email, phone, city, office_size, timing, marketing_consent, marketing_consent_at, consent_version, notify_status, confirm_status, status';

function d1(sql) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--remote', '--env', 'production', '--json', '--command', sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  return JSON.parse(out)[0];
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  // Neutralise spreadsheet formulas (CSV injection) and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const toCsv = (rows) => [COLUMNS.split(', ').join(','), ...rows.map((r) => COLUMNS.split(', ').map((c) => csvCell(r[c])).join(','))].join('\n');
const stamp = () => new Date().toISOString().slice(0, 10);

async function main() {
  const [cmd = 'leads', ...args] = process.argv.slice(2);
  mkdirSync(OUT, { recursive: true });

  if (cmd === 'leads') {
    const i = args.indexOf('--days');
    const days = i >= 0 ? Number(args[i + 1]) : 30;
    if (!Number.isInteger(days) || days < 1 || days > 3650) throw new Error('--days must be a whole number from 1 to 3650');
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { results } = d1(`SELECT ${COLUMNS} FROM walkthrough_requests WHERE created_at >= '${since}' ORDER BY created_at DESC`);
    const file = `${OUT}/walkthrough-requests-${stamp()}-last-${days}-days.csv`;
    writeFileSync(file, toCsv(results));
    console.log(`${results.length} request(s) -> ${file}`);
    return;
  }

  const email = (args[0] || '').trim();
  if (!EMAIL.test(email) || email.length > 254) throw new Error('Give one valid email address.');
  const where = `email = '${email.replace(/'/g, "''")}' COLLATE NOCASE`;

  if (cmd === 'export') {
    const { results } = d1(`SELECT ${COLUMNS} FROM walkthrough_requests WHERE ${where} ORDER BY created_at`);
    const file = `${OUT}/data-request-${stamp()}-${email.replace(/[^A-Za-z0-9]/g, '_')}.json`;
    writeFileSync(file, JSON.stringify(results, null, 2));
    console.log(`${results.length} record(s) held for this address -> ${file}`);
    return;
  }

  if (cmd === 'delete') {
    const { results } = d1(`SELECT COUNT(*) AS n FROM walkthrough_requests WHERE ${where}`);
    const n = results[0].n;
    if (!n) { console.log('No records for this address.'); return; }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`Delete ${n} record(s) for this address permanently? Type DELETE to confirm: `);
    rl.close();
    if (answer !== 'DELETE') { console.log('Nothing deleted.'); return; }
    const res = d1(`DELETE FROM walkthrough_requests WHERE ${where}`);
    console.log(`Deleted ${res.meta?.changes ?? n} record(s).`);
    return;
  }

  throw new Error('Commands: leads [--days N] | export <email> | delete <email>');
}

main().catch((err) => { console.error(err.message); process.exit(1); });
