const CACHE_NAME = 'mira-cache-v2026-v2';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/logo-mira.png',
    '/splash_video.mp4'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('MIRA: Pre-caching critical assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // 1. Skip Supabase API calls (let them be handled by the app's internal cache/pending logic)
    if (event.request.url.includes('supabase.co')) {
        return;
    }

    // 2. Strategy: Cache First for Images and Fonts
    if (event.request.destination === 'image' || event.request.destination === 'font') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const cacheCopy = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 3. Strategy: Network First, falling back to Cache, then Offline Page
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If the request is successful, clone and cache it
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((response) => {
                    if (response) return response;
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                });
            })
    );
});

// Push Notifications
self.addEventListener('push', function (event) {
    let data = { title: 'MIRA', body: 'Nova atualização disponível' };
    if (event.data) {
        try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
    }
    const options = {
        body: data.body,
        icon: '/logo-mira.png',
        badge: '/logo-mira.png',
        vibrate: [100, 50, 100],
        data: { dateOfArrival: Date.now() }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    let targetUrl = '/';
    if (event.notification.data && event.notification.data.url) {
        targetUrl = event.notification.data.url;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Se houver alguma aba ativa, tenta focar ou redirecionar
            for (const client of clientList) {
                const clientUrl = new URL(client.url);
                const targetPath = new URL(targetUrl, clientUrl.origin).pathname;
                
                // Se a aba estiver aberta na mesma app, foca-a e navega
                if ('focus' in client) {
                    client.focus();
                    if (client.navigate) {
                        return client.navigate(targetUrl);
                    }
                }
            }
            // Se nenhuma aba estiver ativa, abre uma nova
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
