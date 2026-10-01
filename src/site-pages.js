// Every generated page in one place: the Service areas hub, the city pages, and
// Services, Security, FAQ, About and Contact. The build, the generator script and the
// tests all go through here.
import { ALL_PAGES as AREA_PAGES, ALL_PATHS as AREA_PATHS, structuredData as areaData, ldScript } from './area-pages.js';
import { CORE_PAGES, CORE_PATHS, coreData } from './core-pages.js';

export const ALL_PAGES = () => [...CORE_PAGES, ...AREA_PAGES()];
export const ALL_PATHS = () => ({ ...CORE_PATHS, ...AREA_PATHS() });
export const structuredData = (file, site) => (site && coreData(file, site)) || areaData(file, site);
export { ldScript };
