import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, Phone, User, CheckCheck, Clock, Sparkles } from 'lucide-react';
import { Vendor, Booking } from '../types';

interface ChatTabProps {
  vendors: Vendor[];
  bookings: Booking[];
  currentUser: any;
  onOpenLogin: () => void;
  onShowNotification: (msg: string) => void;
}

export default function ChatTab({
  vendors,
  bookings,
  currentUser,
  onOpenLogin,
  onShowNotification
}: ChatTabProps) {
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Record<string, { sender: 'user' | 'vendor'; text: string; time: string }[]>>({
    'sample': [
      { sender: 'vendor', text: 'Namaste! Thank you for inquiring with us. How can we make your celebration special?', time: '10:30 AM' }
    ]
  });

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-brand-border p-8 text-center space-y-4 my-6 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary-light text-brand-primary flex items-center justify-center mx-auto">
          <MessageSquare size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-base text-gray-900 font-display">Sign In to Chat with Vendors</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Communicate directly with verified decorators, caterers, banquet managers and photographers after booking.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLogin}
          className="bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition active:scale-95"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Active connected vendors from bookings or inquiries
  const connectedVendors = vendors.slice(0, 5);
  const activeVendor = vendors.find(v => v.id === activeVendorId) || connectedVendors[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeVendor) return;

    const vendorKey = activeVendor.id;
    const newMsg = {
      sender: 'user' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [vendorKey]: [...(prev[vendorKey] || []), newMsg]
    }));
    setInputText('');

    // Simulated vendor auto-acknowledgement
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [vendorKey]: [
          ...(prev[vendorKey] || []),
          {
            sender: 'vendor',
            text: `Namaste ${currentUser.name || 'Ji'}! Received your message. Our team is coordinating your booking details now.`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
    }, 1500);
  };

  return (
    <div className="space-y-4 my-2">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-base text-gray-900 font-display flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-primary" />
            <span>Celebration Messages</span>
          </h2>
          <p className="text-xs text-gray-500">Direct chat with your booked event partners</p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-3xl border border-brand-border shadow-xs overflow-hidden min-h-[460px]">
        {/* Vendor Conversation List */}
        <div className="border-r border-gray-100 p-3 space-y-2 overflow-y-auto max-h-[480px]">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 block">
            Active Partners ({connectedVendors.length})
          </span>
          {connectedVendors.map((vendor) => {
            const isSelected = activeVendor?.id === vendor.id;
            return (
              <button
                key={vendor.id}
                type="button"
                onClick={() => setActiveVendorId(vendor.id)}
                className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition ${
                  isSelected ? 'bg-brand-primary-light border border-brand-border' : 'hover:bg-gray-50'
                }`}
              >
                <img
                  src={vendor.images?.[0] || 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=150'}
                  alt={vendor.name}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900 truncate block">{vendor.name}</span>
                    <span className="text-[9px] text-gray-400 font-medium">Active</span>
                  </div>
                  <span className="text-[10px] text-brand-primary font-semibold truncate block">
                    {vendor.category}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Conversation Thread */}
        <div className="md:col-span-2 flex flex-col justify-between p-4 bg-gray-50/50">
          {/* Thread Header */}
          {activeVendor && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 bg-white p-3 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3">
                <img
                  src={activeVendor.images?.[0] || 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=150'}
                  alt={activeVendor.name}
                  className="w-9 h-9 rounded-xl object-cover border border-gray-200 shrink-0"
                />
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900">{activeVendor.name}</h4>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Online & Verified</span>
                  </span>
                </div>
              </div>

              {activeVendor.phone && (
                <a
                  href={`tel:${activeVendor.phone}`}
                  className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:text-brand-primary hover:bg-brand-primary-light transition"
                  title="Direct Phone Call"
                >
                  <Phone size={15} />
                </a>
              )}
            </div>
          )}

          {/* Messages Bubble Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1 min-h-[260px]">
            <div className="text-center">
              <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-3 py-1 rounded-full uppercase">
                End-to-End Encrypted Celebration Chat
              </span>
            </div>

            {(messages[activeVendor?.id || 'sample'] || messages['sample']).map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-primary text-white rounded-br-xs'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-400 font-medium px-1 mt-0.5 flex items-center gap-1">
                  <span>{msg.time}</span>
                  {msg.sender === 'user' && <CheckCheck size={11} className="text-brand-primary" />}
                </span>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Message ${activeVendor?.name || 'vendor'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs outline-none focus:border-brand-primary shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white p-2.5 rounded-2xl shadow-xs transition active:scale-95 disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
