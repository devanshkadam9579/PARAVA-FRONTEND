import React from 'react';
import { 
  X, Check, Sparkles, Shield, Camera, Music, Utensils, 
  MapPin, Clock, Users, Award, ShieldCheck, HeartHandshake, Eye
} from 'lucide-react';

export interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  category: string;
  features?: string[];
}

export function AmenitiesModal({
  isOpen,
  onClose,
  vendorName,
  category,
  features = []
}: AmenitiesModalProps) {
  if (!isOpen) return null;

  // Curated category feature groups
  const defaultFeatureGroups = [
    {
      group: 'Core Services & Execution',
      items: features.length > 0 ? features : [
        'Dedicated On-Site Master Supervisor',
        'Pre-Event Layout & Acoustic Planning',
        'Complete Setup & Post-Event Breakdown',
        'Aadhaar & Police Verified Professional Staff'
      ]
    },
    {
      group: 'Equipment & Assurance',
      items: [
        'Commercial Grade Certified Gear',
        'Live Backup Equipment On Standby',
        'Central Temperature & Power Safeguards',
        'Escrow Protected Payment Milestone Guarantee'
      ]
    },
    {
      group: 'Hospitality & Safety',
      items: [
        'First Aid & Fire Safety Compliance',
        'Sanitized Preparation & Handling',
        '24/7 Parva Concierge Escalation Support',
        'Zero Cancellation Penalty Protection Policy'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 font-display">
              What this service offers
            </h3>
            <p className="text-xs text-gray-500 font-medium">{vendorName} · {category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 divide-y divide-gray-100">
          {defaultFeatureGroups.map((group, idx) => (
            <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
                {group.group}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} className="stroke-[3]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800 leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
