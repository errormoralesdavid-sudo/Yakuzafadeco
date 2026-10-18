const CACHE_NAME = 'yakuza-store-v2';

const ARCHIVOS_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './firebase-config.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ARCHIVOS_CACHE);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nombresDeCache) => {
            return Promise.all(
                nombresDeCache.map((nombre) => {
                    if (nombre !== CACHE_NAME) return caches.delete(nombre);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
    if (evento.request.url.includes('firestore.googleapis.com')) return;
    evento.respondWith(
        caches.match(evento.request).then((respuestaCache) => {
            if (respuestaCache) {
                fetch(evento.request).then((respuestaRed) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(evento.request, respuestaRed.clone());
                    });
                }).catch(() => {}); 
                return respuestaCache;
            }
            return fetch(evento.request);
        })
    );
});
