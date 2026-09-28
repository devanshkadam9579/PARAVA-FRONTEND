import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Search, Filter, ShieldCheck, User, Store, 
  Clock, Download, RefreshCw, Phone, Mail, Calendar, Eye
} from 'lucide-react';
import { getDb } from '../../lib/firebase';
import { Vendor, Booking } from '../../types';

export interface AdminChatLogsViewerProps {
  vendors: Vendor[];
  bookings: Booking[];
}

export function AdminChatLogsViewer({ vendors, bookings }: AdminChatLogsViewerProps) {
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [selectedThreadVendor, setSelectedThreadVendor] = useState<string | null>(null);

  // Real-time Firestore Listener for all system chats
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const fetchChats = async () => {
      try {
        setLoading(true);
        const db = getDb();
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
        const q = query(collection(db, 'chats'), orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const logs: any[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            let timeStr = 'Just now';
            if (data.createdAt?.toDate) {
              timeStr = data.createdAt.toDate().toLocaleString('en-IN');
            } else if (data.createdAt instanceof Date) {
              timeStr = data.createdAt.toLocaleString('en-IN');
            } else if (typeof data.createdAt === 'string') {
              try {
                timeStr = new Date(data.createdAt).toLocaleString('en-IN');
              } catch (e) {}
            }

            logs.push({
              id: doc.id,
              ...data,
              formattedTime: timeStr
            });
          });
          setChatLogs(logs);
          setLoading(false);
        }, (err) => {
          console.warn('Admin chat logs sync warning:', err);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error fetching admin chats:', err);
        setLoading(false);
      }
    };

    fetchChats();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter logs
  const filteredLogs = chatLogs.filter((log) => {
    const v = vendors.find(item => item.id === log.vendorId);
    const vendorName = log.vendorName || v?.name || log.vendorId || '';
    const sender = log.senderName || log.sender || '';
    const text = log.text || '';
    const bookingId = log.bookingId || '';

    const matchesSearch = 
      vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookingId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVendor = selectedVendorId === 'all' || log.vendorId === selectedVendorId;

    return matchesSearch && matchesVendor;
  });

  // Group by Vendor for the thread selector
  const vendorGroupCounts: Record<string, number> = {};
  chatLogs.forEach((log) => {
    const vId = log.vendorId || 'unassigned';
    vendorGroupCounts[vId] = (vendorGroupCounts[vId] || 0) + 1;
  });

  const exportChatLogs = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", jsonStr);
    dlAnchorElem.setAttribute("download", `parva_chat_audit_logs_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-6 space-y-6 text-xs font-sans shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 font-display flex items-center gap-2">
              <span>Admin Live Chat Logs & Communications Hub</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase">
                {chatLogs.length} Total Messages
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Monitor customer demands, vendor coordination, and verified booking communications in real time
            </p>
          </div>
        </div>

        <button
          onClick={exportChatLogs}
          disabled={filteredLogs.length === 0}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Download size={14} />
          <span>Export JSON Audit</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor name, customer name, message text or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-brand-primary focus:bg-white transition"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-brand-primary"
          >
            <option value="all">All Vendors ({chatLogs.length} msgs)</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({vendorGroupCounts[v.id] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Table & Feed */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <RefreshCw size={24} className="animate-spin mx-auto text-brand-primary" />
            <p className="text-xs font-bold">Syncing live messages from Firestore...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <MessageSquare size={32} className="mx-auto text-gray-300" />
            <p className="text-xs font-bold text-gray-500">No chat messages found for this filter.</p>
            <p className="text-[11px] text-gray-400">
              When customers message confirmed vendors, all transcripts will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Vendor Partner</th>
                  <th className="p-3.5">Sender & Role</th>
                  <th className="p-3.5">Message Content</th>
                  <th className="p-3.5">Booking / Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredLogs.map((log) => {
                  const v = vendors.find(item => item.id === log.vendorId);
                  const isUser = log.sender === 'user' || log.sender === 'customer';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/70 transition">
                      <td className="p-3.5 text-[11px] text-gray-500 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-gray-400" />
                          <span>{log.formattedTime}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-[10px]">
                            🏛️
                          </span>
                          <span className="truncate max-w-[140px]">{log.vendorName || v?.name || log.vendorId}</span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            isUser ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isUser ? 'Customer' : 'Vendor'}
                          </span>
                          <span className="font-bold text-gray-800 text-xs">
                            {log.senderName || log.userName || (isUser ? 'Customer' : 'Vendor')}
                          </span>
                        </div>
                        {log.userPhone && (
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            📞 {log.userPhone}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-xs text-gray-800 max-w-md">
                        <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-200/70 text-xs font-normal leading-relaxed whitespace-pre-line">
                          {log.text}
                        </div>
                      </td>

                      <td className="p-3.5 text-[11px] font-mono text-gray-500 whitespace-nowrap">
                        {log.bookingId ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {log.bookingId}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Direct Channel</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
