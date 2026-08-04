// Tombstone service worker.
//
// A Workbox service worker used to live here. It precached index.html and
// registered a NavigationRoute bound to it, so every returning visitor was
// served a 2024-era snapshot of the site forever: the file never changed, so
// the browser never saw an update worth applying.
//
// This replacement exists only to evict that one. It must stay deployed at this
// URL long enough for old clients to check in, so do not delete it.
// It takes control, drops every cache, unregisters itself, then reloads.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) client.navigate(client.url);
    })()
  );
});
