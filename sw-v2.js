var CACHE_NAME = 'ganadero-v19';
var urlsToCache = [
    './', './index.html', './styles.css', './app.js', './manifest.json',
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
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            return fetch(e.request).then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                if (e.request.mode === 'navigate') return caches.match('./index.html');
                return new Response('', {status: 200});
            });
        })
    );
});

// Background Sync
self.addEventListener('sync', function(e) {
    if (e.tag === 'sync-data') {
        e.waitUntil(
            self.clients.matchAll().then(function(clients) {
                clients.forEach(function(client) {
                    client.postMessage({ type: 'sync-complete' });
                });
            })
        );
    }
});

// Notificación push
self.addEventListener('push', function(e) {
    var data = e.data ? e.data.json() : { title: 'GANADERO ÉLITE', body: 'Revisa tus animales' };
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ctext y="22" font-size="20"%3E🐄%3C/text%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23fbbf24"/%3E%3C/svg%3E',
            vibrate: [200, 100, 200],
            tag: 'ganadero-notif',
            requireInteraction: true,
            actions: [
                { action: 'open', title: 'Abrir app' },
                { action: 'close', title: 'Cerrar' }
            ]
        })
    );
});

self.addEventListener('notificationclick', function(e) {
    e.notification.close();
    if (e.action === 'open') {
        e.waitUntil(clients.openWindow('./index.html'));
    }
});
