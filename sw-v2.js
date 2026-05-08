var CACHE_NAME = 'ganadero-v12';
var urls = ['./','./index.html','./styles.css','./app.js','./manifest.json'];

self.addEventListener('install', function(e) {
    e.waitUntil(caches.open(CACHE_NAME).then(function(c) {
        return c.addAll(urls);
    }).then(function() {
        return self.skipWaiting();
    }));
});

self.addEventListener('activate', function(e) {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(r) {
            return r || fetch(e.request).catch(function() {
                return caches.match('./index.html');
            });
        })
    );
});
