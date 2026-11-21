// ohaswin. — service worker
// Strategy: cache-first for the shell, network-first for pages, never cache content data.

const SHELL_CACHE = 'shell-v1';
const PAGE_CACHE  = 'pages-v1';

// Everything that IS the shell — versioned, long-lived, cache-first.
const SHELL_ASSETS = [
  '/style.css',
  '/script.js',
  '/preloader.js',
  '/assets/me.avif',
  '/assets/outp.webp',
  '/assets/cd.avif',
  '/assets/boy.avif',
  '/assets/speak.avif',
  '/assets/vine.avif',
  '/assets/offline.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/offline.html',
];

// Never cache these — always hit the network.
const NEVER_CACHE = [
  '/blog.json',
];

// ─── Install: pre-cache the shell ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: evict old caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== PAGE_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Cross-origin requests (GitHub API, fonts, etc.) — always pass through.
  if (url.origin !== self.location.origin) return;

  // 2. Content data files — network only, no cache.
  if (NEVER_CACHE.some(p => url.pathname === p || url.pathname.startsWith(p))) {
    return; // fall through to browser
  }

  // 3. Shell assets — cache-first (they're versioned by SHELL_CACHE name).
  if (isShellAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // 4. Navigation (HTML pages) — network-first, 3s timeout, then cache.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 5. Everything else — network only.
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isShellAsset(pathname) {
  return SHELL_ASSETS.some(a => a === pathname);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstWithFallback(request) {
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(PAGE_CACHE).then(cache => cache.put(request, response.clone()));
    }
    return response;
  });

  // Race: network vs 3-second timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 3000)
  );

  try {
    return await Promise.race([networkPromise, timeoutPromise]);
  } catch {
    // Try page cache first, then shell home, then offline page.
    const cached = await caches.match(request, { cacheName: PAGE_CACHE });
    if (cached) return cached;

    const home = await caches.match('/index.html', { cacheName: PAGE_CACHE });
    if (home) return home;

    return caches.match('/offline.html', { cacheName: SHELL_CACHE });
  }
}
