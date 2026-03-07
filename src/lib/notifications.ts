import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import app from './firebase';

// FCM notification types
export type NotificationType =
  | 'new_donation'        // New donation posted (for volunteers)
  | 'pickup_requested'    // Volunteer requested pickup (for hotels)
  | 'request_accepted'    // Hotel accepted request (for volunteers)
  | 'request_rejected'    // Hotel rejected request (for volunteers)
  | 'pickup_completed';   // Pickup completed (for both)

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  donationId?: string;
}

let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn('Firebase Messaging not supported in this environment:', err);
}

// ── Permission & Token ──

export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied.');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: undefined, // Using the default Firebase VAPID key
    });

    if (token) {
      console.log('FCM Token:', token.substring(0, 20) + '...');
      // In production, you'd send this token to your backend
      localStorage.setItem('fcm_token', token);
      return token;
    }
    return null;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
}

// ── Foreground message listener ──

type MessageCallback = (payload: NotificationPayload) => void;
const listeners: MessageCallback[] = [];

export function onNotification(callback: MessageCallback): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

// Set up foreground message handler
if (messaging) {
  onMessage(messaging, (payload: MessagePayload) => {
    console.log('[FCM] Foreground message:', payload);

    const notification: NotificationPayload = {
      type: (payload.data?.type as NotificationType) || 'new_donation',
      title: payload.notification?.title || 'FoodConnect',
      body: payload.notification?.body || '',
      donationId: payload.data?.donationId,
    };

    // Notify all listeners
    listeners.forEach(cb => cb(notification));

    // Also show a browser notification if the app is in focus
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        tag: notification.type,
      });
    }
  });
}

// ── Local notifications (in-app toast system) ──
// These are used when we can't send a real FCM push (no backend),
// but still want to show notifications within the app.

type ToastNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
};

let toasts: ToastNotification[] = [];
const toastListeners: ((toasts: ToastNotification[]) => void)[] = [];

function notifyToastListeners() {
  toastListeners.forEach(cb => cb([...toasts]));
}

export function onToastNotifications(callback: (toasts: ToastNotification[]) => void): () => void {
  toastListeners.push(callback);
  callback([...toasts]); // Initial state
  return () => {
    const idx = toastListeners.indexOf(callback);
    if (idx > -1) toastListeners.splice(idx, 1);
  };
}

export function sendLocalNotification(type: NotificationType, title: string, body: string, donationId?: string) {
  const toast: ToastNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    title,
    body,
    timestamp: Date.now(),
    read: false,
  };

  toasts = [toast, ...toasts].slice(0, 50); // Keep last 50
  notifyToastListeners();

  // Also show browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: type,
    });
  }
}

export function markNotificationRead(id: string) {
  toasts = toasts.map(t => t.id === id ? { ...t, read: true } : t);
  notifyToastListeners();
}

export function clearNotifications() {
  toasts = [];
  notifyToastListeners();
}

export function getUnreadCount(): number {
  return toasts.filter(t => !t.read).length;
}
