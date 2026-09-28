import React from 'react';
import { X, MessageSquare, ShieldCheck } from 'lucide-react';
import { AdminChatLogsViewer } from './AdminChatLogsViewer';
import { Vendor, Booking } from '../../types';

export interface AdminChatLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  bookings: Booking[];
}

export function AdminChatLogsModal({
  isOpen,
  onClose,
  vendors,
  bookings
}: AdminChatLogsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-emerald-100">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <MessageSquare className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display tracking-tight">Admin Customer-Vendor Live Communications Hub</h2>
              <p className="text-xs text-white/80">Audit real-time client demands, vendor response times, and booking agreements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
          <AdminChatLogsViewer vendors={vendors} bookings={bookings} />
        </div>
      </div>
    </div>
  );
}
