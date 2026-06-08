const CACHE = 'ascend-v3';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/data.js',
  './js/engine.js',
  './js/app.js',
  './js/pages/dashboard.js',
  './js/pages/quests.js',
  './js/pages/skills.js',
  './js/pages/academics.js',
  './js/pages/achievements.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
