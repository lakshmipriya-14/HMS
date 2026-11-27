import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { LoadingState } from '../../components/LoadingState';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Megaphone,
  CheckCheck,
  Search,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.notifications.getNotifications();
      if (res.data) setNotifications(res.data);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSuccessMessage('All notifications marked as read.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to mark all read:', err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (!search) return true;
    const t = (n.title || '').toLowerCase();
    const m = (n.message || '').toLowerCase();
    return t.includes(search.toLowerCase()) || m.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#00897B]" />
            Department Notices & Operational Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hospital administration announcements, emergency broadcasts, and department operational notifications.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <CheckCheck className="w-4 h-4 text-[#00897B]" />
          Mark All as Read
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-[#16A34A] text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-[#DC2626] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter notifications by keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00897B] transition"
        />
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingState message="Loading department alerts..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No Notifications</p>
          <p className="text-xs text-slate-400 mt-1">You are all caught up! No unread notices.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 transition flex items-start gap-3.5 ${
                item.isRead ? 'bg-white hover:bg-slate-50/50' : 'bg-[#E0F2F1]/30 hover:bg-[#E0F2F1]/50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  item.isRead ? 'bg-slate-100 text-slate-400' : 'bg-[#E0F2F1] text-[#00897B] font-bold'
                }`}
              >
                <Megaphone className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold ${item.isRead ? 'text-slate-700' : 'text-slate-900 font-black'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.message}</p>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  title="Mark as read"
                  className="px-2.5 py-1 text-[11px] font-bold text-[#00897B] bg-[#E0F2F1] hover:bg-[#E0F2F1] rounded-lg transition shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
