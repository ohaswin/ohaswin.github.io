// Ultra-simple preloader - just cache in background, use normal navigation
(function() {
  'use strict';

  // Track what we've already preloaded to avoid duplicates
  const preloadedUrls = new Set();

  // Register service worker
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('[Preloader] SW registered'))
        .catch(() => console.log('[Preloader] SW failed'));
    }
  }

  // Check if URL is already cached
  async function isUrlCached(url) {
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
    
    // Skip if already preloaded in this session
    if (preloadedUrls.has(url)) {
      console.log('[Preloader] Already preloaded:', url);
      return;
    }

    // Check if already cached
    const isCached = await isUrlCached(url);
    if (isCached) {
      console.log('[Preloader] Already cached:', url);
      preloadedUrls.add(url); // Mark as handled
      return;
    }

    // Mark as being preloaded
    preloadedUrls.add(url);
    
    // Simple fetch to trigger service worker caching
    fetch(url, { method: 'GET' })
      .then(response => {
        if (response.ok) {
          console.log('[Preloader] Cached:', url);
        }
      })
      .catch(() => {}); // Silent fail
  }

  // Preload on hover (debounced)
  let hoverTimeout;
  function handleHover(e) {
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
    // Only add hover preloading
    document.addEventListener('mouseover', handleHover);

    // Preload main pages after 2 seconds (only if not cached)
    setTimeout(() => {
      ['/projects/index.html', '/blog/index.html', '/about/index.html', '/contact/index.html'].forEach(preloadPage);
    }, 2000);
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