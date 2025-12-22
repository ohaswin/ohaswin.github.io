// Ultra-simple preloader - just cache in background, use normal navigation
(function() {
  'use strict';

  // Improved DEV detection
  const DEV_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

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
    if (DEV_MODE) return false;
    if ('caches' in window) {
      try {
        const cache = await caches.open('ohaswin-cache-v3');
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
    if (!url || url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('#')) return;
    if (DEV_MODE) {
      log(`Dev mode: Skipping preload of ${url}`);
      return;
    }
    if (preloadedUrls.has(url)) {
      log('Already preloaded:', url);
      return;
    }
    const isCached = await isUrlCached(url);
    if (isCached) {
      log('Already cached:', url);
      preloadedUrls.add(url);
      return;
    }
    preloadedUrls.add(url);
    fetch(url, { method: 'GET' })
      .then(response => {
        if (response.ok) log('Cached:', url);
      })
      .catch(() => {});
  }

  // Preload on hover/touch (debounced)
  let hoverTimeout;
  function handlePreload(e) {
    if (DEV_MODE) return;
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => preloadPage(href), 100);
  }

  // Initialize
  function init() {
    if (DEV_MODE) log('Development mode detected - caching and preloading disabled');
    document.addEventListener('mouseover', handlePreload);
    document.addEventListener('touchstart', handlePreload, { passive: true });
    if (!DEV_MODE) {
      setTimeout(() => {
        [
          '/index.html',
          '/projects/index.html',
          '/blog/index.html',
          '/about/index.html',
          '/contact/index.html'
        ].forEach(preloadPage);
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