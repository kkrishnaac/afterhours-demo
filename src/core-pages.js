// Services, Security, FAQ, About and Contact: generated like the city pages so the
// visible text and the structured data come from the same data. Every sentence here
// is taken from what the home page already says (or from HARA's stated way of working):
// nothing about the company's history, team, insurance, prices or response times, since
// none of that is confirmed. Copy rules: sentence case, no em or en dashes.
import { BUSINESS } from './business.js';
import { REGIONS } from './service-areas.js';
import { head, foot, t, actions, trail } from './area-pages.js';

export const REGULAR = [
  'Desks and workstations dusted and wiped',
  'Carpets vacuumed, hard floors mopped',
  'Washrooms cleaned, sanitized and restocked',
  'Kitchens and break rooms wiped down',
  'Trash and recycling emptied, liners replaced',
  'Door handles, switches and rails disinfected',
  'Meeting rooms and reception reset',
  'Interior glass and entrance doors spot-cleaned',
];
export const SPECIALTY = [
  'Deep cleaning',
  'Carpet steam cleaning',
  'Hard floor stripping, waxing and buffing',
  'Interior window washing',
  'Fridges, microwaves and appliances inside and out',
  'Upholstery and office chair cleaning',
  'Move-in and move-out cleaning',
  'Post-renovation cleanup',
];
export const STEPS = [
  ['Book a free walkthrough', 'Tell us a little about your office and pick a time that suits you.'],
  ['We see the space', 'We check the size, layout and condition, and note what matters to you.'],
  ['You get a clear quote', 'A price based on what we actually saw, not a guess.'],
  ['Pick your schedule', 'Any days and times, changed whenever you need.'],
  ['Cleaning begins', 'Your checklist, followed and checked on every visit.'],
];
export const SECURITY = [
  ['Key and fob control', 'Keys and fobs are signed out and back in, and never tagged with your address.'],
  ['Alarm codes kept close', 'Codes stay with the few people assigned to your office, and the alarm is set on the way out.'],
  ['A consistent team', 'The same trained people clean your office, so you always know who is inside.'],
  ['Confidential by default', 'Papers, screens and files stay exactly where they are. We clean around them.'],
  ['Lock-up check', 'Doors, windows and lights are checked before we leave, every visit.'],
  ['Every visit logged', 'Arrival and departure times are recorded, so you always have a record.'],
];
export const PRIORITIES = [
  ['Flexible hours', 'Any day and any time of the week: early, late, overnight or weekends.'],
  ['Offices only', 'Offices are our focus, so every visit is built around how a workplace runs.'],
  ['Security first', 'Keys, alarm codes and confidential spaces handled with care on every visit.'],
  ['Free walkthrough', 'We see your office first, so your quote matches its real size and condition.'],
];
const CITIES = REGIONS.flatMap((r) => r.cities);
export const FAQS = [
  ['How does the free walkthrough work?', 'We visit your office, check the size, layout and condition, and note what matters to you. You then get a clear quote based on what we actually saw.'],
  ['Does the walkthrough cost anything?', 'No. The walkthrough is free, and you are under no commitment to go ahead once you have seen the quote.'],
  ['What days and times can you clean?', 'Any day and any time: early mornings, evenings, overnight or weekends. We plan around your opening hours and change the schedule whenever you need.'],
  ['What do you clean?', 'Regular cleaning on the days and times you choose, such as desks, floors, washrooms, kitchens, meeting rooms and reception, plus specialty work like deep cleaning, carpet steam cleaning and window washing. The full list is on the services page.'],
  ['Do you clean anything other than offices?', 'Offices are our focus, so every visit is built around how a workplace runs.'],
  ['How do you price a clean?', 'Your price is based on what we actually saw at the walkthrough, not a guess. Book a walkthrough to get a clear quote.'],
  ['How do you handle keys and alarm codes?', 'Keys and fobs are signed out and back in, and never tagged with your address. Alarm codes stay with the few people assigned to your office, and the alarm is set on the way out.'],
  ['Can we change the schedule later?', 'Yes. Any days and times, changed whenever you need, including as your team grows.'],
  ['Which cities do you serve?', `We serve Toronto and the GTA: ${CITIES.join(', ')}. If your city is not on the list, call us and we will tell you straight away whether we can help.`],
  ['How do I book?', `Use the Book a free walkthrough button, call ${BUSINESS.phoneDisplay}, or email ${BUSINESS.email}.`],
];

const li = (items) => items.map((x) => `      <li>${t(x)}</li>`).join('\n');
const rows = (items) => items.map(([n, d]) => `      <li><strong>${t(n)}.</strong> ${t(d)}</li>`).join('\n');
const main = (inner) => `  <main id="main" class="legal area" tabindex="-1">\n${inner}\n  </main>\n`;
const HOME = ['Home', './'];

export const CORE = {
  'services.html': {
    path: '/services',
    title: `Office cleaning services in Toronto and the GTA | ${BUSINESS.name}`,
    description: 'Regular office cleaning on the days and times you choose, plus deep cleaning, carpet steam cleaning and more. Free walkthrough before every quote.',
    crumb: 'Services',
    render() {
      return head(this) + main(`${trail([HOME, ['Services']])}
    <h1>Office cleaning services</h1>
    <p class="lead">Regular cleaning on the days and times you choose, and specialty work when you need it. Offices only, across Toronto and the GTA.</p>
${actions(null)}

    <h2>Regular cleaning</h2>
    <p>On the days and times you choose.</p>
    <ul>
${li(REGULAR)}
    </ul>

    <h2>Specialty and one-time</h2>
    <p>Booked whenever you need them.</p>
    <ul>
${li(SPECIALTY)}
    </ul>

    <h2>Any day. Any time.</h2>
    <p>Early mornings, evenings, overnight or weekends. We clean when it suits your office, and adjust the schedule whenever you need. It is planned around your opening hours and easy to change as your team grows.</p>

    <h2>How it works</h2>
    <ol>
${STEPS.map(([n, d]) => `      <li><strong>${t(n)}.</strong> ${t(d)}</li>`).join('\n')}
    </ol>

    <h2>Where we work</h2>
    <p>We clean offices across Toronto and the GTA. See the <a href="service-areas.html">service areas</a> and how we handle <a href="security.html">security</a>, or read the <a href="faq.html">questions people ask</a>.</p>
${actions(null)}`) + foot;
    },
    ld: (site, url, base) => [
      {
        '@type': 'Service', '@id': `${url}#service`, serviceType: 'Office cleaning', name: 'Office cleaning',
        provider: { '@id': `${site}/#business` },
        areaServed: CITIES.map((c) => ({ '@type': 'City', name: c })),
        hasOfferCatalog: {
          '@type': 'OfferCatalog', name: 'Office cleaning services',
          itemListElement: [['Regular cleaning', REGULAR], ['Specialty and one-time', SPECIALTY]].map(([name, items]) => ({
            '@type': 'OfferCatalog', name,
            itemListElement: items.map((i) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: i } })),
          })),
        },
      },
      base,
    ],
  },

  'security.html': {
    path: '/security',
    title: `Secure office cleaning: keys, alarm codes and privacy | ${BUSINESS.name}`,
    description: 'How HARA Facilities Cleaning handles keys, fobs, alarm codes and confidential spaces on every visit to your office.',
    crumb: 'Security',
    render() {
      return head(this) + main(`${trail([HOME, ['Security']])}
    <h1>Trusted with your keys</h1>
    <p class="lead">An empty office still holds everything that matters to your business. We treat access and privacy as seriously as the cleaning.</p>
${actions(null)}

    <h2>How we protect your office</h2>
    <ul class="area__districts">
${rows(SECURITY)}
    </ul>

    <h2>Tell us how your building works</h2>
    <p>At the free walkthrough we ask how you get in, who holds the alarm code and which rooms are off limits, and we agree the routine before the first clean. If your building has sign-in rules or limits on service elevator times, we plan around them.</p>

    <h2>More</h2>
    <p>See <a href="services.html">what we clean</a>, read the <a href="faq.html">questions people ask</a>, or <a href="contact.html">get in touch</a>.</p>
${actions(null)}`) + foot;
    },
    ld: (site, url, base) => [base],
  },

  'faq.html': {
    path: '/faq',
    title: `Office cleaning questions answered | ${BUSINESS.name}`,
    description: 'Answers about the free walkthrough, pricing, hours, security and areas served by HARA Facilities Cleaning.',
    crumb: 'FAQ',
    render() {
      return head(this) + main(`${trail([HOME, ['FAQ']])}
    <h1>Questions people ask</h1>
    <p class="lead">Short answers about how we work. If yours is not here, call us or send a request and we will answer it at the walkthrough.</p>

${FAQS.map(([q, a]) => `    <details class="faq">
      <summary>${t(q)}</summary>
      <p>${t(a)}</p>
    </details>`).join('\n')}

    <h2>Ready when you are</h2>
${actions(null)}`) + foot;
    },
    ld: (site, url, base) => [
      { '@type': 'FAQPage', mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      base,
    ],
  },

  'about.html': {
    path: '/about',
    title: `About ${BUSINESS.name} | Office cleaning in Toronto and the GTA`,
    description: 'HARA Facilities Cleaning is an office cleaning company serving Toronto and the GTA, built around flexible hours, security and a free walkthrough.',
    crumb: 'About',
    render() {
      return head(this) + main(`${trail([HOME, ['About']])}
    <h1>About <span translate="no">HARA</span> Facilities Cleaning</h1>
    <p class="lead"><span translate="no">HARA</span> Facilities Cleaning is an office cleaning company serving Toronto and the GTA, on any day and at any time that suits you.</p>
${actions(null)}

    <h2>What we stand for</h2>
    <ul class="area__districts">
${rows(PRIORITIES)}
    </ul>

    <h2>Talk to us</h2>
    <p>Call <a href="tel:${BUSINESS.phoneE164}">${BUSINESS.phoneDisplay}</a> or email <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a>. See <a href="services.html">what we clean</a>, <a href="security.html">how we handle security</a> and <a href="service-areas.html">where we work</a>.</p>`) + foot;
    },
    ld: (site, url, base) => [{ '@type': 'AboutPage', url, name: `About ${BUSINESS.name}`, about: { '@id': `${site}/#business` } }, base],
  },

  'contact.html': {
    path: '/contact',
    title: `Contact ${BUSINESS.name} | Book a free walkthrough`,
    description: 'Call, email or book a free walkthrough with HARA Facilities Cleaning. Office cleaning across Toronto and the GTA.',
    crumb: 'Contact',
    render() {
      return head(this) + main(`${trail([HOME, ['Contact']])}
    <h1>Contact us</h1>
    <p class="lead">The quickest way to a quote is a free walkthrough. Book one online, or call or email us.</p>
${actions(null)}

    <h2>Get in touch</h2>
    <ul class="area__districts">
      <li><strong>Phone.</strong> <a href="tel:${BUSINESS.phoneE164}">${BUSINESS.phoneDisplay}</a></li>
      <li><strong>Email.</strong> <a href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></li>
      <li><strong>Where we work.</strong> Toronto and the GTA. See all <a href="service-areas.html">service areas</a>.</li>
    </ul>

    <h2>What happens next</h2>
    <ol>
${STEPS.slice(0, 3).map(([n, d]) => `      <li><strong>${t(n)}.</strong> ${t(d)}</li>`).join('\n')}
    </ol>`) + foot;
    },
    ld: (site, url, base) => [{ '@type': 'ContactPage', url, name: `Contact ${BUSINESS.name}`, about: { '@id': `${site}/#business` } }, base],
  },
};

export const CORE_PAGES = Object.keys(CORE);
export const CORE_PATHS = Object.fromEntries(Object.entries(CORE).map(([f, c]) => [f, c.path]));
export const renderCore = (file) => CORE[file].render();
export function coreData(file, site) {
  const c = CORE[file];
  if (!c) return null;
  const url = `${site}${c.path}`;
  const base = {
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', `${site}/`], [c.crumb, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  };
  return c.ld(site, url, base);
}
