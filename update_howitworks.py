import re

with open('src/components/airbnb/HowItWorksSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''      {/* Promotional Banners */}
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
                {/* Promo Card 1 */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white mb-2 shadow-inner">
                    <Star size={20} className="fill-white" />
                  </div>
                  <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">50% Off Pre-Wedding Drone Shoots</h4>
                  <p className="text-xs text-gray-300 whitespace-normal leading-relaxed">Book any premium photographer today and get a complimentary 4K cinematic drone shoot.</p>
                </div>
                {/* Promo Card 2 */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white mb-2 shadow-inner">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">Free Royal Mandap Upgrade</h4>
                  <p className="text-xs text-gray-300 whitespace-normal leading-relaxed">Valid on all luxury banquet hall bookings this month. Elevate your wedding decor.</p>
                </div>
                {/* Promo Card 3 */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white mb-2 shadow-inner">
                    <Award size={20} />
                  </div>
                  <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">Complimentary Live Counters</h4>
                  <p className="text-xs text-gray-300 whitespace-normal leading-relaxed">Get 2 premium live catering counters absolutely free on bookings above 200 guests.</p>
                </div>
                {/* Promo Card 4 */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-80 shrink-0 shadow-lg inline-flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white mb-2 shadow-inner">
                    <HeartHandshake size={20} />
                  </div>
                  <h4 className="font-extrabold text-lg text-white whitespace-normal leading-tight">Bridal Makeup Trial Free</h4>
                  <p className="text-xs text-gray-300 whitespace-normal leading-relaxed">Secure your HD Bridal Makeup package and get a 100% free personalized trial session.</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>'''

content = re.sub(
    r'\{\/\* Trust & Escrow Guarantee \*\/\}.*?<\/section>', 
    replacement, 
    content, 
    flags=re.DOTALL
)

with open('src/components/airbnb/HowItWorksSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
