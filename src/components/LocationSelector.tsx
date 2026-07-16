/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Check, Globe, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CITIES } from '../data';

interface LocationSelectorProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSelector({
  currentCity,
  onSelectCity,
  isOpen,
  onClose
}: LocationSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
            id="location-backdrop"
          />

          {/* Drawer Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[24px] shadow-2xl z-50 overflow-hidden pb-8 border-t border-brand-border"
            id="location-drawer"
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-brand-border">
              <div>
                <h3 className="text-lg font-semibold text-brand-text">Select Event Location</h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">Where is your special occasion happening?</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full text-brand-text-secondary transition"
                id="close-location-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
              {/* Current GPS Action */}
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        // In a real app, we would reverse geocode these coordinates.
                        // For this demo, we'll map them to the nearest supported city.
                        const { latitude, longitude } = position.coords;
                        console.log('GPS Coordinates:', latitude, longitude);
                        
                        // Simulation: nearest city logic
                        onSelectCity('Mumbai (GPS Detected)');
                        onClose();
                      },
                      (error) => {
                        console.error('Geolocation error:', error);
                        onSelectCity('Mumbai'); // Fallback
                        onClose();
                      }
                    );
                  } else {
                    onSelectCity('Mumbai');
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-between p-4 bg-brand-primary-light/50 hover:bg-brand-primary-light rounded-2xl transition mb-4 group"
                id="gps-location-btn"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-primary/20">
                    <Navigation size={18} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-brand-primary-dark">Use Current Location</p>
                    <p className="text-xs text-brand-text-secondary">GPS, Mumbai Suburban, MH</p>
                  </div>
                </div>
                <span className="text-xs text-brand-primary font-semibold group-hover:underline">Locate</span>
              </button>

              {/* Popular Cities Header */}
              <div className="flex items-center gap-2 mb-3 mt-2 px-1">
                <Globe size={14} className="text-brand-text-secondary" />
                <span className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">Popular Cities</span>
              </div>

              {/* Cities Grid */}
              <div className="grid grid-cols-2 gap-3">
                {CITIES.map((city) => {
                  const isSelected = currentCity === city || (city === 'Mumbai' && currentCity.includes('GPS'));
                  return (
                    <button
                      key={city}
                      onClick={() => {
                        onSelectCity(city);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary-light/20 text-brand-primary-dark font-medium shadow-sm shadow-brand-primary/10'
                          : 'border-brand-border hover:border-gray-400 hover:bg-gray-50 text-brand-text'
                      }`}
                      id={`city-btn-${city.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className={isSelected ? 'text-brand-primary' : 'text-gray-400'} />
                        <span className="text-sm">{city}</span>
                      </div>
                      {isSelected && <Check size={16} className="text-brand-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
