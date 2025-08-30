const CACHE_NAME = 'ohaswin-cache-v1';
const DEBUG = true;

// Cache essential static resources
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/projects.html',
  '/blog.html',
  '/about.html',
  '/contact.html',
  '/assets/me.jpeg',
  '/assets/outp.webp',
  '/preloader.js'
];

function log(msg) {
  if (DEBUG) console.log('[SW]', msg);
}

// Install - cache static resources
self.addEventListener('install', event => {
  log('Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Try to cache all resources, but don't fail if some are missing
        return Promise.allSettled(
          STATIC_RESOURCES.map(url => 
            cache.add(url).catch(err => log(`Failed to cache ${url}: ${err.message}`))
          )
        );
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
  // Only handle GET requests from same origin
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          log('✓ From cache: ' + event.request.url);
          
          // Return cached version immediately
          // Update cache in background
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
                log('↻ Updated cache: ' + event.request.url);
              }
            })
            .catch(() => {}); // Silent fail for background updates
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        log('→ From network: ' + event.request.url);
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            // Cache successful responses
            cache.put(event.request, networkResponse.clone());
            log('✓ Cached: ' + event.request.url);
          }
          return networkResponse;
        });
      });
    }).catch(() => {
      // Final fallback
      if (event.request.headers.get('Accept').includes('text/html')) {
        return caches.match('/index.html');
      }
      return fetch(event.request);
    })
  );
});

