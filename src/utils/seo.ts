/**
 * Parva SEO & Canonical Metadata Manager
 * Ensures 100% compliant self-referencing canonical URLs and metadata
 * across all client-side routes and landing pages.
 */

export interface SeoConfig {
  path: string;
  city?: string;
  category?: string;
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}

export const BASE_PRODUCTION_URL = 'https://myparva.com';

export const SEO_KOLHAPUR_ROUTES: Record<string, SeoConfig> = {
  '/event-vendors-kolhapur': {
    path: '/event-vendors-kolhapur',
    city: 'Kolhapur',
    category: 'all',
    title: 'Event Vendors in Kolhapur | Venues, Catering & Decor | MyParva',
    description: 'Discover and book verified celebration vendors in Kolhapur. Compare banquet halls, caterers, decorators, photographers, and DJs with 5% escrow protection.',
    canonical: `${BASE_PRODUCTION_URL}/event-vendors-kolhapur`
  },
  '/wedding-venues-kolhapur': {
    path: '/wedding-venues-kolhapur',
    city: 'Kolhapur',
    category: 'Banquet Hall',
    title: 'Wedding Venues & Palatial Banquet Halls in Kolhapur | MyParva',
    description: 'Find and book top wedding venues, heritage halls, and AC banquet spaces in Kolhapur. Compare capacities, transparent per-day pricing, and direct booking.',
    canonical: `${BASE_PRODUCTION_URL}/wedding-venues-kolhapur`
  },
  '/event-catering-kolhapur': {
    path: '/event-catering-kolhapur',
    city: 'Kolhapur',
    category: 'Catering',
    title: 'Event Catering Services in Kolhapur | Authentic Multi-Cuisine | MyParva',
    description: 'Book top multi-cuisine caterers and legendary Kolhapuri thali specialists. Live counters, authentic brass thali buffets, and certified hygiene.',
    canonical: `${BASE_PRODUCTION_URL}/event-catering-kolhapur`
  },
  '/wedding-photographers-kolhapur': {
    path: '/wedding-photographers-kolhapur',
    city: 'Kolhapur',
    category: 'Photographer',
    title: 'Wedding Photographers & Drone Cinematography in Kolhapur | MyParva',
    description: 'Book top candid wedding photographers and 4K aerial drone cinematographers in Kolhapur. Pre-wedding shoots, cinematic teasers, and albums.',
    canonical: `${BASE_PRODUCTION_URL}/wedding-photographers-kolhapur`
  },
  '/event-decorators-kolhapur': {
    path: '/event-decorators-kolhapur',
    city: 'Kolhapur',
    category: 'Decorator',
    title: 'Wedding & Event Decorators in Kolhapur | Mandap & Floral Themes | MyParva',
    description: 'Book luxury mandap designs, marigold strings, kinetic lighting, and contemporary floral installations in Kolhapur on MyParva.',
    canonical: `${BASE_PRODUCTION_URL}/event-decorators-kolhapur`
  },
  '/dj-sound-services-kolhapur': {
    path: '/dj-sound-services-kolhapur',
    city: 'Kolhapur',
    category: 'DJ',
    title: 'DJ & Sound System Services in Kolhapur | Concert Sound & Lights | MyParva',
    description: 'Book trending club DJs, line-array concert sound, moving-head lasers, and live acoustic bands for sangeet and wedding receptions in Kolhapur.',
    canonical: `${BASE_PRODUCTION_URL}/dj-sound-services-kolhapur`
  },
  '/makeup-artists-kolhapur': {
    path: '/makeup-artists-kolhapur',
    city: 'Kolhapur',
    category: 'Makeup Artist',
    title: 'Bridal Makeup Artists in Kolhapur | Airbrush HD Styling | MyParva',
    description: 'Book certified bridal makeup artists, airbrush HD makeup specialists, and saree draping professionals in Kolhapur.',
    canonical: `${BASE_PRODUCTION_URL}/makeup-artists-kolhapur`
  },
  '/event-planners-kolhapur': {
    path: '/event-planners-kolhapur',
    city: 'Kolhapur',
    category: 'Event Planner',
    title: 'Event Planners & Wedding Coordinators in Kolhapur | MyParva',
    description: 'Complete wedding planning, theme execution, hotel bookings, and day-of coordination services in Kolhapur.',
    canonical: `${BASE_PRODUCTION_URL}/event-planners-kolhapur`
  },
  '/cake-desserts-kolhapur': {
    path: '/cake-desserts-kolhapur',
    city: 'Kolhapur',
    category: 'Cake & Desserts',
    title: 'Custom Wedding Cakes & Dessert Bars in Kolhapur | MyParva',
    description: 'Order multi-tier customized fondant wedding cakes, artisan dessert platters, and cupcakes in Kolhapur on MyParva.',
    canonical: `${BASE_PRODUCTION_URL}/cake-desserts-kolhapur`
  }
};

/**
 * Updates head meta tags and self-referencing canonical URL dynamically.
 * This guarantees Google Search Console sees the exact canonical URL matching the active page.
 */
export function updateDocumentSeo(options: {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: string;
}) {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  document.title = options.title;

  // 2. Canonical Tag (resolves "Alternative page with proper canonical tag")
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', options.canonicalUrl);

  // 3. Meta Description
  let descEl = document.querySelector('meta[name="description"]');
  if (!descEl) {
    descEl = document.createElement('meta');
    descEl.setAttribute('name', 'description');
    document.head.appendChild(descEl);
  }
  descEl.setAttribute('content', options.description);

  // 4. Open Graph Tags
  const setMetaProperty = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaProperty('og:title', options.title);
  setMetaProperty('og:description', options.description);
  setMetaProperty('og:url', options.canonicalUrl);
  setMetaProperty('og:type', options.ogType || 'website');
  setMetaProperty('og:image', options.ogImage || `${BASE_PRODUCTION_URL}/parva-logo.png`);

  // 5. Twitter Card Tags
  const setMetaName = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaName('twitter:title', options.title);
  setMetaName('twitter:description', options.description);
  setMetaName('twitter:image', options.ogImage || `${BASE_PRODUCTION_URL}/parva-logo.png`);
}
