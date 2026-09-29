// Every photo on the site. Pure data with no DOM access, so vite.config.js can
// import it too and expand <x-photo> tags into full <picture> markup at build time.
const LANDSCAPE = [960, 1600, 2560, 3840];
const PORTRAIT = [720, 1200, 1800, 2400];
const PORTRAIT_IDS = new Set(['04-kitchen', '05-washroom', '07-lobby-elevators']);

// The service cards, in page order. The photo viewer walks through these.
export const PHOTOS = [
  { id: '10-dawn-open-office', title: 'Offices',
    alt: 'Sunrise across rows of spotless desks in an open-plan office above the Toronto skyline.' },
  { id: '09-desk-first-light', title: 'Workstations',
    alt: 'A dust-free oak desk in morning sun with a closed laptop, a white cup and a pencil set parallel to the edge.' },
  { id: '06-corridor', title: 'Meeting rooms',
    alt: 'A corridor of glass meeting rooms, the ceiling lights reflected in a polished floor.' },
  { id: '04-kitchen', title: 'Kitchens and break rooms',
    alt: 'An office kitchen with stainless steel counters wiped spotless and clean glasses lined up on the shelf.' },
  { id: '05-washroom', title: 'Washrooms',
    alt: 'A marble office washroom with a streak-free mirror, gleaming chrome taps and folded white towels.' },
  { id: '08-lounge-blue-hour', title: 'Common areas',
    alt: 'An office lounge with cushions aligned on a boucle sofa and fresh vacuum lines in the rug.' },
  { id: '07-lobby-elevators', title: 'Floors',
    alt: 'Polished bronze elevator doors in a quiet lobby, the dark stone floor gleaming.' },
];

const ladder = (id) => (PORTRAIT_IDS.has(id) ? PORTRAIT : LANDSCAPE);

export const srcset = (id, ext) => ladder(id).map((w) => `img/${id}-${w}.${ext} ${w}w`).join(', ');

/** Smallest file in the ladder: the fallback src and the viewer thumbnail. */
export const smallest = (id, ext = 'webp') => `img/${id}-${ladder(id)[0]}.${ext}`;

/** Intrinsic size of the 4K master, so the browser reserves space before load. */
export const dimensions = (id) => (PORTRAIT_IDS.has(id) ? [2336, 3504] : id.startsWith('01-') || id.startsWith('10-') ? [3840, 2160] : [3504, 2336]);
