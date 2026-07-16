/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vendor, QuickCategory, HeroPromo, ChatMessage, EventPlanner } from './types';

export const CITIES = [
  'Kolhapur',
  'Pune',
  'Nagpur',
  'Nashik',
  'Mumbai',
  'Delhi NCR',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Ahmedabad',
  'Lucknow',
  'Satara',
  'Sangli'
];

export const EVENT_PLANNERS: EventPlanner[] = [
  {
    id: 'ep1',
    name: 'Elite Dream Planners',
    tagline: 'Crafting memories beyond expectations.',
    description: 'Specializing in destination weddings and high-end corporate events.',
    rating: 4.9,
    reviewCount: 150,
    location: 'Mumbai',
    verified: true,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=400'],
    features: ['Destination Weddings', 'Corporate Events', 'Full Planning']
  }
];

export const QUICK_CATEGORIES: QuickCategory[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    iconName: 'Heart',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'birthday',
    name: 'Birthday',
    iconName: 'Cake',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    iconName: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'festival',
    name: 'Festival',
    iconName: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'housewarming',
    name: 'Housewarming',
    iconName: 'Home',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'engagement',
    name: 'Engagement',
    iconName: 'Gift',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    iconName: 'Award',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'baby-shower',
    name: 'Baby Shower',
    iconName: 'Smile',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eb2?auto=format&fit=crop&q=80&w=400'
  }
];

export const HERO_PROMOS: HeroPromo[] = [
  {
    id: 'promo-1',
    title: 'Grand Winter Weddings 2026',
    subtitle: 'Get up to 25% bundle discount on Halls + Decorators',
    badge: 'Limited Offer',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-pink-500/80 to-purple-600/80',
    tag: 'Wedding'
  },
  {
    id: 'promo-2',
    title: 'Neon Birthday Bash Bundles',
    subtitle: 'Complete DJ, sound, lighting & decorator starting from ₹24,999',
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-amber-400/80 to-rose-500/80',
    tag: 'Birthday'
  },
  {
    id: 'promo-3',
    title: 'Premium Corporate Seminars',
    subtitle: 'Verified sound systems, drone photography & luxury catering for corporate meets',
    badge: 'Verified Deals',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    gradient: 'from-blue-600/80 to-indigo-700/80',
    tag: 'Corporate'
  }
];

export const VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'The Royal Grand Pavilion',
    category: 'Banquet Hall',
    tagline: 'Palatial luxury banquets with heritage aesthetics',
    description: 'The Royal Grand Pavilion is a premier five-star luxury event hall. Offering a grand ballroom with a seating capacity of over 1,200 guests, stunning high ceilings, and pre-integrated central climate control. Perfectly suited for grand destination weddings, lavish receptions, and high-profile corporate galas.',
    rating: 4.9,
    reviewCount: 348,
    trustScore: 99,
    distance: '1.2 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 150000,
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Valet Parking (200+ Cars)', 'In-house Multi-Cuisine Catering', 'Central AC', '2 Premium Bridal Suites', 'Sound Isolation & Stage Rigging'],
    services: [
      { name: 'Grand Ballroom Rental (Full Day)', price: 150000, description: 'Exclusive access to the main grand ballroom, stage, and dynamic house lighting.', unit: 'day' },
      { name: 'Lawn & Open Terrace Area Addition', price: 60000, description: 'Stunning landscaped garden space for outdoor buffet or fire ceremony.', unit: 'event' },
      { name: 'VIP Lounge Setup with Private Attendant', price: 25000, description: 'Plush high-end seating area for special guests and immediate family.', unit: 'event' }
    ],
    reviews: [
      { id: 'r1', userName: 'Ananya Sharma', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'June 12, 2026', comment: 'Absolutely magical experience. The staff was incredibly coordinated and the venue looked like an absolute dream for my brother’s reception. Extremely premium and high-end!' },
      { id: 'r2', userName: 'Rajesh Mehta', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', rating: 4.8, date: 'May 28, 2026', comment: 'Great service. The valets handled the high volume of cars perfectly. The banquet acoustics are world class.' }
    ],
    bookingsCount: 1420,
    occasion: ['Wedding'],
    capacity: 1200,
    whatsapp: '919999999999'
  },
  {
    id: 'v2',
    name: 'Aura Premium Florals & Decor',
    category: 'Decorator',
    tagline: 'High-concept floral themes and bespoke glass installations',
    description: 'Specializing in contemporary, bohemian, and grand royal Indian wedding themes. Our in-house team of structural designers and master florists bring complex mood boards to life. We utilize imported orchids, premium drapery, and custom kinetic light fixtures to create an unforgettable fairy tale landscape.',
    rating: 4.8,
    reviewCount: 215,
    trustScore: 97,
    distance: '2.5 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 45000,
    images: [
      'https://images.unsplash.com/photo-1522413416052-4065f8a8de35?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    founderName: 'Aditi Sharma',
    founderImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    features: ['Imported Fresh Flowers', 'Kinetic Light Installations', 'Interactive Photo Booths', 'Pre-Wedding Consultation', 'Eco-Friendly Reusable Materials'],
    services: [
      { name: 'Traditional Marigold Mandap & Stage Decor', price: 45000, description: 'Gorgeous marigold & jasmine ceiling strings, brass accessories, and high-back traditional seating.', unit: 'event' },
      { name: 'Ultra-Modern Glasshouse Floral Theme', price: 95000, description: 'Stunning crystal installations, white premium orchids, fairy lights, and mirror walkways.', unit: 'event' },
      { name: 'Ambient Neon Entrance Tunnel & Photo Booth', price: 20000, description: 'High-tech neon tubes, custom greenery panels, and custom-scripted acrylic sign boards.', unit: 'event' }
    ],
    reviews: [
      { id: 'r3', userName: 'Karan Johar', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'June 25, 2026', comment: 'Aura converted a simple lawn into a gorgeous paradise within just 6 hours! The roses were fresh and smelled amazing.' }
    ],
    bookingsCount: 840,
    occasion: ['Wedding'],
    whatsapp: '918888888888'
  },
  {
    id: 'v3',
    name: 'Focus Arts & Cinematic Films',
    category: 'Photographer',
    tagline: 'Award-winning photojournalism and slow-motion cinematic teasers',
    description: 'We believe your story is unique. Focus Arts captures genuine raw emotions, candid smiles, and grand cinematic entries. With over 8 years of international event coverage, we use premium cameras, stabilised drone rigs, and expert colorists to produce cinema-grade highlight films and gorgeous coffee table albums.',
    rating: 4.9,
    reviewCount: 189,
    trustScore: 98,
    distance: '3.1 km',
    responseTime: '< 5 mins',
    verified: true,
    basePrice: 35000,
    images: [
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Dual Sony FX3 Cinema Cameras', '4K Drone Footage', 'Fast Delivery (< 14 Days)', 'Candid Specialist', 'Premium Hardbound Leather Album'],
    services: [
      { name: 'Candid & Traditional Coverage (Single Day)', price: 35000, description: '1 Lead Candid Photographer + 1 Traditional Photographer. Includes 150 edited high-res digital copies.', unit: 'day' },
      { name: '4K Cinematic Teaser Film & Highlights (3-5 Min)', price: 50000, description: 'High-production value cinema shoot, professional audio sync, and licensing for social media music.', unit: 'event' },
      { name: 'Pre-Wedding Cinematic Couple Shoot', price: 25000, description: '4-hour outdoor shoot, 2 dress changes, and premium romantic highlight montage.', unit: 'shoot' }
    ],
    reviews: [
      { id: 'r4', userName: 'Devika Patel', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120', rating: 4.9, date: 'June 05, 2026', comment: 'The photos made me cry! They managed to capture the smallest details. Incredibly professional and silent operators.' }
    ],
    bookingsCount: 650,
    occasion: ['Wedding']
  },
  {
    id: 'v4',
    name: 'DJ Rohit & Electric Sound Systems',
    category: 'DJ',
    tagline: 'High-energy electronic dance beats & dynamic laser shows',
    description: 'Turn your event into an absolute concert. DJ Rohit is known for open-format mashups, Bollywood remixes, and seamless English pop transitions. Equipped with world-class JBL Line Array systems, professional Truss structures, high-intensity laser projectors, and synchronized cold-pyro controllers.',
    rating: 4.7,
    reviewCount: 154,
    trustScore: 95,
    distance: '1.9 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 25000,
    images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Bangalore',
    features: ['JBL Line Array Tech', 'Custom Animated Truss', 'Cold-Pyro Sparklers Integrated', 'Interactive LED DJ Booth', 'Wireless Mic Arrays'],
    services: [
      { name: 'Sangeet / Party DJ with Basic Sound System', price: 25000, description: 'Premium DJ console, active JBL speakers, dynamic LED wash lights, and 4 hours playing time.', unit: 'event' },
      { name: 'Grand Concert Audio & Club Laser Truss Setup', price: 55000, description: 'Heavy JBL Line Arrays, high-power colored laser systems, vertical smoke jets, and visual led walls.', unit: 'event' },
      { name: 'Cold-Pyro Launcher & Fog Machine Package', price: 10000, description: '4 high-altitude indoor pyros synchronized with your entry and dry-ice heavy low fog effect.', unit: 'event' }
    ],
    reviews: [
      { id: 'r5', userName: 'Vikram Malhotra', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120', rating: 4.8, date: 'April 14, 2026', comment: 'The bass was absolutely pounding! No one left the dance floor for 3 hours straight. Incredible Bollywood mashups!' }
    ],
    bookingsCount: 410,
    occasion: ['Wedding']
  },
  {
    id: 'v5',
    name: 'Saffron & Spice Gourmet Catering',
    category: 'Catering',
    tagline: 'Five-star regional Indian delicacies and live chef counters',
    description: 'We curate gastronomic journeys for you and your guests. From classic Mughlai feasts and authentic Gujarati thalis to molecular gastronomy counters and European dessert arrays. Every ingredient is premium, locally sourced, and prepared under strict international safety standards by star-rated executive chefs.',
    rating: 4.9,
    reviewCount: 412,
    trustScore: 99,
    distance: '0.8 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 850,
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Molecular Gastronomy Live Counters', 'Five-Star Star-Rated Chefs', 'Pure Vegetarian Separate Setup', 'Bespoke Printed Menu Cards', 'High-Density Premium Crockery'],
    services: [
      { name: 'Royal Heritage Indian Buffet Menu', price: 1200, description: '3 Starters, 4 Mains, 2 Live Counters, and 3 Artisanal Desserts. Premium service staff included.', unit: 'plate' },
      { name: 'Continental & Live Woodfired Pizza Setup', price: 1500, description: 'Live wood-fired oven station, premium Italian cheese, authentic Mexican and Asian live woks.', unit: 'plate' },
      { name: 'Artisanal Mocktail & Bubble-Tea Bar', price: 300, description: 'Flair bartenders, customized theme recipes, liquid nitrogen shooters, and boba counters.', unit: 'plate' }
    ],
    reviews: [
      { id: 'r6', userName: 'Smita Patel', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'May 19, 2026', comment: 'Our guests are still talking about the live Dal Makhani counter and the Rasmalai mousse! Absolute perfection.' }
    ],
    bookingsCount: 1980,
    occasion: ['Wedding']
  },
  {
    id: 'v6',
    name: 'Suhani Premium Bridal Makeup & Hair',
    category: 'Makeup Artist',
    tagline: 'High-definition airbrushing & traditional Indian styling',
    description: 'Suhani is an acclaimed international makeup specialist trained in London. Known for creating elegant, glowing, and timeless brides, she uses premium, dermatologically-approved international brands like Chanel, Dior, and Estée Lauder to give you a gorgeous HD finish that stands out under heavy stage lights.',
    rating: 4.8,
    reviewCount: 122,
    trustScore: 96,
    distance: '4.2 km',
    responseTime: '< 20 mins',
    verified: true,
    basePrice: 18000,
    images: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Delhi NCR',
    features: ['Premium Airbrush HD Makeup', 'Dior, Chanel & Estée Lauder Only', 'Pre-Wedding Trial Included', 'Hairstyling & Saree Draping', 'Assistant Team Available'],
    services: [
      { name: 'Bridal Airbrush HD Makeup Package', price: 25000, description: 'Includes complete airbrushing, premium lashes, customized extensions, hairstyle, and outfit draping.', unit: 'event' },
      { name: 'Sangeet / Cocktails Premium Makeup', price: 18000, description: 'Gorgeous glowing dewy look with glamorous hairstyles and premium glitter shadows.', unit: 'event' },
      { name: 'Family / Bridesmaids Makeup (Per Person)', price: 6000, description: 'Natural HD look, elegant buns or curls, and standard draping by Suhani’s associate team.', unit: 'person' }
    ],
    reviews: [
      { id: 'r7', userName: 'Ritu Sen', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', rating: 4.9, date: 'June 29, 2026', comment: 'Suhani is a magician! The makeup was incredibly light but lasted for 12 hours straight without a single crease.' }
    ],
    bookingsCount: 320,
    occasion: ['Wedding']
  },
  {
    id: 'v7',
    name: 'Sea Breeze Banquets Juhu',
    category: 'Banquet Hall',
    tagline: 'Coastal views with elegant contemporary glass ballrooms',
    description: 'Located right next to the Juhu coastline, Sea Breeze Banquets offers a beautiful beachfront view with a modern glass-paneled banquet hall. Ideal for intimate to mid-sized gatherings, sun-drenched pre-wedding ceremonies, and stylish sundowner cocktail receptions.',
    rating: 4.8,
    reviewCount: 164,
    trustScore: 97,
    distance: '1.9 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 95000,
    images: [
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Beachfront Coastal View', 'Acoustic Soundproofing', 'Valet Parking (100 Cars)', 'Integrated AV Systems', 'Glass Atrium Setup'],
    services: [
      { name: 'Ocean Glass Hall Rental (Full Day)', price: 95000, description: 'Exclusive use of the sea-facing glass banquet hall and pre-function area.', unit: 'day' },
      { name: 'Sundowner Sunset Deck Access', price: 35000, description: 'Use of the beachfront outdoor deck area for sunset cocktails or pheras.', unit: 'event' }
    ],
    reviews: [
      { id: 'r8', userName: 'Preeti Deshmukh', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'May 12, 2026', comment: 'The sunset views were absolutely breath-taking! All my guests loved the ocean breeze and the pristine ballroom.' }
    ],
    bookingsCount: 420,
    occasion: ['Wedding'],
    capacity: 450
  },
  {
    id: 'v8',
    name: 'Royal Feast Caterers',
    category: 'Catering',
    tagline: 'Authentic heritage recipes and traditional royal service',
    description: 'Specializing in authentic traditional cuisines with a history of royal banqueting. From rich Lucknowi dum biryanis and royal Rajasthani thalis to exquisite vegetarian street food arrays from across India. Crafted with generational recipes using premium spices and stone-ground organic flours.',
    rating: 4.7,
    reviewCount: 145,
    trustScore: 96,
    distance: '2.8 km',
    responseTime: '< 20 mins',
    verified: true,
    basePrice: 650,
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Generational Royal Chefs', 'Traditional Brass Service Cookware', 'Live Hand-Pulled Roti Counters', 'Customized Heritage Menus'],
    services: [
      { name: 'Traditional Indian Feast Menu', price: 650, description: '2 Starters, 3 Mains, Traditional Breads, and 2 Classic Desserts. Copper-themed serving sets included.', unit: 'plate' },
      { name: 'Royal Rajput Thali Setup', price: 950, description: 'Specialized thali table service with unlimited traditional royal delicacies and direct host pampering.', unit: 'plate' }
    ],
    reviews: [
      { id: 'r9', userName: 'Harsh Vardhan', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', rating: 4.8, date: 'June 01, 2026', comment: 'Absolutely legendary Dum Biryani. The traditional brass serving sets made our event look incredibly royal.' }
    ],
    bookingsCount: 510,
    occasion: ['Wedding']
  },
  {
    id: 'v9',
    name: 'DJ Riya & Laser Beats',
    category: 'DJ',
    tagline: 'Electronic progressive house and high-tech corporate audio',
    description: 'DJ Riya is a premier female club and festival artist specializing in high-energy commercial pop, EDM, and tech-house. Paired with high-tech computerized laser beams and responsive light shows to turn any venue into a dynamic concert floor.',
    rating: 4.8,
    reviewCount: 98,
    trustScore: 97,
    distance: '2.1 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 18000,
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Club-Grade Sound Systems', 'Intelligent Laser Array Show', 'Wireless Headset Mic Arrays', 'Responsive Visual Booth Displays'],
    services: [
      { name: 'Progressive Club DJ Package', price: 18000, description: 'Exclusive 4-hour set by DJ Riya, premium speakers, and dynamic visual lighting controller.', unit: 'event' },
      { name: 'Dynamic Laser & Cold-Spark Show Addon', price: 12000, description: '4 high-powered synchronized lasers and 2 cold-spark firing launchers.', unit: 'event' }
    ],
    reviews: [
      { id: 'r10', userName: 'Siddharth Sen', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'June 18, 2026', comment: 'Riya is a superstar! She kept the energy at 200% all night. The laser system was mind-blowing!' }
    ],
    bookingsCount: 230,
    occasion: ['Wedding']
  },
  {
    id: 'v10',
    name: 'Golden Touch Decorators',
    category: 'Decorator',
    tagline: 'Classic marigold, fairy-light drapes, and elegant brass aesthetics',
    description: 'Golden Touch specializes in warm, traditional, and heritage Indian decor. Combining deep red drapery, gold accents, rustic brass lanterns, and extensive marigold garlands to create highly photogenic and deeply nostalgic wedding/festive environments.',
    rating: 4.6,
    reviewCount: 112,
    trustScore: 94,
    distance: '3.4 km',
    responseTime: '< 15 mins',
    verified: false,
    basePrice: 30000,
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Rustic Brass Accents', 'Classic Marigold Garlands', 'High-Strength Fairy Lights Drapes', 'Fast Setup (< 4 Hours)', 'Flexible Custom Layouts'],
    services: [
      { name: 'Classic Festive Canopy & Seating Decor', price: 30000, description: 'Complete marigold and gold canopy, premium carpets, and traditional brass pedestal lamp setup.', unit: 'event' },
      { name: 'Grand Brass Archway Entrance Decor', price: 15000, description: 'Immersive entry tunnel using traditional hanging brass pots and fresh jasmine strings.', unit: 'event' }
    ],
    reviews: [
      { id: 'r11', userName: 'Meera Desai', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120', rating: 4.7, date: 'June 10, 2026', comment: 'Loved their professionalism. The traditional brass lamps and fresh flowers felt so authentic and peaceful.' }
    ],
    bookingsCount: 190,
    occasion: ['Wedding']
  },
  {
    id: 'v11',
    name: 'Gourmet Crust Cakes & Macarons',
    category: 'Cake & Desserts',
    tagline: 'Artisanal multi-tiered fondant cakes and live dessert bar',
    description: 'Bespoke high-end pastry kitchen crafting award-winning multi-tier cakes, personalized sugar sculptures, and custom macaron towers. We use organic ingredients, premium Belgian chocolate, and pure vanilla bean extract to ensure your wedding or birthday celebration has a spectacular, delicious center of attention.',
    rating: 4.9,
    reviewCount: 96,
    trustScore: 98,
    distance: '1.4 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 4500,
    images: [
      'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['3D Sugar Sculpting', 'Eggless & Gluten-Free Options', 'Temperature-Controlled Delivery', 'Pre-tasting Samples Box', 'Belgian Couverture Chocolate'],
    services: [
      { name: 'Luxury 3-Tier Customized Theme Fondant Cake (3 kg)', price: 8500, description: 'Handcrafted customized design, sugar florals, custom internal sponge and mousse flavors of choice.', unit: 'cake' },
      { name: 'Premium Cupcake & Macaron Assorted Platter (24 Pcs)', price: 2400, description: 'Elegant luxury gift box containing 12 flavored macarons and 12 custom themed cupcakes.', unit: 'platter' }
    ],
    reviews: [
      { id: 'r12', userName: 'Sneha Rao', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'June 22, 2026', comment: 'The cake looked so magnificent, we did not want to cut it! And the Belgian chocolate flavor was extremely rich.' }
    ],
    bookingsCount: 280,
    occasion: ['Wedding']
  },
  {
    id: 'v12',
    name: 'Joywave Interactive Fun Zones',
    category: 'Fun & Entertainment',
    tagline: 'Interactive virtual reality arenas, anchor emcees, and kids play setups',
    description: 'We turn standard banquets into high-engagement interactive arenas. Specializing in kids play-zones, customized wedding emcees/hosts, professional puppet artists, magic-shows, live photo-booth props, and high-tech VR (virtual reality) simulation setups that guests of all ages thoroughly enjoy.',
    rating: 4.8,
    reviewCount: 78,
    trustScore: 95,
    distance: '2.9 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 12000,
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Custom Animated Truss', 'Emcee Anchoring Team', 'Safe Kids Play Fencing', 'VR Simulator & Racing Rigs', 'Live Caricature & Tattoo Artists'],
    services: [
      { name: 'Interactive Kids Play-Zone Setup (Full Day)', price: 15000, description: 'Fenced play area with slider, ball pit, safety mats, and 2 dedicated supervisor attendants.', unit: 'event' },
      { name: 'Premium Celebration Emcee / Anchor & Magic Show', price: 12000, description: '4 hours professional event anchoring, crowd engagement games, and 45 mins high-end magic show.', unit: 'event' }
    ],
    reviews: [
      { id: 'r13', userName: 'Anil Gupta', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', rating: 4.9, date: 'May 14, 2026', comment: 'The emcee kept both kids and seniors completely engaged. The magic show was the highlight of the evening!' }
    ],
    bookingsCount: 160,
    occasion: ['Wedding']
  },
  {
    id: 'v_p1',
    name: 'Aditya & Co. Luxury Planners',
    category: 'Event Planner',
    tagline: 'Signature destination wedding and luxury corporate curation',
    description: 'Aditya & Co. is a legendary boutique planning house operating across Pune and Mumbai. Founded by Aditya Deshmukh, the agency specializes in seamless execution, bespoke thematic styling, custom vendor coordination, and high-profile destination weddings.',
    rating: 4.9,
    reviewCount: 142,
    trustScore: 98,
    distance: '1.5 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 45000,
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Pune',
    features: ['Bespoke Theme Conceptualization', 'VIP RSVP & Guest Coordination', 'Complete Budget Allocation & Negotiation', 'Live Webcast & Tech Supervision'],
    services: [
      { name: 'Complete Wedding Curation & Coordination', price: 45000, description: 'End-to-end design concept, timeline planning, vendor sourcing, onsite coordination, and RSVP management.', unit: 'event' },
      { name: 'Intimate Ceremony Styling & Curation', price: 20000, description: 'Design concepts, table styling, and day-of management for small events under 150 guests.', unit: 'event' }
    ],
    reviews: [
      { id: 'rp1_1', userName: 'Shruti Jadhav', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'April 20, 2026', comment: 'Aditya and his team made my wedding completely stress-free. Every guest commented on how organized the schedule was!' }
    ],
    bookingsCount: 320,
    occasion: ['Wedding'],
    founderName: 'Aditya Deshmukh',
    experience: '12 Years',
    whatsapp: '9876543210',
    phone: '9876543210',
    instagram: 'https://instagram.com/adityaplanners'
  },
  {
    id: 'v_p2',
    name: 'Royal Symphony Weddings & Events',
    category: 'Event Planner',
    tagline: 'Crafting heritage celebrations and royal wedding spectacles',
    description: 'Royal Symphony specializes in larger-than-life celebrations and high-capacity luxury events. Led by industry icon Meera Sen, they have executed spectacular heritage sangeets, royal weddings, and corporate galas across Mumbai, Pune, and Kolhapur.',
    rating: 5.0,
    reviewCount: 210,
    trustScore: 99,
    distance: '0.8 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 65000,
    images: [
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Elite Celebrity Sourcing & Booking', '3D Layout Renderings of Banquet Stages', 'Premium Logistics & Hospitality Management', 'Custom Sound & Pyrotechnic Supervision'],
    services: [
      { name: 'Heritage Royal Celebration Planning', price: 65000, description: 'Exclusive premium planning for grand sangeets, weddings, and multi-day festivities with premium design.', unit: 'event' },
      { name: 'Corporate Gala & Tech Launch Curation', price: 40000, description: 'Corporate coordination, keynote staging, branding backdrop design, and technical direction.', unit: 'event' }
    ],
    reviews: [
      { id: 'rp2_1', userName: 'Kabir Kapoor', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', rating: 5, date: 'May 30, 2026', comment: 'Meera and the Royal Symphony team executed our launch party seamlessly. Highly recommended!' }
    ],
    bookingsCount: 450,
    occasion: ['Wedding'],
    founderName: 'Meera Sen',
    experience: '8 Years',
    whatsapp: '9988776655',
    phone: '9988776655',
    instagram: 'https://instagram.com/royalsymphony'
  },
  {
    id: 'v_kp1',
    name: 'The Shalini Palace Grand Banquet',
    category: 'Banquet Hall',
    tagline: 'Heritage lakefront palace banquets with royal Maratha elegance',
    description: 'Located along the scenic Rankala Lake in Kolhapur, The Shalini Palace Grand Banquet offers majestic black stone arches, Italian marble flooring, and sprawling garden lawns. Perfect for lavish destination weddings and premium heritage banquets.',
    rating: 4.9,
    reviewCount: 182,
    trustScore: 98,
    distance: '0.5 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 120000,
    location: 'Kolhapur',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'
    ],
    videos: ['https://www.youtube.com/shorts/q2Z4FmX1Cg4'],
    features: ['Lakefront View', 'Sprawling Palace Lawns', 'Valet Parking', 'Heritage Bridal Suites', 'Royal Chandelier Hall'],
    services: [
      { name: 'Heritage Ballroom Rental (Full Day)', price: 120000, description: 'Exclusive use of the main palace ballroom, crystal chandeliers, and central air conditioning.', unit: 'day' },
      { name: 'Rankala Lakefront Lawn Addition', price: 50000, description: 'Outdoor scenic lawn space perfect for wedding pheras or sunset receptions.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 240,
    occasion: ['Wedding'],
    capacity: 1000,
    whatsapp: '919900112233'
  },
  {
    id: 'v_kp2',
    name: 'Sayaji Hotel Ballroom Kolhapur',
    category: 'Banquet Hall',
    tagline: 'Five-star contemporary luxury with stellar gourmet catering',
    description: 'Experience 5-star hospitality in Kolhapur. Sayaji Hotel features state-of-the-art audiovisual setups, central climate control, and award-winning culinary teams crafting absolute masterpieces for wedding sangeets and corporate meets.',
    rating: 4.8,
    reviewCount: 145,
    trustScore: 97,
    distance: '1.8 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 95000,
    location: 'Kolhapur',
    images: [
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
    ],
    videos: ['https://www.youtube.com/shorts/q2Z4FmX1Cg4'],
    features: ['Five-Star Hospitality', 'Premium LED Screens Integrated', 'Central AC', 'Multi-level Secure Parking', 'Award-winning Culinary Team'],
    services: [
      { name: 'Grand Sayaji Ballroom (Full Session)', price: 95000, description: 'Exclusive rental of the acoustic-insulated banquet hall, stage, and dynamic laser lighting.', unit: 'day' }
    ],
    reviews: [],
    bookingsCount: 310,
    occasion: ['Wedding'],
    capacity: 800,
    whatsapp: '919900112244'
  },
  {
    id: 'v_kp3',
    name: 'Maratha Spices & Authentic Kolhapuri Caterers',
    category: 'Catering',
    tagline: 'Legendary Tambda & Pandhra Rassa with royal brass Thali setups',
    description: 'We bring the authentic flavors of Kolhapur\'s rich culinary heritage to your celebrations. Specializing in legendary Tambda Rassa, Pandhra Rassa, Sukka Mutton, and premium veg Kolhapuri dishes prepared with hand-pounded local spices and presented in royal brass thalis.',
    rating: 4.9,
    reviewCount: 220,
    trustScore: 99,
    distance: '2.0 km',
    responseTime: '< 5 mins',
    verified: true,
    basePrice: 600,
    location: 'Kolhapur',
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
    ],
    videos: ['https://www.youtube.com/shorts/O46Aorl7b7Y'],
    features: ['Generational Local Chefs', 'Royal Brass Tableware', 'Live Hand-made Bhakri Counters', 'Strict separate Pure Veg preparation setups'],
    services: [
      { name: 'Authentic Maratha Buffet Menu', price: 600, description: 'Authentic local delicacies including Tambda & Pandhra Rassa, Sukka Mutton, Biryani, and handmade Bhakri.', unit: 'plate' },
      { name: 'Royal Kolhapuri Veg Feast', price: 500, description: 'Famous Veg Kolhapuri, Akkha Masur, Solkadhi, and live jowar bhakri with traditional sweet Shrikhand.', unit: 'plate' }
    ],
    reviews: [],
    bookingsCount: 430,
    occasion: ['Wedding'],
    whatsapp: '919900112255'
  },
  {
    id: 'v_kp4',
    name: 'Rankala Cinematic Studio',
    category: 'Photographer',
    tagline: 'Award-winning pre-wedding lakeside shoots and cinematic films',
    description: 'Capturing the soul and heritage of Kolhapur. We specialize in gorgeous lakefront couple shoots, dynamic drone videography, and multi-camera candid coverage that tells your wedding story like a romantic Bollywood feature film.',
    rating: 4.9,
    reviewCount: 94,
    trustScore: 96,
    distance: '1.0 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 30000,
    location: 'Kolhapur',
    images: [
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'
    ],
    videos: ['https://www.youtube.com/shorts/36_8p_GPhWc'],
    features: ['4K DJI Drone Footage', 'Rankala Lake Outdoor Session', 'Sony FX3 Cinema Rigs', 'Leatherbound Heritage Albums', 'Fast Delivery (< 10 Days)'],
    services: [
      { name: 'Complete Candid & Cinema Coverage (1 Day)', price: 40000, description: '1 Candid Photographer, 1 Cinema Videographer, 1 Traditional Photographer. Includes cinematic highlights video.', unit: 'day' },
      { name: 'Rankala Lakefront Pre-Wedding Couple Shoot', price: 20000, description: 'Sunset pre-wedding shoot with custom styling assistance and a 3-minute romantic teaser film.', unit: 'shoot' }
    ],
    reviews: [],
    bookingsCount: 150,
    occasion: ['Wedding'],
    whatsapp: '919900112266'
  },
  {
    id: 'v_kp5',
    name: 'Panhala Royal Planners',
    category: 'Event Planner',
    tagline: 'Flawless luxury execution from heritage decor to vendor coordination',
    description: 'Let our royal coordinators design your perfect wedding in Kolhapur. From Panhala fort theme setup to premium catering management, we handle all logistics, RSVP lists, and vendor contracts seamlessly so you can focus on creating memories.',
    rating: 4.9,
    reviewCount: 78,
    trustScore: 97,
    distance: '0.2 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 40000,
    location: 'Kolhapur',
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
    ],
    videos: ['https://www.youtube.com/shorts/O46Aorl7b7Y'],
    features: ['Fort Thematic Decor Specialization', 'Full RSVP Coordination', 'Guest Transport & Hospitality', 'Budget Optimization'],
    services: [
      { name: 'Complete Royal Wedding Management', price: 50000, description: 'End-to-end design, hotel bookings, transportation, live dhol/welcome management, and day-of coordination.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 120,
    occasion: ['Wedding'],
    founderName: 'Rajvardhan Patil',
    experience: '7 Years',
    whatsapp: '919900112277'
  },
  {
    id: 'v_m1',
    name: 'Taj Lands End Grand Ballroom',
    category: 'Banquet Hall',
    tagline: 'Sea-facing palatial ballroom with premium five-star hospitality',
    description: 'Located in the heart of Bandra, Taj Lands End Grand Ballroom offers majestic views of the Arabian Sea. It features high ceilings, crystal chandeliers, and in-house catering by master chefs. Perfectly suited for grand celebrity weddings and elite corporate events.',
    rating: 4.9,
    reviewCount: 280,
    trustScore: 99,
    distance: '0.8 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 250000,
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Arabian Sea View', 'Five-Star Catering', 'Premium Valet Parking', 'Luxury Bridal Suite'],
    services: [
      { name: 'Sea-View Ballroom Rental (Full Day)', price: 250000, description: 'Exclusive ballroom access, stage, central climate control, and basic sound setup.', unit: 'day' }
    ],
    reviews: [],
    bookingsCount: 620,
    occasion: ['Wedding', 'Corporate', 'Engagement'],
    capacity: 1000,
    whatsapp: '919000000001'
  },
  {
    id: 'v_m2',
    name: 'Dreamcraft Luxury Decorators',
    category: 'Decorator',
    tagline: 'Bespoke floral setups, crystal walkways, and grand stage backdrops',
    description: 'Specializing in contemporary floral themes, bespoke glass mandaps, and high-end light installations. We bring your dream wedding themes to life using premium imported flowers and customized setups.',
    rating: 4.8,
    reviewCount: 190,
    trustScore: 98,
    distance: '1.5 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 75000,
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Imported Florals', 'Bespoke Mandap Setup', 'LED Backdrop Integration', 'Eco-friendly Options'],
    services: [
      { name: 'Bespoke Floral Mandap & Stage Setup', price: 75000, description: 'Design, execution, fresh imported flowers, and premium stage lighting.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 450,
    occasion: ['Wedding', 'Engagement', 'Anniversary'],
    whatsapp: '919000000002'
  },
  {
    id: 'v_m3',
    name: 'Mumbai Candid Shutters',
    category: 'Photographer',
    tagline: 'Premium wedding photojournalism and cinematic 4K highlight films',
    description: 'Capturing raw emotions, candid smiles, and grand celebrations. Our team of award-winning photographers uses top-tier cinema gear and drones to document your special moments.',
    rating: 4.9,
    reviewCount: 160,
    trustScore: 97,
    distance: '2.1 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 40000,
    images: [
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Sony FX3 Cinema Cameras', '4K Drone Footage', 'Fast 10-day Delivery', 'Premium Hardbound Album'],
    services: [
      { name: 'Candid Photography & Cinematography (1 Day)', price: 50000, description: '1 candid photographer, 1 cinematographer, drone coverage, and high-res digital edits.', unit: 'day' }
    ],
    reviews: [],
    bookingsCount: 380,
    occasion: ['Wedding', 'Engagement', 'Pre-Wedding'],
    whatsapp: '919000000003'
  },
  {
    id: 'v_m4',
    name: 'DJ Vicky & Visual Trusses',
    category: 'DJ',
    tagline: 'High-energy electronic beats, club lighting, and synchronized cold-pyros',
    description: 'Vicky is Mumbai\'s premier Bollywood & EDM mashup DJ. Equipped with state-of-the-art JBL line arrays, custom LED dj booths, and responsive laser shows to make your sangeet night unforgettable.',
    rating: 4.7,
    reviewCount: 130,
    trustScore: 96,
    distance: '3.0 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 30000,
    images: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['JBL Sound System', 'Custom DJ Console', 'Integrated Lasers', 'Synchronized Cold Pyros'],
    services: [
      { name: 'Premium DJ & Light Setup (Sangeet)', price: 30000, description: 'DJ console, club-grade sound, dynamic truss lights, and 4-hour performance.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 290,
    occasion: ['Wedding', 'Birthday', 'Festival'],
    whatsapp: '919000000004'
  },
  {
    id: 'v_m5',
    name: 'Lalit Fine Dine Caterers',
    category: 'Catering',
    tagline: 'Gourmet multi-cuisine menu with interactive molecular live counters',
    description: 'Curating luxury culinary journeys for your guests. Specializing in live wood-fired pizzas, authentic regional Indian delicacies, molecular gastronomy starters, and custom dessert studios.',
    rating: 4.9,
    reviewCount: 310,
    trustScore: 99,
    distance: '1.2 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 900,
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Molecular Gastronomy Live Station', 'Bespoke Dessert Studio', 'Star-rated Chefs', 'Vegetarian Separate Kitchen'],
    services: [
      { name: 'Premium Multi-Cuisine Dinner Buffet', price: 900, description: '4 starters, 5 main course dishes, live dessert station, and high-density crockery.', unit: 'plate' }
    ],
    reviews: [],
    bookingsCount: 780,
    occasion: ['Wedding', 'Corporate', 'Anniversary'],
    whatsapp: '919000000005'
  },
  {
    id: 'v_m6',
    name: 'Komal Joshi Makeup Studio',
    category: 'Makeup Artist',
    tagline: 'Flawless airbrush HD bridal styling and premium hair design',
    description: 'Komal Joshi is a highly acclaimed bridal specialist trained in Paris. She uses high-end international cosmetics like Chanel, Dior, and Estée Lauder to deliver a natural, long-lasting glow under stage lights.',
    rating: 4.8,
    reviewCount: 110,
    trustScore: 97,
    distance: '2.5 km',
    responseTime: '< 20 mins',
    verified: true,
    basePrice: 20000,
    images: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Airbrush HD Makeup', 'Dior & Chanel Cosmetics Only', 'Pre-Wedding Makeup Trial', 'Saree & Outfit Draping'],
    services: [
      { name: 'Bridal Airbrush HD Styling Package', price: 20000, description: 'Airbrush makeup, bridal hairstyle, saree draping, lashes, and hair extensions.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 220,
    occasion: ['Wedding', 'Engagement', 'Pre-Wedding'],
    whatsapp: '919000000006'
  },
  {
    id: 'v_m7',
    name: 'The Sweet Boutique Mumbai',
    category: 'Cake & Desserts',
    tagline: 'Luxury multi-tier fondant cakes and customized sweet platters',
    description: 'A boutique bakery known for producing masterpieces. We design customized 3D multi-tier cakes and gourmet cupcakes using imported Belgian chocolate and organic vanilla extracts.',
    rating: 4.9,
    reviewCount: 85,
    trustScore: 98,
    distance: '1.4 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 5000,
    images: [
      'https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['3D Fondant Designs', 'Eggless Custom Recipes', 'Temperature Controlled Delivery', 'Premium Belgian Chocolate'],
    services: [
      { name: '3-Tier Luxury Customized Wedding Cake (3 kg)', price: 9000, description: 'Handcrafted fondant details, custom flavor profiles, and premium delivery.', unit: 'cake' }
    ],
    reviews: [],
    bookingsCount: 180,
    occasion: ['Wedding', 'Birthday', 'Baby Shower'],
    whatsapp: '919000000007'
  },
  {
    id: 'v_m8',
    name: 'Mumbai Live Dhol & Bollywood Dancers',
    category: 'Fun & Entertainment',
    tagline: 'High-energy live Punjabi Dhol, brass bands, and dance troupes',
    description: 'Add grand energy to your wedding entrance and sangeet celebrations with our professional Nashik dhol, Punjabi dhol beats, brass bands, and energetic Bollywood backup dancers.',
    rating: 4.8,
    reviewCount: 95,
    trustScore: 96,
    distance: '2.8 km',
    responseTime: '< 15 mins',
    verified: true,
    basePrice: 15000,
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Traditional Punjabi & Nashik Dhol', 'Backup Dancers Troupe', 'Emcee Anchoring Team', 'Grand Welcome Setup'],
    services: [
      { name: 'Punjabi Dhol Duo & Grand Entry Troupe', price: 15000, description: '2 master dhol players and 4 entrance dancers for baraat and groom entry.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 310,
    occasion: ['Wedding', 'Festival', 'Engagement'],
    whatsapp: '919000000008'
  },
  {
    id: 'v_m9',
    name: 'Wedlock Luxury Planners',
    category: 'Event Planner',
    tagline: 'End-to-end wedding design, theme conceptualization, and RSVP logistics',
    description: 'We orchestrate absolute dream weddings. From theme creation and hotel bookings to vendor negotiation, transportation, and onsite execution, we handle every detail with premium quality.',
    rating: 4.9,
    reviewCount: 140,
    trustScore: 98,
    distance: '1.2 km',
    responseTime: '< 10 mins',
    verified: true,
    basePrice: 60000,
    images: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'
    ],
    location: 'Mumbai',
    features: ['Custom 3D Venue Layouts', 'VIP RSVP Logistics', 'Budget Optimization', 'Full Day-of Coordination'],
    services: [
      { name: 'Full Wedding Planning & Coordination', price: 60000, description: 'End-to-end styling, booking management, transport logistics, and onsite coordinators.', unit: 'event' }
    ],
    reviews: [],
    bookingsCount: 280,
    occasion: ['Wedding', 'Engagement', 'Corporate'],
    founderName: 'Aditya Kulkarni',
    experience: '9 Years',
    whatsapp: '919000000009'
  }
];

export const SUGGESTED_RECENT_SEARCHES = [
  'Luxury Banquet Hall Juhu',
  'Flower Decorator for Anniversary',
  'Best Wedding Photographer',
  'Caterers with live pizza counters'
];

export const TRENDING_SEARCHES = [
  'Drone Videography Mumbai',
  'Acoustic Live Bands for Sangeet',
  'Rustic Theme Housewarming',
  'Intimate Naming Ceremony Packages'
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    vendorId: 'v1',
    sender: 'vendor',
    text: 'Namaste Devansh! Thanks for reaching out to The Royal Grand Pavilion. Are you looking to book for the upcoming wedding season in late 2026?',
    timestamp: '10:30 AM'
  },
  {
    id: 'm2',
    vendorId: 'v1',
    sender: 'user',
    text: 'Hello! Yes, we are planning a wedding for November 14, 2026. Is the Grand Ballroom available?',
    timestamp: '10:35 AM'
  },
  {
    id: 'm3',
    vendorId: 'v1',
    sender: 'vendor',
    text: 'Great news! November 14, 2026, is currently available. Since this is an auspicious day, we have high demand. Would you like to schedule a private walkthrough this weekend?',
    timestamp: '10:36 AM'
  },
  {
    id: 'm4',
    vendorId: 'v3',
    sender: 'vendor',
    text: 'Hey Devansh! We have updated our portfolio with recent pre-wedding videos. Let us know if you want a customized quote for photography + cinematic video bundle!',
    timestamp: 'Yesterday'
  }
];
