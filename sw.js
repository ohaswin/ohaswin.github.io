const CACHE_NAME = 'ohaswin-cache-v1';
const DEBUG = true;
const DEV_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.port !== '';

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/projects/index.html',
  '/blog/index.html',
  '/about/index.html',
  '/contact/index.html',
  '/assets/me.avif',
  '/assets/outp.webp',
  '/assets/cd.avif',
  '/assets/boy.avif',
  '/assets/speak.avif',
  '/preloader.js'
];

function log(msg) {
  if (DEBUG) console.log('[SW]', DEV_MODE ? '[DEV]' : '[PROD]', msg);
}

// Install - cache static resources (only if not already cached)
self.addEventListener('install', event => {
  log('Installing...');
  
  if (DEV_MODE) {
    log('Dev mode: Skipping cache installation');
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        const cachePromises = STATIC_RESOURCES.map(async url => {
          const cached = await cache.match(url);
          if (cached) {
            log(`Already cached: ${url}`);
            return Promise.resolve();
          }
          return cache.add(url).catch(err => 
            log(`Failed to cache ${url}: ${err.message}`)
          );
        });
        
        return Promise.allSettled(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('Install failed:', err))
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  log('Activating...');
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== CACHE_NAME)
             .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch - serve from cache first for instant loading
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // In dev mode, always fetch from network
  if (DEV_MODE) {
    log('Dev mode: Bypassing cache for ' + event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  const url = new URL(event.request.url);
  const isAsset = url.pathname.startsWith('/assets/');
  const isHTML = event.request.headers.get('Accept').includes('text/html');

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          log('✓ From cache: ' + event.request.url);
          
          const cacheDate = cachedResponse.headers.get('date');
          const staleTime = isAsset ? 24 * 60 * 60 * 1000 : 3 * 60 * 60 * 1000;
          const isStale = !cacheDate || 
            (Date.now() - new Date(cacheDate).getTime()) > staleTime;

          if (isStale && isHTML) {
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                  log('↻ Updated stale cache: ' + event.request.url);
                }
              })
              .catch(() => {});
          }
          
          return cachedResponse;
        }
        
        log('→ From network: ' + event.request.url);
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
            log('✓ Cached: ' + event.request.url);
          }
          return networkResponse;
        });
      });
    }).catch(() => {
      if (isHTML) {
        return caches.match('/index.html');
      }
      return fetch(event.request);
    })
  );
});

