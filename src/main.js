// Home page entry: the Studio design (moved from the design lab, 2026-10-01). Native scrolling:
// the photo reel is driven by the page's own scroll (CSS scroll timeline), so no JS scroller.
import './studio/base.css';
import './studio/g.css';
import './studio/h.css';
import './studio/site.css';

import './studio/studio.js';     // dial menu and its knob, reel or grid toggle, image fade, Toronto clock
import './studio/logo-intro.js'; // the hero logo's one-time intro (Motion)
import './studio/tab-menu.js';   // phones: the menu bar at the top
import { initQuote } from './quote.js';

initQuote();
