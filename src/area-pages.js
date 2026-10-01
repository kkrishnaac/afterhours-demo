// Renders the Service areas hub and one page per city in AREAS (pure string
// functions: the generator script writes the files, the build plugin reads the
// structured data, and the tests check both). Same markup and classes as the
// other simple pages, so nothing about the design changes.
import { AREAS, REGIONS, slugOf } from './service-areas.js';
import { BUSINESS } from './business.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Typographic apostrophes in visible copy, as on the rest of the site.
const t = (s) => esc(s).replace(/(\w)'(\w)/g, '$1\u2019$2');
const byName = new Map(AREAS.map((a) => [a.name, a]));

export const HUB_FILE = 'service-areas.html';
export const areaFile = (a) => `${slugOf(a.name)}.html`;
export const areaPath = (a) => `/${slugOf(a.name)}`;
export const HUB_PATH = '/service-areas';
export const ALL_PAGES = () => [HUB_FILE, ...AREAS.map(areaFile)];
export const ALL_PATHS = () => ({ [HUB_FILE]: HUB_PATH, ...Object.fromEntries(AREAS.map((a) => [areaFile(a), areaPath(a)])) });

const head = ({ title, description }) => `<!doctype html>
<html lang="en-CA">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${t(title)}</title>
  <meta name="description" content="${t(description)}" />
  <meta name="theme-color" content="#FAFBFD" />
  <meta property="og:title" content="${t(title)}" />
  <meta property="og:description" content="${t(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="og.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="HARA Facilities Cleaning logo beside a spotless open-plan office above the Toronto skyline. Every desk ready. Every door locked." />
  <meta property="og:site_name" content="HARA Facilities Cleaning" />
  <meta property="og:locale" content="en_CA" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="apple-touch-icon.png" />
  <meta name="robots" content="noindex" />
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <x-include src="partials/nav-page.html"></x-include>
`;
const foot = `  <x-include src="partials/footer.html"></x-include>
  <script type="module" src="/src/page.js"></script>
</body>
</html>
`;

const book = (city) => `./?city=${encodeURIComponent(city)}#walkthrough`;
const actions = (city, label = 'Book a free walkthrough') => `    <div class="area__actions">
      <a class="btn btn--primary btn--lg" href="${city ? book(city) : './#walkthrough'}">${label}</a>
      <a class="call" href="tel:${BUSINESS.phoneE164}"><i data-icon="phone"></i>${BUSINESS.phoneDisplay}</a>
    </div>`;
const crumbs = (last) => `    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="./">Home</a>${last ? ` <span aria-hidden="true">/</span> <a href="${HUB_FILE}">Service areas</a> <span aria-hidden="true">/</span> <span aria-current="page">${t(last)}</span>` : ` <span aria-hidden="true">/</span> <span aria-current="page">Service areas</span>`}
    </nav>`;

export function areaTitle(a) { return `Office cleaning in ${a.name} | ${BUSINESS.name}`; }

export function renderArea(a) {
  const near = a.nearby.map((n) => byName.get(n)).filter(Boolean);
  return head({ title: areaTitle(a), description: a.description }) + `  <main id="main" class="legal area" tabindex="-1">
${crumbs(a.name)}
    <h1>Office cleaning in ${t(a.name)}</h1>
    <p class="lead">${t(a.intro)}</p>
${actions(a.name)}

    <h2>Where we clean in ${t(a.name)}</h2>
    <ul class="area__districts">
${a.districts.map(([n, d]) => `      <li><strong>${t(n)}.</strong> ${t(d)}</li>`).join('\n')}
    </ul>

    <h2>The offices we see here</h2>
    <p>${t(a.offices)}</p>

    <h2>Getting in and working around your building</h2>
    <p>${t(a.access)}</p>

    <h2>Questions about cleaning in ${t(a.name)}</h2>
${a.faqs.map(([q, an]) => `    <details class="faq">
      <summary>${t(q)}</summary>
      <p>${t(an)}</p>
    </details>`).join('\n')}

    <h2>How it works</h2>
    <p>We visit your office first, free, and see the size and condition of the space. You get a clear quote, and cleaning starts on the days and at the times you choose. Offices only, any day and any time.</p>
${actions(a.name)}

    <h2>Also serving</h2>
    <ul class="areas__list area__near" aria-label="Nearby cities">
${near.map((n) => `      <li><a href="${areaFile(n)}">${t(n.name)}</a></li>`).join('\n')}
      <li><a href="${HUB_FILE}">All service areas</a></li>
    </ul>
  </main>
` + foot;
}

export function renderHub() {
  return head({
    title: `Service areas: office cleaning across Toronto and the GTA | ${BUSINESS.name}`,
    description: 'HARA Facilities Cleaning serves offices across Toronto and the GTA, any day and any time. Find your city and book a free walkthrough.',
  }) + `  <main id="main" class="legal area" tabindex="-1">
${crumbs(null)}
    <h1>Service areas</h1>
    <p class="lead">We clean offices across Toronto and the GTA, any day and any time. Pick your city to start a free walkthrough request, or read about the cities we know best.</p>
${actions(null)}

    <h2>Office cleaning guides by city</h2>
    <ul class="area__cards">
${AREAS.map((a) => `      <li><a class="area__card" href="${areaFile(a)}"><span class="area__card-name">${t(a.name)}</span><span class="area__card-meta">${t(a.region)}</span></a></li>`).join('\n')}
    </ul>

    <h2>Every city we serve</h2>
    <p>Tap a city to start your walkthrough request with it already chosen.</p>
${REGIONS.map((r) => `    <h3 class="area__region">${t(r.name)}</h3>
    <ul class="areas__list" aria-label="${t(r.name)}">
${r.cities.map((c) => `      <li><a href="./?city=${encodeURIComponent(c)}#walkthrough" data-city="${t(c)}">${t(c)}</a></li>`).join('\n')}
    </ul>`).join('\n')}

    <h2>Not on the list?</h2>
    <p>Call <a href="tel:${BUSINESS.phoneE164}">${BUSINESS.phoneDisplay}</a> or email <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a>. If your office is in the GTA, we will tell you straight away whether we can help.</p>
  </main>
` + foot;
}

// JSON-LD for a page, or null. Needs the absolute site URL (set at the domain
// step): until then pages carry no structured data and stay noindex.
export function structuredData(file, site) {
  if (!site) return null;
  const business = { '@type': 'LocalBusiness', '@id': `${site}/#business` };
  const crumbList = (items) => ({
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
  });
  if (file === 'index.html') {
    return [{
      ...business,
      name: BUSINESS.name,
      url: `${site}/`,
      image: `${site}/og.jpg`,
      telephone: BUSINESS.phoneE164,
      email: BUSINESS.email,
      description: 'Office cleaning across Toronto and the GTA, on any day and at any time, with a free walkthrough before every quote.',
      areaServed: REGIONS.flatMap((r) => r.cities).map((c) => ({ '@type': 'City', name: c })),
    }];
  }
  if (file === HUB_FILE) {
    return [crumbList([['Home', `${site}/`], ['Service areas', `${site}${HUB_PATH}`]])];
  }
  const a = AREAS.find((x) => areaFile(x) === file);
  if (!a) return null;
  const url = `${site}${areaPath(a)}`;
  return [
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      serviceType: 'Office cleaning',
      name: `Office cleaning in ${a.name}`,
      description: a.description,
      url,
      provider: { '@id': business['@id'] },
      areaServed: { '@type': 'City', name: a.name },
    },
    crumbList([['Home', `${site}/`], ['Service areas', `${site}${HUB_PATH}`], [a.name, url]]),
    {
      '@type': 'FAQPage',
      mainEntity: a.faqs.map(([q, an]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: an } })),
    },
  ];
}

export const ldScript = (items) => items.map((i) => `  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...i }).replace(/</g, '\\u003c')}</script>`).join('\n');
