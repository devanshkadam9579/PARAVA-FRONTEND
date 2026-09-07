import re

with open('src/components/airbnb/HowItWorksSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update signature to accept promos
sig_search = "export function HowItWorksSection() {"
sig_replace = "export function HowItWorksSection({ promos = [] }: { promos?: any[] }) {"
content = content.replace(sig_search, sig_replace)

# Replace the specific placeholder loop with a map over promos
# The old one was:
# {[1, 2].map((loopIdx) => ( ... ))}
old_loop_pattern = r'\{\[1, 2\]\.map\(\(loopIdx\) => \(\s*<React\.Fragment key=\{loopIdx\}>.*?<\/React\.Fragment>\s*\)\)\}'

# Create the new loop
# Since we need a marquee to repeat, we will create 2 groups of the exact same promos
new_loop = """{[1, 2].map((loopIdx) => (
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
            ))}"""

content = re.sub(old_loop_pattern, new_loop, content, flags=re.DOTALL)

with open('src/components/airbnb/HowItWorksSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
