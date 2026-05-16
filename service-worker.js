const CACHE_VERSION = 'quinielas-v35';
const ARCHIVOS_ESTATICOS = [
'/manifest.json',
];
self.addEventListener('install', e => {
e.waitUntil(
caches.open(CACHE_VERSION).then(async cache => {
const resultados = await Promise.allSettled(
ARCHIVOS_ESTATICOS.map(url =>
cache.add(url)
.then(() => console.log('[SW] Cacheado OK:', url))
.catch(err => console.warn('[SW] No se pudo cachear:', url, err.message))
)
);
const ok = resultados.filter(r => r.status === 'fulfilled').length;
const fail = resultados.filter(r => r.status === 'rejected').length;
console.log(`[SW] Install terminado. OK: ${ok}, Fail: ${fail}`);
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
.then(() =>
self.clients.matchAll({ type: 'window' }).then(clients => {
clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
})
)
);
});
self.addEventListener('fetch', e => {
const url = e.request.url;
const esDinamica =
url.includes('/api/') ||
url.includes('/jornada-actual') ||
url.includes('/admin') ||
url.includes('/pendientes') ||
url.includes('/lista-oficial') ||
url.includes('/resultados');
if (esDinamica) return;
if (e.request.mode === 'navigate') {
e.respondWith(
fetch(e.request)
.then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
}
return response;
})
.catch(() =>
caches.match(e.request)
.then(c => c || caches.match('/index.html'))
.then(c => c || new Response('Sin conexión', { status: 503 }))
)
);
return;
}
if (url.includes('.js') || url.includes('.css')) {
e.respondWith(
fetch(e.request)
.then(response => {
if (response && response.status === 200) {
const clone = response.clone();
caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
}
return response;
})
.catch(() =>
caches.match(e.request).then(c =>
c || new Response('Sin conexión', { status: 503 })
)
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
.catch(() => new Response('Sin conexión', { status: 503 }));
})
);
});