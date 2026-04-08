// ================================
// Expense Tracker — Service Worker
// FIXES:
// [1] Relative paths './file' instead of '/file'
//     → '/file' = root of domain (breaks on GitHub Pages subfolders & locally)
//     → './file' = relative to sw.js location (works everywhere)
// [2] Added offline fallback page properly
// ================================

const CACHE_NAME = 'expense-tracker-v6';

// FIX [1]: Use relative paths — works on localhost AND GitHub Pages
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './MobileIcon.png',
  './desktopIcon.png',
];

// Install — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — cache first, then network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
