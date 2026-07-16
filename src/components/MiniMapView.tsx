/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, Compass, Navigation, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Vendor } from '../types';

interface MiniMapViewProps {
  vendor: Vendor;
  onShowNotification?: (msg: string) => void;
}

export default function MiniMapView({ vendor, onShowNotification }: MiniMapViewProps) {
  const [copied, setCopied] = useState(false);

  // Derive localized address and coordinates based on location
  const getMapDetails = () => {
    const loc = vendor.location || 'Mumbai';
    switch (loc) {
      case 'Mumbai':
        return {
          address: `Royal Estate Lane, Juhu Beach Road, Mumbai, MH - 400049`,
          coords: `19.1026° N, 72.8242° E`,
          neighborhood: 'Juhu Scheme',
          nearby: 'Hotel Tulip Star • Juhu Beach Garden'
        };
      case 'Bangalore':
        return {
          address: `Regency Garden Ring Rd, Indiranagar Double Rd, Bangalore, KA - 560008`,
          coords: `12.9716° N, 77.5946° E`,
          neighborhood: 'Indiranagar',
          nearby: 'Metro Station • 100 Feet Road junction'
        };
      case 'Delhi NCR':
        return {
          address: `Main Ring Road, Block H, Saket Heritage District, New Delhi - 110017`,
          coords: `28.6139° N, 77.2090° E`,
          neighborhood: 'Saket',
          nearby: 'Select Citywalk • Garden of Five Senses'
        };
      case 'Hyderabad':
        return {
          address: `Road No. 2, Banjara Hills Corporate Sector, Hyderabad, TS - 500034`,
          coords: `17.3850° N, 78.4867° E`,
          neighborhood: 'Banjara Hills',
          nearby: 'KBR Park • GVK One Mall'
        };
      case 'Pune':
        return {
          address: `Lane 6, Koregaon Park Plaza, Pune, MH - 411001`,
          coords: `18.5204° N, 73.8567° E`,
          neighborhood: 'Koregaon Park',
          nearby: 'Osho Ashram Garden • Westin Circle'
        };
      default:
        return {
          address: `Grand Galleria Plaza, Central Boulevard, ${loc}, India`,
          coords: `22.3094° N, 72.1362° E`,
          neighborhood: 'Heritage Row',
          nearby: 'Central Botanical Lake • City Center Mall'
        };
    }
  };

  const { address, coords, neighborhood, nearby } = getMapDetails();

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(coords);
    setCopied(true);
    if (onShowNotification) {
      onShowNotification('Coordinates copied to clipboard!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-sm" id={`vendor-mini-map-${vendor.id}`}>
      {/* Map Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
        <div className="flex items-center gap-1.5">
          <Compass className="text-brand-primary animate-spin-slow" size={15} />
          <span className="text-[11px] font-bold text-brand-text uppercase tracking-wider">
            Interactive Venue Location
          </span>
        </div>
        <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2 py-0.5 rounded-md">
          {neighborhood}
        </span>
      </div>

      {/* Styled Mock Map Canvas */}
      <div className="relative h-[180px] bg-[#E8ECEF] overflow-hidden group select-none">
        
        {/* SVG Roads & Map features */}
        <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Grid background pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Park (Green blocks) */}
          <path d="M-10,30 Q30,10 80,40 T150,20 L130,100 L-10,90 Z" fill="#D4E6D9" opacity="0.75" />
          <path d="M220,120 Q260,110 320,140 T380,110 L390,180 L200,180 Z" fill="#D4E6D9" opacity="0.65" />
          
          {/* Water body (Blue lake/river) */}
          <path d="M120,-10 C140,40 180,60 210,120 C230,160 280,185 300,200 L350,200 L350,-10 Z" fill="#C9DFEC" />

          {/* Broad Highways (Yellow-white) */}
          <path d="M-20,80 L420,110" stroke="#FFF" strokeWidth="10" strokeLinecap="round" />
          <path d="M-20,80 L420,110" stroke="#FFE9A3" strokeWidth="6" strokeLinecap="round" />

          <path d="M160,-20 L180,220" stroke="#FFF" strokeWidth="8" strokeLinecap="round" />
          <path d="M160,-20 L180,220" stroke="#FFE9A3" strokeWidth="4" strokeLinecap="round" />

          {/* Secondary streets (Thin white lines) */}
          <path d="M50,-20 L40,220" stroke="#FFF" strokeWidth="3" />
          <path d="M280,-20 L290,220" stroke="#FFF" strokeWidth="3" />
          <path d="M-20,140 Q100,130 180,150 T420,160" stroke="#FFF" strokeWidth="3.5" fill="none" />
          <path d="M-20,30 Q220,50 420,20" stroke="#FFF" strokeWidth="3" fill="none" />
          
          {/* Local secondary connector paths */}
          <path d="M180,60 L280,40" stroke="#FFF" strokeWidth="2" strokeDasharray="3,3" />
          <path d="M100,105 L100,180" stroke="#FFF" strokeWidth="2.5" />
        </svg>

        {/* Dynamic coordinate indicators on the map */}
        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-white/90">
          GPS: {coords}
        </div>

        {/* Nearby landmarks */}
        <div className="absolute top-2 left-2 bg-white/85 backdrop-blur-sm px-2 py-1 rounded-md text-[9px] font-semibold text-brand-text shadow-sm border border-gray-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
          <span>{nearby}</span>
        </div>

        {/* Center Target Pointer with dynamic scale pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          {/* Outer Pulsing Aura Ring */}
          <div className="absolute w-12 h-12 bg-brand-primary/20 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          <div className="absolute w-6 h-6 bg-brand-primary/30 rounded-full animate-pulse pointer-events-none" style={{ animationDuration: '1.5s' }} />

          {/* Main Pin */}
          <motion.div
            initial={{ y: -8, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 15,
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 1.5
            }}
            className="z-10 cursor-pointer flex flex-col items-center group-hover:scale-110 transition-transform"
          >
            <div className="bg-brand-primary text-white p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center relative">
              <MapPin size={16} fill="white" strokeWidth={1} />
            </div>
            {/* Soft shadow underneath */}
            <div className="w-2.5 h-1 bg-black/20 rounded-full blur-[1px] mt-0.5" />
          </motion.div>

          {/* Float tag showing distance */}
          <div className="mt-1 bg-brand-primary-dark text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
            {vendor.distance} away
          </div>
        </div>

        {/* Controls Overlay inside Map */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          <button
            onClick={handleCopyCoords}
            className="p-1.5 bg-white hover:bg-gray-50 text-brand-text hover:text-brand-primary rounded-lg shadow-md transition active:scale-95 border border-gray-100"
            title="Copy GPS coordinates"
            id={`copy-gps-btn-${vendor.id}`}
          >
            {copied ? <Check size={14} className="text-brand-success" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Address Details Area */}
      <div className="p-4 bg-white space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="text-brand-text-secondary transform rotate-45" size={13} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-brand-text-secondary leading-tight uppercase font-semibold tracking-wider">
              Physical Venue Address
            </p>
            <p className="text-xs text-brand-text font-medium mt-0.5 leading-relaxed">
              {address}
            </p>
          </div>
        </div>

        {/* Interactive map launchers */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vendor.name}, ${vendor.location}`)}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-brand-border text-brand-text font-bold text-xs py-2.5 rounded-xl transition"
            id={`open-google-maps-${vendor.id}`}
          >
            <span>Open in Maps</span>
            <ExternalLink size={12} className="text-brand-text-secondary" />
          </button>
          <button
            onClick={() => {
              if (onShowNotification) {
                onShowNotification(`Routes generated! Travel time: approx 12 mins via Highway 1.`);
              }
            }}
            className="flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-brand-primary/10"
            id={`get-directions-${vendor.id}`}
          >
            <Navigation size={12} className="fill-white" />
            <span>Get Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
}
