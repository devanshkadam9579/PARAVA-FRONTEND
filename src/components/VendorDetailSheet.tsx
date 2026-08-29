/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Star, ShieldCheck, MapPin, Sparkles, Clock, Calendar, Check,
  CheckCircle2, ArrowRight, User, ThumbsUp, CalendarIcon, Heart,
  ChevronLeft, ChevronRight, Instagram, Phone, MessageCircle, Lock, Play, Video,
  Download, FileText, User as UserIcon, DollarSign, Info, Smartphone, CreditCard, Users,
  MessageSquare, Image as ImageIcon, ShoppingCart, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Vendor, VendorServiceItem } from '../types';
import MiniMapView from './MiniMapView';

function getEmbedUrl(url: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/shorts/') || trimmed.includes('youtu.be/')) {
    const id = trimmed.split('/shorts/')[1] || trimmed.split('.be/')[1];
    if (id) {
      const cleanId = id.split('?')[0].split('&')[0];
      return `https://www.youtube.com/embed/${cleanId}`;
    }
  }
  if (trimmed.includes('youtube.com/watch')) {
    const parts = trimmed.split('v=');
    if (parts[1]) {
      const cleanId = parts[1].split('&')[0];
      return `https://www.youtube.com/embed/${cleanId}`;
    }
  }
  if (trimmed.includes('instagram.com/reel/') || trimmed.includes('instagram.com/p/')) {
    const id = trimmed.split('/reel/')[1]?.split('/')[0] || trimmed.split('/p/')[1]?.split('/')[0];
    if (id) {
      return `https://www.instagram.com/p/${id}/embed`;
    }
  }
  return '';
}

function getYoutubeId(url: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('youtube.com/shorts/') || trimmed.includes('youtu.be/')) {
    const id = trimmed.split('/shorts/')[1] || trimmed.split('.be/')[1];
    return id ? id.split('?')[0].split('&')[0] : '';
  }
  if (trimmed.includes('youtube.com/watch')) {
    const parts = trimmed.split('v=');
    return parts[1] ? parts[1].split('&')[0] : '';
  }
  return '';
}

interface VendorDetailSheetProps {
  vendor: Vendor;
  isOpen: boolean;
  onClose: () => void;
  bundledServices: VendorServiceItem[];
  onAddServiceToBundle: (service: VendorServiceItem) => void;
  onRemoveServiceFromBundle: (serviceName: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onShowNotification?: (msg: string) => void;
  currentUser: { name: string; phone: string; email: string; city: string } | null;
  onTriggerLogin: (onSuccess: () => void) => void;
  onAddLead: (leadData: { name: string; phone: string; email: string; city: string; budget: number }) => void;
  planningEventType: string;
  planningStartDate: string;
  planningEndDate: string;
  planningGuestSize: number;
  isAdmin?: boolean;
  onUpdateVendor?: (updatedVendor: Vendor) => void;
  onAddReview?: (rating: number, comment: string) => Promise<void>;
  onStartInAppChat?: (vendor: Vendor) => void;
  bookingFeePercentage?: number;
  handlePayWithRazorpay?: (params: any) => void;
  onNavigateToBookings?: () => void;
}

export default function VendorDetailSheet({
  vendor,
  isOpen,
  onClose,
  bundledServices,
  onAddServiceToBundle,
  onRemoveServiceFromBundle,
  isWishlisted,
  onToggleWishlist,
  onShowNotification,
  currentUser,
  onTriggerLogin,
  onAddLead,
  planningEventType,
  planningStartDate,
  planningEndDate,
  planningGuestSize,
  isAdmin = false,
  onUpdateVendor,
  onAddReview,
  onStartInAppChat,
  bookingFeePercentage = 5,
  handlePayWithRazorpay,
  onNavigateToBookings
}: VendorDetailSheetProps) {
  
  // Handle native back button to close sheet instead of exiting app
  useEffect(() => {
    window.history.pushState({ vendorSheetOpen: true }, '');
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

const [activeTab, setActiveTab] = useState<'services' | 'showcase' | 'about' | 'reviews'>('services');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [userRatingInput, setUserRatingInput] = useState(5);
  const [userCommentInput, setUserCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [likedReels, setLikedReels] = useState<Record<number, boolean>>({});
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);

  // New Interactive Modals State
  const [isFullCalendarOpen, setIsFullCalendarOpen] = useState(false);
  const [activeReelModal, setActiveReelModal] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const safeUserName = currentUser?.name || (currentUser as any)?.displayName || currentUser?.email?.split('@')[0] || 'Guest Planner';
  const safeUserPhone = currentUser?.phone || 'N/A';
  const safeUserEmail = currentUser?.email || 'N/A';
  const safeUserCity = currentUser?.city || 'N/A';

  // Dynamic Catering Real Service & Guest Multiplier Calculations
  const isCatering = vendor.category === 'Catering';
  const [cateringGuestCount, setCateringGuestCount] = useState<number>(planningGuestSize || 150);

  // Available real services for catering
  const cateringServices = (vendor.services && vendor.services.length > 0)
    ? vendor.services
    : [{ id: 'base_menu', name: 'Standard Full Catering Menu', price: vendor.basePrice || 450, unit: 'per plate', description: 'Complete starters, main course, bread, rice and dessert' }];

  const [selectedCateringServiceId, setSelectedCateringServiceId] = useState<string>(cateringServices[0]?.id || 'base_menu');

  const activeCateringService = cateringServices.find(s => s.id === selectedCateringServiceId) || cateringServices[0];
  const activePlateRate = isCatering ? (activeCateringService?.price || vendor.basePrice || 450) : vendor.basePrice;

  const rawServicePrice = bundledServices.length > 0
    ? bundledServices.reduce((acc, s) => acc + s.price, 0)
    : activePlateRate;

  const servicesTotal = isCatering ? (activePlateRate * cateringGuestCount) : rawServicePrice;

  const currentFeePct = bookingFeePercentage || 5;
  const calculatedBookingFee = Math.round((servicesTotal * currentFeePct) / 100);
  const gstAmount = Math.round(calculatedBookingFee * 0.18);
  const subtotalBeforeCoupon = calculatedBookingFee + gstAmount;
  const finalPayableTotal = Math.max(0, subtotalBeforeCoupon - couponDiscount);

  const downloadVendorPDF = async () => {
    if (onShowNotification) onShowNotification("Generating professional profile PDF... 📄");
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Brand Header - Logo with decorative elements
    doc.setFillColor(18, 18, 18); // brand-text color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Abstract logo mark (Diamond/Star shape)
    doc.setFillColor(255, 191, 0); // brand-warning
    doc.triangle(margin, 15, margin + 5, 25, margin - 5, 25, 'F');
    doc.triangle(margin, 35, margin + 5, 25, margin - 5, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PARVA', margin + 12, 28);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM EVENT ECOSYSTEM • ESTD 2024', margin + 12, 34);

    y = 60;
    doc.setTextColor(18, 18, 18);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(vendor.name, margin, y);
    
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${vendor.category} • ${vendor.location}`, margin, y);

    y += 20;
    doc.setTextColor(18, 18, 18);
    doc.setFontSize(14);
    doc.text('Professional Biography', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(vendor.description, pageWidth - (margin * 2));
    doc.text(splitDesc, margin, y);
    y += (splitDesc.length * 5) + 10;

    // Founder Info
    if (vendor.founderName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Leadership', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Founder: ${vendor.founderName}`, margin, y);
      y += 15;
    }

    // Services
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Core Offerings & Pricing', margin, y);
    y += 8;
    vendor.services.forEach((s) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${s.name} - ₹${s.price.toLocaleString('en-IN')}/${s.unit}`, margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitS = doc.splitTextToSize(s.description, pageWidth - (margin * 2) - 10);
      doc.text(splitS, margin + 5, y);
      y += (splitS.length * 4) + 5;
    });

    // Features
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Key Amenities', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const featuresText = vendor.features.join(' • ');
    const splitFeatures = doc.splitTextToSize(featuresText, pageWidth - (margin * 2));
    doc.text(splitFeatures, margin, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© 2026 PARVA EVENTS. All rights reserved. Registered trademark of PARVA Celebrations India.', margin, 285);
    doc.text('Verified Vendor Profile • Generated via PARVA Ecosystem', pageWidth - margin - 80, 285);

    doc.save(`${vendor.name.replace(/\s+/g, '_')}_Profile.pdf`);
    if (onShowNotification) onShowNotification("Profile downloaded! ✨");
  };

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'success'>('method');

  const downloadReceiptPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Header - Styled with logo
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Abstract logo mark
    doc.setFillColor(255, 191, 0);
    doc.triangle(margin, 15, margin + 5, 25, margin - 5, 25, 'F');
    doc.triangle(margin, 35, margin + 5, 25, margin - 5, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PARVA OFFICIAL RECEIPT', margin + 12, 28);
    
    // Content
    doc.setTextColor(18, 18, 18);
    doc.setFontSize(12);
    let y = 60;
    doc.text(`Receipt No: PRV-REC-${Math.floor(100000 + Math.random() * 900000)}`, margin, y);
    y += 10;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 20;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor Details:', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${vendor.name}`, margin, y);
    y += 6;
    doc.text(`Category: ${vendor.category}`, margin, y);
    y += 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary:', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount Paid (Advance): ₹5,000`, margin, y);
    y += 6;
    doc.text('Status: SUCCESS', margin, y);
    y += 6;
    doc.text('Payment Mode: UPI / Digital Wallet', margin, y);
    
    y += 30;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const disclaimer = "This is a computer-generated receipt for the advance booking amount paid via PARVA. The remaining amount should be settled with the vendor as per the agreed terms.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - (margin * 2));
    doc.text(splitDisclaimer, margin, y);
    
    // Footer
    doc.setFontSize(8);
    doc.text('© 2026 PARVA EVENTS. Verified Secure Transaction.', margin, 285);

    doc.save(`${vendor.name.replace(/\s+/g, '_')}_Receipt.pdf`);
    if (onShowNotification) onShowNotification("Receipt downloaded! 🧾✨");
  };

  // In-place editing states for Admins
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [editedTagline, setEditedTagline] = useState(vendor.tagline);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(vendor.description);

  const [isEditingFeatures, setIsEditingFeatures] = useState(false);
  const [editedFeatures, setEditedFeatures] = useState(vendor.features ? vendor.features.join(', ') : '');

  const [isEditingBasePrice, setIsEditingBasePrice] = useState(false);
  const [editedBasePrice, setEditedBasePrice] = useState(String(vendor.basePrice));

  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [editedServiceName, setEditedServiceName] = useState('');
  const [editedServicePrice, setEditedServicePrice] = useState('');

  useEffect(() => {
    setEditedTagline(vendor.tagline || '');
    setEditedDescription(vendor.description || '');
    setEditedFeatures(vendor.features ? vendor.features.join(', ') : '');
    setEditedBasePrice(String(vendor.basePrice));
    setIsEditingTagline(false);
    setIsEditingDescription(false);
    setIsEditingFeatures(false);
    setIsEditingBasePrice(false);
    setEditingServiceIndex(null);
  }, [vendor]);

  const handleSaveTagline = () => {
    setIsEditingTagline(false);
    onUpdateVendor?.({ ...vendor, tagline: editedTagline });
    if (onShowNotification) onShowNotification("Tagline updated successfully!");
  };

  const handleSaveDescription = () => {
    setIsEditingDescription(false);
    onUpdateVendor?.({ ...vendor, description: editedDescription });
    if (onShowNotification) onShowNotification("Professional bio updated successfully!");
  };

  const handleSaveFeatures = () => {
    setIsEditingFeatures(false);
    const parsedFeatures = editedFeatures.split(',').map(f => f.trim()).filter(Boolean);
    onUpdateVendor?.({ ...vendor, features: parsedFeatures });
    if (onShowNotification) onShowNotification("Amenities updated successfully!");
  };

  const handleSaveBasePrice = () => {
    setIsEditingBasePrice(false);
    const priceVal = Number(editedBasePrice);
    onUpdateVendor?.({ ...vendor, basePrice: isNaN(priceVal) ? vendor.basePrice : priceVal });
    if (onShowNotification) onShowNotification("Base price updated successfully!");
  };

  const handleSaveService = (index: number) => {
    const updatedServices = [...(vendor.services || [])];
    if (updatedServices[index]) {
      updatedServices[index] = {
        ...updatedServices[index],
        name: editedServiceName,
        price: Number(editedServicePrice) || updatedServices[index].price
      };
      onUpdateVendor?.({ ...vendor, services: updatedServices });
      setEditingServiceIndex(null);
      if (onShowNotification) onShowNotification("Service updated successfully!");
    }
  };
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Sync gallery index with active index when gallery is opened or closed
  useEffect(() => {
    if (isGalleryOpen) {
      setGalleryIndex(activeImageIndex);
    }
  }, [isGalleryOpen, activeImageIndex]);

  // Keyboard navigation for the full-screen gallery
  useEffect(() => {
    if (!isGalleryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        const nextIndex = (galleryIndex + 1) % vendor.images.length;
        setGalleryIndex(nextIndex);
        setActiveImageIndex(nextIndex);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (galleryIndex - 1 + vendor.images.length) % vendor.images.length;
        setGalleryIndex(prevIndex);
        setActiveImageIndex(prevIndex);
      } else if (e.key === 'Escape') {
        setIsGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, galleryIndex, vendor.images.length]);

  // Generate simple next 7 days dates for interactive calendar selector
  const today = new Date();
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 2); // Start from day after tomorrow
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      available: i !== 3 && i !== 5 // Simulate couple of booked dates
    };
  });

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
            className="fixed inset-0 bg-black z-40"
            id="detail-backdrop"
          />

          {/* Sliding Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-brand-bg shadow-2xl z-50 flex flex-col overflow-hidden"
            id="detail-sheet"
          >
            {/* Scrollable container for contents */}
            <div className="flex-1 overflow-y-auto pb-24">
              
              {/* Photo Hero Showcase */}
              <div 
                onClick={() => {
                  setGalleryIndex(activeImageIndex);
                  setIsGalleryOpen(true);
                }}
                className="relative aspect-[16/10] bg-gray-200 cursor-pointer group overflow-hidden"
                id="vendor-hero-image-container"
              >
                <img loading="lazy"
                  src={(vendor.images && vendor.images.length > 0 && vendor.images[activeImageIndex]) ? vendor.images[activeImageIndex] : 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600'}
                  alt={vendor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600';
                  }}
                />

                {/* Cover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

                {/* Top Actions Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadVendorPDF();
                    }}
                    className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition"
                    title="Download Profile PDF"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tap to view gallery badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1.5 shadow-lg pointer-events-none scale-95 group-hover:scale-100">
                  <Sparkles size={12} className="text-brand-primary animate-pulse" />
                  <span>Tap to view gallery</span>
                </div>

                {/* Top Sticky Bar Actions */}
                <div className="absolute top-4 inset-x-4 flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                    id="detail-close-btn"
                  >
                    <X size={20} />
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const message = `Check out ${vendor.name} on PARVA!%0A${vendor.tagline}%0A${window.location.origin}`;
                        window.open(`https://wa.me/?text=${message}`, '_blank');
                      }}
                      className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                      title="Share via WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist();
                      }}
                      className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
                      id="detail-wishlist-btn"
                    >
                      <Heart size={20} className={isWishlisted ? 'fill-brand-primary text-brand-primary' : ''} />
                    </button>
                  </div>
                </div>

                {/* Image Index Indicators */}
                <div className="absolute bottom-4 right-4 flex gap-1">
                  {vendor.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(idx);
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeImageIndex === idx ? 'bg-brand-primary w-5' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>

                {/* Vendor Category Overlay */}
                <span className="absolute bottom-4 left-4 bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-lg tracking-wider uppercase">
                  {vendor.category}
                </span>
              </div>

              {/* Core Information Section */}
              <div className="bg-white p-6 border-b border-brand-border">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h2 className="text-xl font-bold text-brand-text leading-tight">
                    {vendor.name}
                  </h2>
                  {vendor.verified && (
                    <div className="flex items-center gap-1 text-[10px] bg-brand-primary-light text-brand-primary-dark px-2.5 py-1 rounded-lg font-bold shrink-0">
                      <ShieldCheck size={13} />
                      <span>TRUSTED</span>
                    </div>
                  )}
                </div>

                {isAdmin ? (
                  <div className="mb-4 bg-gray-50 p-2.5 rounded-xl border border-dashed border-brand-primary/30">
                    {isEditingTagline ? (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-brand-primary block">Edit Tagline</label>
                        <input
                          type="text"
                          value={editedTagline}
                          onChange={(e) => setEditedTagline(e.target.value)}
                          className="w-full bg-white border border-brand-border rounded-lg p-1.5 text-xs outline-none focus:border-brand-primary"
                        />
                        <div className="flex justify-end gap-1.5 text-[10px]">
                          <button onClick={() => setIsEditingTagline(false)} className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold">Cancel</button>
                          <button onClick={handleSaveTagline} className="px-2 py-0.5 rounded bg-brand-primary text-white font-bold">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs text-brand-text-secondary italic">"{vendor.tagline}"</p>
                        <button
                          onClick={() => setIsEditingTagline(true)}
                          className="text-[9px] font-extrabold text-brand-primary shrink-0 underline decoration-dotted"
                        >
                          Change Tagline
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-brand-text-secondary italic mb-4 leading-relaxed">
                    "{vendor.tagline}"
                  </p>
                )}

                {/* Micro metrics grid */}
                <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <div className="text-center">
                    <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-1">Score</span>
                    <div className="flex items-center justify-center gap-0.5 text-brand-success font-bold text-sm">
                      <Sparkles size={13} />
                      <span>{vendor.trustScore}%</span>
                    </div>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-1">Distance</span>
                    <span className="font-semibold text-brand-text text-sm">{vendor.distance}</span>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-1">Response</span>
                    <div className="flex items-center justify-center gap-0.5 text-brand-primary font-semibold text-[11px] leading-tight">
                      <Clock size={11} />
                      <span>{vendor.responseTime}</span>
                    </div>
                  </div>
                  <div className="text-center border-l border-gray-200">
                    <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block mb-1">Bookings</span>
                    <span className="font-semibold text-brand-text text-sm">{vendor.bookingsCount}+</span>
                  </div>
                </div>
              </div>

              {/* Clean Catering Guest Count Box */}
              {isCatering && (
                <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-2xl mx-6 mt-4 flex items-center justify-between shadow-2xs">
                  <div>
                    <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                      <span>🍽️</span>
                      <span>Event Guest Count</span>
                    </h4>
                    <p className="text-[10px] text-amber-800 font-medium mt-0.5">
                      Select any plate service below to calculate total
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCateringGuestCount(prev => Math.max(10, prev - 25))}
                      className="w-7 h-7 rounded-lg bg-amber-100/60 hover:bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center active:scale-95 transition"
                    >
                      -
                    </button>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={cateringGuestCount}
                        onChange={(e) => setCateringGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center font-black text-xs text-amber-950 font-mono outline-none bg-transparent"
                      />
                      <span className="text-[10px] font-bold text-amber-800 pr-1">Guests</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCateringGuestCount(prev => prev + 25)}
                      className="w-7 h-7 rounded-lg bg-amber-100/60 hover:bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center active:scale-95 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Interactive Calendar Slot */}
              <div className="bg-white px-6 py-5 border-b border-brand-border">
                <div className="flex items-center justify-between gap-1.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-brand-primary" />
                    <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider">
                      Check Date Availability
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullCalendarOpen(true)}
                    className="text-[10px] font-bold text-brand-primary hover:underline bg-brand-primary/10 px-2.5 py-1 rounded-lg flex items-center gap-1"
                  >
                    <CalendarIcon size={12} />
                    <span>View Full Calendar</span>
                  </button>
                </div>
                
                {/* Scrollable Calendar Row */}
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.dateString;
                    return (
                      <button
                        key={item.dateString}
                        onClick={() => item.available && setSelectedDate(item.dateString)}
                        disabled={!item.available}
                        className={`flex flex-col items-center p-3 rounded-xl min-w-[58px] snap-center border transition-all ${
                          !item.available
                            ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20 scale-105'
                            : 'bg-white border-brand-border hover:border-brand-primary text-brand-text'
                        }`}
                        id={`calendar-date-${item.dateString}`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider mb-1">
                          {item.dayName}
                        </span>
                        <span className="text-base font-extrabold mb-0.5">
                          {item.dayNum}
                        </span>
                        <span className="text-[9px] font-medium uppercase opacity-80">
                          {item.available ? item.monthName : 'Booked'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedDate && (
                  <p className="text-xs text-brand-success font-semibold flex items-center gap-1 mt-2.5">
                    <CheckCircle2 size={13} />
                    <span>Vendor is fully available for booking on {selectedDate}!</span>
                  </p>
                )}
              </div>

              {/* Segmented Tabs Control */}
              <div className="bg-white border-b border-brand-border flex overflow-x-auto scrollbar-none">
                {(['services', 'about', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-grow shrink-0 text-center py-3 px-2.5 text-xs font-bold capitalize border-b-2 transition-all ${
                      activeTab === tab
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-brand-text-secondary hover:text-brand-text'
                    }`}
                    id={`vendor-tab-${tab}`}
                  >
                    {tab === 'services' 
                      ? 'Services' 
                      : tab === 'reviews' 
                      ? `Reviews (${vendor.reviewCount})` 
                      : 'About'}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                
                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    <p className="text-xs text-brand-text-secondary mb-2 font-medium">
                      Select specific services below to instantly add them to your custom event bundle:
                    </p>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {vendor.services.map((svc, index) => {
                        const isAdded = bundledServices.some((s) => s.name === svc.name);
                        const isEditingSvc = editingServiceIndex === index;

                        return (
                          <div
                            key={svc.name}
                            className={`min-w-[260px] w-[260px] snap-center shrink-0 rounded-3xl overflow-hidden border transition-all ${
                              isAdded ? 'border-brand-primary bg-brand-primary-light/5 shadow-md shadow-brand-primary/10' : 'border-gray-100 bg-white shadow-sm'
                            }`}
                            id={`service-card-${svc.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {/* Service Image Section */}
                            <div className="h-32 bg-gray-100 relative w-full overflow-hidden">
                              {svc.image ? (
                                <img loading="lazy" src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                  <ImageIcon size={32} />
                                </div>
                              )}
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-sm border border-white">
                                <span className="text-sm font-extrabold text-brand-text">₹{svc.price.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              {isEditingSvc ? (
                                <div className="space-y-2 bg-gray-50 p-2 rounded-xl border border-dashed border-brand-primary/20">
                                  <span className="text-[9px] font-black uppercase text-brand-primary block">Modify Service Option</span>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-500 uppercase">Service Name</label>
                                    <input
                                      type="text"
                                      value={editedServiceName}
                                      onChange={(e) => setEditedServiceName(e.target.value)}
                                      className="w-full bg-white border border-brand-border rounded-lg p-1.5 text-xs outline-none focus:border-brand-primary"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-500 uppercase">Price (₹)</label>
                                    <input
                                      type="number"
                                      value={editedServicePrice}
                                      onChange={(e) => setEditedServicePrice(e.target.value)}
                                      className="w-full bg-white border border-brand-border rounded-lg p-1.5 text-xs outline-none focus:border-brand-primary"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-1.5 text-[10px]">
                                    <button onClick={() => setEditingServiceIndex(null)} className="px-2.5 py-1 rounded bg-gray-200 text-gray-700 font-bold">Cancel</button>
                                    <button onClick={() => handleSaveService(index)} className="px-2.5 py-1 rounded bg-brand-primary text-white font-bold">Save</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-bold text-brand-text text-[15px] leading-tight line-clamp-1">{svc.name}</h5>
                                      {isAdmin && (
                                        <button
                                          onClick={() => {
                                            setEditingServiceIndex(index);
                                            setEditedServiceName(svc.name);
                                            setEditedServicePrice(String(svc.price));
                                          }}
                                          className="text-[9px] font-black text-brand-primary underline shrink-0 hover:text-brand-primary-dark"
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-brand-text-secondary line-clamp-2 min-h-[32px]">
                                      {svc.description}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <span className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">
                                      Per {svc.unit}
                                    </span>
                                    
                                    {isAdded ? (
                                      <button
                                        onClick={() => onRemoveServiceFromBundle(svc.name)}
                                        className="bg-brand-primary text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
                                        id={`remove-svc-btn-${svc.name.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        <Check size={14} />
                                        <span>Added</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => onAddServiceToBundle(svc)}
                                        className="bg-gray-900 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md shadow-black/10 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
                                        id={`add-svc-btn-${svc.name.toLowerCase().replace(/\s+/g, '-')}`}
                                      >
                                        <ShoppingCart size={14} />
                                        <span>Add</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sticky Bottom Action Bar when services are added */}
                    {bundledServices.length > 0 && (
                      <div className="mt-6 sticky bottom-0 bg-white border border-brand-border p-4 rounded-2xl shadow-xl flex items-center justify-between z-20">
                        <div>
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider block">Draft Selection Bundle</span>
                          <span className="text-xs font-extrabold text-brand-text">
                            {bundledServices.length} Service{bundledServices.length > 1 ? 's' : ''} Added • ₹{bundledServices.reduce((a, b) => a + b.price, 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onNavigateToBookings) onNavigateToBookings();
                          }}
                          className="bg-brand-primary hover:bg-brand-primary-dark text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md shadow-brand-primary/20 flex items-center gap-1.5 transition active:scale-95"
                        >
                          <span>Review & Book in Cart</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'showcase' && (
                  <div className="space-y-6" id="vendor-showcase-panel">
                    
                    {/* Part C: Reels & Video Shorts Showcase */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-brand-text uppercase tracking-wider flex items-center gap-1">
                          <Video size={13} className="text-brand-primary" />
                          <span>🎬 Verified Reels & Video Shorts</span>
                        </h4>
                        <span className="text-[10px] text-brand-text-secondary font-medium">Aspect 9:16 Format</span>
                      </div>
                      
                      {/* Responsive video columns */}
                      <div className="grid grid-cols-2 gap-3">
                        {(vendor.videos && vendor.videos.length > 0 ? vendor.videos : [
                          vendor.category === 'Banquet Hall' ? "https://www.youtube.com/shorts/q2Z4FmX1Cg4" : "https://www.youtube.com/shorts/36_8p_GPhWc",
                          vendor.category === 'DJ' ? "https://www.youtube.com/shorts/r6nB64lC3h0" : "https://www.youtube.com/shorts/O46Aorl7b7Y"
                        ]).map((videoUrl, index) => {
                          const embedUrl = getEmbedUrl(videoUrl);
                          const isDirectMp4 = videoUrl.endsWith('.mp4');
                          const ytId = getYoutubeId(videoUrl);
                          const isPlaying = playingVideoIndex === index;
                          
                          return (
                            <div 
                              key={index}
                              className="bg-black rounded-2xl overflow-hidden aspect-[9/16] relative shadow-md border border-brand-border flex flex-col group cursor-pointer"
                              onClick={() => {
                                if (!isPlaying) setPlayingVideoIndex(index);
                              }}
                            >
                              {isPlaying ? (
                                embedUrl ? (
                                  <iframe
                                    src={`${embedUrl}?autoplay=1`}
                                    title={`Reel ${index + 1}`}
                                    className="w-full h-full border-0 absolute inset-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                ) : isDirectMp4 ? (
                                  <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    playsInline
                                    loop
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-white/60">
                                    <Play size={24} className="text-brand-primary mb-2" />
                                    <span className="text-[10px] font-bold">Standard Reel Link</span>
                                    <a href={videoUrl} target="_blank" rel="noreferrer" className="text-[9px] text-brand-accent underline mt-1 break-all">
                                      Watch External
                                    </a>
                                  </div>
                                )
                              ) : (
                                <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-3 bg-cover bg-center" style={{
                                  backgroundImage: ytId ? `url(https://img.youtube.com/vi/${ytId}/hqdefault.jpg)` : 'none',
                                  backgroundColor: '#1E293B'
                                }}>
                                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/50 transition-colors" />
                                  <div className="z-10 flex justify-between items-center w-full">
                                    <span className="bg-brand-primary/95 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                                      Reel {index + 1}
                                    </span>
                                  </div>
                                  <div className="z-10 flex-1 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition shadow-lg flex items-center justify-center text-brand-primary">
                                      <Play size={22} fill="currentColor" className="ml-0.5" />
                                    </div>
                                  </div>
                                  <div className="z-10 text-white text-center text-[9px] font-medium leading-tight">
                                    Tap to play verified reel
                                  </div>
                                </div>
                              )}
                              
                              {/* Floating Social Interactions */}
                              <div className="absolute right-2.5 bottom-12 z-20 flex flex-col items-center gap-3">
                                {/* Like Icon */}
                                <button
                                  type="button"
                                  onClick={() => setLikedReels(prev => ({ ...prev, [index]: !prev[index] }))}
                                  className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition hover:scale-110 active:scale-95 pointer-events-auto"
                                >
                                  <Heart
                                    size={13}
                                    className={likedReels[index] ? 'text-red-500 fill-red-500' : 'text-white'}
                                  />
                                </button>
                                <span className="text-[8px] font-black text-white -mt-2.5 drop-shadow">
                                  {likedReels[index] ? '1.2k' : '1.1k'}
                                </span>

                                {/* Comment Icon */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onShowNotification) onShowNotification("💬 Live comments are restricted to authenticated accounts.");
                                  }}
                                  className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition hover:scale-110 pointer-events-auto"
                                >
                                  <MessageCircle size={13} className="text-white" />
                                </button>
                                <span className="text-[8px] font-black text-white -mt-2.5 drop-shadow">
                                  45
                                </span>

                                {/* Share Icon */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const shareUrl = `https://wa.me/?text=Check out this stunning reel from ${vendor.name} on PARVA! ${encodeURIComponent(videoUrl)}`;
                                    window.open(shareUrl, '_blank');
                                    if (onShowNotification) onShowNotification("📥 Share link copied to WhatsApp!");
                                  }}
                                  className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-emerald-400 transition hover:scale-110 pointer-events-auto"
                                >
                                  <Phone size={13} className="text-emerald-400" />
                                </button>
                                <span className="text-[8px] font-black text-white -mt-2.5 drop-shadow">
                                  Share
                                </span>
                              </div>

                              {/* Dark subtle overlay on hover */}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 transition duration-300 pointer-events-none z-10">
                                <span className="text-[9px] text-white font-extrabold uppercase tracking-wide">
                                  {vendor.category} Reel #{index + 1}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                  </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-5">
                    <div className="space-y-5 bg-white p-5 rounded-2xl border border-brand-border">
                      {/* Description / Bio Section */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider">
                            Professional Bio
                          </h4>
                          {isAdmin && !isEditingDescription && (
                            <button
                              onClick={() => setIsEditingDescription(true)}
                              className="text-[9px] font-bold text-brand-primary underline"
                            >
                              Edit Bio
                            </button>
                          )}
                        </div>
                        {isEditingDescription ? (
                          <div className="space-y-2 bg-gray-50 p-2.5 rounded-xl border border-brand-border">
                            <textarea
                              value={editedDescription}
                              onChange={(e) => setEditedDescription(e.target.value)}
                              rows={4}
                              className="w-full bg-white border border-brand-border rounded-lg p-2 text-xs outline-none focus:border-brand-primary leading-relaxed"
                            />
                            <div className="flex justify-end gap-1.5 text-[10px]">
                              <button onClick={() => setIsEditingDescription(false)} className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold">Cancel</button>
                              <button onClick={handleSaveDescription} className="px-2 py-0.5 rounded bg-brand-primary text-white font-bold">Save</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-brand-text-secondary leading-relaxed">
                            {vendor.description}
                          </p>
                        )}
                      </div>

                      {/* Founder Section */}
                      {(vendor.founderName || isAdmin) && (
                        <div className="pt-5 border-t border-gray-100">
                          <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider mb-4">
                            Meet the Founder
                          </h4>
                          <div className="flex items-center gap-4">
                            {vendor.founderImage ? (
                              <img loading="lazy" src={vendor.founderImage} alt={vendor.founderName} className="w-16 h-16 rounded-full object-cover border-2 border-brand-primary/20" />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xl font-bold">
                                {vendor.founderName?.charAt(0) || 'F'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-brand-text">{vendor.founderName}</p>
                              <p className="text-xs text-brand-text-secondary">{vendor.founderBio || 'Founder & Owner'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Budgets & Events Section */}
                      <div className="pt-5 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Budget Range</h4>
                          <p className="text-xs font-bold text-brand-text">
                            {vendor.minBudget ? `₹${vendor.minBudget.toLocaleString()}` : (vendor.basePrice ? `₹${vendor.basePrice.toLocaleString()}` : 'Price on request')}
                            {vendor.maxBudget ? ` - ₹${vendor.maxBudget.toLocaleString()}` : ''}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Events Handled</h4>
                          <p className="text-xs font-bold text-brand-text">
                            {vendor.eventsHandled && vendor.eventsHandled.length > 0 ? vendor.eventsHandled.join(', ') : vendor.occasion.join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Google Maps Location */}
                      {(vendor.googleMapsUrl || vendor.location) && (
                        <div className="pt-5 border-t border-gray-100">
                          <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider mb-3">
                            Location & Map
                          </h4>
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin size={16} className="text-brand-primary shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-brand-text-secondary leading-relaxed">
                              {vendor.location}
                            </p>
                          </div>
                          {vendor.googleMapsUrl && (
                            <div className="rounded-xl overflow-hidden border border-gray-100 h-40">
                              <iframe 
                                src={vendor.googleMapsUrl} 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                allowFullScreen 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                              ></iframe>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Amenities & Features Section */}
                      <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider">
                            Key Amenities & Features
                          </h4>
                          {isAdmin && !isEditingFeatures && (
                            <button
                              onClick={() => setIsEditingFeatures(true)}
                              className="text-[9px] font-bold text-brand-primary underline"
                            >
                              Edit Amenities
                            </button>
                          )}
                        </div>
                        {isEditingFeatures ? (
                          <div className="space-y-2 bg-gray-50 p-2.5 rounded-xl border border-brand-border">
                            <span className="text-[8px] font-bold text-gray-400 block uppercase">Comma-separated list:</span>
                            <input
                              type="text"
                              value={editedFeatures}
                              onChange={(e) => setEditedFeatures(e.target.value)}
                              className="w-full bg-white border border-brand-border rounded-lg p-1.5 text-xs outline-none focus:border-brand-primary"
                              placeholder="e.g. Free Wifi, AC, Valet Parking"
                            />
                            <div className="flex justify-end gap-1.5 text-[10px]">
                              <button onClick={() => setIsEditingFeatures(false)} className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold">Cancel</button>
                              <button onClick={handleSaveFeatures} className="px-2 py-0.5 rounded bg-brand-primary text-white font-bold">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {vendor.features && vendor.features.length > 0 ? (
                              vendor.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="bg-gray-100 text-brand-text text-[11px] font-medium py-1 px-2.5 rounded-lg border border-gray-200/50 flex items-center gap-1"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                                  <span>{feature}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-brand-text-secondary italic">No features listed</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Founder Info Section */}
                      <div className="pt-4 border-t border-dashed border-gray-100">
                        <h4 className="text-xs font-semibold text-brand-text uppercase tracking-wider mb-3">
                          Meet the Founder
                        </h4>
                        <div className="flex items-center gap-4 bg-brand-bg/50 p-4 rounded-2xl border border-brand-border">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-primary shadow-sm">
                            <img loading="lazy" 
                              src={vendor.founderImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"} 
                              alt={vendor.founderName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-black text-brand-text">{vendor.founderName || 'Founder Name'}</p>
                            <p className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-wider">Visionary & Lead Strategist</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <ShieldCheck size={12} className="text-brand-primary" />
                              <span className="text-[9px] font-black text-brand-primary uppercase">Identity Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Mini Map Placeholder */}
                    <MiniMapView vendor={vendor} onShowNotification={onShowNotification} />
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Summary row */}
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-brand-border mb-4">
                      <div className="text-center shrink-0">
                        <span className="text-3xl font-extrabold text-brand-text">{vendor.rating}</span>
                        <div className="flex items-center gap-0.5 mt-1 justify-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < Math.floor(vendor.rating) ? 'text-brand-warning fill-brand-warning' : 'text-gray-200'}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-brand-text-secondary mt-1">{vendor.reviewCount} Ratings</p>
                      </div>
                      <div className="text-xs text-brand-text-secondary flex-1 leading-relaxed">
                        98% of users recommended this vendor, noting exceptional communication and punctuality on the big day.
                      </div>
                    </div>

                    {/* Interactive Review Form */}
                    <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-brand-border space-y-3.5 mb-4 shadow-sm animate-in slide-in-from-bottom duration-200">
                      <h4 className="font-extrabold text-brand-text text-xs uppercase tracking-wider flex items-center gap-1">
                        <span>Share Your Experience</span>
                        <span>⭐</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Your Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setUserRatingInput(starVal)}
                              className="focus:outline-none transition active:scale-125"
                            >
                              <Star
                                size={18}
                                className={starVal <= userRatingInput ? 'text-brand-warning fill-brand-warning' : 'text-gray-200'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-brand-text-secondary uppercase tracking-widest block">Review Comments</label>
                        <textarea
                          rows={2}
                          value={userCommentInput}
                          onChange={(e) => setUserCommentInput(e.target.value)}
                          placeholder="Write a comment about their quality of service, coordination, or pricing..."
                          className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-primary transition resize-none text-brand-text font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={submittingReview}
                        onClick={async () => {
                          if (!userCommentInput.trim()) {
                            if (onShowNotification) onShowNotification('⚠️ Please enter review comment.');
                            return;
                          }
                          setSubmittingReview(true);
                          try {
                            if (onAddReview) {
                              await onAddReview(userRatingInput, userCommentInput.trim());
                              setUserCommentInput('');
                              setUserRatingInput(5);
                              if (onShowNotification) onShowNotification('🎉 Thank you! Review published successfully.');
                            } else {
                              if (onShowNotification) onShowNotification('⚠️ Review publishing is disabled.');
                            }
                          } catch (err) {
                            console.error(err);
                            if (onShowNotification) onShowNotification('❌ Could not post review.');
                          } finally {
                            setSubmittingReview(false);
                          }
                        }}
                        className="w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-black text-[10px] py-2.5 rounded-xl transition uppercase tracking-widest active:scale-95 shadow-md shadow-brand-primary/10"
                      >
                        {submittingReview ? 'Publishing Review...' : 'Post Review Now'}
                      </button>
                    </div>

                    {vendor.reviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-4 rounded-2xl border border-brand-border space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <img loading="lazy"
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="w-8 h-8 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h5 className="font-semibold text-brand-text text-xs">{rev.userName}</h5>
                              <span className="text-[9px] text-brand-text-secondary">{rev.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 bg-brand-primary-light px-1.5 py-0.5 rounded text-[10px] font-bold text-brand-primary-dark">
                            <span>{rev.rating}</span>
                            <Star size={9} className="fill-brand-primary-dark" />
                          </div>
                        </div>
                        <p className="text-xs text-brand-text-secondary leading-relaxed pl-1">
                          "{rev.comment}"
                        </p>
                        <div className="flex justify-end gap-1.5 items-center text-[10px] text-brand-text-secondary pt-1">
                          <ThumbsUp size={11} className="text-gray-400 cursor-pointer hover:text-brand-primary" />
                          <span>Helpful</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            </motion.div>

                              {/* Celebration Modal */}
                    <AnimatePresence>
                      {showWinnerModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
                          >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-brand-primary to-emerald-400" />
                            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Sparkles size={48} className="text-brand-primary animate-bounce" />
                            </div>
                            <h2 className="text-3xl font-black text-brand-text mb-2 uppercase tracking-tighter">YOU WON!</h2>
                            <p className="text-brand-text-secondary font-bold text-xs mb-6 leading-relaxed">
                              Verified contact access has been <span className="text-brand-primary font-black underline">UNLOCKED</span> for this vendor. You can now chat directly on WhatsApp!
                            </p>
                            
                            <div className="space-y-2 mb-8">
                              <button
                                onClick={() => {
                                  const waUrl = `https://wa.me/${vendor.whatsapp || '919999999999'}?text=${encodeURIComponent(`Hello ${vendor.name}, I found your profile on PARVA and I am interested in your services for my upcoming event!`)}`;
                                  window.open(waUrl, '_blank');
                                  setShowWinnerModal(false);
                                }}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95"
                              >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.63 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                <span>CHAT ON WHATSAPP</span>
                              </button>
                              <button
                                onClick={() => setShowWinnerModal(false)}
                                className="w-full bg-brand-primary text-white font-black py-3.5 rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-95 transition"
                              >
                                VIEW FULL PROFILE
                              </button>
                            </div>
                            {/* Confetti particles simulated with dots */}
                            {[...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ y: 0, x: 0 }}
                                animate={{ 
                                  y: [0, -100, 100], 
                                  x: [0, (i % 2 === 0 ? 1 : -1) * (i * 20)],
                                  opacity: [0, 1, 0] 
                                }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                className={`absolute w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-emerald-400' : 'bg-brand-primary'}`}
                                style={{ top: '50%', left: '50%' }}
                              />
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Payment Modal */}
                    <AnimatePresence>
                      {isPaymentModalOpen && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
                          >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-brand-bg/30">
                              <h3 className="font-black text-brand-text text-sm uppercase tracking-widest">Secure Checkout</h3>
                              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X size={18} />
                              </button>
                            </div>

                            <div className="p-8 flex-1">
                              {paymentStep === 'method' && (
                                <div className="space-y-6">
                                  <div className="text-center">
                                    <div className="inline-flex items-center gap-1.5 bg-brand-primary-light text-brand-primary-dark font-black text-[9px] uppercase px-3 py-1.5 rounded-full tracking-widest mb-4">
                                      <ShieldCheck size={11} />
                                      <span>Verified Booking Lock</span>
                                    </div>
                                    <p className="text-[10px] text-brand-text-secondary font-black uppercase tracking-widest mb-1">Direct Connection Fee</p>
                                    <h4 className="text-4xl font-black text-brand-text tracking-tighter">₹5,000</h4>
                                    <p className="text-[11px] text-brand-text-secondary font-medium mt-2 leading-relaxed px-4">
                                      This one-time connection fee locks your date with <b>{vendor.name}</b> and grants you 24/7 direct access. This amount is 100% adjustable against your final bill.
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <button
                                      onClick={() => {
                                        setPaymentStep('processing');
                                        setTimeout(() => {
                                          setPaymentStep('success');
                                        }, 2500);
                                      }}
                                      className="w-full bg-[#f8f9fa] border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:border-brand-primary transition group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-primary-light rounded-xl flex items-center justify-center text-brand-primary">
                                          <Smartphone size={20} />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-black text-brand-text">UPI / Google Pay</p>
                                          <p className="text-[10px] text-brand-text-secondary font-bold">Fastest & Secure</p>
                                        </div>
                                      </div>
                                      <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-primary" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setPaymentStep('processing');
                                        setTimeout(() => {
                                          setPaymentStep('success');
                                        }, 2500);
                                      }}
                                      className="w-full bg-[#f8f9fa] border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:border-brand-primary transition group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-primary-light rounded-xl flex items-center justify-center text-brand-primary">
                                          <CreditCard size={20} />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-black text-brand-text">Credit / Debit Card</p>
                                          <p className="text-[10px] text-brand-text-secondary font-bold">Safe & Encrypted</p>
                                        </div>
                                      </div>
                                      <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-primary" />
                                    </button>
                                  </div>
                                </div>
                              )}

                              {paymentStep === 'processing' && (
                                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                                  <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                                  <div className="text-center">
                                    <h4 className="text-lg font-black text-brand-text">Processing Payment</h4>
                                    <p className="text-xs text-brand-text-secondary font-bold">Please do not refresh or go back...</p>
                                  </div>
                                </div>
                              )}

                              {paymentStep === 'success' && (
                                <div className="py-8 space-y-6 text-center">
                                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/20">
                                    <Check size={40} strokeWidth={3} />
                                  </div>
                                  <div>
                                    <h4 className="text-2xl font-black text-brand-text">BOOKING CONFIRMED!</h4>
                                    <p className="text-xs text-brand-text-secondary font-bold mt-1 leading-relaxed px-4">
                                      Your advance payment of ₹5,000 has been received successfully.
                                    </p>
                                  </div>
                                  <div className="space-y-3 pt-4">
                                    <button
                                      onClick={downloadReceiptPDF}
                                      className="w-full bg-brand-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-95 transition"
                                    >
                                      <FileText size={18} />
                                      <span>DOWNLOAD RECEIPT</span>
                                    </button>
                                    <button
                                      onClick={() => setIsPaymentModalOpen(false)}
                                      className="w-full bg-gray-100 text-brand-text font-black py-3 rounded-xl hover:bg-gray-200 transition"
                                    >
                                      BACK TO PROFILE
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-4 bg-gray-50 flex items-center justify-center gap-2 border-t border-gray-100">
                              <ShieldCheck size={14} className="text-emerald-600" />
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">PCI-DSS COMPLIANT • 256-BIT SSL</span>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    

          {/* Full-Screen Swipeable Gallery overlay */}
          <AnimatePresence>
            {isGalleryOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col justify-between select-none"
                id="full-screen-gallery"
              >
                {/* Top header bar */}
                <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/85 via-black/40 to-transparent text-white z-10">
                  <div className="flex flex-col">
                    <span className="text-xs text-white/60 uppercase font-semibold tracking-wider">
                      {vendor.name}
                    </span>
                    <span className="text-sm font-bold tracking-wider mt-0.5">
                      {galleryIndex + 1} / {vendor.images.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsGalleryOpen(false)}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition text-white"
                    id="gallery-close-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Main Swipeable Stage */}
                <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4">
                  {/* Left Navigation Arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIndex = (galleryIndex - 1 + vendor.images.length) % vendor.images.length;
                      setGalleryIndex(prevIndex);
                      setActiveImageIndex(prevIndex);
                    }}
                    className="absolute left-6 p-4 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/10 hover:border-white/20 z-10 transition-all hidden md:flex active:scale-95 shadow-lg"
                    id="gallery-prev-btn"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  {/* Swipeable main content area */}
                  <div className="w-full max-w-4xl max-h-[70vh] relative flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={galleryIndex}
                        src={vendor.images[galleryIndex]}
                        alt={`${vendor.name} gallery image ${galleryIndex + 1}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(event, info) => {
                          const swipeThreshold = 50;
                          if (info.offset.x < -swipeThreshold) {
                            // Swiped left -> next
                            const nextIndex = (galleryIndex + 1) % vendor.images.length;
                            setGalleryIndex(nextIndex);
                            setActiveImageIndex(nextIndex);
                          } else if (info.offset.x > swipeThreshold) {
                            // Swiped right -> prev
                            const prevIndex = (galleryIndex - 1 + vendor.images.length) % vendor.images.length;
                            setGalleryIndex(prevIndex);
                            setActiveImageIndex(prevIndex);
                          }
                        }}
                        className="max-w-full max-h-[70vh] object-contain rounded-2xl cursor-grab active:cursor-grabbing shadow-2xl border border-white/5 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>
                  </div>

                  {/* Right Navigation Arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIndex = (galleryIndex + 1) % vendor.images.length;
                      setGalleryIndex(nextIndex);
                      setActiveImageIndex(nextIndex);
                    }}
                    className="absolute right-6 p-4 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/10 hover:border-white/20 z-10 transition-all hidden md:flex active:scale-95 shadow-lg"
                    id="gallery-next-btn"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Bottom Bar: Thumbnails and Swipe Instructions */}
                <div className="p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-4 z-10">
                  <p className="text-white/40 text-[11px] font-medium md:hidden tracking-wider flex items-center gap-1.5 animate-pulse">
                    <span>← Swipe left or right to browse →</span>
                  </p>

                  {/* Thumbnail Row */}
                  <div className="flex gap-3 overflow-x-auto max-w-full py-2 px-4 scrollbar-none justify-center">
                    {vendor.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setGalleryIndex(idx);
                          setActiveImageIndex(idx);
                        }}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all shrink-0 aspect-[4/3] w-16 md:w-20 ${
                          galleryIndex === idx 
                            ? 'border-brand-primary scale-110 shadow-lg shadow-brand-primary/30 ring-2 ring-brand-primary/20' 
                            : 'border-white/10 opacity-40 hover:opacity-80 hover:scale-105'
                        }`}
                        id={`gallery-thumb-${idx}`}
                      >
                        <img loading="lazy"
                          src={img}
                          alt={`thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Full Calendar Picker Modal Overlay */}
          <AnimatePresence>
            {isFullCalendarOpen && (
              <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-2xl space-y-4 relative overflow-hidden border border-gray-100"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">Vendor Booking Calendar</h3>
                        <p className="text-[11px] text-gray-500">{vendor.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFullCalendarOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Calendar Instructions & Legend */}
                  <div className="flex items-center justify-between text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-rose-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Booked / Blocked</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-brand-primary">
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                      <span>Selected</span>
                    </div>
                  </div>

                  {/* Date Grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-gray-400 uppercase">
                      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 max-h-[300px] overflow-y-auto p-1">
                      {Array.from({ length: 30 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i + 1);
                        const dateStr = d.toISOString().split('T')[0];
                        const dayNum = d.getDate();
                        const isBlocked = (vendor.busyDates || []).includes(dateStr) || i === 4 || i === 11 || i === 18;
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={dateStr}
                            disabled={isBlocked}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              if (onShowNotification) {
                                onShowNotification(`Selected ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
                              }
                              setIsFullCalendarOpen(false);
                            }}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all p-1 ${
                              isSelected
                                ? 'bg-brand-primary text-white font-extrabold shadow-md scale-105 ring-2 ring-brand-primary/30'
                                : isBlocked
                                ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed border border-dashed border-gray-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold active:scale-95'
                            }`}
                          >
                            <span className="text-xs">{dayNum}</span>
                            <span className="text-[8px] font-semibold">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setIsFullCalendarOpen(false)}
                      className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-bold py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95"
                    >
                      {selectedDate ? `Confirm Date: ${selectedDate}` : 'Close Calendar'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Reels Video Popup Player Modal */}
          <AnimatePresence>
            {activeReelModal && (
              <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-black rounded-[36px] w-full max-w-sm aspect-[9/16] overflow-hidden shadow-2xl relative flex flex-col border border-white/20"
                >
                  <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                      <Video className="text-brand-primary" size={18} />
                      <span className="text-xs font-black uppercase tracking-wider">Reel Showcase</span>
                    </div>
                    <button
                      onClick={() => setActiveReelModal(null)}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition active:scale-95"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <iframe
                    src={`${getEmbedUrl(activeReelModal)}?autoplay=1`}
                    title="Reel Player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />

                  <div className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-between bg-black/60 backdrop-blur-md p-3 rounded-2xl text-white">
                    <div>
                      <p className="text-xs font-black">{vendor.name}</p>
                      <p className="text-[10px] text-gray-300">{vendor.category} Showcase Video</p>
                    </div>
                    <button
                      onClick={() => setActiveReelModal(null)}
                      className="bg-brand-primary text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-brand-primary-dark"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Digital Booking Receipt Modal */}
          <AnimatePresence>
            {showReceiptModal && receiptData && (
              <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-[36px] max-w-md w-full p-6 shadow-2xl space-y-4 relative overflow-hidden"
                  id="printable-booking-receipt"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-purple-500 to-emerald-500" />
                  
                  <div className="flex justify-between items-start pt-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-brand-primary font-black text-lg">
                        <Sparkles size={20} />
                        <span>PARVA RECEIPT</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {receiptData.id}</p>
                    </div>
                    <button
                      onClick={() => setShowReceiptModal(false)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-emerald-900">BOOKING ADVANCE PAID & CONFIRMED</p>
                      <p className="text-[10px] text-emerald-700">Date slot reserved with vendor portal.</p>
                    </div>
                  </div>

                  {/* Customer & Vendor Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Customer Details</span>
                      <p className="font-bold text-gray-800">{receiptData.userName}</p>
                      <p className="text-[10px] text-gray-500">{receiptData.userPhone}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase block">Vendor Details</span>
                      <p className="font-bold text-gray-800">{receiptData.vendorName}</p>
                      <p className="text-[10px] text-gray-500">{receiptData.vendorCategory} • {receiptData.vendorLocation}</p>
                    </div>
                  </div>

                  {/* Itemized Services */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase block">Booked Services</span>
                    {receiptData.services.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-xl text-gray-700 font-medium">
                        <span>{s.name}</span>
                        <span className="font-bold text-gray-900">₹{s.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Summary */}
                  <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Services Total:</span>
                      <span className="font-bold">₹{receiptData.servicesTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Advance Fee ({receiptData.bookingFeePct}%):</span>
                      <span className="font-bold">₹{receiptData.bookingFeeAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>GST (18%):</span>
                      <span className="font-bold">₹{receiptData.gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-brand-primary-dark pt-1 border-t border-gray-100">
                      <span>TOTAL PAID:</span>
                      <span className="text-brand-primary">₹{receiptData.totalAmountDue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 bg-brand-primary text-white py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/20 hover:bg-brand-primary-dark transition active:scale-95"
                    >
                      <Download size={16} />
                      <span>Print / Save PDF</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `*PARVA BOOKING CONFIRMATION*\nReceipt ID: ${receiptData.id}\nVendor: ${receiptData.vendorName}\nCustomer: ${receiptData.userName}\nTotal Paid: ₹${receiptData.totalAmountDue}\nDate: ${receiptData.date}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-500 text-white px-4 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <MessageCircle size={16} />
                      <span>WhatsApp Receipt</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
