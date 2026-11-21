// ohaswin. — preloader
// Registers the SW and prefetches pages on hover/touch. That's it.
(function () {
  'use strict';

  const DEV_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  function log(msg) {
    if (DEV_MODE) console.log('[Preloader]', msg);
  }

  // ── Service Worker registration ─────────────────────────────────────────────
  function initServiceWorker() {
    if (DEV_MODE) { log('Dev mode: skipping SW registration'); return; }
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js')
      .then(() => log('SW registered'))
      .catch(e => log('SW failed: ' + e));
  }

  // ── Hover/touch prefetch (intent-based, keeps page cache warm) ──────────────
  const prefetched = new Set();
  let hoverTimeout;

  function prefetchPage(url) {
    if (!url || prefetched.has(url)) return;
    if (url.startsWith('http') || url.startsWith('mailto:') || url.startsWith('#')) return;
    prefetched.add(url);
    fetch(url, { method: 'GET' }).catch(() => {});
    log('Prefetched: ' + url);
  }

  function handleHover(e) {
    if (DEV_MODE) return;
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => prefetchPage(href), 100);
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    document.addEventListener('mouseover', handleHover);
    document.addEventListener('touchstart', handleHover, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initServiceWorker(); init(); });
  } else {
    initServiceWorker();
    init();
  }
})();
