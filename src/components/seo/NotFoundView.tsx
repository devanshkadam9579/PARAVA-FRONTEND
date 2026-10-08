import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home, ArrowRight, Compass, HelpCircle } from 'lucide-react';
import { SEO_KOLHAPUR_ROUTES } from '../../utils/seo';

export function NotFoundView() {
  return (
    <div className="min-h-[80vh] bg-white flex items-center justify-center px-4 py-16">
      <Helmet>
        <title>Page Not Found | Parva Events</title>
        <meta name="description" content="The page or vendor you are looking for is not available. Explore verified event vendors and services in Kolhapur on Parva." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="max-w-xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 text-[#EC003F] border border-rose-200">
          <HelpCircle size={40} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Page or Vendor Not Found
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mx-auto">
            The link you followed may be expired or the vendor is currently updating their listing. Explore verified celebration services across Kolhapur below.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#EC003F] hover:bg-[#D40038] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-600/20 transition active:scale-95 text-sm cursor-pointer"
          >
            <Home size={16} />
            <span>Return to Homepage</span>
          </Link>
          <Link
            to="/event-vendors-kolhapur"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3.5 rounded-2xl transition text-sm cursor-pointer"
          >
            <Compass size={16} />
            <span>Browse Kolhapur Vendors</span>
          </Link>
        </div>

        {/* Popular Category Links */}
        <div className="pt-8 border-t border-gray-100 space-y-3 text-left">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
            Popular Event Services in Kolhapur
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(SEO_KOLHAPUR_ROUTES).slice(1, 7).map(([path, cfg]) => (
              <Link
                key={path}
                to={path}
                className="p-3 rounded-xl bg-gray-50 hover:bg-rose-50 border border-gray-200 text-xs font-bold text-gray-800 hover:text-[#EC003F] transition truncate flex items-center justify-between"
              >
                <span className="truncate">{cfg.h1}</span>
                <ArrowRight size={12} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default NotFoundView;
