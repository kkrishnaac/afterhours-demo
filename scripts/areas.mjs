// Writes every generated page into the project root, where Vite picks them up like any
// other page: the Service areas hub, one page per city (src/service-areas.js), and
// Services, Security, FAQ, About and Contact (src/core-pages.js).
// Run: npm run areas   (the build scripts run it first, so the files never go stale)
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AREAS } from '../src/service-areas.js';
import { HUB_FILE, areaFile, renderArea, renderHub } from '../src/area-pages.js';
import { CORE_PAGES, renderCore } from '../src/core-pages.js';

const root = resolve(import.meta.dirname, '..');
const out = (file, html) => writeFileSync(resolve(root, file), html);
out(HUB_FILE, renderHub());
for (const a of AREAS) out(areaFile(a), renderArea(a));
for (const f of CORE_PAGES) out(f, renderCore(f));
console.log(`areas: wrote ${AREAS.length + 1 + CORE_PAGES.length} pages`);
