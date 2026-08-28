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
        return 'bg-[#ff385c]/10 text-[#ff385c] border-[#ff385c]/20';
      case 'slot':
        return 'bg-green-50 text-[#008A05] border-green-200';
      case 'delivery':
        return 'bg-blue-50 text-[#0073E6] border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
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
        className="relative w-full max-w-md mx-auto bg-white rounded-t-[32px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Top Handle Bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Notifications</h2>
              <p className="text-[11px] text-gray-500">Live slot updates, offers & deliveries</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold hover:underline"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Permission Notification Banner */}
        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-primary text-white flex items-center justify-center shrink-0">
                <Volume2 size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 leading-tight">Enable Phone Pop-ups</p>
                <p className="text-[10px] text-gray-600">Get instant lock-screen slot confirmations</p>
              </div>
            </div>
            <button
              onClick={onRequestPermission}
              className="bg-brand-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-brand-primary-dark active:scale-95 transition-all shrink-0"
            >
              Enable
            </button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-gray-50">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'slot', label: 'Slot Confirmations' },
            { id: 'delivery', label: 'Delivery & Status' },
            { id: 'offer', label: 'Offers & Deals' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 divide-y divide-gray-50">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <Bell size={24} />
              </div>
              <h4 className="text-sm font-bold text-gray-700 mb-1">All Caught Up!</h4>
              <p className="text-xs text-gray-500 max-w-[220px]">
                You have no unread notifications for {activeFilter === 'all' ? 'any category' : activeFilter}.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  if (onActionClick) onActionClick(notif);
                }}
                className={`pt-2.5 pb-2 px-3 rounded-2xl transition-all cursor-pointer ${
                  notif.read ? 'bg-white hover:bg-gray-50' : 'bg-rose-50/40 hover:bg-rose-50/70 border border-rose-100/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getBadgeStyle(notif.type)}`}>
                        {notif.type === 'slot' ? 'Slot Confirmed' : notif.type === 'delivery' ? 'Live Status' : notif.type === 'offer' ? 'Special Deal' : 'System'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{notif.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 leading-snug mb-0.5">
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-gray-600 leading-normal">
                      {notif.message}
                    </p>

                    {notif.actionText && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-brand-primary">
                        <span>{notif.actionText}</span>
                        <ArrowRight size={12} />
                      </div>
                    )}
                  </div>

                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onTriggerTestNotification}
            className="flex-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Send Test Phone Pop-up</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
