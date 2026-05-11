/* 
   📂 ganadero-elite/sw-v2.js
   Service Worker para GANADERO ÉLITE v4.0.0
   Estrategia: Cache First con actualización en segundo plano
*/

const CACHE_NAME = 'ganadero-elite-v4';
const CORE_FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// ==================== INSTALACIÓN ====================
self.addEventListener('install', (event) => {
    console.log('🛠️ SW v4: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cacheando archivos esenciales v4');
                return cache.addAll(CORE_FILES);
            })
            .then(() => {
                console.log('✅ SW v4: Instalado correctamente');
                // Forzar activación inmediata
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('❌ Error en instalación del SW:', err);
                return self.skipWaiting();
            })
    );
});

// ==================== ACTIVACIÓN ====================
self.addEventListener('activate', (event) => {
    console.log('🔄 SW v4: Activando...');
    
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
                console.log('✅ SW v4: Activado y controlando clientes');
                return self.clients.claim();
            })
    );
});

// ==================== FETCH - ESTRATEGIA CACHE FIRST ====================
self.addEventListener('fetch', (event) => {
    // Solo manejar peticiones GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    
    // No cachear peticiones a APIs externas (si las hubiera en el futuro)
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Actualizar el cache en segundo plano (stale-while-revalidate)
                    fetch(event.request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, networkResponse.clone());
                                    });
                            }
                        })
                        .catch(() => {
                            // Silencioso - no hay conexión para actualizar
                        });
                    
                    return cachedResponse;
                }

                // Si no está en cache, intentar de la red
                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clonar y guardar en cache
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch((err) => {
                                console.warn('⚠️ No se pudo cachear:', event.request.url);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Si es una navegación, devolver el index.html offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html')
                                .then((cachedIndex) => {
                                    return cachedIndex || new Response(
                                        '<html><body style="background:#030303;color:#fbbf24;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h1>🧠</h1><p>GANADERO ÉLITE</p><p style="color:#a1a1aa;">Sin conexión</p></div></body></html>',
                                        { 
                                            status: 503, 
                                            statusText: 'Service Unavailable',
                                            headers: { 'Content-Type': 'text/html' }
                                        }
                                    );
                                });
                        }
                        
                        return new Response('Recurso no disponible offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ==================== NOTIFICACIONES PUSH ====================
self.addEventListener('push', (event) => {
    let data = {
        title: 'GANADERO ÉLITE',
        body: 'Actualización disponible',
        icon: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="192" height="192"%3E%3Crect width="192" height="192" rx="36" fill="%23030303"/%3E%3Ctext x="96" y="132" font-size="96" text-anchor="middle"%3E🧠%3C/text%3E%3C/svg%3E'
    };

    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="72" height="72"%3E%3Ccircle cx="36" cy="36" r="36" fill="%23fbbf24"/%3E%3C/svg%3E',
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        data: {
            url: './index.html'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ==================== CLIC EN NOTIFICACIÓN ====================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            // Si ya hay una ventana abierta, enfocarla
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrir una nueva
            return clients.openWindow('./index.html');
        })
    );
});

// ==================== MENSAJES DESDE LA APP ====================
self.addEventListener('message', (event) => {
    if (!event.data) return;

    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CHECK_UPDATE':
            console.log('📡 Verificando actualizaciones...');
            self.registration.update();
            break;
        case 'CLEAR_CACHE':
            caches.delete(CACHE_NAME)
                .then(() => {
                    console.log('🗑️ Cache limpiado');
                    if (event.ports && event.ports[0]) {
                        event.ports[0].postMessage({ success: true });
                    }
                });
            break;
        default:
            console.log('📨 Mensaje recibido:', event.data.type);
    }
});

console.log('🧠 Service Worker GANADERO ÉLITE v4.0.0 cargado');
