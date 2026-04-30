import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import { markNotificationRead, onToastNotifications } from '../../lib/notifications';

type ToastItem = {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: string;
};

const iconForType = (type: string) => {
  if (type.includes('accepted') || type.includes('completed')) {
    return <CheckCircle2 size={18} className="text-forest-600" />;
  }
  if (type.includes('rejected') || type.includes('error')) {
    return <AlertCircle size={18} className="text-red-500" />;
  }
  return <Bell size={18} className="text-amber-500" />;
};

const ToastViewport: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsub = onToastNotifications((items) => {
      setToasts(items.filter((item) => !item.read).slice(0, 4) as ToastItem[]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        markNotificationRead(toast.id);
      }, 4500)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts]);

  const visible = useMemo(() => toasts.slice(0, 3), [toasts]);

  return (
    <div className="fixed top-4 right-4 z-50 w-[min(92vw,420px)] pointer-events-none">
      <AnimatePresence>
        {visible.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="mb-2.5 pointer-events-auto rounded-2xl border border-white/60 bg-white/90 dark:bg-stone-900/90 dark:border-stone-700/80 backdrop-blur-xl shadow-lg"
          >
            <div className="p-3.5 flex items-start gap-3">
              <div className="mt-0.5">{iconForType(toast.type || '')}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{toast.title}</p>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2">{toast.body}</p>
              </div>
              <button
                onClick={() => markNotificationRead(toast.id)}
                className="text-xs px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastViewport;
