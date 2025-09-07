// Ultra-simple preloader - just cache in background, use normal navigation
(function() {
  'use strict';

  // Detect development environment
  const DEV_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.port !== '';
  
  // Track what we've already preloaded to avoid duplicates
  const preloadedUrls = new Set();

  function log(msg) {
    console.log('[Preloader]', DEV_MODE ? '[DEV]' : '[PROD]', msg);
  }

  // Register service worker
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => log('SW registered'))
        .catch(() => log('SW failed'));
    }
  }

  // Check if URL is already cached
  async function isUrlCached(url) {
    if (DEV_MODE) {
      log('Dev mode: Skipping cache check');
      return false; // Always treat as not cached in dev mode
    }

    if ('caches' in window) {
      try {
        const cache = await caches.open('ohaswin-cache-v1');
        const response = await cache.match(url);
        return !!response;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // Preload a page in background (only if not already cached)
  async function preloadPage(url) {
    if (!url || url.startsWith('http') || url.includes('#')) return;
    
    if (DEV_MODE) {
      log(`Dev mode: Skipping preload of ${url}`);
      return;
    }
    
    // Skip if already preloaded in this session
    if (preloadedUrls.has(url)) {
      log('Already preloaded:', url);
      return;
    }

    // Check if already cached
    const isCached = await isUrlCached(url);
    if (isCached) {
      log('Already cached:', url);
      preloadedUrls.add(url);
      return;
    }

    // Mark as being preloaded
    preloadedUrls.add(url);
    
    // Simple fetch to trigger service worker caching
    fetch(url, { method: 'GET' })
      .then(response => {
        if (response.ok) {
          log('Cached:', url);
        }
      })
      .catch(() => {});
  }

  // Preload on hover (debounced)
  let hoverTimeout;
  function handleHover(e) {
    if (DEV_MODE) return; // Skip hover preloading in dev mode

    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
      return;
    }

    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => preloadPage(href), 100);
  }

  // Initialize
  function init() {
    if (DEV_MODE) {
      log('Development mode detected - caching and preloading disabled');
    }

    document.addEventListener('mouseover', handleHover);

    // Skip preloading in dev mode
    if (!DEV_MODE) {
      setTimeout(() => {
        ['/projects/index.html', '/blog/index.html', '/about/index.html', '/contact/index.html'].forEach(preloadPage);
      }, 2000);
    }
  }

  // Start when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initServiceWorker();
      init();
    });
  } else {
    initServiceWorker();
    init();
  }
})();