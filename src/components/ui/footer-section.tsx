import React from 'react';
import { Sparkles, Heart, ShieldCheck, Instagram, Facebook, Youtube, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { ParvaLogo } from '../airbnb/ParvaLogo';

export interface FooterSectionProps {
  onNavigateTab?: (tab: 'home' | 'bookings' | 'chat' | 'profile') => void;
  onOpenSupport?: () => void;
  onOpenLogin?: () => void;
}

export function FooterSection({
  onNavigateTab,
  onOpenSupport,
  onOpenLogin
}: FooterSectionProps) {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200/80 text-gray-700 font-sans mt-16 transition-colors">
      {/* Top Banner: Confidence & Guarantees */}
      <div className="w-full border-b border-gray-200/60 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">Verified Specialists</h4>
              <p className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                Aadhaar verified, background-checked event professionals.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">5% Escrow Advance</h4>
              <p className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                Lock your celebration date safely with minimal advance fee.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Heart size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">Transparent Pricing</h4>
              <p className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                Clear quotes, guest-based calculators, and no hidden surprises.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900">24/7 Concierge Support</h4>
              <p className="text-xs text-gray-500 mt-0.5 font-medium leading-relaxed">
                Real celebration managers ready to coordinate your big day.
              </p>
              <div className="mt-2 space-y-1">
                <a href="mailto:support@myparva.com?subject=Concierge Request" className="block text-xs font-bold text-rose-600 hover:underline">
                  support@myparva.com
                </a>
                <a href="tel:9579812694" className="block text-xs font-bold text-rose-600 hover:underline">
                  +91 9579812694
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links Columns */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <ParvaLogo size="md" onClick={() => onNavigateTab?.('home')} />
            <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-sm pt-2">
              Plan better. Celebrate better. PARVA is India's modern event marketplace connecting families and organizers with top-rated caterers, decorators, photographers, venues, and DJs.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-rose-600 hover:border-rose-300 transition shadow-2xs"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-rose-600 hover:border-rose-300 transition shadow-2xs"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-rose-600 hover:border-rose-300 transition shadow-2xs"
                aria-label="YouTube"
              >
                <Youtube size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-rose-600 hover:border-rose-300 transition shadow-2xs"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* For Customers */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              For Customers
            </h5>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-600">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('home')}
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Browse services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('bookings')}
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  My reservations
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  How it works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Customer help center
                </button>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              For Vendors
            </h5>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-600">
              <li>
                <a
                  href="https://parva-vendor-app.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Become a partner
                </a>
              </li>
              <li>
                <a
                  href="https://parva-vendor-app.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Vendor portal login
                </a>
              </li>
              <li>
                <a
                  href="https://parva-vendor-app.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Partner guidelines & safety
                </a>
              </li>
              <li>
                <a
                  href="https://parva-vendor-app.onrender.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-600 transition cursor-pointer"
                >
                  Monetization & payouts
                </a>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Company & Legal
            </h5>
            <ul className="space-y-2.5 text-xs font-semibold text-gray-600">
              <li>
                <span className="hover:text-rose-600 transition cursor-pointer">
                  About PARVA
                </span>
              </li>
              <li>
                <span className="hover:text-rose-600 transition cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-rose-600 transition cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-rose-600 transition cursor-pointer">
                  Cancellation & Refund policy
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-10 mt-10 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium">
          <p>© 2026 PARVA Celebrations Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Made with precision for Indian Celebrations 🇮🇳</span>
            <span>English (IN) · INR (₹)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default FooterSection;
