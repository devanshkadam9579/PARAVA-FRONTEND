import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Calendar, Plus, Image as ImageIcon, Trash2, Check, Clock } from 'lucide-react';
import { getDb } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import CloudinaryImageUploader from '../CloudinaryImageUploader';

interface VendorDashboardProps {
  currentUser: any;
  vendors: any[];
  bookings: any[];
  onLogout: () => void;
  showNotification: (msg: string) => void;
  onNavigateToMessages?: () => void;
}

export default function VendorDashboardFull({ currentUser, vendors, bookings, onLogout, showNotification, onNavigateToMessages }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'services' | 'availability' | 'earnings'>('bookings');
  
  const vendor = vendors.find(v => v.id === currentUser.vendorId) || currentUser;
  const vendorBookings = bookings.filter(b => b.vendorId === vendor.id || b.vendor?.id === vendor.id);

  // Availability State
  const [blockDate, setBlockDate] = useState('');
  const [blockScope, setBlockScope] = useState<'Fullday' | 'Morning' | 'Evening'>('Fullday');
  const [busyDates, setBusyDates] = useState<string[]>(vendor.busyDates || []);
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>(vendor.busySlots || {});

  // Services State
  const [services, setServices] = useState<any[]>(vendor.services || []);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceImage, setNewServiceImage] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);

  // Calendar State & Handlers
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatDateStr = (dayNum: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const handleToggleDay = async (dateStr: string) => {
    try {
      const db = getDb();
      let updatedDates = [...busyDates];
      let updatedSlots = { ...busySlots };

      if (blockScope === 'Fullday') {
        if (updatedDates.includes(dateStr)) {
          updatedDates = updatedDates.filter((d) => d !== dateStr);
        } else {
          updatedDates.push(dateStr);
        }
      } else {
        const currentForDate = updatedSlots[dateStr] || [];
        if (currentForDate.includes(blockScope)) {
          const filtered = currentForDate.filter((s) => s !== blockScope);
          if (filtered.length === 0) {
            delete updatedSlots[dateStr];
          } else {
            updatedSlots[dateStr] = filtered;
          }
        } else {
          updatedSlots[dateStr] = [...currentForDate, blockScope];
        }
      }

      await setDoc(doc(db, 'vendors', vendor.id), { 
        busyDates: updatedDates,
        busySlots: updatedSlots 
      }, { merge: true });

      setBusyDates(updatedDates);
      setBusySlots(updatedSlots);
      showNotification('Availability calendar updated!');
    } catch (err) {
      showNotification('Error updating calendar.');
    }
  };

  const handleBlockAllWeekends = async () => {
    try {
      const db = getDb();
      const updated = new Set(busyDates);
      for (let day = 1; day <= daysInMonth; day++) {
        const dObj = new Date(year, month, day);
        const dayOfWeek = dObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          updated.add(formatDateStr(day));
        }
      }
      const newDates = Array.from(updated);
      await setDoc(doc(db, 'vendors', vendor.id), { busyDates: newDates }, { merge: true });
      setBusyDates(newDates);
      showNotification('All weekends blocked for this month.');
    } catch (e) {
      showNotification('Error blocking weekends.');
    }
  };

  const handleClearMonth = async () => {
    try {
      const db = getDb();
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      const newDates = busyDates.filter((d) => !d.startsWith(prefix));
      const newSlots = { ...busySlots };
      Object.keys(newSlots).forEach((k) => {
        if (k.startsWith(prefix)) delete newSlots[k];
      });
      await setDoc(doc(db, 'vendors', vendor.id), { busyDates: newDates, busySlots: newSlots }, { merge: true });
      setBusyDates(newDates);
      setBusySlots(newSlots);
      showNotification('Month unblocked successfully.');
    } catch (e) {
      showNotification('Error clearing month.');
    }
  };

  const handleAddService = async () => {
    if (!newServiceName || !newServicePrice) {
      showNotification('Please enter service name and price.');
      return;
    }
    
    try {
      const db = getDb();
      const newService = {
        id: Date.now().toString(),
        name: newServiceName,
        price: newServicePrice,
        image: newServiceImage
      };
      
      const updatedServices = [...services, newService];
      await setDoc(doc(db, 'vendors', vendor.id), { services: updatedServices }, { merge: true });
      
      setServices(updatedServices);
      setIsAddingService(false);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceImage('');
      showNotification('Service added successfully!');
    } catch (e) {
      showNotification('Error adding service.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const db = getDb();
      const updatedServices = services.filter(s => s.id !== serviceId);
      await setDoc(doc(db, 'vendors', vendor.id), { services: updatedServices }, { merge: true });
      setServices(updatedServices);
      showNotification('Service removed.');
    } catch (e) {
      showNotification('Error removing service.');
    }
  };

  const handleToggleListing = async () => {
    try {
      const db = getDb();
      const newLiveStatus = !(vendor.isLive ?? true);
      await setDoc(doc(db, 'vendors', vendor.id), { isLive: newLiveStatus }, { merge: true });
      showNotification(newLiveStatus ? 'Your listing is now LIVE on Parva!' : 'Your listing is now HIDDEN.');
    } catch (e) {
      showNotification('Error toggling listing status.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#fafafa] flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 h-[72px] flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black text-xl">
            P
          </div>
          <div>
            <h1 className="font-extrabold text-brand-primary text-lg leading-tight tracking-tight">parva partner</h1>
            <p className="text-[11px] text-gray-500 font-semibold">{vendor.name}</p>
          </div>
        </div>

        <nav className="hidden md:flex bg-gray-50/80 rounded-full border border-gray-200 p-1">
          {['Dashboard', 'Bookings', 'Services', 'Availability', 'Earnings', 'Messages'].map(tab => (
            
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Messages' && onNavigateToMessages) {
                  onNavigateToMessages();
                } else {
                  setActiveTab(tab.toLowerCase() as any);
                }
              }}

              className={`px-6 py-2 rounded-full text-xs font-bold transition ${activeTab === tab.toLowerCase() ? 'bg-white text-brand-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-primary border border-brand-primary/20 rounded-full hover:bg-brand-primary/5 transition"
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
        
        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-gray-900 font-display">Client Bookings Queue</h2>
                <p className="text-sm text-gray-500 mt-1">Manage reservations, acceptance responses, and client schedules</p>
              </div>
              <div className="flex bg-gray-50 border border-gray-200 rounded-full p-1">
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(f => (
                  <button key={f} className={`px-4 py-1.5 text-xs font-bold rounded-full ${f === 'All' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {vendorBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 py-24 flex flex-col items-center justify-center text-center shadow-sm">
                <Calendar size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-black text-gray-900">No bookings in this tab</h3>
                <p className="text-sm text-gray-500 mt-2">Client bookings matching this filter will show up here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {vendorBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{b.status || 'Pending'}</span>
                        <span className="text-xs text-gray-500 font-mono">ID: {b.id.slice(-6)}</span>
                      </div>
                      <h4 className="font-bold text-gray-900">{b.userName || 'Customer'} - {b.eventType}</h4>
                      <p className="text-xs text-gray-500 mt-1">Date: {b.date || 'TBD'} | Guests: {b.guestCount || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-primary text-lg">₹{b.totalAmount?.toLocaleString('en-IN') || 0}</p>
                      <button className="text-xs font-bold text-white bg-brand-primary px-4 py-2 rounded-full mt-2 hover:bg-brand-primary-dark">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-2xl font-black text-gray-900 font-display">Calendar & Slot Availability</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Tap or click any date below to instantly block or unblock your schedule.
                </p>
              </div>

              {/* Slot Mode Selector */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                {(['Fullday', 'Morning', 'Evening'] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setBlockScope(scope)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      blockScope === scope
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {scope === 'Fullday' ? 'Full Day' : scope}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Main Container */}
            <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-5">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 font-display">
                    {monthNames[month]} {year}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date())}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                  >
                    Today
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition font-bold"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition font-bold"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Day-of-week header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-black uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-100">
                {daysOfWeek.map((d, i) => (
                  <div key={d} className={i === 0 || i === 6 ? 'text-brand-primary' : ''}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Monthly Dates Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty cells for leading offset */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[84px] bg-gray-50/50 rounded-2xl opacity-40" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = formatDateStr(dayNum);
                  const isFullBlocked = busyDates.includes(dateStr);
                  const partialBlocked = (busySlots[dateStr] || []).length > 0;
                  const hasBooking = vendorBookings.some((b) => b.date === dateStr || b.eventDate === dateStr);

                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleToggleDay(dateStr)}
                      className={`min-h-[64px] sm:min-h-[84px] p-2 rounded-2xl border text-left flex flex-col justify-between transition group relative ${
                        isFullBlocked
                          ? 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100'
                          : partialBlocked
                          ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                          : hasBooking
                          ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                          : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-black ${isToday ? 'w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center' : ''}`}>
                          {dayNum}
                        </span>
                        {isFullBlocked ? (
                          <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-1 rounded">
                            BLOCKED
                          </span>
                        ) : partialBlocked ? (
                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1 rounded">
                            {busySlots[dateStr].join(', ')}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition">
                            OPEN
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-bold">
                        {hasBooking ? (
                          <span className="text-blue-700 font-extrabold flex items-center gap-1">
                            • Booked
                          </span>
                        ) : isFullBlocked ? (
                          <span className="text-red-500 font-bold">Tap to open</span>
                        ) : (
                          <span className="text-gray-400 font-normal">Available</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend and Bulk Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white border border-gray-300" />
                    <span>Open & Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Blocked Date</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Partial Slot Blocked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Client Confirmed</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBlockAllWeekends}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition"
                  >
                    Block All Weekends
                  </button>
                  <button
                    type="button"
                    onClick={handleClearMonth}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition"
                  >
                    Unblock Month
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-gray-900 font-display">My Services & Offerings</h2>
                <p className="text-sm text-gray-500 mt-1">Add, edit, or remove services that customers can book</p>
              </div>
              <button 
                onClick={() => setIsAddingService(!isAddingService)}
                className="bg-brand-primary text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Plus size={14} /> Add New Service
              </button>
            </div>

            {isAddingService && (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4 mb-6">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Add New Service</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Service Name</label>
                    <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none" placeholder="e.g. Pre-Wedding Photoshoot" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Base Price (₹)</label>
                    <input type="text" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none" placeholder="e.g. 15000" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Service Image</label>
                  <CloudinaryImageUploader onUploadSuccess={(url) => setNewServiceImage(url)} />
                  {newServiceImage && <img src={newServiceImage} alt="Preview" className="h-20 w-32 object-cover rounded-xl mt-2" />}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddService} className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl text-xs">Save Service</button>
                  <button onClick={() => setIsAddingService(false)} className="bg-gray-100 text-gray-600 font-bold px-6 py-2 rounded-xl text-xs">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {services.map(s => (
                <div key={s.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm group">
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="font-bold text-gray-900 text-sm">{s.name}</h4>
                    <p className="text-brand-primary font-black mt-1">₹{s.price}</p>
                    <button onClick={() => handleDeleteService(s.id)} className="mt-4 flex items-center gap-1 text-[10px] font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition">
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-gray-900 font-display">Welcome, {vendor.name}!</h2>
                <p className="text-sm text-gray-500 mt-1">Here is an overview of your business on Parva.</p>
              </div>
              <button 
                onClick={handleToggleListing}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition ${vendor.isLive ?? true ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
              >
                {vendor.isLive ?? true ? <><Check size={14} /> Listing is LIVE</> : <><Clock size={14} /> Listing is HIDDEN</>}
              </button>
            </div>
            {/* Quick stats placeholder */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><p className="text-xs text-gray-500 font-bold uppercase">Total Bookings</p><h3 className="text-3xl font-black mt-2">{vendorBookings.length}</h3></div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><p className="text-xs text-gray-500 font-bold uppercase">Active Services</p><h3 className="text-3xl font-black mt-2">{services.length}</h3></div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><p className="text-xs text-gray-500 font-bold uppercase">Profile Views</p><h3 className="text-3xl font-black mt-2">1,204</h3></div>
            </div>
          </div>
        )}
        
        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black text-gray-900 font-display">Earnings Overview</h2>
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center">
              <p className="text-sm text-gray-500 font-bold uppercase mb-2">Total Revenue Generated</p>
              <h3 className="text-5xl font-black text-brand-primary">₹0</h3>
              <p className="text-xs text-gray-400 mt-4">Earnings will appear here once bookings are completed.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
