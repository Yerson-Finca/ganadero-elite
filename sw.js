// GANADERO ÉLITE - Service Worker v11
var CACHE_NAME = 'ganadero-v11';

self.addEventListener('install', function(e) {
    console.log('SW: Instalando...');
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './app.js',
                './manifest.json'
            ]);
        }).then(function() {
            console.log('SW: Instalado correctamente');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(e) {
    console.log('SW: Activado');
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) {
                        console.log('SW: Eliminando caché viejo:', k);
                        return caches.delete(k);
                    })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        fetch(e.request).then(function(response) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(e.request, clone);
            });
            return response;
        }).catch(function() {
            return caches.match(e.request).then(function(cached) {
                return cached || caches.match('./index.html');
            });
        })
    );
});
