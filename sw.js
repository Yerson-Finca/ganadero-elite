var CACHE_NAME = 'ganadero-elite-v5';
self.addEventListener('install', function(e) {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME));
});
self.addEventListener('activate', function(e) {
    e.waitUntil(caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) {
            if (k !== CACHE_NAME) return caches.delete(k);
        }));
    }).then(function() { return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e) {
    e.respondWith(caches.match(e.request).then(function(r) {
        return r || fetch(e.request).then(function(nr) {
            if (nr && nr.status === 200) {
                var rc = nr.clone();
                caches.open(CACHE_NAME).then(function(c) { c.put(e.request, rc); });
            }
            return nr;
        });
    }));
});
