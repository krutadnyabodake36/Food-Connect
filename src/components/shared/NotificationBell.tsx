import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Package, CheckCircle2, UserCheck, UserX, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { onToastNotifications, markNotificationRead, clearNotifications, requestNotificationPermission, NotificationType } from '../../lib/notifications';

const ICONS: Record<NotificationType, React.ReactNode> = {
  new_donation: <Package size={18} className="text-forest-500" />,
  pickup_requested: <UserCheck size={18} className="text-blue-500" />,
  request_accepted: <CheckCircle2 size={18} className="text-emerald-500" />,
  request_rejected: <UserX size={18} className="text-red-500" />,
  pickup_completed: <Megaphone size={18} className="text-amber-500" />,
};

const COLORS: Record<NotificationType, string> = {
  new_donation: 'bg-forest-50 dark:bg-forest-900/20 border-forest-100 dark:border-forest-800',
  pickup_requested: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
  request_accepted: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
  request_rejected: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
  pickup_completed: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
};

type Toast = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
};

const NotificationBell: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = toasts.filter(t => !t.read).length;

  useEffect(() => {
    const unsub = onToastNotifications(setToasts);
    return unsub;
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    // Request permission on first click
    if (!hasAskedPermission && Notification.permission === 'default') {
      setHasAskedPermission(true);
      await requestNotificationPermission();
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <Bell size={20} className="text-stone-600 dark:text-stone-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl shadow-stone-900/10 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100">Notifications</h3>
                {unreadCount > 0 && <p className="text-xs text-stone-500 dark:text-stone-400">{unreadCount} unread</p>}
              </div>
              {toasts.length > 0 && (
                <button
                  onClick={() => clearNotifications()}
                  className="text-xs text-stone-500 hover:text-red-500 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {toasts.length === 0 ? (
                <div className="py-12 text-center text-stone-400 dark:text-stone-500">
                  <Bell size={28} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1">You'll see activity updates here</p>
                </div>
              ) : (
                toasts.map(toast => (
                  <button
                    key={toast.id}
                    onClick={() => markNotificationRead(toast.id)}
                    className={`w-full text-left px-5 py-3.5 border-b border-stone-50 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors flex items-start gap-3 ${
                      !toast.read ? 'bg-stone-50/50 dark:bg-stone-800/30' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${COLORS[toast.type]}`}>
                      {ICONS[toast.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!toast.read ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                          {toast.title}
                        </p>
                        {!toast.read && <span className="w-2 h-2 rounded-full bg-forest-500 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">{toast.body}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">{formatTime(toast.timestamp)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
