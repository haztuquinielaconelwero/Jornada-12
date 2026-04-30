const CACHE_VERSION = 'quinielas-v3';
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
.then(() => {
console.log('[SW] Cacheado OK:', url);
return url;
})
.catch(err => {
console.warn('[SW] No se pudo cachear:', url, err.message);
throw err;
})
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
.map(k => caches.delete(k))
)
)
.then(() => self.clients.claim())
);
});
self.addEventListener('fetch', e => {
if (e.request.url.includes('/api/')) return;
if (e.request.mode === 'navigate') {
e.respondWith(
fetch(e.request)
.then(response => {
const clone = response.clone();
caches.open(CACHE_VERSION).then(c => c.put('/', clone));
return response;
})
.catch(() =>
caches.match('/').then(c => c || caches.match('/index.html'))
)
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
.catch(() => cachedResponse || new Response('Sin conexión', { status: 503 }));
})
);
});