// Every photo on the site, in the order of the night. IMG numbers in the
// captions and the viewer come from this list.
export const PHOTOS = [
  { id: '01-dusk-open-office', title: 'Open office', time: '18:00', portrait: false,
    alt: 'An empty open-plan office high above Toronto at dusk, pale oak desks cleared and chairs tucked in.' },
  { id: '02-reception-night', title: 'Reception', time: '21:10', portrait: false,
    alt: 'A travertine reception desk at night lit by one brass lamp, the stone floor spotless.' },
  { id: '04-kitchen', title: 'Kitchen', time: '01:30', portrait: true,
    alt: 'An office kitchen at night, stainless steel counters wiped spotless and clean glasses lined up on the shelf.' },
  { id: '05-washroom', title: 'Washroom', time: '02:15', portrait: true,
    alt: 'A marble office washroom with a streak-free mirror, gleaming chrome taps and folded white towels.' },
  { id: '06-corridor', title: 'Corridor', time: '03:00', portrait: false,
    alt: 'A long office corridor with glass meeting rooms, the ceiling light reflected in a mirror-polished floor.' },
  { id: '08-lounge-blue-hour', title: 'Lounge', time: '04:40', portrait: false,
    alt: 'An office lounge before dawn, cushions aligned on a boucle sofa and fresh vacuum lines in the rug.' },
  { id: '07-lobby-elevators', title: 'Lobby', time: '05:30', portrait: true,
    alt: 'Polished bronze elevator doors in a quiet lobby, the dark stone floor gleaming.' },
  { id: '09-desk-first-light', title: 'First desk', time: '06:30', portrait: false,
    alt: 'A dust-free oak desk in low morning sun with a closed laptop, a white cup and a pencil set parallel to the edge.' },
  { id: '10-dawn-open-office', title: 'Morning', time: '07:00', portrait: false,
    alt: 'Sunrise pouring across rows of spotless desks in an open-plan office above the Toronto skyline.' },
];

const LANDSCAPE = [960, 1600, 2560, 3840];
const PORTRAIT = [720, 1200, 1800, 2400];

export const imgNo = (i) => `IMG ${String(i + 1).padStart(2, '0')}`;

export function srcset(photo, ext) {
  const ladder = photo.portrait ? PORTRAIT : LANDSCAPE;
  return ladder.map((w) => `img/${photo.id}-${w}.${ext} ${w}w`).join(', ');
}

export function smallest(photo, ext = 'webp') {
  return `img/${photo.id}-${photo.portrait ? PORTRAIT[0] : LANDSCAPE[0]}.${ext}`;
}
