// Writes the Service areas hub and one page per city (from src/service-areas.js)
// into the project root, where Vite picks them up like any other page.
// Run: npm run areas   (the build scripts run it first, so the files never go stale)
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AREAS } from '../src/service-areas.js';
import { HUB_FILE, areaFile, renderArea, renderHub } from '../src/area-pages.js';

const root = resolve(import.meta.dirname, '..');
writeFileSync(resolve(root, HUB_FILE), renderHub());
for (const a of AREAS) writeFileSync(resolve(root, areaFile(a)), renderArea(a));
console.log(`areas: wrote ${AREAS.length + 1} pages`);
