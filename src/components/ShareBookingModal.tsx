import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Copy, Check, Calendar, Ticket, ShieldCheck, Heart, ExternalLink, Download, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Booking } from '../types';

interface ShareBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onShowNotification: (msg: string) => void;
}

export default function ShareBookingModal({
  isOpen,
  onClose,
  booking,
  onShowNotification
}: ShareBookingModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isOpen || !booking) return null;

  // Generate the encoded shareable data link
  const generateShareableLink = () => {
    try {
      const minimalBookingData = {
        id: booking.id,
        vendor: {
          id: booking.vendor.id,
          name: booking.vendor.name,
          category: booking.vendor.category,
          location: booking.vendor.location,
          trustScore: booking.vendor.trustScore,
          rating: booking.vendor.rating,
          images: booking.vendor.images ? [booking.vendor.images[0]] : []
        },
        selectedServices: booking.selectedServices,
        eventDate: booking.eventDate,
        eventType: booking.eventType,
        status: booking.status,
        totalPrice: booking.totalPrice,
        bundleDiscount: booking.bundleDiscount,
        finalPrice: booking.finalPrice,
        bookingIdString: booking.bookingIdString
      };

      const rawJson = JSON.stringify(minimalBookingData);
      // Base64 encode safely supporting unicode characters
      const b64 = btoa(encodeURIComponent(rawJson).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      
      return `${window.location.origin}${window.location.pathname}?sharedBooking=${b64}`;
    } catch (error) {
      console.error('Error generating share link:', error);
      return window.location.href;
    }
  };

  const shareableUrl = generateShareableLink();

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        // Fallback for older browsers / iframe contexts
        const textarea = document.createElement('textarea');
        textarea.value = shareableUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onShowNotification('📋 Read-only event plan link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      onShowNotification('❌ Failed to copy to clipboard.');
    }
  };

  const handleWhatsAppShare = () => {
    const servicesStr = (booking.selectedServices || [])
      .map((s) => `• *${s.name}* (₹${s.price.toLocaleString('en-IN')})`)
      .join('\n');

    const message = 
`✨ *PARVA CELEBRATIONS - EVENT BLUEPRINT* ✨

🎉 *Celebration:* ${booking.eventType || 'Event'}
📅 *Date:* ${booking.eventDate}
🏢 *Vendor:* ${booking.vendor.name} (${booking.vendor.category})
🎫 *Booking ID:* ${booking.bookingIdString || booking.id}

📋 *Booked Services:*
${servicesStr}

💰 *Total Investment:* ₹${(booking.finalPrice || booking.totalPrice || 0).toLocaleString('en-IN')}

🔗 *View Live Event Plan:* ${shareableUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onShowNotification('📲 Opening WhatsApp to share your event plan...');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `PARVA Event Plan - ${booking.eventType || 'Celebration'}`,
          text: `View our official celebration plan with ${booking.vendor.name} on PARVA!`,
          url: shareableUrl
        });
        onShowNotification('🎉 Event plan shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleWhatsAppShare();
        }
      }
    } else {
      handleWhatsAppShare();
    }
  };

  const handleDownloadCardImage = async () => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    onShowNotification('🎨 Generating high-res event plan pass...');

    try {
      const cardElement = document.getElementById('booking-visual-pass');
      if (!cardElement) {
        onShowNotification('❌ Could not locate event card element.');
        setIsGeneratingImage(false);
        return;
      }

      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `PARVA_Event_Plan_${booking.bookingIdString || booking.id}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification('🖼️ Event plan image saved to your downloads!');
    } catch (err) {
      console.error('Error generating card image:', err);
      onShowNotification('❌ Could not generate card image. Please use WhatsApp share.');
    } finally {
      setIsGeneratingImage(false);
    }
  };


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-text/40 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-brand-bg w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-brand-border flex flex-col z-10 max-h-[90vh]"
          id="share-booking-modal"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-brand-primary" />
              <h3 className="font-extrabold text-brand-text text-base">Share Event Plan</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition text-brand-text-secondary"
              id="close-share-modal-btn"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1">
            {/* Visual Card Snippet */}
            <div 
              className="relative bg-gradient-to-br from-brand-primary/10 via-white to-brand-primary/5 rounded-[24px] border border-brand-primary/20 p-5 shadow-lg shadow-brand-primary/5 overflow-hidden"
              id="booking-visual-pass"
            >
              {/* Semicircle Ticket Cuts */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-brand-bg border-r border-brand-primary/20 rounded-r-full z-10" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-brand-bg border-l border-brand-primary/20 rounded-l-full z-10" />

              {/* Card Header branding */}
              <div className="flex justify-between items-center border-b border-brand-primary/20 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-xs">👑</span>
                  <span className="text-[10px] font-extrabold tracking-widest text-brand-primary uppercase">
                    PARVA CELEBRATIONS
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span className="text-[9px] font-bold text-emerald-700">OFFICIAL PLAN</span>
                </div>
              </div>

              {/* Vendor & Category */}
              <div className="mb-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary px-2 py-0.5 rounded bg-brand-primary/10">
                  {booking.eventType}
                </span>
                <h4 className="font-extrabold text-brand-text text-base mt-2.5">
                  {booking.vendor.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-brand-text-secondary">
                    {booking.vendor.category}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-brand-text-secondary flex items-center gap-0.5">
                    📍 {booking.vendor.location}
                  </span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div className="border-t border-dashed border-brand-primary/30 my-4" />

              {/* Booking metadata */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                    CELEBRATION DATE
                  </span>
                  <span className="text-xs font-bold text-brand-text flex items-center gap-1 mt-1">
                    <Calendar size={12} className="text-brand-primary" />
                    {booking.eventDate}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                    BOOKING ID
                  </span>
                  <span className="text-xs font-mono font-bold text-brand-text flex items-center gap-1 mt-1">
                    <Ticket size={12} className="text-amber-600" />
                    {booking.bookingIdString}
                  </span>
                </div>
              </div>

              {/* Service list highlights */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-brand-primary/10 space-y-1.5 mb-4 max-h-32 overflow-y-auto">
                <span className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">
                  INCLUDED SERVICES
                </span>
                {booking.selectedServices.map((svc) => (
                  <div key={svc.name} className="flex justify-between items-center text-[11px]">
                    <span className="text-brand-text font-medium truncate max-w-[150px]">
                      {svc.name}
                    </span>
                    <span className="font-bold text-brand-text">
                      ₹{svc.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Block */}
              <div className="bg-brand-primary text-white rounded-xl p-3 flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-extrabold tracking-widest uppercase opacity-80 block">
                    TOTAL INVESTMENT
                  </span>
                  <span className="text-lg font-black tracking-tight">
                    ₹{booking.finalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white/20 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                  {booking.status === 'Completed' ? 'Celebrated ✓' : 'Direct Locked 🔐'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-brand-text-secondary text-center leading-relaxed max-w-[260px] mx-auto">
              Share this event blueprint with friends, family, or other decorators to collaborate on your vision!
            </p>
          </div>

          {/* Actions Footer */}
          <div className="px-6 pb-6 pt-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-3 px-4 rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
              id="whatsapp-share-btn"
            >
              <span className="text-base">📲</span>
              <span>Share via WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadCardImage}
                disabled={isGeneratingImage}
                className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                id="download-plan-image-btn"
              >
                <Download size={13} />
                <span>{isGeneratingImage ? 'Exporting...' : 'Save Image'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="bg-white hover:bg-gray-100 text-brand-text border border-brand-border py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                id="copy-share-link-btn"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span className="text-emerald-600 font-extrabold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-brand-text-secondary" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
