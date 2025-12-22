importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_NAME = 'ohaswin-cache-v3';
const DEV_MODE = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

if (workbox) {
  workbox.setConfig({ debug: DEV_MODE });

  // Precache static resources
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: null },
    { url: '/blog/index.html', revision: null },
    { url: '/projects/index.html', revision: null },
    { url: '/about/index.html', revision: null },
    { url: '/contact/index.html', revision: null },
    { url: '/assets/me.avif', revision: null },
    { url: '/assets/outp.webp', revision: null },
    { url: '/assets/cd.avif', revision: null },
    { url: '/assets/boy.avif', revision: null },
    { url: '/assets/speak.avif', revision: null },
  ]);

  // Stale-while-revalidate for all navigation requests (HTML)
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_NAME + '-pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // Cache-first for static assets (images, styles, scripts)
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'script',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAME + '-assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // Fallback to index.html for navigation requests when offline
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('/index.html');
    }
    return Response.error();
  });

  // Skip waiting and activate new SW immediately
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
} else {
  // Fallback: No Workbox loaded
  self.addEventListener('install', event => self.skipWaiting());
  self.addEventListener('activate', event => self.clients.claim());
}

