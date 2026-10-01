// Every photo on the site. Pure data with no DOM access, so vite.config.js can
// import it too and expand <x-photo> tags into full <picture> markup at build time.
// Photos are Unsplash originals (Unsplash License: free for commercial use, no attribution
// required), chosen by Krishna on 2026-10-01; masters in assets/raw (gitignored), ladders in
// public/img via `npm run images`. Width and height are the master's intrinsic size.
const LANDSCAPE = [960, 1600, 2560, 3840];

// The service cards, in page order. The photo viewer walks through these.
export const PHOTOS = [
  { id: '11-open-office', title: 'Open offices', w: 6240, h: 3354,
    alt: 'An empty open-plan office with rows of clean desks and chairs in soft daylight.' },
  { id: '12-glass-offices', title: 'Private offices and corridors', w: 2301, h: 1536,
    alt: 'A corridor of glass-walled offices with a polished concrete floor.' },
  { id: '13-meeting-room', title: 'Meeting rooms', w: 4096, h: 3072,
    alt: 'A long wooden conference table with the chairs tucked in and the screen off.' },
  { id: '14-toronto-towers', title: 'Office buildings', w: 4466, h: 2512,
    alt: 'Glass office towers in downtown Toronto on a clear day.' },
  { id: '15-washroom', title: 'Washrooms', w: 3637, h: 2046,
    alt: 'A commercial washroom with a row of sinks, mirrors and frosted glass stalls.' },
  { id: '17-lounge-skyline', title: 'Reception and lounges', w: 3918, h: 2939,
    alt: 'An office lounge with tables and chairs by floor-to-ceiling windows over a city skyline.' },
  { id: '18-lobby', title: 'Entrances and floors', w: 3840, h: 2160,
    alt: 'A bright white building lobby with a reception desk and a polished floor.' },
];

// Decorative photos outside the cards (the security band background).
export const EXTRA = [{ id: '19-toronto-dusk', w: 5142, h: 3428 }];

const byId = new Map([...PHOTOS, ...EXTRA].map((p) => [p.id, p]));

export const srcset = (id, ext) => LANDSCAPE.map((w) => `img/${id}-${w}.${ext} ${w}w`).join(', ');

/** Smallest file in the ladder: the fallback src and the viewer thumbnail. */
export const smallest = (id, ext = 'webp') => `img/${id}-${LANDSCAPE[0]}.${ext}`;

/** Intrinsic size of the master, so the browser reserves space before load. */
export const dimensions = (id) => { const p = byId.get(id); if (!p) throw new Error(`Unknown photo ${id}`); return [p.w, p.h]; };
