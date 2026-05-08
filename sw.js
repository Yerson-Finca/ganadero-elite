// Service Worker para GANADERO ÉLITE - Offline completo con CORS
var CACHE_NAME = 'ganadero-elite-v7';

// Archivos propios
var urlsLocales = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// Archivos externos (CDN) - necesitan modo CORS
var urlsExternas = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('Cacheando archivos locales...');
            // Cachear archivos locales (mismo dominio)
            cache.addAll(urlsLocales).catch(function(e) {
                console.log('Error cacheando locales:', e);
            });
            
            // Cachear archivos externos (CDN) con modo CORS
            urlsExternas.forEach(function(url) {
                fetch(url, { mode: 'cors' }).then(function(response) {
                    if (response.status === 200) {
                        cache.put(url, response.clone());
                        console.log('Cacheado:', url);
                    }
                }).catch(function(e) {
                    console.log('No se pudo cachear:', url);
                });
            });
            
            return Promise.resolve();
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.map(function(key) {
                    if (key !== CACHE_NAME) {
                        console.log('Eliminando caché viejo:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    
    // Para URLs externas, usar modo no-cors
    var request = event.request;
    
    event.respondWith(
        caches.match(request).then(function(cached) {
            if (cached) {
                return cached;
            }
            
            return fetch(request).then(function(response) {
                if (!response || response.status !== 200) {
                    return response;
                }
                
                var responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(request, responseClone);
                });
                
                return response;
            }).catch(function() {
                // Si falla la red y es una página, devolver index.html
                if (request.headers.get('accept') && 
                    request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
                return new Response('', { status: 503 });
            });
        })
    );
});
