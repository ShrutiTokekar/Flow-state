import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface Notification {
  id: number;
  message: string;
  type: 'REMINDER' | 'DEADLINE' | 'SYNC' | 'INFO';
  isRead: boolean;
  createdAt: string;
  task?: { id: number; title: string };
}

const typeStyles: Record<string, string> = {
  DEADLINE: 'border-l-4 border-red-400 bg-red-50',
  REMINDER: 'border-l-4 border-orange-400 bg-orange-50',
  INFO:     'border-l-4 border-flow-purple bg-purple-50',
  SYNC:     'border-l-4 border-blue-400 bg-blue-50',
};

const typeIcon: Record<string, string> = {
  DEADLINE: '⚠️',
  REMINDER: '⏰',
  INFO:     '✅',
  SYNC:     '🔄',
};

export const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.isRead).length);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds so new notifications appear automatically
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id);
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n.id !== id);
      });
    } catch (e) { console.error(e); }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-flow-purple text-white">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-bold font-heading">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-white text-flow-purple text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadNotifications} title="Refresh" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} title="Mark all read" className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-flow-purple border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="h-10 w-10 mb-2 opacity-30" />
            <p className="font-medium text-sm">You're all caught up! 🎉</p>
            <p className="text-xs mt-1">No notifications right now</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 flex gap-3 items-start transition-colors ${
                  n.isRead ? 'opacity-60' : 'bg-white'
                } ${typeStyles[n.type] || typeStyles.INFO}`}
              >
                <span className="text-base mt-0.5 shrink-0">{typeIcon[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark read"
                      className="p-1 text-gray-400 hover:text-flow-purple hover:bg-flow-lavender rounded-lg transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    title="Delete"
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={markAllRead}
            className="text-xs text-flow-purple hover:text-purple-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;