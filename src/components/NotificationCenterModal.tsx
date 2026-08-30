import React, { useState } from 'react';
import { Bell, X, Tag, CalendarCheck, Truck, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export interface AppNotification {
  id: string;
  type: 'offer' | 'slot' | 'delivery' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionText?: string;
  actionPayload?: any;
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onActionClick?: (notification: AppNotification) => void;
  onTriggerTestNotification: () => void;
  permissionStatus: NotificationPermission | 'unsupported';
  onRequestPermission: () => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  onActionClick,
  onTriggerTestNotification,
  permissionStatus,
  onRequestPermission
}: NotificationCenterModalProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'offer' | 'slot' | 'delivery'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'offer':
        return <Tag size={18} className="text-[#ff385c]" />;
      case 'slot':
        return <CalendarCheck size={18} className="text-[#008A05]" />;
      case 'delivery':
        return <Truck size={18} className="text-[#0073E6]" />;
      default:
        return <Sparkles size={18} className="text-amber-500" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'offer':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'slot':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'delivery':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getNotificationCardStyle = (notif: AppNotification) => {
    if (notif.type === 'slot') {
      return notif.read 
        ? 'bg-white hover:bg-emerald-50/30 border border-gray-100' 
        : 'bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80';
    }
    if (notif.type === 'delivery') {
      return notif.read 
        ? 'bg-white hover:bg-sky-50/30 border border-gray-100' 
        : 'bg-sky-50/50 hover:bg-sky-50 border border-sky-200/80';
    }
    if (notif.type === 'offer') {
      return notif.read 
        ? 'bg-white hover:bg-amber-50/30 border border-gray-100' 
        : 'bg-amber-50/50 hover:bg-amber-50 border border-amber-200/80';
    }
    return notif.read ? 'bg-white hover:bg-gray-50 border border-gray-100' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md mx-auto bg-white rounded-t-[32px] max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800">
              <Bell size={15} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 leading-tight">Notifications</h2>
              <p className="text-[10px] text-gray-500">Live booking updates and status</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-gray-500 hover:text-gray-900 font-semibold hover:underline"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar border-b border-gray-50">
          {[
            { id: 'all', label: 'All' },
            { id: 'slot', label: 'Bookings' },
            { id: 'delivery', label: 'Status' },
            { id: 'offer', label: 'Offers' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
                <Bell size={20} />
              </div>
              <h4 className="text-xs font-bold text-gray-700 mb-0.5">No notifications</h4>
              <p className="text-[11px] text-gray-400">
                You're all caught up!
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const cleanTitle = (notif.title || '').replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
              const cleanMsg = (notif.message || '').replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    if (onActionClick) onActionClick(notif);
                  }}
                  className={`p-3 rounded-2xl transition-all cursor-pointer ${getNotificationCardStyle(notif)}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(notif.type)}`}>
                          {notif.type === 'slot' ? 'Booking Confirmed' : notif.type === 'delivery' ? 'Status' : notif.type === 'offer' ? 'Special Deal' : 'System'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">{notif.timestamp}</span>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900 leading-snug mb-0.5">
                        {cleanTitle}
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-normal">
                        {cleanMsg}
                      </p>

                      {notif.actionText && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-brand-primary">
                          <span>{notif.actionText}</span>
                          <ArrowRight size={11} />
                        </div>
                      )}
                    </div>

                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

