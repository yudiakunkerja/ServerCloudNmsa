importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCKhjsqoJ3mIZYYY5-0NG2c5fEqdixyvp4",
  authDomain: "projectforworl-server.firebaseapp.com",
  projectId: "projectforworl-server",
  storageBucket: "projectforworl-server.firebasestorage.app",
  messagingSenderId: "102453515282",
  appId: "1:102453515282:web:030b8dbc19c4a5153eb4cb",
  measurementId: "G-WZQG1YLC6K"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'RemindMe Pro';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    tag: 'remindme-notification',
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.notification?.title || data.data?.title || 'RemindMe Pro';
    const options = {
      body: data.notification?.body || data.data?.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: 'remindme-notification'
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Keep service worker alive — handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'remindme-sync') {
    event.waitUntil(Promise.resolve());
  }
});
