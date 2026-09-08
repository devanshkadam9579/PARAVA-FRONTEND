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

  const handleBlockDate = async () => {
    if (!blockDate) return;
    try {
      const db = getDb();
      let updatedDates = [...busyDates];
      let updatedSlots = { ...busySlots };

      if (blockScope === 'Fullday') {
        if (!updatedDates.includes(blockDate)) updatedDates.push(blockDate);
      } else {
        if (!updatedSlots[blockDate]) updatedSlots[blockDate] = [];
        if (!updatedSlots[blockDate].includes(blockScope)) updatedSlots[blockDate].push(blockScope);
      }

      await setDoc(doc(db, 'vendors', vendor.id), { 
        busyDates: updatedDates,
        busySlots: updatedSlots 
      }, { merge: true });

      setBusyDates(updatedDates);
      setBusySlots(updatedSlots);
      showNotification('Date blocked successfully.');
      setBlockDate('');
    } catch (err) {
      showNotification('Error blocking date.');
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
            <div>
              <h2 className="text-2xl font-black text-gray-900 font-display">Calendar & Slot Availability</h2>
              <p className="text-sm text-gray-500 mt-1">Block personal dates, busy slots, and manage operating windows</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-2">Pick Date to Manage</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-2">Choose Block Scope</label>
                  <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                    {['Fullday', 'Morning', 'Evening'].map(scope => (
                      <button 
                        key={scope}
                        onClick={() => setBlockScope(scope as any)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${blockScope === scope ? 'bg-[#982B55] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleBlockDate}
                  className="w-full bg-[#E50000] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition"
                >
                  <Clock size={16} /> Block Selected Date/Slot
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 mb-2">Currently Blocked Dates ({busyDates.length})</h3>
                {busyDates.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-4">All dates are currently open for customer reservations.</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {busyDates.map(d => (
                      <div key={d} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                        <span className="text-xs font-bold text-gray-700">{d}</span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded uppercase font-bold">Full Day</span>
                      </div>
                    ))}
                  </div>
                )}
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
