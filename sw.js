var CACHE_NAME = 'ganadero-elite-v8';
var urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2'
];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache).catch(function(err) {
                console.log('Cache parcial:', err);
            });
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(keys.map(function(k) {
                if (k !== CACHE_NAME) return caches.delete(k);
            }));
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(e) {
    // NO interceptar peticiones que no sean GET
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(function(cached) {
            // Si está en caché, devolverlo SIEMPRE
            if (cached) {
                return cached;
            }
            
            // Si no está en caché, ir a la red
            return fetch(e.request).then(function(response) {
                // Guardar en caché para la próxima
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                // Si no hay red y no está en caché
                // Para páginas HTML, devolver index.html
                if (e.request.headers.get('accept') && 
                    e.request.headers.get('accept').indexOf('text/html') !== -1) {
                    return caches.match('./index.html');
                }
                // Para otros recursos, devolver error silencioso
                return new Response('', {status: 200});
            });
        })
    );
});
