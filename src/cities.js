// The 16 GTA cities HARA serves: real coordinates for the map, and the only
// values the walkthrough form (page and server) accepts for "city".
// [name, lat, lon, label dx, label dy, anchor]
export const CITIES = [
  ['Toronto', 43.6532, -79.3832, 14, 26, 'start'],
  ['Mississauga', 43.589, -79.6441, -14, 6, 'end'],
  ['Vaughan', 43.8361, -79.4983, -14, 6, 'end'],
  ['Markham', 43.8561, -79.337, 14, 6, 'start'],
  ['Richmond Hill', 43.8828, -79.4403, 0, -18, 'middle'],
  ['Brampton', 43.7315, -79.7624, -14, 6, 'end'],
  ['Oakville', 43.4675, -79.6877, -14, 6, 'end'],
  ['Pickering', 43.8384, -79.0868, -8, -16, 'end'],
  ['Ajax', 43.8509, -79.0204, 6, 26, 'middle'],
  ['Aurora', 44.0065, -79.4504, 14, 6, 'start'],
  ['Newmarket', 44.0592, -79.4613, 14, 6, 'start'],
  ['Milton', 43.5183, -79.8774, -14, 6, 'end'],
  ['Burlington', 43.3255, -79.799, -14, 6, 'end'],
  ['Caledon', 43.8668, -79.858, -14, 6, 'end'],
  ['Whitby', 43.8975, -78.9429, 0, -18, 'middle'],
  ['Oshawa', 43.8971, -78.8658, 12, 26, 'middle'],
];

export const CITY_NAMES = CITIES.map((c) => c[0]).sort((a, b) => a.localeCompare(b));
