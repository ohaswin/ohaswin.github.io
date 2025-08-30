// Ultra-simple preloader - just cache in background, use normal navigation
(function() {
  'use strict';

  // Register service worker
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('[Preloader] SW registered'))
        .catch(() => console.log('[Preloader] SW failed'));
    }
  }

  // Preload a page in background (just for caching)
  function preloadPage(url) {
    if (!url || url.startsWith('http') || url.includes('#')) return;
    
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

    // Preload main pages after 2 seconds
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