// 📂 ganadero-elite/sw-v2.js - CACHE AGRESIVA
const CACHE_NAME = 'ganadero-elite-v5-2';
const CORE_FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// Instalación: Cachear TODO inmediatamente
self.addEventListener('install', (event) => {
    console.log('🛠️ SW v5.2: Instalando con cache agresiva...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cacheando archivos esenciales');
                return cache.addAll(CORE_FILES);
            })
            .then(() => {
                console.log('✅ SW v5.2: Instalado');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('❌ Error instalación SW:', err);
                return self.skipWaiting();
            })
    );
});

// Activación: Limpiar caches viejos INMEDIATAMENTE
self.addEventListener('activate', (event) => {
    console.log('🔄 SW v5.2: Activando...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Eliminando cache antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ SW v5.2: Activado, tomando control');
                return self.clients.claim();
            })
    );
});

// Fetch: CACHE FIRST AGRESIVO - Siempre desde caché
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Actualizar en segundo plano sin esperar
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, networkResponse.clone());
                                    });
                            }
                        })
                        .catch(() => {});
                    
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200) return response;
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Notificaciones push
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Actualización de GANADERO ÉLITE',
        icon: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="192" height="192"%3E%3Crect width="192" height="192" rx="36" fill="%230D0D0D"/%3E%3Ctext x="96" y="132" font-size="96" text-anchor="middle" fill="%23D4A853"%3E👑%3C/text%3E%3C/svg%3E',
        vibrate: [200, 100, 200],
        timestamp: Date.now()
    };
    event.waitUntil(self.registration.showNotification('GANADERO ÉLITE', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow('./index.html');
        }));
});

console.log('👑 SW GANADERO ÉLITE v5.2 - Cache Agresiva Activada');
