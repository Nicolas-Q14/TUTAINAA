// sw.js
const STATIC_CACHE_NAME = 'menu-elegante-cache-v1';
const DATA_CACHE_NAME = 'menu-data-cache-v1';

const staticUrlsToCache = [
    '/',
    '/index.html',
    // Caching de fuentes y place holders para uso sin conexión.
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://placehold.co/192x192/2C3E50/EAEAEA?text=M',
    'https://placehold.co/512x512/2C3E50/EAEAEA?text=M',
    'https://placehold.co/80x80/FF6347/fff?text=H',
    'https://placehold.co/80x80/FFA07A/fff?text=P',
    'https://placehold.co/80x80/DAA520/fff?text=T',
    'https://placehold.co/80x80/9ACD32/fff?text=E',
    'https://placehold.co/80x80/20B2AA/fff?text=J'
];

// Al instalar, precarga los archivos estáticos.
self.addEventListener('install', (event) => {
    console.log('Service Worker: Evento de instalación.');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
        .then((cache) => {
            console.log('Cache de archivos estáticos abierto, precargando...');
            return cache.addAll(staticUrlsToCache);
        })
        .then(() => self.skipWaiting())
    );
});

// Al activar, elimina los cachés antiguos para liberar espacio.
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Evento de activación.');
    const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Borrando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // Asegura que el service worker se active inmediatamente
    );
});

// Responde a las solicitudes de red con una estrategia de caché más inteligente.
self.addEventListener('fetch', (event) => {
    // Maneja solicitudes específicas para los datos del menú.
    if (event.request.url.includes('/menu-data.json')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        // Si la solicitud de red es exitosa, actualiza la caché y la devuelve.
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Si la red falla, devuelve la versión en caché.
                        return cache.match(event.request);
                    });
            })
        );
        return;
    }

    // Para todos los demás archivos (estáticos), usa la estrategia de caché primero.
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
