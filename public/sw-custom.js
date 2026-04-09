// public/sw-custom.js — injected alongside next-pwa generated SW
// Handles push notifications and background sync

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { title, body, hour } = event.data;
    // Store reminder schedule in SW cache
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: 'reading-reminder',
      actions: [
        { action: 'open', title: 'Open Readr' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      data: { url: '/' },
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-library') {
    event.waitUntil(syncLibraryToCloud());
  }
});

async function syncLibraryToCloud() {
  // Sync is handled by the app when back online
  // This is a placeholder for future background sync
  console.log('[SW] Background sync triggered');
}

// Periodic background sync (Chrome 80+)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-quote') {
    event.waitUntil(prefetchDailyQuote());
  }
});

async function prefetchDailyQuote() {
  try {
    const response = await fetch('https://api.quotable.io/random?tags=books|literature');
    const cache = await caches.open('quotes-api');
    const today = new Date().toISOString().split('T')[0];
    cache.put(`/api/quote-${today}`, response);
  } catch (e) {
    console.warn('[SW] Could not prefetch daily quote:', e);
  }
}
