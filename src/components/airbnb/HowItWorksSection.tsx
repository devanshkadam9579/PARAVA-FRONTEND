import React from 'react';
import { Search, Sparkles, ShieldCheck, HeartHandshake, Award, Headphones, Star } from 'lucide-react';

export function HowItWorksSection() {
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

      {/* Trust & Escrow Guarantee */}
      <section className="bg-gradient-to-tr from-gray-900 via-gray-900 to-rose-950 rounded-3xl sm:rounded-4xl p-8 sm:p-14 text-white shadow-xl space-y-10">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest text-rose-300">
            <Award size={14} />
            <span>The Parva Escrow Guarantee</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-display leading-tight">
            Book with 100% confidence & zero stress
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-medium">
            Every vendor is physically audited, prices are guaranteed, and your advance payment is held safely in escrow until service delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-rose-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">100% Verified Partners</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed font-normal">
                Physically inspected, GST & Aadhaar verified celebration specialists.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-rose-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">5% Date-Lock Advance</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed font-normal">
                Lock your date with only a 5% advance fee. Pay remaining at event.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-rose-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <Headphones size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">24/7 Parva Concierge</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed font-normal">
                Dedicated celebration manager to assist your coordination at every step.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-rose-400 flex items-center justify-center shrink-0 border border-white/10 shadow-xs">
              <Star size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">Direct Wholesale Rates</h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed font-normal">
                Zero middleman markups. Genuine direct vendor pricing guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
