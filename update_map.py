import re

with open('src/components/airbnb/AirbnbVendorDetailView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">
                    RS
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-gray-900">Rohan Sharma</h5>
                    <p className="text-[11px] text-gray-400">Kolhapur • 1 month ago</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  "Seamless coordination and transparent pricing. Paying the 5% advance on Parva gave us complete peace of mind."
                </p>
              </div>
            </div>
          </div>

          {/* Where you'll be - Map Section */}
          <div className="pt-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900 font-display">
              Where you'll be
            </h3>
            <p className="text-xs font-semibold text-gray-600">
              {vendor.location || 'Maharashtra, India'}
            </p>
            <div className="w-full h-[300px] sm:h-[400px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative">
              <iframe
                title="Service Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={https://maps.google.com/maps?q=&t=&z=13&ie=UTF8&iwloc=&output=embed}
                className="absolute inset-0"
                style={{ filter: 'grayscale(0.1) contrast(1.1)' }}
              />
            </div>
          </div>
        </div>'''

content = re.sub(
    r'              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">\s*<div className="flex items-center gap-3">\s*<div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">\s*RS\s*</div>\s*<div>\s*<h5 className="font-extrabold text-xs text-gray-900">Rohan Sharma</h5>\s*<p className="text-\[11px\] text-gray-400">Kolhapur [^<]+</p>\s*</div>\s*</div>\s*<p className="text-xs text-gray-700 leading-relaxed font-normal">\s*"Seamless coordination and transparent pricing\. Paying the 5% advance on Parva gave us complete peace of mind\."\s*</p>\s*</div>\s*</div>\s*</div>\s*</div>',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/airbnb/AirbnbVendorDetailView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
