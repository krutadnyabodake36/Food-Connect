// Firebase Messaging Service Worker
// This runs in the background and handles push notifications when the app is not active

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyArQA4G1uXFoLdCJC3KirNHKG40nowNmg4",
  authDomain: "food-connect-ed27b.firebaseapp.com",
  projectId: "food-connect-ed27b",
  storageBucket: "food-connect-ed27b.firebasestorage.app",
  messagingSenderId: "555206354447",
  appId: "1:555206354447:web:087a4693e59e66a58ca57a",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || 'FoodConnect';
  const options = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.type || 'general',
    data: payload.data,
    actions: [{ action: 'open', title: 'Open App' }],
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
