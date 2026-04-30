const CACHE_VERSION = 'quinielas-v4';
const ARCHIVOS = [
'/',
'/index.html',
'/script.js',
'/styles.css',
'/manifest.json',
];
self.addEventListener('install', e => {
e.waitUntil(
caches.open(CACHE_VERSION).then(async cache => {
const resultados = await Promise.allSettled(
ARCHIVOS.map(url =>
cache.add(url)
.then(() => console.log('[SW] Cacheado OK:', url))
.catch(err => console.warn('[SW] No se pudo cachear:', url, err.message))
)
);
const ok = resultados.filter(r => r.status === 'fulfilled').length;
const fail = resultados.filter(r => r.status === 'rejected').length;
console.log(`[SW] Install terminado. OK: ${ok}, Fail: ${fail}`);
return self.skipWaiting();
})
);
});
self.addEventListener('activate', e => {
e.waitUntil(
caches.keys()
.then(keys =>
Promise.all(
keys
.filter(k => k !== CACHE_VERSION)
.map(k => {
console.log('[SW] Borrando caché viejo:', k);
return caches.delete(k);
})
)
)
.then(() => self.clients.claim())
);
});
self.addEventListener('fetch', e => {
const url = e.request.url;
if (url.includes('/api/')) return;
if (e.request.mode === 'navigate') {
e.respondWith(
fetch(e.request)
.then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_VERSION).then(c => c.put('/', clone));
}
return response;
})
.catch(() =>
caches.match('/').then(c => c || caches.match('/index.html'))
)
);
return;
}
if (url.includes('script.js') || url.includes('styles.css')) {
e.respondWith(
fetch(e.request)
.then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
}
return response;
})
.catch(() => {
console.warn('[SW] Sin red, usando caché para:', url);
return caches.match(e.request);
})
);
return;
}
e.respondWith(
caches.match(e.request).then(cachedResponse => {
if (cachedResponse) return cachedResponse;
return fetch(e.request)
.then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
}
return response;
})
.catch(() => new Response('Sin conexión', { status: 503 }));
})
);
});