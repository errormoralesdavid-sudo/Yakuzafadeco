const CACHE_NAME = 'yakuza-store-v1';

// Archivos vitales que se guardarán en el celular del usuario
const ARCHIVOS_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './firebase-config.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js'
];

// Instalación: Guardar los archivos estáticos en la caché
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ARCHIVOS_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación: Limpiar cachés antiguas si actualizas la versión de tu app
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nombresDeCache) => {
            return Promise.all(
                nombresDeCache.map((nombre) => {
                    if (nombre !== CACHE_NAME) {
                        return caches.delete(nombre);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptar peticiones (Estrategia: Caché primero, luego red)
self.addEventListener('fetch', (evento) => {
    // Excluir las peticiones a la base de datos de Firebase para que siempre busquen datos reales
    if (evento.request.url.includes('firestore.googleapis.com')) {
        return;
    }

    evento.respondWith(
        caches.match(evento.request).then((respuestaCache) => {
            // Si está en caché, lo devuelve instantáneamente
            if (respuestaCache) {
                // Se actualiza en segundo plano
                fetch(evento.request).then((respuestaRed) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(evento.request, respuestaRed.clone());
                    });
                }).catch(() => {}); // Ignorar errores si no hay internet
                
                return respuestaCache;
            }

            // Si no está en caché, va a la red
            return fetch(evento.request);
        })
    );
});
