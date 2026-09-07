import React from 'react';
import { Search, Sparkles, ShieldCheck, HeartHandshake, Award, Headphones, Star } from 'lucide-react';

export function HowItWorksSection({ promos = [] }: { promos?: any[] }) {
  const steps = [
    {
      step: '01',
      title: 'Discover Specialists',
      desc: 'Browse physically audited venues, caterers, decorators, and photographers in your city with transparent pricing.',
      icon: Search
    },
    {
      step: '02',
      title: 'Customize Your Package',
      desc: 'Select exact guest counts, time slots, and bespoke add-on options tailored to your event requirements.',
      icon: Sparkles
    },
    {
      step: '03',
      title: 'Lock with 5% Advance',
      desc: 'Secure your date under the Parva Escrow Guarantee. Pay only a 5% connection fee now.',
      icon: ShieldCheck
    },
    {
      step: '04',
      title: 'Celebrate Stress-Free',
      desc: 'Direct vendor execution with 24/7 Parva Concierge support. Pay remaining balance on event day.',
      icon: HeartHandshake
    }
  ];

  return (
    <div className="space-y-16">
      {/* How Parva Works */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
            How Parva Works
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            From inspiration to execution, booking your celebration is completely effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow relative space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black transition-transform group-hover:scale-105">
                    <Icon size={22} />
                  </div>
                  <span className="text-3xl font-black font-display text-gray-200 group-hover:text-rose-200 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-gray-900 font-display">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

            {/* Promotional Banners */}
      <section className="bg-gradient-to-tr from-gray-900 via-gray-900 to-rose-950 rounded-3xl sm:rounded-4xl p-8 sm:p-14 text-white shadow-xl overflow-hidden relative">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest text-rose-300">
            <Sparkles size={14} />
            <span>Exclusive Offers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-display leading-tight">
            Celebrate more, spend less
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-medium">
            Unlock premium celebration packages with our exclusive limited-time vendor promotions.
          </p>
        </div>

        {/* CSS Marquee Loop */}
        <div className="relative flex overflow-x-hidden w-full group mask-image-fade">
          <div className="animate-marquee flex gap-6 whitespace-nowrap min-w-full">
            {[1, 2].map((loopIdx) => (
              <React.Fragment key={loopIdx}>
                {promos.length > 0 ? promos.map((promo, idx) => (
                  <div key={`${loopIdx}-${promo.id || idx}`} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3 relative overflow-hidden group">
                    {/* Background Image with Overlay */}
                    {promo.image && (
                      <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                        <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                      </div>
                    )}
                    
                    <div className="relative z-10 flex flex-col gap-3 h-full">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-inner">
                          <Star size={20} className="fill-white" />
                        </div>
                        {promo.badge && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-200 px-2 py-1 rounded-md border border-rose-500/30">
                            {promo.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">{promo.title || 'Special Promotion'}</h4>
                      <p className="text-xs text-gray-300 whitespace-normal leading-relaxed flex-1">{promo.subtitle || 'Book now to avail this exclusive offer.'}</p>
                    </div>
                  </div>
                )) : (
                  <>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white mb-2 shadow-inner">
                        <Star size={20} className="fill-white" />
                      </div>
                      <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">50% Off Pre-Wedding Drone Shoots</h4>
                      <p className="text-xs text-gray-300 whitespace-normal leading-relaxed">Book any premium photographer today and get a complimentary 4K cinematic drone shoot.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white mb-2 shadow-inner">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">Free Royal Mandap Upgrade</h4>
                      <p className="text-xs text-gray-300 whitespace-normal leading-relaxed">Valid on all luxury banquet hall bookings this month. Elevate your wedding decor.</p>
                    </div>
                  </>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
