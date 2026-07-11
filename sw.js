// Service Worker — Offline-Cache für die Anfragen-App
const CACHE = 'anfragen-v18';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './icons/icon.svg',
  './js/helpers.js',
  './js/i18n.js',
  './js/countries.js',
  './js/products.js',
  './js/container.js',
  './js/inquiry-form.js',
  './js/inquiry-crud.js',
  './js/roles.js',
  './js/handoff.js',
  './js/inquiry-list.js',
  './js/pallet-view.js',
  './js/article-catalog.js',
  './js/proforma.js',
  './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first mit Cache-Fallback: online immer frische Dateien,
// offline aus dem Cache — verhindert Stale-Cache nach Updates.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
