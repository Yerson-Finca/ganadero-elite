var CACHE_NAME = 'ganadero-elite-v3';
var urlsToCache = [
  './', './index.html', './manifest.json', './styles.css',
  './app.js', './database.js', './formulas.js', './catalogos.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(c) { return c.addAll(urlsToCache).catch(function(){}); }));
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(r) {
    return r || fetch(e.request).then(function(nr) {
      if (nr && nr.status === 200) { var rc = nr.clone(); caches.open(CACHE_NAME).then(function(c) { c.put(e.request, rc); }); }
      return nr;
    });
  }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(ks) { return Promise.all(ks.map(function(k) { if (k !== CACHE_NAME) return caches.delete(k); })); }));
});
