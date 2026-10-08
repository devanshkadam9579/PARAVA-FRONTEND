import { Vendor } from '../types';
import { VENDORS } from '../data';

export const SITE_URL = 'https://myparva.com';

export interface SeoPageConfig {
  path: string;
  category: string; // 'all' or canonical category name e.g. 'Banquet Hall', 'Catering'
  city: string;
  title: string;
  h1: string;
  metaDescription: string;
  keywords: string;
  heroTagline: string;
  introDescription: string;
  bulletPoints: string[];
  faqs: { question: string; answer: string }[];
}

/**
 * 9 Core Kolhapur Category SEO Landing Page Configurations
 * Direct mapped to Admin / Firestore canonical categories.
 */
export const SEO_KOLHAPUR_ROUTES: Record<string, SeoPageConfig> = {
  '/event-vendors-kolhapur': {
    path: '/event-vendors-kolhapur',
    category: 'all',
    city: 'Kolhapur',
    title: 'Event Vendors in Kolhapur | Book Verified Services | Parva',
    h1: 'Event Vendors in Kolhapur',
    metaDescription: 'Discover and book verified event vendors in Kolhapur on Parva. Compare banquet halls, caterers, photographers, decorators, DJs, and makeup artists with transparent pricing.',
    keywords: 'event vendors kolhapur, wedding vendors kolhapur, party planners kolhapur, celebration services kolhapur, parva events',
    heroTagline: 'Kolhapur’s Trusted Event Vendor Marketplace',
    introDescription: 'Planning a wedding, reception, birthday, or corporate celebration in Kolhapur? Parva connects you directly with top-rated, background-verified banquet halls, authentic caterers, candid photographers, artistic decorators, and sound specialists across Tarabai Park, Rajarampuri, Rankala, and Gandhinagar.',
    bulletPoints: [
      '100% Verified Local Partners: Identity, quality, and service portfolios vetted by our local team.',
      'Transparent Pricing & Advance Protection: Lock dates with just a 5% escrow booking fee.',
      'One Unified Cart: Bundle banquet halls, decorators, caterers, and DJs in a single reservation.'
    ],
    faqs: [
      {
        question: 'How do I book event vendors in Kolhapur on Parva?',
        answer: 'Browse curated vendor profiles, check their service packages and real customer reviews, select your event date and preferred time slot, and reserve with our secure 5% escrow advance fee.'
      },
      {
        question: 'Can I book multiple vendors for the same event?',
        answer: 'Yes! Parva lets you bundle banquet halls, catering teams, photographers, and decorators into one reservation schedule with synchronized event timing.'
      },
      {
        question: 'Which areas in Kolhapur do vendors serve?',
        answer: 'Our partners serve all major areas including Tarabai Park, Rajarampuri, Shahupuri, Rankala, Nagala Park, Gandhinagar, and surrounding celebration destinations.'
      }
    ]
  },

  '/wedding-venues-kolhapur': {
    path: '/wedding-venues-kolhapur',
    category: 'Banquet Hall',
    city: 'Kolhapur',
    title: 'Wedding Venues & Banquet Halls in Kolhapur | Parva',
    h1: 'Wedding Venues in Kolhapur',
    metaDescription: 'Explore the finest wedding venues, AC banquet halls, and marriage lawns in Kolhapur. Check guest capacities, package inclusions, and book directly on Parva.',
    keywords: 'wedding venues kolhapur, banquet halls in kolhapur, marriage lawns kolhapur, ac banquet hall kolhapur, reception hall kolhapur',
    heroTagline: 'Heritage Palaces, Luxury Ballrooms & Sprawling Lawns',
    introDescription: 'Find the ideal setting for your wedding sangeet, traditional vivah, or grand reception. From royal lakefront heritage palaces overlooking Rankala to modern 5-star AC ballrooms with premium hospitality, browse verified venues with transparent day and slot pricing.',
    bulletPoints: [
      'Diverse Capacities: Intimate celebration halls (100–300 guests) to grand marriage lawns (1,500+ guests).',
      'In-House & Flexible Catering: Options with turnkey gourmet dining or open vendor policies.',
      'Direct Date Availability: Check open calendar slots for morning muhurtams and evening receptions.'
    ],
    faqs: [
      {
        question: 'What is the average cost of a wedding venue in Kolhapur?',
        answer: 'AC banquet halls typically range from ₹35,000 to ₹1,50,000 per slot depending on guest capacity, climate control, and included decor or AV infrastructure.'
      },
      {
        question: 'Do banquet halls in Kolhapur offer parking and dressing rooms?',
        answer: 'Most top banquet halls listed on Parva provide dedicated bridal suites, green rooms, and secured guest parking spaces.'
      }
    ]
  },

  '/event-catering-kolhapur': {
    path: '/event-catering-kolhapur',
    category: 'Catering',
    city: 'Kolhapur',
    title: 'Event Catering Services in Kolhapur | Authentic Food | Parva',
    h1: 'Event Catering Services in Kolhapur',
    metaDescription: 'Book top event caterers in Kolhapur. Authentic Kolhapuri Tambda-Pandhra Rassa, royal brass thali dining, multi-cuisine buffets, and live dessert counters.',
    keywords: 'event catering kolhapur, wedding caterers in kolhapur, tambda pandhra rassa caterers, veg non veg catering kolhapur, party caterers',
    heroTagline: 'Authentic Maharashtrian Feasts & Multi-Cuisine Gourmet Catering',
    introDescription: 'Food is the heart of every celebration in Kolhapur. Parva brings you legendary catering masters who specialize in rich, slow-cooked Tambda and Pandhra Rassa, royal brass thalis, pure vegetarian traditional shahi pangat, and modern multi-cuisine live counters.',
    bulletPoints: [
      'Authentic Local Spices: Hand-pounded Kolhapuri masala and time-honored traditional preparation.',
      'Flexible Formats: Traditional pangat seated dining, premium buffet spreads, and live snack stalls.',
      'Rigorous Food Safety: Stringent kitchen hygiene and certified quality ingredients.'
    ],
    faqs: [
      {
        question: 'What types of catering menus are available in Kolhapur?',
        answer: 'Options include authentic Kolhapuri Non-Veg (Tambda & Pandhra Rassa, Sukka Mutton), traditional Maharashtrian Pure-Veg, North Indian, and continental live food stations.'
      },
      {
        question: 'How is event catering priced?',
        answer: 'Pricing is usually calculated per plate (ranging from ₹300 to ₹1,200+ depending on menu tier) or as comprehensive package contracts for large wedding gatherings.'
      }
    ]
  },

  '/wedding-photographers-kolhapur': {
    path: '/wedding-photographers-kolhapur',
    category: 'Photographer',
    city: 'Kolhapur',
    title: 'Wedding Photographers in Kolhapur | Candid & Cinematic | Parva',
    h1: 'Wedding Photographers in Kolhapur',
    metaDescription: 'Hire top candid wedding photographers and cinematic filmmakers in Kolhapur. Pre-wedding lakeside shoots at Rankala, drone coverage, and high-res albums.',
    keywords: 'wedding photographers kolhapur, candid photography kolhapur, pre wedding shoot kolhapur, cinematic wedding video kolhapur',
    heroTagline: 'Candid Emotions, Cinematic 4K Films & Timeless Memories',
    introDescription: 'Preserve the laughter, tears, and rituals of your big day with Kolhapur’s finest visual storytellers. Our verified photographers capture candid emotions, dynamic drone aerials, and romantic pre-wedding shoots around Rankala Lake, Panhala Fort, and Shalini Palace.',
    bulletPoints: [
      'State-of-the-Art Gear: High-end full-frame cinema cameras, stabilized gimbals, and aerial 4K drones.',
      'Bespoke Packages: Traditional photo + video, candid photojournalism, and custom coffee table albums.',
      'Fast Turnaround: Teaser reels delivered within days, complete photo library within weeks.'
    ],
    faqs: [
      {
        question: 'Do photographers in Kolhapur do pre-wedding shoots?',
        answer: 'Yes, photographers offer packages tailored for scenic locations such as Rankala Lake, Panhala Fort, and heritage resort landscapes.'
      },
      {
        question: 'What is included in a standard wedding photography package?',
        answer: 'Standard packages typically include full-day candid and traditional coverage, cinematic highlight video, drone aerials, and custom hardbound photobooks.'
      }
    ]
  },

  '/event-decorators-kolhapur': {
    path: '/event-decorators-kolhapur',
    category: 'Decorator',
    city: 'Kolhapur',
    title: 'Event Decorators in Kolhapur | Mandap, Floral & Lights | Parva',
    h1: 'Event Decorators in Kolhapur',
    metaDescription: 'Find artistic event decorators in Kolhapur. Traditional marigold mandaps, modern pastel floral arches, LED entrance walkways, and theme stage setups.',
    keywords: 'event decorators kolhapur, wedding mandap decorator kolhapur, stage decoration kolhapur, birthday theme decor kolhapur, floral decor',
    heroTagline: 'Stunning Floral Mandaps, Theme Stages & Ambient Lighting',
    introDescription: 'Transform any venue into a magical celebration space. Whether you desire a heritage Maratha wedding stage with fresh marigolds and brass lamps, a fairy-tale pastel floral canopy, or high-tech neon lighting for a cocktail night, book trusted Kolhapur decorators on Parva.',
    bulletPoints: [
      'Fresh & Imported Flowers: Handcrafted floral backdrops, entrance arches, and centerpieces.',
      'Theme Conceptualization: Royal heritage, minimalist boho, contemporary fairy-tale, or whimsical birthday themes.',
      'Turnkey Setup & Teardown: On-time delivery with zero stress for the host family.'
    ],
    faqs: [
      {
        question: 'Can decorators customize designs based on reference photos?',
        answer: 'Yes! Parva decorators happily customize color palettes, floral choices, and stage structures according to your personal vision or Pinterest references.'
      },
      {
        question: 'Do decorators provide lighting and audio trusses?',
        answer: 'Many decorator packages include ambient warm lighting, focus spots, fairy light canopies, and stage illumination.'
      }
    ]
  },

  '/dj-sound-services-kolhapur': {
    path: '/dj-sound-services-kolhapur',
    category: 'DJ',
    city: 'Kolhapur',
    title: 'DJ & Sound Services in Kolhapur | Sangeet, Parties & Sound | Parva',
    h1: 'DJ & Sound Services in Kolhapur',
    metaDescription: 'Hire professional event DJs and high-power sound systems in Kolhapur. Crystal line arrays, moving heads, cold-pyros, and top Bollywood/EDM mixes.',
    keywords: 'dj in kolhapur, sound system for wedding kolhapur, sangeet dj kolhapur, party sound setup kolhapur, event dj sound',
    heroTagline: 'High-Energy Bollywood & EDM Beats with Stadium-Grade Sound',
    introDescription: 'Get your guests dancing with premier wedding and party DJs in Kolhapur. Featuring top JBL and RCF line arrays, synchronized intelligent moving lights, cold-pyro sparklers, and custom Bollywood, Marathi, and commercial EDM playlists.',
    bulletPoints: [
      'Pro Sound Engineering: Crystal-clear acoustics tuned perfectly to indoor halls or outdoor lawns.',
      'Special Effects: Cold-pyros, dry ice fog for first dance, and atmospheric haze machines.',
      'Experienced Performers: Crowd-reading talent who keep sangeet and reception dance floors packed.'
    ],
    faqs: [
      {
        question: 'Do DJs supply their own sound systems and mixers?',
        answer: 'Yes, full DJ packages include sound reinforcement (line arrays/subwoofers), Pioneer DJ consoles, wireless mics, and lighting setups.'
      },
      {
        question: 'Are cold-pyros safe for indoor wedding halls?',
        answer: 'Our professional sound and FX technicians use indoor-safe, smokeless cold-spark fountains that do not generate hazardous heat or smoke.'
      }
    ]
  },

  '/makeup-artists-kolhapur': {
    path: '/makeup-artists-kolhapur',
    category: 'Makeup Artist',
    city: 'Kolhapur',
    title: 'Bridal Makeup Artists in Kolhapur | HD & Airbrush | Parva',
    h1: 'Makeup Artists in Kolhapur',
    metaDescription: 'Book certified bridal makeup artists in Kolhapur. HD airbrush bridal makeup, traditional Nauvari draping, sangeet glam, and family makeup packages.',
    keywords: 'bridal makeup artist kolhapur, hd makeup kolhapur, airbrush makeup kolhapur, nauvari saree draping kolhapur, wedding makeup artist',
    heroTagline: 'Flawless HD & Airbrush Bridal Looks with Luxury Cosmetics',
    introDescription: 'Look radiant on your special day. Kolhapur’s elite makeup artists specialize in long-lasting HD and airbrush bridal makeup, authentic Nauvari and Shela saree draping, artistic hair styling, and glamorous sangeet looks using certified international cosmetics like MAC, Huda Beauty, and Dior.',
    bulletPoints: [
      'International Brands: Premium skin-friendly cosmetics designed to withstand stage lighting and camera flashes.',
      'Traditional & Modern Expertise: Authentic Maharashtrian bridal styling alongside modern dewy finishes.',
      'On-Location Service: Artists travel directly to your home, hotel suite, or wedding venue green room.'
    ],
    faqs: [
      {
        question: 'What is the difference between HD and Airbrush makeup?',
        answer: 'HD makeup uses ultra-fine pigments applied with brushes to create a natural camera-ready finish. Airbrush uses a fine spray gun for a water-resistant, weightless, long-wearing layer.'
      },
      {
        question: 'Do makeup artists offer family and bridesmaid styling packages?',
        answer: 'Yes, artists on Parva provide bundle packages for the bride plus mother, sisters, and bridesmaids.'
      }
    ]
  },

  '/event-planners-kolhapur': {
    path: '/event-planners-kolhapur',
    category: 'Event Planner',
    city: 'Kolhapur',
    title: 'Event Planners in Kolhapur | Wedding & Party Organizers | Parva',
    h1: 'Event Planners in Kolhapur',
    metaDescription: 'Hire experienced wedding planners and corporate event organizers in Kolhapur. Full-service vendor coordination, budget management, and timeline execution.',
    keywords: 'event planners kolhapur, wedding planner kolhapur, event management company kolhapur, party organizers kolhapur',
    heroTagline: 'Stress-Free Wedding & Celebration Planning from Start to Finish',
    introDescription: 'Enjoy your own celebration while seasoned professionals manage every detail. Kolhapur’s premier event planners take care of vendor negotiations, RSVP tracking, hospitality, decor execution, and timeline synchronization for weddings, corporate meets, and anniversaries.',
    bulletPoints: [
      'Comprehensive Coordination: One point of contact for venues, caterers, decorators, and entertainment.',
      'Budget Optimization: Maximize your event budget with vetted partner pricing and transparent milestone tracking.',
      'On-Day Production: Dedicated floor managers ensuring rituals, meals, and performances run precisely on time.'
    ],
    faqs: [
      {
        question: 'What does a wedding planner in Kolhapur handle?',
        answer: 'Planners manage venue selection, theme decor, catering menus, logistics, guest hospitality, artist booking, and on-site day coordination.'
      },
      {
        question: 'Can I hire an event planner for partial coordination or day-of management?',
        answer: 'Yes, planners offer customizable packages ranging from full turnkey wedding management to day-of coordination only.'
      }
    ]
  },

  '/cake-desserts-kolhapur': {
    path: '/cake-desserts-kolhapur',
    category: 'Cake & Desserts',
    city: 'Kolhapur',
    title: 'Custom Wedding Cakes & Desserts in Kolhapur | Parva',
    h1: 'Cake & Desserts in Kolhapur',
    metaDescription: 'Order custom multi-tiered wedding cakes and dessert tables in Kolhapur. Artisanal fondant cakes, macaron towers, and live dessert counters.',
    keywords: 'wedding cakes kolhapur, custom birthday cakes kolhapur, dessert counter kolhapur, designer cakes kolhapur, bakery kolhapur',
    heroTagline: 'Bespoke Multi-Tier Cakes & Artisanal Dessert Counters',
    introDescription: 'Elevate your cake-cutting ceremony with exquisite custom cakes crafted by Kolhapur’s finest artisanal bakers. From towering multi-tiered floral wedding cakes to personalized birthday centerpieces, French macarons, and chocolate dessert tables.',
    bulletPoints: [
      'Artisanal Quality: 100% pure chocolate, fresh fruit preserves, and organic vanilla bean extract.',
      'Custom Designs: Sugar florals, edible gold leaf, custom monograms, and architectural fondant artistry.',
      'Safe Temperature-Controlled Delivery: Direct setup at your banquet hall or venue.'
    ],
    faqs: [
      {
        question: 'How far in advance should I order a wedding cake in Kolhapur?',
        answer: 'We recommend booking bespoke multi-tier wedding cakes at least 2 to 4 weeks in advance to allow time for tastings, design sketches, and custom sugar craft.'
      },
      {
        question: 'Are eggless cake options available?',
        answer: 'Yes, our listed bakers offer delicious, 100% vegetarian / eggless artisanal recipes for all cake flavors and dessert spreads.'
      }
    ]
  }
};

/**
 * Deterministic, stable vendor slug generator
 * Example: "The Shalini Palace Grand Banquet" + "Kolhapur" -> "the-shalini-palace-grand-banquet-kolhapur"
 */
export function generateVendorSlug(vendor: { name: string; location?: string; id?: string }): string {
  if (!vendor || !vendor.name) return 'vendor';

  const cleanName = vendor.name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const locLower = (vendor.location || '').toLowerCase();
  let cityPart = '';
  if (locLower.includes('kolhapur')) cityPart = 'kolhapur';
  else if (locLower.includes('pune')) cityPart = 'pune';
  else if (locLower.includes('mumbai')) cityPart = 'mumbai';
  else if (locLower.includes('satara')) cityPart = 'satara';
  else if (locLower.includes('sangli')) cityPart = 'sangli';

  if (cityPart && !cleanName.includes(cityPart)) {
    return `${cleanName}-${cityPart}`;
  }

  return cleanName;
}

/**
 * Matches a vendor by slug, explicit vendor.slug, or Firestore id
 */
export function findVendorBySlug(slug: string, vendors: Vendor[]): Vendor | null {
  if (!slug) return null;

  const normalizedInput = decodeURIComponent(slug).toLowerCase().trim().replace(/^\/vendors?\//i, '').replace(/[^a-z0-9]/g, '');

  const searchList = Array.isArray(vendors) && vendors.length > 0 ? vendors : VENDORS;

  // 1. Direct ID match
  const byId = searchList.find(v => v.id && v.id.toLowerCase() === slug.toLowerCase());
  if (byId) return byId;

  // 2. Computed slug match
  const byGeneratedSlug = searchList.find(v => {
    const s = generateVendorSlug(v);
    return s.toLowerCase() === slug.toLowerCase();
  });
  if (byGeneratedSlug) return byGeneratedSlug;

  // 3. Normalized alphanumeric match
  const byNorm = searchList.find(v => {
    const s = generateVendorSlug(v).replace(/[^a-z0-9]/g, '');
    const nameNorm = (v.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const idNorm = (v.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return s === normalizedInput || nameNorm === normalizedInput || idNorm === normalizedInput;
  });
  if (byNorm) return byNorm;

  // 4. Secondary fallback: check default VENDORS if vendors was custom list
  if (searchList !== VENDORS) {
    return findVendorBySlug(slug, VENDORS);
  }

  return null;
}

/**
 * Builds standard canonical URL
 */
export function buildCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath.replace(/\/+$/, '') || ''}`;
}
