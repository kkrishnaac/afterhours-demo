// The cities that get their own page, and the full list grouped by region for the hub.
// Add a city here (and run `npm run areas`) and its page, the hub card, the footer-free
// internal links, the sitemap entry and the structured data all follow.
// Only facts that are true of the place or of HARA's stated way of working (free
// walkthrough first, offices only, any day and any time). No distances, no prices,
// no client names, no reviews: none of those are known yet.
// Copy rules: sentence case, no em or en dashes.

export const REGIONS = [
  { name: 'City of Toronto', cities: ['Toronto'] },
  { name: 'Peel Region', cities: ['Mississauga', 'Brampton', 'Caledon'] },
  { name: 'York Region', cities: ['Vaughan', 'Markham', 'Richmond Hill', 'Aurora', 'Newmarket'] },
  { name: 'Halton Region', cities: ['Oakville', 'Burlington', 'Milton'] },
  { name: 'Durham Region', cities: ['Pickering', 'Ajax', 'Whitby', 'Oshawa'] },
];

export const slugOf = (name) => `office-cleaning-${name.toLowerCase().replace(/\s+/g, '-')}`;

export const AREAS = [
  {
    name: 'Toronto',
    region: 'City of Toronto',
    description: 'Office cleaning in Toronto on any day and at any time, from downtown towers to North York and Scarborough. Book a free walkthrough.',
    intro: 'Toronto offices run on every kind of schedule, from the early starts of the Financial District to the late finishes of King West. We clean when your floor is empty, and we start with a free walkthrough so the quote matches your space.',
    districts: [
      ['Financial District and the PATH', 'Bay Street towers and the offices that connect to the underground walkway.'],
      ['King West and the Entertainment District', 'Mid-rise offices and converted heritage buildings.'],
      ['Liberty Village', 'Former factory floors turned into open-plan studios and agencies.'],
      ['Yonge and Eglinton', 'Midtown suites for professional practices and head offices.'],
      ['North York Centre', 'Towers along Yonge Street around Sheppard and Finch.'],
      ['Scarborough Town Centre and Etobicoke', 'Suburban office buildings with their own parking.'],
    ],
    offices: 'Toronto has the widest mix of buildings in the GTA. A downtown tower floor, an open-plan studio in a converted warehouse and a two-room suite above a shop on a main street all need different cleaning plans. The walkthrough is where we see which one yours is: how many desks, how much glass, how many washrooms and where the supplies live.',
    access: 'Many towers sign visitors in through a security desk, issue key fobs and limit the service elevators to set hours. Tell us the building rules at the walkthrough and we plan each visit around them, so cleaning never depends on someone staying late to let us in.',
    faqs: [
      ['Can you clean an office inside a tower with building security?', 'Yes. Share the sign-in rules, fob arrangements and service elevator times at the walkthrough, and we build the visit around them.'],
      ['Do you clean outside the downtown core?', 'Yes. We serve offices across the city, including North York, Scarborough and Etobicoke, as well as the neighbouring cities.'],
    ],
    nearby: ['Mississauga', 'Vaughan', 'Markham'],
  },
  {
    name: 'Mississauga',
    region: 'Peel Region',
    description: 'Office cleaning in Mississauga for business parks, City Centre towers and Port Credit suites, on your schedule. Free walkthrough before every quote.',
    intro: 'Mississauga is a city of business parks and corporate campuses as much as downtown towers. We clean on the days and at the hours your team is out, and every quote starts with a free walkthrough of your floor.',
    districts: [
      ['City Centre', 'Offices around Hurontario Street and Square One.'],
      ['Airport Corporate Centre', 'Large floor plates close to Pearson airport.'],
      ['Meadowvale Business Park', 'Low-rise corporate buildings with surface parking.'],
      ['Port Credit', 'Small professional offices along the lakefront and Lakeshore Road.'],
      ['Streetsville', 'Main street suites in a village-scale setting.'],
    ],
    offices: 'Many Mississauga offices are a single floor of a low or mid-rise building in a business park, with a larger floor area than a downtown suite and plenty of meeting rooms and kitchens. Port Credit and Streetsville are the opposite: small offices where one team uses every room. We size the plan to what we see at the walkthrough, not to a template.',
    access: 'Business park buildings usually have ground-level entrances and parking at the door, which keeps an evening or early-morning visit simple. If your building uses alarm codes or fobs, tell us at the walkthrough and we agree how they are handled before the first clean.',
    faqs: [
      ['Do you clean larger floor plates in business parks?', 'Yes. We plan the number of people and the time on site around the size of the floor, which we measure at the walkthrough.'],
      ['Can you cover Port Credit and Streetsville as well as City Centre?', 'Yes. We serve every part of Mississauga.'],
      ['How do I book a visit for my Mississauga office?', 'Use the Book a free walkthrough button on this page, or call us. We arrange the walkthrough at a time that suits you and send a clear quote once we have seen the space.'],
    ],
    nearby: ['Brampton', 'Oakville', 'Toronto'],
  },
  {
    name: 'Vaughan',
    region: 'York Region',
    description: 'Office cleaning in Vaughan, from the Metropolitan Centre to Concord and Woodbridge, any day and any time. Book a free walkthrough.',
    intro: 'Vaughan mixes new glass towers with offices built into working business parks. We fit the cleaning to your hours, and we visit first, free, so the quote reflects the real space.',
    districts: [
      ['Vaughan Metropolitan Centre', 'Newer mid-rise and tower offices at Highway 7 and Jane Street, beside the subway station.'],
      ['Concord', 'Business parks near Highway 7 and Highway 400.'],
      ['Woodbridge', 'Professional suites around the Market Lane and Islington Avenue area.'],
      ['Vaughan Mills area', 'Offices close to Highway 400 and Rutherford Road.'],
    ],
    offices: 'Vaughan has a lot of offices that sit inside industrial and warehouse units: a front office on a street of workshops and distribution firms. These need a different plan from a tower floor, with entrances and shared washrooms that see more traffic. At the walkthrough we look at the office part on its own terms and quote just that.',
    access: 'Newer towers at the Metropolitan Centre have concierge and fob access. Unit offices in Concord and Woodbridge usually have a direct door and parking. Either way, tell us how you get in and when the alarm goes on, and we agree the routine before the first visit.',
    faqs: [
      ['Do you clean an office that is part of a warehouse unit?', 'Yes, we clean the office space. We only quote the offices, washrooms and kitchen, and not the warehouse.'],
      ['Can you clean in the evening after we leave?', 'Yes. Evenings, overnight and weekends are all available, whichever suits your building.'],
      ['How do I get a quote for a Vaughan office?', 'Book a free walkthrough. We visit, see the size and condition of the space, and send a clear quote afterwards, with no commitment to go ahead.'],
    ],
    nearby: ['Markham', 'Toronto', 'Brampton'],
  },
  {
    name: 'Markham',
    region: 'York Region',
    description: 'Office cleaning in Markham for Highway 7 corporate parks, Unionville and Markham Centre. Flexible hours and a free walkthrough before every quote.',
    intro: 'Markham is home to a large concentration of technology and professional firms. Teams here work to different clocks, so we clean on the days and at the times that suit yours, and we visit first so the quote is accurate.',
    districts: [
      ['Markham Centre and Unionville', 'Offices around Enterprise Boulevard and Warden Avenue.'],
      ['Highway 7 corridor', 'Corporate buildings along Highway 7 between Woodbine and Warden.'],
      ['Woodbine and Steeles area', 'Business parks near the Highway 404 and Highway 407 interchanges.'],
      ['Markham Village and Cornell', 'Smaller practices and local firms.'],
    ],
    offices: 'The typical Markham office is a corporate building in an office park, often with open-plan floors, many monitors and a shared kitchen on each level. Equipment on desks and in meeting rooms is part of the job, so we clean around it rather than moving it. Because teams here keep long and varied hours, an early-morning or evening clean often works best, so the floor is ready when people arrive. The walkthrough shows us how your floor is laid out and what needs special care.',
    access: 'Office parks along Highway 7 and near Highway 404 typically have surface or shared parking and a building entrance for tenants. Share your access arrangements at the walkthrough, including any restricted rooms, and we leave those exactly as they are.',
    faqs: [
      ['Will you move our equipment to clean?', 'No. Papers, screens and files stay where they are, and we clean around them.'],
      ['Do you work on weekends for teams with unusual shifts?', 'Yes. Any day and any time, including weekends and overnight.'],
      ['Do you charge for the walkthrough?', 'No. The walkthrough is free, and you are under no commitment to go ahead once you have seen the quote.'],
    ],
    nearby: ['Vaughan', 'Toronto', 'Mississauga'],
  },
  {
    name: 'Brampton',
    region: 'Peel Region',
    description: 'Office cleaning in Brampton, from Downtown Brampton to Bramalea and the Highway 410 corridor. Free walkthrough, flexible hours.',
    intro: 'Brampton offices range from professional suites on Queen Street to company offices attached to logistics and distribution sites. We schedule around your shifts and visit for free first so you know the price before you commit.',
    districts: [
      ['Downtown Brampton', 'Professional suites around Queen Street and Main Street.'],
      ['Bramalea', 'Offices around Bramalea City Centre and Dixie Road.'],
      ['Highway 410 and Steeles Avenue', 'Business parks and company offices for distribution and manufacturing firms.'],
    ],
    offices: 'Brampton has a big logistics and manufacturing sector, and many of its companies run their management and admin teams from an office built next to the warehouse. These offices see more foot traffic from the floor, so entrances, hard floors and shared washrooms need regular attention. In Downtown Brampton the offices are smaller and quieter: an accounting or law practice may only need a regular evening clean of a few rooms, and the plan reflects that.',
    access: 'Offices on shift-based sites are often staffed at unusual hours. That works in our favour: we can clean between shifts or overnight. Tell us when the building is quiet and how access works, and we agree the timing at the walkthrough.',
    faqs: [
      ['Can you clean offices that run on shifts?', 'Yes. We schedule around your shifts, including overnight and weekends.'],
      ['Do you clean the warehouse floor too?', 'No. We clean offices only, so we focus on the admin, meeting and washroom spaces.'],
      ['Can you clean on a fixed schedule, such as every weekday evening?', 'Yes. You choose the days and times, and the plan can change as your team grows.'],
    ],
    nearby: ['Mississauga', 'Vaughan', 'Toronto'],
  },
  {
    name: 'Oakville',
    region: 'Halton Region',
    description: 'Office cleaning in Oakville, from Downtown Oakville and Bronte to the QEW business corridor. Free walkthrough before every quote.',
    intro: 'Oakville offices are a mix of boutique suites in the historic downtown and corporate buildings along the QEW. We clean on your schedule, and we start with a free walkthrough so you see what we will do before you decide.',
    districts: [
      ['Downtown Oakville', 'Professional offices on and around Lakeshore Road, many in heritage buildings.'],
      ['Bronte Village', 'Small offices near the harbour.'],
      ['QEW corridor', 'Corporate and head-office buildings around Speers Road and Trafalgar Road.'],
    ],
    offices: 'Downtown Oakville is known for boutique offices in older buildings with character: original floors, smaller rooms and shared entrances. Along the QEW the offices are larger and more modern. Many of these offices are client-facing, with a reception area and meeting rooms that need to look their best at the start of each day. Both kinds are cleaned to the same standard, but the plan differs, and we take care in older buildings so we do not damage finishes.',
    access: 'Older downtown buildings may have a single shared entrance and limited parking. Corporate buildings by the highway usually have their own lot and entry system. Tell us which yours is and we agree access and timing at the walkthrough.',
    faqs: [
      ['Do you work in heritage buildings?', 'Yes. We use the right products for older floors and finishes, and we ask about anything delicate at the walkthrough.'],
      ['Do you also serve Burlington and Milton?', 'Yes. We serve the whole of Halton Region, including Burlington and Milton.'],
      ['How often can our office be cleaned?', 'As often as you need: every day, once a week, or on different days each week. You choose the days and times, and we plan around them.'],
    ],
    nearby: ['Mississauga', 'Brampton', 'Toronto'],
  },
];
