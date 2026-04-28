/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca con la Conexión con Python (API)--------------------------------------*/
const ENV = (() => {
const { hostname, port, protocol } = window.location;
const isLocalhost =
hostname === 'localhost' ||
hostname === '127.0.0.1' ||
hostname === '0.0.0.0';
const isLanIP = /^(10\.\d{1,3}|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}$/.test(hostname);
const isStaging =
hostname.includes('railway.app') ||
hostname.includes('staging.quinielaselwero.com');
const isDev = isLocalhost || isLanIP;
const isProd = !isDev && !isStaging;
let base;
if (isDev) {
const currentPort = port || '8000';
base = `${protocol}//${hostname}:${currentPort}`;
} else if (isStaging) {
base = `${protocol}//${hostname}`;
} else {
base = 'https://www.quinielaselwero.com';
}
return Object.freeze({ isDev, isStaging, isProd, base });
})();
const API_BASE = ENV.base;
function apiUrl(path, params = {}) {
if (typeof path !== 'string' || !path.trim()) {
console.error('❌ apiUrl: path inválido recibido:', path);
return null;
}
const cleanPath = '/' + path.replace(/^\/+/, '').replace(/\/+/g, '/');
let url;
try {
url = new URL(cleanPath, API_BASE);
} catch (e) {
console.error('❌ apiUrl: no se pudo construir URL para path:', path, e);
return null;
}
Object.entries(params).forEach(([key, value]) => {
if (value !== null && value !== undefined && value !== '') {
url.searchParams.set(key, String(value));
}
});
return url.toString();
}
if (ENV.isDev) {
console.log(`%c🔧 Entorno DEV detectado`, 'color: #facc15; font-weight: bold');
console.log(`📡 API_BASE → ${API_BASE}`);
}
const _ls = Object.freeze({
get(key) {
try { return localStorage.getItem(key); } catch { return null; }
},
set(key, value) {
try { localStorage.setItem(key, value); return true; }
catch (e) {
if (ENV?.isDev) console.warn('⚠️ _ls.set: no se pudo guardar "' + key + '" en localStorage', e);
return false;
}
},
remove(key) {
try { localStorage.removeItem(key); } catch { /* sin acceso */ }
},
});
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en la identificacion del vendedor-------------------------------------*/
const VendedorManager = (() => {
const VENDEDORES_VALIDOS = new Set([
'Alexander', 'Alfonso', 'Arturo', 'Azael', 'Boosters', 'Checo',
'Choneke', 'Dani', 'Del Angel', 'El Leona', 'El Piojo', 'Energeticos',
'Enoc', 'Ever', 'Fer', 'Figueroa', 'Gera', 'GioSoto', 'Guerrero',
'Javier Garcia', 'JJ', 'Jose Luis', 'Juan de Dios', 'Juanillo',
'Kany', 'Manu', 'Marchan', 'Marcos', 'Mazatan', 'Memo', 'Pantoja',
'Patty', 'Piny', 'PolloGol', 'Ranita', 'Rolando', 'Taliban', 'Tienda',
'Vender 1', 'Rifa', 'Dinamica Final', '•',
]);
const STORAGE_KEY = 'vendedor';
const MAX_LENGTH = 20;
function setCookie(value) {
try {
document.cookie = `vendedor=${encodeURIComponent(value)};max-age=31536000;path=/;SameSite=Lax`;
} catch (e) {
if (ENV?.isDev) console.warn('⚠️ VendedorManager: no se pudo guardar cookie', e);
}
}
function getCookie() {
try {
const match = document.cookie.match(/(?:^|;\s*)vendedor=([^;]+)/);
return match ? decodeURIComponent(match[1]) : null;
} catch (e) {
if (ENV?.isDev) console.warn('⚠️ VendedorManager: no se pudo leer cookie', e);
return null;
}
}
function getFromURL() {
try {
const raw = new URLSearchParams(window.location.search).get(STORAGE_KEY);
if (!raw) return null;
const trimmed = raw.trim();
if (trimmed.length === 0 || trimmed.length > MAX_LENGTH) {
console.warn(`⚠️ VendedorManager: valor fuera de rango (len=${trimmed.length})`);
return null;
}
if (!VENDEDORES_VALIDOS.has(trimmed)) {
console.warn(`⚠️ VendedorManager: vendedor desconocido en URL → "${trimmed}"`);
return null;
}
return trimmed;
} catch (e) {
console.error('❌ VendedorManager: error al leer URL param:', e);
return null;
}
}
function resolve() {
const fromURL = getFromURL();
if (fromURL) {
_ls.set(STORAGE_KEY, fromURL);
setCookie(fromURL);
return fromURL;
}
const fromStorage = _ls.get(STORAGE_KEY);
if (fromStorage && VENDEDORES_VALIDOS.has(fromStorage.trim())) {
setCookie(fromStorage.trim());
return fromStorage.trim();
}
if (fromStorage && !VENDEDORES_VALIDOS.has(fromStorage.trim())) {
console.warn(`⚠️ VendedorManager: limpiando vendedor inválido en storage → "${fromStorage}"`);
_ls.remove(STORAGE_KEY);
}
const fromCookie = getCookie();
if (fromCookie && VENDEDORES_VALIDOS.has(fromCookie.trim())) {
_ls.set(STORAGE_KEY, fromCookie.trim());
if (ENV?.isDev) console.log(`🍪 VendedorManager: vendedor recuperado desde cookie → "${fromCookie.trim()}"`);
return fromCookie.trim();
}
return null;
}
function updateDOM(vendedor) {
const apply = () => {
const el = document.getElementById('heroVendorText');
if (!el) return;
el.textContent = vendedor ?? 'Vendedor';
};
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', apply, { once: true });
} else {
apply();
}
}
const current = resolve();
if (current) {
if (ENV?.isDev) console.log(`✅ VendedorManager: vendedor activo → "${current}"`);
} else {
if (new URLSearchParams(window.location.search).has(STORAGE_KEY)) {
console.warn('⚠️ VendedorManager: param "vendedor" en URL es inválido o no reconocido');
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
if (typeof showToast === 'function') {
showToast('Abre la app desde el link de tu vendedor para registrarte correctamente. 🔗', 'warning');
}
}, { once: true });
} else {
if (typeof showToast === 'function') {
showToast('Abre la app desde el link de tu vendedor para registrarte correctamente. 🔗', 'warning');
}
}
}
updateDOM(current);
return Object.freeze({
current,
isValid: current !== null,
getFromURL,
isKnown: (name) => typeof name === 'string' && VENDEDORES_VALIDOS.has(name.trim()),
});
})();
const currentVendedor = VendedorManager.current;
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en las Funciones globales -------------------------------------*/
const AppState = (() => {
const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'quinielasData';
const MAX_SAVED = 200;
const MAX_SENT = 500;
function validateQuiniela(q) {
if (!q || typeof q !== 'object')
return { valid: false, reason: 'No es un objeto' };
if (typeof q.id !== 'number' || !Number.isFinite(q.id))
return { valid: false, reason: `id inválido: ${q.id}` };
if (typeof q.name !== 'string' || !q.name.trim())
return { valid: false, reason: 'name vacío o inválido' };
if (typeof q.vendedor !== 'string' || !q.vendedor.trim())
return { valid: false, reason: 'vendedor vacío o inválido' };
if (!q.predictions || typeof q.predictions !== 'object' || Array.isArray(q.predictions))
return { valid: false, reason: 'predictions inválido' };
if (typeof q.jornada !== 'string' || !q.jornada.trim())
return { valid: false, reason: 'jornada vacía (campo nuevo en v2)' };
const VALID_PICKS = new Set(['L', 'E', 'V']);
for (const [matchId, picks] of Object.entries(q.predictions)) {
if (!Array.isArray(picks))
return { valid: false, reason: `Partido ${matchId}: picks no es array` };
if (picks.length === 0 || picks.length > 3)
return { valid: false, reason: `Partido ${matchId}: picks fuera de rango (${picks.length})` };
const uniquePicks = new Set(picks);
if (uniquePicks.size !== picks.length)
return { valid: false, reason: `Partido ${matchId}: picks tiene duplicados` };
for (const pick of picks) {
if (!VALID_PICKS.has(pick))
return { valid: false, reason: `Partido ${matchId}: pick inválido "${pick}"` };
}
}
return { valid: true };
}
function validatePartido(p) {
return (
p &&
typeof p === 'object' &&
typeof p.id === 'number' &&
typeof p.local === 'string' && p.local.trim() &&
typeof p.visitante === 'string' && p.visitante.trim()
);
}
let _quinielaPredictions = {};
let _savedQuinielas = [];
let _sentQuinielas = [];
let _partidos = [];
const _listeners = {};
function on(event, callback) {
if (!_listeners[event]) _listeners[event] = new Set();
_listeners[event].add(callback);
return () => _listeners[event].delete(callback);
}
function _emit(event, payload) {
_listeners[event]?.forEach(cb => {
try { cb(payload); }
catch (e) { console.error(`❌ AppState: error en listener "${event}":`, e); }
});
}
function _migrate(data, fromVersion) {
let migrated = { ...data };
if (fromVersion < 2) {
console.warn(`⚠️ AppState: migrando datos v${fromVersion} → v${SCHEMA_VERSION}. savedQuinielas descartado.`);
migrated.savedQuinielas = [];
}
return migrated;
}
function loadFromStorage() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) return;
const data = JSON.parse(raw);
const version = data._version ?? 1;
const payload = version !== SCHEMA_VERSION ? _migrate(data, version) : data;
if (Array.isArray(payload.savedQuinielas)) {
_savedQuinielas = payload.savedQuinielas.reduce((acc, q) => {
const { valid, reason } = validateQuiniela(q);
if (valid) {
acc.push(q);
} else {
console.warn(`⚠️ AppState: quiniela descartada al cargar (${reason}):`, q);
}
return acc;
}, []);
}
if (Array.isArray(payload.sentQuinielas)) {
_sentQuinielas = payload.sentQuinielas.filter(
q => q && typeof q === 'object' && typeof q.id === 'number'
);
}
if (ENV?.isDev) {
console.log(`📦 AppState cargado: ${_savedQuinielas.length} guardadas, ${_sentQuinielas.length} enviadas`);
}
} catch (e) {
console.error('❌ AppState: error al cargar localStorage, reiniciando estado:', e);
_savedQuinielas = [];
_sentQuinielas = [];
try { localStorage.removeItem(STORAGE_KEY); } catch { /* silencioso */ }
}
}
function saveToStorage() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify({
_version: SCHEMA_VERSION,
savedQuinielas: _savedQuinielas,
sentQuinielas: _sentQuinielas,
}));
} catch (e) {
if (e?.name === 'QuotaExceededError' || e?.code === 22) {
console.error('❌ AppState: localStorage lleno. Limpiando sentQuinielas antiguas...');
_sentQuinielas = [];
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify({
_version: SCHEMA_VERSION,
savedQuinielas: _savedQuinielas,
sentQuinielas: [],
}));
console.warn('⚠️ AppState: sentQuinielas vaciado para liberar espacio.');
} catch {
console.error('❌ AppState: localStorage sigue lleno. No se pudo persistir.');
}
} else {
console.error('❌ AppState: error inesperado al guardar:', e);
}
}
}
function getPredictions() {
return { ..._quinielaPredictions };
}
function setPrediction(matchId, picks) {
if (typeof matchId !== 'number' || matchId < 0 || matchId > 8) {
console.error(`❌ AppState.setPrediction: matchId inválido (${matchId})`);
return false;
}
const VALID = new Set(['L', 'E', 'V']);
if (!Array.isArray(picks) || picks.length === 0 || picks.length > 3) {
console.error(`❌ AppState.setPrediction: picks inválido:`, picks);
return false;
}
const unique = [...new Set(picks)];
if (unique.some(p => !VALID.has(p))) {
console.error(`❌ AppState.setPrediction: pick desconocido en:`, picks);
return false;
}
_quinielaPredictions[matchId] = unique;
_emit('predictionsChanged', { matchId, picks: unique });
return true;
}
function clearPrediction(matchId) {
if (matchId in _quinielaPredictions) {
delete _quinielaPredictions[matchId];
_emit('predictionsChanged', { matchId, picks: null });
}
}
function resetPredictions() {
for (const key of Object.keys(_quinielaPredictions)) {
delete _quinielaPredictions[key];
}
_emit('predictionsChanged', null);
}
function getSaved() {
return [..._savedQuinielas];
}
function addSaved(quinielas) {
const items = Array.isArray(quinielas) ? quinielas : [quinielas];
const errors = [];
let added = 0;
if (_savedQuinielas.length + items.length > MAX_SAVED) {
const msg = `Límite de ${MAX_SAVED} quinielas guardadas alcanzado`;
console.error(`❌ AppState.addSaved: ${msg}`);
return { added: 0, errors: [msg] };
}
for (const q of items) {
const { valid, reason } = validateQuiniela(q);
if (!valid) {
errors.push(`Quiniela rechazada: ${reason}`);
continue;
}
const id = Date.now() + _savedQuinielas.length + Math.floor(Math.random() * 1000);
_savedQuinielas.push({ ...q, id });
added++;
}
if (added > 0) {
saveToStorage();
_emit('savedChanged', { action: 'add', count: added });
}
return { added, errors };
}
function removeSavedById(id) {
const before = _savedQuinielas.length;
_savedQuinielas = _savedQuinielas.filter(q => q.id !== id);
const removed = before !== _savedQuinielas.length;
if (removed) {
saveToStorage();
_emit('savedChanged', { action: 'remove', id });
} else {
console.warn(`⚠️ AppState.removeSavedById: no se encontró quiniela con id=${id}`);
}
return removed;
}
function clearSaved() {
if (_savedQuinielas.length > 0) {
_savedQuinielas = [];
saveToStorage();
_emit('savedChanged', { action: 'clear' });
}
}
function getSent() {
return [..._sentQuinielas];
}
function markAsSent(quinielas) {
const items = Array.isArray(quinielas) ? quinielas : [quinielas];
const norm = s => (typeof s === 'string' ? s.trim().toLowerCase() : '');
const contentKey = q => {
const picks = Object.keys(q.predictions ?? {}).sort().map(k => {
const v = (q.predictions ?? {})[k];
return `${k}:${Array.isArray(v) ? [...v].sort().join('') : String(v).toUpperCase()}`;
}).join('|');
return `${norm(q.name || q.nombre)}|${norm(q.vendedor)}|${norm(q.jornada)}|${picks}`;
};
const existingKeys = new Set(_sentQuinielas.map(contentKey));
const novedades = items.filter(q => {
const key = contentKey(q);
if (existingKeys.has(key)) {
if (ENV?.isDev) console.warn(`⚠️ markAsSent: duplicado bloqueado: "${q.name ?? q.nombre}"`);
return false;
}
existingKeys.add(key);
return true;
});
if (novedades.length === 0) {
if (ENV?.isDev) console.warn('⚠️ markAsSent: todas las quinielas ya existían, nada que agregar');
return;
}
if (_sentQuinielas.length + novedades.length > MAX_SENT) {
const overflow = (_sentQuinielas.length + novedades.length) - MAX_SENT;
_sentQuinielas.splice(0, overflow);
console.warn(`⚠️ AppState: sentQuinielas rotado, se eliminaron ${overflow} entradas antiguas`);
}
_sentQuinielas.push(...novedades.map(q => ({ ...q })));
saveToStorage();
_emit('sentChanged', { action: 'add', count: novedades.length });
}
function replaceSent(newList) {
if (!Array.isArray(newList)) return false;
_sentQuinielas = newList.filter(q => q && typeof q === 'object');
saveToStorage();
_emit('sentChanged', { action: 'replace', count: _sentQuinielas.length });
return true;
}
function getPartidos() {
return _partidos;
}
function setPartidos(data) {
if (_partidos.length > 0) {
console.warn('⚠️ AppState.setPartidos: los partidos ya están cargados. Ignorando.');
return false;
}
if (!Array.isArray(data) || data.length === 0) {
console.error('❌ AppState.setPartidos: data vacío o inválido', data);
return false;
}
const validos = data.filter(p => {
const ok = validatePartido(p);
if (!ok) console.warn('⚠️ AppState.setPartidos: partido inválido ignorado:', p);
return ok;
});
if (validos.length === 0) {
console.error('❌ AppState.setPartidos: ningún partido pasó validación');
return false;
}
_partidos = Object.freeze(validos.map(p => Object.freeze({ ...p })));
_emit('partidosLoaded', { count: _partidos.length });
if (ENV?.isDev) {
console.log(`⚽ AppState: ${_partidos.length} partidos cargados y congelados`);
}
return true;
}
loadFromStorage();
return Object.freeze({
on,
getPredictions,
setPrediction,
clearPrediction,
resetPredictions,
getSaved,
addSaved,
removeSavedById,
clearSaved,
getSent,
markAsSent,
replaceSent,
getPartidos,
setPartidos,
saveToStorage,
});
})();
const quinielaPredictions = AppState.getPredictions();
let savedQuinielas = AppState.getSaved();
let sentQuinielas = AppState.getSent();
let partidos = AppState.getPartidos();
AppState.on('savedChanged', () => { savedQuinielas = AppState.getSaved(); });
AppState.on('sentChanged', () => { sentQuinielas = AppState.getSent(); });
AppState.on('partidosLoaded', () => { partidos = AppState.getPartidos(); });
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en el guardado y las alertas -------------------------------------*/
const userId = (() => {
const KEY = 'userId';
const VALID_FORMAT = /^u_[0-9a-f]{16,}$/i;
function generateId() {
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
return 'u_' + crypto.randomUUID().replace(/-/g, '');
}
const array = new Uint8Array(8);
crypto.getRandomValues(array);
return 'u_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
const existing = _ls.get(KEY);
if (existing && VALID_FORMAT.test(existing)) {
return existing;
}
const newId = generateId();
_ls.set(KEY, newId);
return newId;
})();
function deleteQuiniela(id) {
if (typeof id !== 'number' || !Number.isFinite(id)) {
console.error('❌ deleteQuiniela: id inválido recibido:', id);
return false;
}
const removed = AppState.removeSavedById(id);
if (!removed) {
console.warn(`⚠️ deleteQuiniela: no se encontró quiniela con id=${id}`);
return false;
}
if (typeof updateSavedBadge === 'function') updateSavedBadge();
if (typeof showSaved === 'function') showSaved();
return true;
}
const ToastManager = (() => {
const MAXTOASTS = 3;
const active = [];
const TYPES = {
success: {
color: '#10b981',
icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
},
error: {
color: '#ef4444',
icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
},
warning: {
color: '#f59e0b',
icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
},
info: {
color: '#3b82f6',
icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
},
};
function _inyectarEstilos() {
if (document.getElementById('toast-styles')) return;
const style = document.createElement('style');
style.id = 'toast-styles';
style.textContent = `
#toast-container {
position: fixed;
bottom: 80px;
right: 16px;
z-index: 10001;
display: flex;
flex-direction: column-reverse;
gap: 10px;
pointer-events: none;
max-width: min(360px, calc(100vw - 32px));
width: 100%;
}
.wero-toast {
pointer-events: all;
display: flex;
align-items: flex-start;
gap: 12px;
background: #1a1a1a;
border: 1px solid rgba(255,255,255,0.08);
border-left: 3px solid var(--toast-color);
border-radius: 10px;
padding: 13px 14px;
box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3);
color: #f0f0f0;
font-size: 0.875rem;
font-weight: 500;
line-height: 1.4;
position: relative;
overflow: hidden;
transform: translateX(120%);
opacity: 0;
transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1),
opacity 0.38s ease;
will-change: transform, opacity;
-webkit-tap-highlight-color: transparent;
}
.wero-toast.toast-visible {
transform: translateX(0);
opacity: 1;
}
.wero-toast.toast-saliendo {
transform: translateX(120%);
opacity: 0;
transition: transform 0.3s cubic-bezier(0.55, 0, 1, 0.45),
opacity 0.3s ease;
}
.wero-toast-icon {
flex-shrink: 0;
width: 32px;
height: 32px;
border-radius: 50%;
background: color-mix(in srgb, var(--toast-color) 15%, transparent);
display: flex;
align-items: center;
justify-content: center;
color: var(--toast-color);
margin-top: 1px;
}
.wero-toast-body {
flex: 1;
min-width: 0;
padding-right: 8px;
}
.wero-toast-text {
word-break: break-word;
}
.wero-toast-close {
flex-shrink: 0;
background: none;
border: none;
color: rgba(255,255,255,0.35);
cursor: pointer;
padding: 2px;
line-height: 1;
display: flex;
align-items: center;
justify-content: center;
border-radius: 4px;
transition: color 0.15s ease, background 0.15s ease;
margin-top: 1px;
}
.wero-toast-close:hover {
color: rgba(255,255,255,0.8);
background: rgba(255,255,255,0.08);
}
.wero-toast-progress {
position: absolute;
bottom: 0;
left: 0;
height: 2px;
background: var(--toast-color);
border-radius: 0 0 0 10px;
transform-origin: left;
animation: toast-progress var(--toast-duration) linear forwards;
opacity: 0.6;
}
@keyframes toast-progress {
from { transform: scaleX(1); }
to { transform: scaleX(0); }
}
@media (max-width: 480px) {
#toast-container {
right: 12px;
left: 12px;
max-width: 100%;
bottom: 72px;
}
}
`;
document.head.appendChild(style);
}
function _obtenerContenedor() {
let container = document.getElementById('toast-container');
if (!container) {
container = document.createElement('div');
container.id = 'toast-container';
container.setAttribute('role', 'region');
container.setAttribute('aria-label', 'Notificaciones');
document.body.appendChild(container);
}
return container;
}
function _remover(toast, container) {
if (!toast.isConnected) return;
toast.classList.remove('toast-visible');
toast.classList.add('toast-saliendo');
setTimeout(() => {
try { container.removeChild(toast); } catch { /* ya fue removido */ }
const idx = active.indexOf(toast);
if (idx !== -1) active.splice(idx, 1);
}, 320);
}
function show(message, type = 'info') {
if (!message || typeof message !== 'string') return;
_inyectarEstilos();
const container = _obtenerContenedor();
if (active.length >= MAXTOASTS) {
_remover(active[0], container);
}
const config = TYPES[type] ?? TYPES.info;
const duration = Math.min(2000 + message.length * 35, 5500);
const toast = document.createElement('div');
toast.className = 'wero-toast';
toast.setAttribute('role', 'alert');
toast.setAttribute('aria-live', 'polite');
toast.setAttribute('aria-atomic', 'true');
toast.style.setProperty('--toast-color', config.color);
toast.style.setProperty('--toast-duration', `${duration}ms`);
const iconWrap = document.createElement('div');
iconWrap.className = 'wero-toast-icon';
iconWrap.setAttribute('aria-hidden', 'true');
iconWrap.innerHTML = config.icon;
const body = document.createElement('div');
body.className = 'wero-toast-body';
const text = document.createElement('span');
text.className = 'wero-toast-text';
text.textContent = message;
body.appendChild(text);
const closeBtn = document.createElement('button');
closeBtn.className = 'wero-toast-close';
closeBtn.setAttribute('aria-label', 'Cerrar notificación');
closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
closeBtn.onclick = () => _remover(toast, container);
const progress = document.createElement('div');
progress.className = 'wero-toast-progress';
toast.appendChild(iconWrap);
toast.appendChild(body);
toast.appendChild(closeBtn);
toast.appendChild(progress);
container.appendChild(toast);
active.push(toast);
void toast.offsetWidth;
toast.classList.add('toast-visible');
const timer = setTimeout(() => _remover(toast, container), duration);
toast.addEventListener('mouseenter', () => {
progress.style.animationPlayState = 'paused';
clearTimeout(timer);
});
toast.addEventListener('mouseleave', () => {
_remover(toast, container);
});
}
return Object.freeze({ show });
})();
function showToast(message, type) {
ToastManager.show(message, type);
}
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en los Partidos de la jornada ----------------------------------------*/
const PARTIDOS_ESPERADOS = 9;
let _partidosLoading = false;
/**
* @param {any} p
* @returns {{ valid: boolean, reason?: string }}
*/
function _validatePartidoShape(p) {
if (!p || typeof p !== 'object' || Array.isArray(p))
return { valid: false, reason: 'No es un objeto' };
if (typeof p.id !== 'number' || !Number.isFinite(p.id) || p.id < 0)
return { valid: false, reason: `id inválido: ${JSON.stringify(p.id)}` };
if (typeof p.local !== 'string' || !p.local.trim())
return { valid: false, reason: `local vacío en partido id=${p.id}` };
if (typeof p.visitante !== 'string' || !p.visitante.trim())
return { valid: false, reason: `visitante vacío en partido id=${p.id}` };
if (typeof p.horario !== 'string' || !p.horario.trim())
return { valid: false, reason: `horario vacío en partido id=${p.id}` };
return { valid: true };
}
/**
* @param {string} url
* @param {number} timeoutMs
* @returns {Promise<Response>}
*/
async function _fetchWithTimeout(url, timeoutMs) {
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
try {
const response = await fetch(url, {
signal: controller.signal,
headers: { 'Accept': 'application/json' },
});
return response;
} finally {
clearTimeout(timer);
}
}
/**
* @param {{ maxRetries?: number, timeoutMs?: number, notify?: boolean }} options
* @returns {Promise<boolean>}
*/
async function cargarPartidos({ maxRetries = 2, timeoutMs = 8000, notify = true } = {}) {
if (_partidosLoading) {
if (ENV?.isDev) console.warn('⚠️ cargarPartidos: ya hay una carga en progreso, ignorando.');
return false;
}
if (AppState.getPartidos().length > 0) {
if (ENV?.isDev) console.log('⚽ cargarPartidos: partidos ya en AppState, saltando fetch.');
return true;
}
_partidosLoading = true;
const url = apiUrl('/api/partidos');
if (!url) {
_partidosLoading = false;
console.error('❌ cargarPartidos: URL inválida, abortando');
return false;
}
let lastError = null;
for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
if (attempt > 1) {
const delay = (attempt - 1) * 800;
if (ENV?.isDev) console.log(`🔄 cargarPartidos: reintento ${attempt - 1}/${maxRetries} en ${delay}ms...`);
await new Promise(resolve => setTimeout(resolve, delay));
}
try {
const response = await _fetchWithTimeout(url, timeoutMs);
if (!response.ok) {
lastError = `HTTP ${response.status} ${response.statusText}`;
if (ENV?.isDev) console.warn(`⚠️ cargarPartidos (intento ${attempt}): ${lastError}`);
if (response.status === 404 || response.status === 400) break;
continue;
}
let data;
try {
data = await response.json();
} catch (parseError) {
lastError = `Respuesta no es JSON válido (¿HTML de error de servidor?)`;
if (ENV?.isDev) console.warn(`⚠️ cargarPartidos (intento ${attempt}):`, lastError);
continue;
}
const rawPartidos = data?.partidos;
if (!Array.isArray(rawPartidos)) {
lastError = `"partidos" no es un array: ${typeof rawPartidos}`;
if (ENV?.isDev) console.warn(`⚠️ cargarPartidos:`, lastError);
break;
}
if (rawPartidos.length === 0) {
lastError = 'El servidor retornó 0 partidos';
if (ENV?.isDev) console.warn(`⚠️ cargarPartidos:`, lastError);
break;
}
const invalidos = [];
const validos = rawPartidos.filter((p, i) => {
const { valid, reason } = _validatePartidoShape(p);
if (!valid) invalidos.push(`[${i}]: ${reason}`);
return valid;
});
if (invalidos.length > 0) {
console.warn(`⚠️ cargarPartidos: ${invalidos.length} partidos inválidos descartados:`, invalidos);
}
if (validos.length !== PARTIDOS_ESPERADOS) {
lastError = `Se esperaban ${PARTIDOS_ESPERADOS} partidos válidos, llegaron ${validos.length}`;
console.error(`❌ cargarPartidos:`, lastError);
break;
}
const ok = AppState.setPartidos(validos);
if (!ok) {
lastError = 'AppState.setPartidos rechazó los datos';
break;
}
if (ENV?.isDev) {
console.log(`✅ cargarPartidos: ${validos.length} partidos cargados correctamente`);
}
_partidosLoading = false;
return true;
} catch (networkError) {
if (networkError.name === 'AbortError') {
lastError = `Timeout después de ${timeoutMs}ms`;
if (ENV?.isDev) console.warn(`⏱️ cargarPartidos (intento ${attempt}): ${lastError}`);
} else {
lastError = networkError.message || 'Error de red desconocido';
if (ENV?.isDev) console.warn(`🔌 cargarPartidos (intento ${attempt}):`, lastError);
}
}
}
_partidosLoading = false;
console.error(`❌ cargarPartidos: falló tras ${maxRetries + 1} intentos. Último error: ${lastError}`);
if (notify) {
showToast('No se pudieron cargar los partidos. Verifica tu conexión.', 'error');
}
return false;
}
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en Funciones de la pagina quiniela --------------------------------*/
function escapeHtml(str) {
if (str === null || str === undefined) return '';
return String(str)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&#39;');
}
function renderQuinielaMatches() {
const container = document.getElementById('quinielaMatches');
if (!container) {
console.error('❌ renderQuinielaMatches: #quinielaMatches no encontrado en el DOM');
return;
}
const partidos = AppState.getPartidos();
const predictions = AppState.getPredictions();
if (partidos.length === 0) {
container.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Cargando partidos...</p>';
return;
}
const html = partidos.map(partido => {
const id = partido.id;
const local = escapeHtml(partido.local);
const visitante = escapeHtml(partido.visitante);
const localLogo = _isSafeImageUrl(partido.localLogo) ? escapeHtml(partido.localLogo) : '';
const visitanteLogo = _isSafeImageUrl(partido.visitanteLogo) ? escapeHtml(partido.visitanteLogo) : '';
const selL = predictions[id]?.includes('L') ? 'selected' : '';
const selE = predictions[id]?.includes('E') ? 'selected' : '';
const selV = predictions[id]?.includes('V') ? 'selected' : '';
return `
<div class="quiniela-match" data-match-id="${id}">
<div class="quiniela-match-row">
<button
class="quiniela-btn ${selL}"
data-match="${id}"
data-pick="L"
aria-label="Local en partido ${local} vs ${visitante}"
aria-pressed="${selL === 'selected'}"
>L</button>
<div class="quiniela-team-inline">
<img
src="${localLogo}"
alt="${local}"
class="team-logo-small"
width="24"
height="24"
loading="lazy"
onerror="this.style.visibility='hidden'"
>
<span>${local}</span>
</div>
<button
class="quiniela-btn ${selE}"
data-match="${id}"
data-pick="E"
aria-label="Empate en partido ${local} vs ${visitante}"
aria-pressed="${selE === 'selected'}"
>E</button>
<div class="quiniela-team-inline">
<span>${visitante}</span>
<img
src="${visitanteLogo}"
alt="${visitante}"
class="team-logo-small"
width="24"
height="24"
loading="lazy"
onerror="this.style.visibility='hidden'"
>
</div>
<button
class="quiniela-btn ${selV}"
data-match="${id}"
data-pick="V"
aria-label="Visitante en partido ${local} vs ${visitante}"
aria-pressed="${selV === 'selected'}"
>V</button>
</div>
</div>`;
}).join('');
container.innerHTML = html;
}
document.addEventListener('click', function onQuinielaBtnClick(e) {
const btn = e.target.closest('.quiniela-btn[data-match][data-pick]');
if (!btn) return;
const matchId = parseInt(btn.dataset.match, 10);
const pick = btn.dataset.pick;
if (!Number.isFinite(matchId) || !['L', 'E', 'V'].includes(pick)) return;
if (typeof selectPrediction === 'function') {
selectPrediction(matchId, pick, btn);
}
});
const MAX_COMBINATIONS = 500;
function calculateRealQuinielas() {
const partidos = AppState.getPartidos();
const predictions = AppState.getPredictions();
if (partidos.length === 0) return 0;
let total = 1;
for (const partido of partidos) {
const preds = predictions[partido.id];
if (!Array.isArray(preds) || preds.length === 0) return 0;
total *= preds.length;
if (total > MAX_COMBINATIONS) return MAX_COMBINATIONS;
}
return total;
}
function updateQuinielaCount() {
const count = calculateRealQuinielas();
const el = document.querySelector('.quiniela-count');
if (!el) return;
el.textContent = count >= MAX_COMBINATIONS ? `${MAX_COMBINATIONS}+` : count;
}
const PRECIO_POR_QUINIELA = 30;
function calculateCurrentPrice() {
const count = calculateRealQuinielas();
if (count === 0) return 0;
return count * PRECIO_POR_QUINIELA;
}
function updatePrice() {
const total = calculateCurrentPrice();
const el = document.querySelector('.price-display');
if (!el) return;
el.textContent = new Intl.NumberFormat('es-MX', {
style: 'currency',
currency: 'MXN',
minimumFractionDigits: 0,
maximumFractionDigits: 0,
}).format(total);
}
let _lastBadgeCount = -1;
function updateSavedBadge() {
const savedButton = document.querySelector('[data-action="show-saved"]');
if (!savedButton) return;
const count = AppState.getSaved().length;
if (count === _lastBadgeCount) return;
_lastBadgeCount = count;
const existingBadge = savedButton.querySelector('.saved-badge');
if (count <= 0) {
existingBadge?.remove();
return;
}
if (existingBadge) {
existingBadge.textContent = count > 99 ? '99+' : count;
} else {
const badge = document.createElement('span');
badge.className = 'saved-badge';
badge.setAttribute('aria-label', `${count} quinielas guardadas`);
badge.textContent = count > 99 ? '99+' : count;
badge.style.cssText = [
'position: absolute',
'top: -8px',
'right: -8px',
'background: #ef4444',
'color: white',
'border-radius: 50%',
'width: 24px',
'height: 24px',
'display: flex',
'align-items: center',
'justify-content: center',
'font-size: 0.75rem',
'font-weight: 700',
'pointer-events: none',
].join('; ');
savedButton.style.position = 'relative';
savedButton.appendChild(badge);
}
}
function showErrorModal(message) {
if (typeof openModal !== 'function') {
console.error('❌ showErrorModal: openModal no está definida');
showToast(message, 'error');
return;
}
const wrapper = document.createElement('div');
wrapper.style.cssText = 'text-align:center;display:flex;flex-direction:column;align-items:center;';
const img = document.createElement('img');
img.src = 'logos/tarjetaroja.png';
img.alt = 'Tarjeta Roja';
img.style.cssText = 'width:120px;height:auto;margin:0 auto 1rem;display:block;';
img.onerror = () => { img.style.display = 'none'; };
const title = document.createElement('h3');
title.style.cssText = 'color:#ef4444;margin-bottom:1rem;';
title.textContent = '¡Tarjeta Roja!';
const text = document.createElement('p');
text.style.cssText = 'font-size:1rem;color:var(--gris-300);';
text.textContent = message;
wrapper.appendChild(img);
wrapper.appendChild(title);
wrapper.appendChild(text);
openModal(wrapper);
}
function clearQuiniela() {
AppState.resetPredictions();
const nameInput = document.getElementById('playerName');
if (nameInput) nameInput.value = '';
renderQuinielaMatches();
updateQuinielaCount();
updatePrice();
}
function randomQuiniela() {
const partidos = AppState.getPartidos();
if (partidos.length === 0) {
showErrorModal('No hay partidos cargados para generar quiniela aleatoria.');
return;
}
const OPTIONS = ['L', 'E', 'V'];
const MAX_DOUBLES = 4;
const MAX_TRIPLES = 3;
const tiposPorPartido = partidos.map(() => 'single');
const indices = partidos.map((_, i) => i);
for (let i = indices.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[indices[i], indices[j]] = [indices[j], indices[i]];
}
let triplesAsignados = 0;
let doblesAsignados = 0;
for (const idx of indices) {
if (triplesAsignados < MAX_TRIPLES && Math.random() < 0.05) {
tiposPorPartido[idx] = 'triple';
triplesAsignados++;
} else if (doblesAsignados < MAX_DOUBLES && Math.random() < 0.22) {
tiposPorPartido[idx] = 'double';
doblesAsignados++;
}
if (triplesAsignados === MAX_TRIPLES && doblesAsignados === MAX_DOUBLES) break;
}
AppState.resetPredictions();
for (let i = 0; i < partidos.length; i++) {
const partido = partidos[i];
const tipo = tiposPorPartido[i];
let picks;
if (tipo === 'triple') {
picks = ['L', 'E', 'V'];
} else if (tipo === 'double') {
const shuffled = [...OPTIONS];
for (let s = shuffled.length - 1; s > 0; s--) {
const r = Math.floor(Math.random() * (s + 1));
[shuffled[s], shuffled[r]] = [shuffled[r], shuffled[s]];
}
picks = shuffled.slice(0, 2);
} else {
picks = [OPTIONS[Math.floor(Math.random() * OPTIONS.length)]];
}
AppState.setPrediction(partido.id, picks);
}
renderQuinielaMatches();
updateQuinielaCount();
updatePrice();
}
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en Límites de dobles y triples + selección ----------------------------*/
const REGLAS_QUINIELA = Object.freeze({
MAX_DOBLES: 4,
MAX_TRIPLES: 3,
PICKS_VALIDOS: new Set(['L', 'E', 'V']),
MAX_MATCH_ID: 8,
MIN_MATCH_ID: 0,
});
const VENDEDOR_WHATSAPP = Object.freeze({
'Alexander':     '5218287683709',
'Alfonso':       '5218186589145',
'Arturo':        '5218182727993',
'Azael':         '5218120708453',
'Boosters':      '5218121942047',
'Checo':         '5218281186921',
'Choneke':       '5218138834830',
'Dani':          '5218282942378',
'Del Angel':     '5218117456805',
'El Leona':      '5218282944745',
'El Piojo':      '5218118004801',
'Energeticos':   '5218281432464',
'Enoc':          '5218186836163',
'Ever':          '5218117299742',
'Fer':           '5218281317783',
'Figueroa':      '5218334077675',
'Gera':          '5218182523537',
'GioSoto':       '5218116911526',
'Guerrero':      '5217206346990',
'Javier Garcia': '5218281148922',
'JJ':            '5218281006452',
'Jose Luis':     '5218113153788',
'Juan de Dios':  '5218128897266',
'Juanillo':      '5218136984024',
'Kany':          '5218281007191',
'Manu':          '5213111359115',
'Marchan':       '5218281007640',
'Marcos':        '5218117567344',
'Mazatan':       '5218136280437',
'Memo':          '5218284577005',
'Pantoja':       '5218117027387',
'Patty':         '5218281016489',
'Piny':          '5218282941357',
'PolloGol':      '5218125728071',
'Ranita':        '5218281432398',
'Rolando':       '5214891009110',
'Taliban':       '5218287685754',
'Tienda':        '5210123456789',
'Vender 1':      '5210123456789',
'Rifa':          '5210123456789',
'Dinamica Final':'5210123456789',
'•':             '5218281011650',
});
function validateDoublesAndTriples(predictionsObj, { showModal = true } = {}) {
const obj = predictionsObj ?? AppState.getPredictions();
if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
return { valid: false, dobles: 0, triples: 0, reason: 'Objeto de predicciones inválido' };
}
let dobles = 0;
let triples = 0;
let picksInvalidos = 0;
for (const [matchId, picks] of Object.entries(obj)) {
if (!Array.isArray(picks)) continue;
const uniqueValidos = new Set(picks.filter(p => REGLAS_QUINIELA.PICKS_VALIDOS.has(p)));
const count = uniqueValidos.size;
if (count === 2) dobles++;
if (count === 3) triples++;
if (picks.some(p => !REGLAS_QUINIELA.PICKS_VALIDOS.has(p))) picksInvalidos++;
}
if (picksInvalidos > 0) {
const reason = `Se encontraron picks inválidos en ${picksInvalidos} partido(s)`;
if (showModal && typeof showErrorModal === 'function') showErrorModal(reason);
return { valid: false, dobles, triples, reason };
}
if (dobles > REGLAS_QUINIELA.MAX_DOBLES) {
const reason = `Máximo ${REGLAS_QUINIELA.MAX_DOBLES} dobles permitidos (tienes ${dobles})`;
if (showModal && typeof showErrorModal === 'function') showErrorModal(reason);
return { valid: false, dobles, triples, reason };
}
if (triples > REGLAS_QUINIELA.MAX_TRIPLES) {
const reason = `Máximo ${REGLAS_QUINIELA.MAX_TRIPLES} triples permitidos (tienes ${triples})`;
if (showModal && typeof showErrorModal === 'function') showErrorModal(reason);
return { valid: false, dobles, triples, reason };
}
return { valid: true, dobles, triples };
}
function selectPrediction(matchId, prediction, button = null) {
const id = typeof matchId === 'string' ? parseInt(matchId, 10) : matchId;
if (!Number.isFinite(id) || id < REGLAS_QUINIELA.MIN_MATCH_ID || id > REGLAS_QUINIELA.MAX_MATCH_ID) {
console.error(`❌ selectPrediction: matchId inválido → ${JSON.stringify(matchId)}`);
return;
}
if (!REGLAS_QUINIELA.PICKS_VALIDOS.has(prediction)) {
console.error(`❌ selectPrediction: pick inválido → "${prediction}"`);
return;
}
const buttonIsLive = button instanceof Element && button.isConnected;
if (button !== null && !buttonIsLive) {
console.warn(`⚠️ selectPrediction: botón stale detectado para matchId=${id}. Se hará re-render completo.`);
}
const currentPredictions = AppState.getPredictions();
const currentPicks = Array.isArray(currentPredictions[id])
? [...currentPredictions[id]]
: [];
const pickIndex = currentPicks.indexOf(prediction);
const isAdding = pickIndex === -1;
const simulated = Object.fromEntries(
Object.entries(currentPredictions).map(([k, v]) => [k, [...v]])
);
if (isAdding) {
if (!simulated[id]) simulated[id] = [];
simulated[id].push(prediction);
} else {
simulated[id].splice(pickIndex, 1);
if (simulated[id].length === 0) {
delete simulated[id];
}
}
if (isAdding) {
const { valid } = validateDoublesAndTriples(simulated, { showModal: true });
if (!valid) return;
}
const newPicks = simulated[id] ?? [];
if (newPicks.length === 0) {
AppState.clearPrediction(id);
} else {
const ok = AppState.setPrediction(id, newPicks);
if (!ok) {
console.error(`❌ selectPrediction: AppState.setPrediction rechazó picks para partido ${id}`);
return;
}
}
if (buttonIsLive) {
button.classList.toggle('selected', isAdding);
button.setAttribute('aria-pressed', String(isAdding));
const matchContainer = button.closest(`[data-match-id="${id}"]`);
if (matchContainer) {
const updatedPicks = AppState.getPredictions()[id] ?? [];
matchContainer.querySelectorAll('.quiniela-btn[data-pick]').forEach(btn => {
const btnPick = btn.dataset.pick;
const isActive = updatedPicks.includes(btnPick);
btn.classList.toggle('selected', isActive);
btn.setAttribute('aria-pressed', String(isActive));
});
}
} else {
if (typeof renderQuinielaMatches === 'function') renderQuinielaMatches();
}
if (typeof updateQuinielaCount === 'function') updateQuinielaCount();
if (typeof updatePrice === 'function') updatePrice();
}
function generateQuinielaCombinations() {
const partidos = AppState.getPartidos();
const predictions = AppState.getPredictions();
if (partidos.length === 0) {
console.error('❌ generateQuinielaCombinations: no hay partidos cargados');
return [];
}
const picksPerMatch = [];
for (const partido of partidos) {
const preds = predictions[partido.id];
if (!Array.isArray(preds) || preds.length === 0) {
console.warn(`⚠️ generateQuinielaCombinations: partido ${partido.id} sin predicción`);
return [];
}
const validos = preds.filter(p => REGLAS_QUINIELA.PICKS_VALIDOS.has(p));
if (validos.length === 0) {
console.warn(`⚠️ generateQuinielaCombinations: partido ${partido.id} sin picks válidos`);
return [];
}
picksPerMatch.push(validos);
}
const totalCombinations = picksPerMatch.reduce((acc, picks) => acc * picks.length, 1);
if (totalCombinations > MAX_COMBINATIONS) {
console.error(`❌ generateQuinielaCombinations: ${totalCombinations} combinaciones excede el límite de ${MAX_COMBINATIONS}`);
showToast(`Demasiadas combinaciones (${totalCombinations}). Reduce dobles o triples.`, 'error');
return [];
}
let combinations = [[]];
for (const matchPicks of picksPerMatch) {
const expanded = new Array(combinations.length * matchPicks.length);
let idx = 0;
for (const baseCombo of combinations) {
for (const pick of matchPicks) {
expanded[idx++] = [...baseCombo, pick];
}
}
combinations = expanded;
}
return combinations;
}
async function saveQuiniela() {
const nameInput = document.getElementById('playerName');
const rawName = nameInput ? nameInput.value.trim() : '';
if (!rawName) {
showErrorModal('Por favor escribe tu nombre');
return;
}
if (rawName.length > 20) {
showErrorModal('El nombre no puede tener más de 20 caracteres');
return;
}
const name = rawName
.split(/\s+/)
.filter(w => w.length > 0)
.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
.join(' ');
if (nameInput) nameInput.value = name;
const partidos = AppState.getPartidos();
if (partidos.length === 0) {
showErrorModal('No hay partidos configurados. Recarga la página.');
return;
}
const predictions = AppState.getPredictions();
const matchesConPrediccion = Object.keys(predictions).filter(id => {
const picks = predictions[id];
return Array.isArray(picks) && picks.length > 0;
}).length;
if (matchesConPrediccion < partidos.length) {
const faltantes = partidos.length - matchesConPrediccion;
showErrorModal(`Faltan ${faltantes} partido${faltantes > 1 ? 's' : ''} por llenar`);
return;
}
const { valid } = validateDoublesAndTriples(predictions, { showModal: true });
if (!valid) return;
const vendedor = VendedorManager?.current ?? currentVendedor;
if (!vendedor) {
showErrorModal('Link inválido: falta el vendedor. Usa el link de tu vendedor.');
return;
}
const jornadaNombre = window.jornadaActual?.nombre;
if (!jornadaNombre) {
showErrorModal('No se pudo determinar la jornada activa. Recarga la página.');
return;
}
const combos = generateQuinielaCombinations();
if (!Array.isArray(combos) || combos.length === 0) {
return;
}
const timestamp = Date.now();
const nuevasQuinielas = combos.map((combo, comboIndex) => {
if (combo.length !== partidos.length) {
console.error(`❌ saveQuiniela: combo[${comboIndex}] tiene ${combo.length} picks, se esperaban ${partidos.length}`);
return null;
}
const predictionsObj = {};
for (let i = 0; i < partidos.length; i++) {
const pick = combo[i];
if (!REGLAS_QUINIELA.PICKS_VALIDOS.has(pick)) {
console.error(`❌ saveQuiniela: pick inválido "${pick}" en combo[${comboIndex}][${i}]`);
return null;
}
predictionsObj[partidos[i].id] = [pick];
}
return {
id: timestamp + comboIndex,
name,
vendedor,
predictions: predictionsObj,
folio: null,
estado: 'borrador',
jornada: jornadaNombre,
userId,
};
}).filter(Boolean);
if (nuevasQuinielas.length === 0) {
showErrorModal('No se pudo generar ninguna quiniela válida. Intenta de nuevo.');
return;
}
const { added, errors } = AppState.addSaved(nuevasQuinielas);
if (errors.length > 0) {
console.warn('⚠️ saveQuiniela: algunos items fueron rechazados por AppState:', errors);
}
if (added === 0) {
showErrorModal(errors[0] ?? 'No se pudo guardar ninguna quiniela');
return;
}
AppState.resetPredictions();
if (nameInput) nameInput.value = '';
if (typeof renderQuinielaMatches === 'function') renderQuinielaMatches();
if (typeof updateQuinielaCount === 'function') updateQuinielaCount();
if (typeof updatePrice === 'function') updatePrice();
if (typeof updateSavedBadge === 'function') updateSavedBadge();
if (ENV?.isDev) console.log(`💾 saveQuiniela: ${added} quinielas guardadas para "${name}" (${vendedor})`);
}
/*-------------------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en la Navegación principal -------------------------------------------*/
const NavigationManager = (() => {
const PAGES_VALIDAS = new Set(['inicio', 'quiniela', 'resultados', 'analisis', 'ayuda', 'admin']);
const PAGINA_INICIAL = 'inicio';
const HERO_ID_MAP = {
inicio:     'hero',
quiniela:   'hero-quiniela',
resultados: 'hero-resultados',
analisis:   'hero-analisis',
ayuda:      'hero-ayuda',
admin:      'hero-admin',
};
let navToggle        = null;
let floatingNav      = null;
let navItems         = [];
let pages            = [];
let _docClickCleanup = null;
let _keydownCleanup  = null;
function updateHero(page) {
Object.values(HERO_ID_MAP).forEach(heroId => {
const el = document.getElementById(heroId);
if (el) el.classList.remove('active');
});
const heroId = HERO_ID_MAP[page];
if (!heroId) {
if (ENV?.isDev) console.warn(`⚠️ NavigationManager.updateHero: sin hero para página "${page}"`);
return;
}
const heroEl = document.getElementById(heroId);
if (heroEl) {
heroEl.classList.add('active');
} else {
if (ENV?.isDev) console.warn(`⚠️ NavigationManager.updateHero: #${heroId} no encontrado en DOM`);
}
}
function navigateTo(page) {
if (!page || !PAGES_VALIDAS.has(page)) {
console.error(`❌ NavigationManager.navigateTo: página inválida → "${page}"`);
return;
}
if (!pages || pages.length === 0) {
console.error('❌ NavigationManager.navigateTo: no hay elementos .page en el DOM');
return;
}
pages.forEach(p => p.classList.remove('active'));
const targetId = page.charAt(0).toUpperCase() + page.slice(1);
const targetPageEl = document.getElementById(`page${targetId}`);
if (!targetPageEl) {
console.error(`❌ NavigationManager.navigateTo: #page${targetId} no encontrado`);
return;
}
targetPageEl.classList.add('active');
updateHero(page);
navItems.forEach(item => {
const itemPage = item.getAttribute('data-page');
const isActive = itemPage === page;
item.classList.toggle('active', isActive);
item.setAttribute('aria-current', isActive ? 'page' : 'false');
});
window.scrollTo({ top: 0, behavior: 'smooth' });
_runPageHooks(page);
if (ENV?.isDev) console.log(`🧭 NavigationManager: → "${page}"`);
}
function _runPageHooks(page) {
try {
switch (page) {
case 'quiniela':
if (typeof renderQuinielaMatches === 'function') renderQuinielaMatches();
if (typeof updateQuinielaCount   === 'function') updateQuinielaCount();
if (typeof updatePrice           === 'function') updatePrice();
break;
case 'analisis':
_activateFirstTab('#pageAnalisis', 'horarios', 'tabHorarios');
if (typeof renderMatchesHorarios    === 'function') renderMatchesHorarios();
if (typeof renderMatchesPorcentajes === 'function') renderMatchesPorcentajes();
break;
case 'resultados':
_activateFirstTab('#pageResultados', 'misQuinielasJugadas', 'tabMisQuinielas');
if (typeof renderMyQuinielas === 'function') renderMyQuinielas();
break;
case 'admin':
setTimeout(() => {
try {
if (typeof actualizarContadorTotal === 'function') actualizarContadorTotal();
if (typeof actualizarJornadaActual === 'function') actualizarJornadaActual();
if (typeof mostrarAdminTab         === 'function') mostrarAdminTab('pendientes');
if (typeof cargarJugandoTabla      === 'function') cargarJugandoTabla();
if (typeof cargarEsperaTabla       === 'function') cargarEsperaTabla();
} catch (e) {
console.error('❌ NavigationManager: error en hooks de admin:', e);
}
}, 100);
break;
case 'inicio':
if (typeof actualizarEstadosDesdeBackend === 'function') actualizarEstadosDesdeBackend();
break;
}
} catch (e) {
console.error(`❌ NavigationManager._runPageHooks: error en hooks de "${page}":`, e);
}
}
function _activateFirstTab(sectionSelector, tabName, contentId) {
const section = document.querySelector(sectionSelector);
if (!section) return;
section.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
section.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
const firstTab = section.querySelector(`.tab-btn[data-tab="${tabName}"]`);
const firstContent = document.getElementById(contentId);
if (firstTab) firstTab.classList.add('active');
if (firstContent) firstContent.classList.add('active');
}
function _closeNav() {
if (floatingNav && floatingNav.classList.contains('open')) {
floatingNav.classList.remove('open');
if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
}
}
function _handleDocClick(e) {
if (!floatingNav || !floatingNav.classList.contains('open')) return;
if (!floatingNav.contains(e.target) && e.target !== navToggle) {
_closeNav();
}
}
function init() {
navToggle   = document.getElementById('navToggle');
floatingNav = document.getElementById('floatingNav');
navItems    = Array.from(document.querySelectorAll('.nav-item'));
pages       = Array.from(document.querySelectorAll('.page'));
if (ENV?.isDev) {
if (!navToggle)            console.warn('⚠️ NavigationManager: #navToggle no encontrado');
if (!floatingNav)          console.warn('⚠️ NavigationManager: #floatingNav no encontrado');
if (navItems.length === 0) console.warn('⚠️ NavigationManager: sin elementos .nav-item');
if (pages.length === 0)    console.warn('⚠️ NavigationManager: sin elementos .page');
}
if (navToggle && floatingNav) {
const freshToggle = navToggle.cloneNode(true);
navToggle.parentNode.replaceChild(freshToggle, navToggle);
navToggle = freshToggle;
navToggle.setAttribute('aria-expanded', 'false');
navToggle.setAttribute('aria-controls', 'floatingNav');
navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
navToggle.addEventListener('click', function(e) {
e.preventDefault();
const isOpen = floatingNav.classList.toggle('open');
navToggle.setAttribute('aria-expanded', String(isOpen));
});
if (_docClickCleanup) _docClickCleanup();
document.addEventListener('click', _handleDocClick);
_docClickCleanup = () => document.removeEventListener('click', _handleDocClick);
if (_keydownCleanup) _keydownCleanup();
const _keydownHandler = (e) => { if (e.key === 'Escape') _closeNav(); };
document.addEventListener('keydown', _keydownHandler);
_keydownCleanup = () => document.removeEventListener('keydown', _keydownHandler);
}
navItems.forEach(item => {
const page = item.getAttribute('data-page');
if (!page || !PAGES_VALIDAS.has(page)) {
if (ENV?.isDev) console.warn(`⚠️ NavigationManager: nav-item sin data-page válido:`, item);
return;
}
function activateItem(e) {
e.preventDefault();
const clickedPage = e.currentTarget.getAttribute('data-page');
if (!clickedPage || !PAGES_VALIDAS.has(clickedPage)) return;
_closeNav();
navigateTo(clickedPage);
}
item.addEventListener('click', activateItem);
item.addEventListener('keydown', function(e) {
if (e.key === 'Enter' || e.key === ' ') activateItem(e);
});
});
const paginaActiva = navItems.find(item =>
item.classList.contains('active')
)?.getAttribute('data-page') ?? PAGINA_INICIAL;
navigateTo(paginaActiva);
if (ENV?.isDev) console.log(`✅ NavigationManager inicializado. Página inicial: "${paginaActiva}"`);
}
return Object.freeze({
init,
navigateTo,
updateHero,
closeNav: _closeNav,
});
})();
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => NavigationManager.init(), { once: true });
} else {
NavigationManager.init();
}
/*----------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en Actualizar los hero con las quinielas Jugando o No jugando ---------------*/
async function fetchAPI(endpoint, {
timeout = 8000,
retries = 1,
} = {}) {
const url = apiUrl(endpoint);
if (!url) {
console.error('❌ fetchAPI: URL inválida para endpoint:', endpoint);
return { data: null, error: 'URL inválida', status: null };
}
let lastError = null;
for (let attempt = 1; attempt <= retries + 1; attempt++) {
if (attempt > 1) {
await new Promise(r => setTimeout(r, (attempt - 1) * 600));
}
const controller = new AbortController();
const timerId = setTimeout(() => controller.abort(), timeout);
try {
const res = await fetch(url, {
signal: controller.signal,
headers: { 'Accept': 'application/json' },
});
clearTimeout(timerId);
if (!res.ok) {
const isDefinitive = [400, 401, 403, 404].includes(res.status);
lastError = `HTTP ${res.status}`;
if (ENV?.isDev) console.warn(`⚠️ fetchAPI (intento ${attempt}): ${lastError} → ${url}`);
if (isDefinitive) break;
continue;
}
let data;
try {
data = await res.json();
} catch {
lastError = 'Respuesta no es JSON válido';
if (ENV?.isDev) console.warn(`⚠️ fetchAPI: ${lastError} → ${url}`);
break;
}
return { data, error: null, status: res.status };
} catch (err) {
clearTimeout(timerId);
if (err.name === 'AbortError') {
lastError = `Timeout después de ${timeout}ms`;
if (ENV?.isDev) console.warn(`⏱️ fetchAPI (intento ${attempt}): ${lastError} → ${url}`);
} else {
lastError = err.message || 'Error de red desconocido';
if (ENV?.isDev) console.warn(`🔌 fetchAPI (intento ${attempt}): ${lastError} → ${url}`);
}
}
}
return { data: null, error: lastError, status: null };
}
const CounterAnimator = (() => {
const _activeTimers = new Map();
function _cancelTimer(elementId) {
if (!_activeTimers.has(elementId)) return;
const t = _activeTimers.get(elementId);
if (t.isTimeout) clearTimeout(t.id);
else clearInterval(t.id);
_activeTimers.delete(elementId);
}
function animate(elementId, targetValue) {
const el = document.getElementById(elementId);
if (!el) return;
const target = typeof targetValue === 'number' && Number.isFinite(targetValue) && targetValue >= 0
? Math.round(targetValue)
: 0;
const current = parseInt(el.textContent, 10) || 0;
if (current === target) return;
_cancelTimer(elementId);
if (Math.abs(target - current) <= 3) {
el.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
el.style.transform = 'scale(1.15)';
const microId = setTimeout(() => {
if (document.contains(el)) {
el.textContent = target;
el.style.transform = 'scale(1)';
}
_activeTimers.delete(elementId);
}, 75);
_activeTimers.set(elementId, { id: microId, isTimeout: true });
return;
}
const PASOS = 30;
const DURACION = 800;
const diff = target - current;
const step = diff / PASOS;
let count = 0;
const intervalId = setInterval(() => {
if (!document.contains(el)) {
_cancelTimer(elementId);
return;
}
count++;
el.textContent = count >= PASOS ? target : Math.round(current + step * count);
if (count >= PASOS) {
_cancelTimer(elementId);
}
}, DURACION / PASOS);
_activeTimers.set(elementId, { id: intervalId, isTimeout: false });
}
function cancelAll() {
_activeTimers.forEach((t) => {
if (t.isTimeout) clearTimeout(t.id);
else clearInterval(t.id);
});
_activeTimers.clear();
}
return Object.freeze({ animate, cancelAll });
})();
function actualizarContadorAnimado(elementId, targetValue) {
CounterAnimator.animate(elementId, targetValue);
}
const HeroStatsManager = (() => {
let _lastJugando    = -1;
let _lastNoJugando  = -1;
let _jornadaRetries = 0;
const MAX_JORNADA_RETRIES = 10;
let _quinielaHandler   = null;
let _visibilityHandler = null;
let _periodicTimerId   = null;
let _sentChangedCleanup = null;
function updateStats() {
const sentQuinielas = AppState.getSent();
if (sentQuinielas.length === 0) {
if (_lastJugando !== 0 || _lastNoJugando !== 0) {
CounterAnimator.animate('quinielasJugandoCount', 0);
CounterAnimator.animate('quinielasNoJugandoCount', 0);
CounterAnimator.animate('quinielasJugandoCountResultados', 0);
CounterAnimator.animate('quinielasNoJugandoCountResultados', 0);
_lastJugando   = 0;
_lastNoJugando = 0;
}
return;
}
const jornadaNombre = window.jornadaActual?.nombre;
if (!jornadaNombre) {
if (_jornadaRetries >= MAX_JORNADA_RETRIES) {
console.error(`❌ HeroStatsManager: jornadaActual no disponible tras ${MAX_JORNADA_RETRIES} intentos`);
_jornadaRetries = 0;
return;
}
_jornadaRetries++;
if (ENV?.isDev) console.warn(`⚠️ HeroStatsManager: jornadaActual no disponible, reintento ${_jornadaRetries}/${MAX_JORNADA_RETRIES}`);
setTimeout(updateStats, 500);
return;
}
_jornadaRetries = 0;
let jugando   = 0;
let noJugando = 0;
for (const q of sentQuinielas) {
if (!q || typeof q !== 'object' || q.jornada !== jornadaNombre) continue;
if (q.estado === 'jugando') jugando++;
else if (q.estado === 'pendiente' || q.estado === 'espera') noJugando++;
}
if (jugando === _lastJugando && noJugando === _lastNoJugando) return;
_lastJugando   = jugando;
_lastNoJugando = noJugando;
CounterAnimator.animate('quinielasJugandoCount',             jugando);
CounterAnimator.animate('quinielasNoJugandoCount',           noJugando);
CounterAnimator.animate('quinielasJugandoCountResultados',   jugando);
CounterAnimator.animate('quinielasNoJugandoCountResultados', noJugando);
if (ENV?.isDev) {
console.log(`📊 HeroStats: Jugando=${jugando} | No jugando=${noJugando} | Jornada="${jornadaNombre}"`);
}
}
function init() {
destroy();
_quinielaHandler = () => updateStats();
document.addEventListener('quinielaAgregada', _quinielaHandler);
_visibilityHandler = () => {
if (!document.hidden) updateStats();
};
document.addEventListener('visibilitychange', _visibilityHandler);
_sentChangedCleanup = AppState.on('sentChanged', updateStats);
_periodicTimerId = setInterval(() => {
if (!document.hidden) updateStats();
}, 30_000);
updateStats();
if (ENV?.isDev) console.log('✅ HeroStatsManager inicializado');
}
function destroy() {
if (_quinielaHandler)   document.removeEventListener('quinielaAgregada', _quinielaHandler);
if (_visibilityHandler) document.removeEventListener('visibilitychange', _visibilityHandler);
// FIX: ahora sí limpiamos el listener de AppState
if (_sentChangedCleanup) { _sentChangedCleanup(); _sentChangedCleanup = null; }
if (_periodicTimerId)   clearInterval(_periodicTimerId);
CounterAnimator.cancelAll();
_quinielaHandler    = null;
_visibilityHandler  = null;
_periodicTimerId    = null;
_lastJugando        = -1;
_lastNoJugando      = -1;
_jornadaRetries     = 0;
}
return Object.freeze({ init, destroy, updateStats });
})();
function updateHeroStats() {
HeroStatsManager.updateStats();
}
HeroStatsManager.init();
/*----------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en la Navegación principal segunda parte ----------------------------------*/
function _activateTab(sectionId, tabName, contentId) {
const section = document.getElementById(sectionId);
if (!section) {
if (ENV?.isDev) console.warn(`⚠️ _activateTab: #${sectionId} no encontrado`);
return;
}
section.querySelectorAll('.tab-btn').forEach(btn => {
btn.classList.remove('active');
btn.setAttribute('aria-selected', 'false');
});
section.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
const tabBtn = section.querySelector(`.tab-btn[data-tab="${CSS.escape(tabName)}"]`);
const tabContent = document.getElementById(contentId);
if (tabBtn) { tabBtn.classList.add('active'); tabBtn.setAttribute('aria-selected', 'true'); }
if (tabContent) tabContent.classList.add('active');
}
const PAGE_HOOKS = Object.freeze({
inicio: () => {
if (typeof actualizarEstadosDesdeBackend === 'function') {
actualizarEstadosDesdeBackend();
} else if (ENV?.isDev) {
console.warn('⚠️ PAGE_HOOKS.inicio: actualizarEstadosDesdeBackend no definida');
}
HeroStatsManager.updateStats();
},
quiniela: () => {
if (typeof renderQuinielaMatches === 'function') renderQuinielaMatches();
if (typeof updateQuinielaCount === 'function') updateQuinielaCount();
if (typeof updatePrice === 'function') updatePrice();
},
analisis: () => {
_activateTab('pageAnalisis', 'horarios', 'tabHorarios');
if (typeof renderMatchesHorarios === 'function') renderMatchesHorarios();
if (typeof renderMatchesPorcentajes === 'function') renderMatchesPorcentajes();
},
resultados: () => {
_activateTab('pageResultados', 'misQuinielasJugadas', 'tabMisQuinielas');
HeroStatsManager.updateStats();
if (typeof renderMyQuinielas === 'function') renderMyQuinielas();
},
admin: () => {
setTimeout(async () => {
try {
if (typeof actualizarContadorTotal === 'function') actualizarContadorTotal();
if (typeof actualizarJornadaActual === 'function') await actualizarJornadaActual();
mostrarAdminTab('pendientes');
} catch (e) {
console.error('❌ PAGE_HOOKS.admin: error en inicialización:', e);
}
}, 100);
},
});
const AdminTabManager = (() => {
const TABS_VALIDAS = new Set(['pendientes', 'espera', 'jugando']);
const TAB_LOADERS = {
pendientes: () => typeof cargarPendientesTabla === 'function' && cargarPendientesTabla(),
espera:     () => typeof cargarEsperaTabla     === 'function' && cargarEsperaTabla(),
jugando:    () => typeof cargarJugandoTabla    === 'function' && cargarJugandoTabla(),
};
let _currentTab    = null;
let _debounceTimer = null;
const DEBOUNCE_MS  = 250;
function show(tab) {
if (!TABS_VALIDAS.has(tab)) {
console.error(`❌ AdminTabManager.show: tab inválida → "${tab}". Válidas: ${[...TABS_VALIDAS].join(', ')}`);
return;
}
clearTimeout(_debounceTimer);
_debounceTimer = setTimeout(() => _doShow(tab), DEBOUNCE_MS);
}
function _doShow(tab) {
['pendientes', 'espera', 'jugando'].forEach(sectionTab => {
const sectionId = `admin${sectionTab.charAt(0).toUpperCase() + sectionTab.slice(1)}`;
const section = document.getElementById(sectionId);
if (section) {
section.style.display = sectionTab === tab ? '' : 'none';
} else if (ENV?.isDev) {
console.warn(`⚠️ AdminTabManager: #${sectionId} no encontrado en DOM`);
}
});
document.querySelectorAll('#pageAdmin .filter-btn[data-filter]').forEach(btn => {
const isActive = btn.getAttribute('data-filter') === tab;
btn.classList.toggle('active', isActive);
btn.setAttribute('aria-pressed', String(isActive));
});
if (tab === _currentTab) {
if (ENV?.isDev) console.log(`📋 AdminTabManager: tab "${tab}" ya activa, skip reload`);
return;
}
_currentTab = tab;
try {
TAB_LOADERS[tab]?.();
} catch (e) {
console.error(`❌ AdminTabManager: error cargando tab "${tab}":`, e);
}
}
function invalidateCache() { _currentTab = null; }
return Object.freeze({ show, invalidateCache });
})();
function mostrarAdminTab(tab) { AdminTabManager.show(tab); }
function navigateTo(page) {
if (typeof NavigationManager !== 'undefined' && typeof NavigationManager.navigateTo === 'function') {
NavigationManager.navigateTo(page);
return;
}
if (ENV?.isDev) console.warn('⚠️ navigateTo: NavigationManager no disponible, usando fallback');
const PAGES_VALIDAS = new Set(['inicio', 'quiniela', 'resultados', 'analisis', 'ayuda', 'admin']);
if (!page || !PAGES_VALIDAS.has(page)) {
console.error(`❌ navigateTo: página inválida → "${page}"`);
return;
}
document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
const pageId = `page${page.charAt(0).toUpperCase() + page.slice(1)}`;
const pageEl = document.getElementById(pageId);
if (!pageEl) { console.error(`❌ navigateTo: #${pageId} no encontrado`); return; }
pageEl.classList.add('active');
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
const isActive = item.getAttribute('data-page') === page;
item.classList.toggle('active', isActive);
item.setAttribute('aria-current', isActive ? 'page' : 'false');
});
if (typeof updateHero === 'function') updateHero(page);
window.scrollTo({ top: 0, behavior: 'smooth' });
const hook = PAGE_HOOKS[page];
if (typeof hook === 'function') {
try { hook(); }
catch (e) { console.error(`❌ navigateTo: error en hook de "${page}":`, e); }
}
if (ENV?.isDev) console.log(`🧭 navigateTo (fallback): → "${page}"`);
}
(function initFilterBtnListener() {
if (window._filterBtnCleanup) window._filterBtnCleanup();
function handler(e) {
const btn = e.target.closest('.filter-btn[data-filter]');
if (!btn) return;
const tab = btn.getAttribute('data-filter');
const pageAdmin = document.getElementById('pageAdmin');
if (!tab || !pageAdmin || !pageAdmin.classList.contains('active')) return;
AdminTabManager.show(tab);
}
document.addEventListener('click', handler);
window._filterBtnCleanup = () => document.removeEventListener('click', handler);
})();
if (window._pageNavigatedCleanup) window._pageNavigatedCleanup();
function _pageNavigatedHandler(e) {
const page = e?.detail?.page;
if (!page) return;
const hook = PAGE_HOOKS[page];
if (typeof hook === 'function') {
try { hook(); }
catch (err) { console.error(`❌ pageNavigated hook "${page}":`, err); }
}
}
document.addEventListener('pageNavigated', _pageNavigatedHandler);
window._pageNavigatedCleanup = () => document.removeEventListener('pageNavigated', _pageNavigatedHandler);
/*----------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en la informacion de la jornada actual ----------------------------------------*/
const JornadaManager = (() => {
let _jornadaActual = null;
const SCHEMA_REQUERIDO = ['nombre', 'inicio', 'fin', 'link_grupo', 'codigo_grupo'];
function _validateSchema(data) {
if (!data || typeof data !== 'object' || Array.isArray(data)) {
return { valid: false, reason: 'No es un objeto' };
}
for (const campo of SCHEMA_REQUERIDO) {
if (!(campo in data)) {
return { valid: false, reason: `Campo requerido faltante: "${campo}"` };
}
}
if (typeof data.nombre !== 'string' || !data.nombre.trim()) {
return { valid: false, reason: 'nombre vacío o inválido' };
}
if (typeof data.codigo_grupo !== 'string' || !data.codigo_grupo.trim()) {
return { valid: false, reason: 'codigo_grupo vacío o inválido' };
}
if (!_isWhatsAppUrl(data.link_grupo)) {
return { valid: false, reason: `link_grupo no es una URL de WhatsApp válida: "${data.link_grupo}"` };
}
return { valid: true };
}
function _isWhatsAppUrl(url) {
if (typeof url !== 'string' || !url.trim()) return false;
try {
const parsed = new URL(url);
return (
parsed.protocol === 'https:' &&
(parsed.hostname === 'chat.whatsapp.com' ||
parsed.hostname === 'wa.me' ||
parsed.hostname === 'api.whatsapp.com')
);
} catch {
return false;
}
}
function getJornada() { return _jornadaActual; }
function actualizarDOM() {
if (!_jornadaActual) {
if (ENV?.isDev) console.warn('⚠️ JornadaManager.actualizarDOM: sin jornada cargada');
return;
}
const nombre      = _jornadaActual.nombre.trim();
const codigoGrupo = String(_jornadaActual.codigo_grupo).trim();
const linkGrupo   = _jornadaActual.link_grupo;
const badges = document.querySelectorAll('.jornada-badge');
if (badges.length === 0 && ENV?.isDev) {
console.warn('⚠️ JornadaManager.actualizarDOM: sin elementos .jornada-badge en DOM');
}
badges.forEach(badge => {
badge.textContent = nombre ? `${nombre} Liga MX` : 'Liga MX';
});
const grupoLink = document.querySelector('.grupo-jornada');
if (grupoLink) {
grupoLink.href = linkGrupo;
grupoLink.setAttribute('rel', 'noopener noreferrer');
}
const grupoTexto = document.querySelector('.texto-grupo-jornada');
if (grupoTexto) {
grupoTexto.textContent = codigoGrupo
? `Únete al grupo de WhatsApp ${codigoGrupo}`
: 'Únete al grupo de WhatsApp';
}
if (ENV?.isDev) {
console.log(`✅ JornadaManager: DOM actualizado → "${nombre}" (${_jornadaActual.inicio} → ${_jornadaActual.fin})`);
}
}
async function cargar({ maxRetries = 2 } = {}) {
if (_jornadaActual) {
if (ENV?.isDev) console.log('📅 JornadaManager: jornada ya cargada, skip fetch');
actualizarDOM();
return true;
}
let lastError = null;
for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
if (attempt > 1) {
const delay = (attempt - 1) * 1000;
if (ENV?.isDev) console.log(`🔄 JornadaManager: reintento ${attempt - 1}/${maxRetries} en ${delay}ms`);
await new Promise(r => setTimeout(r, delay));
}
const { data, error } = await fetchAPI('/jornada-actual', { timeout: 10000 });
if (error || !data) {
lastError = error ?? 'Respuesta vacía del servidor';
if (ENV?.isDev) console.warn(`⚠️ JornadaManager (intento ${attempt}): ${lastError}`);
continue;
}
const { valid, reason } = _validateSchema(data);
if (!valid) {
console.error(`❌ JornadaManager: schema inválido del servidor → ${reason}`, data);
break;
}
_jornadaActual = Object.freeze({ ...data });
Object.defineProperty(window, 'jornadaActual', {
get: () => _jornadaActual,
set: () => {
console.warn('⚠️ window.jornadaActual es de solo lectura. Usa JornadaManager.cargar()');
},
configurable: true,
});
actualizarDOM();
document.dispatchEvent(new CustomEvent('jornadaCargada', {
detail: { jornada: _jornadaActual },
bubbles: false,
}));
return true;
}
console.error(`❌ JornadaManager: no se pudo cargar la jornada tras ${maxRetries + 1} intentos. Último error: ${lastError}`);
showToast('No se pudo cargar la jornada actual. Recarga la página.', 'error');
return false;
}
return Object.freeze({ cargar, getJornada, actualizarDOM });
})();
async function cargarJornadaActual() { return JornadaManager.cargar(); }
function actualizarJornada() { JornadaManager.actualizarDOM(); }
async function _initJornada() {
const ok = await JornadaManager.cargar();
if (ok) {
if (typeof actualizarEstadosDesdeBackend === 'function') {
try {
await actualizarEstadosDesdeBackend();
} catch (e) {
console.error('❌ _initJornada: error en actualizarEstadosDesdeBackend:', e);
}
} else if (ENV?.isDev) {
console.warn('⚠️ _initJornada: actualizarEstadosDesdeBackend no definida');
}
} else {
if (typeof actualizarEstadosDesdeBackend === 'function') {
setTimeout(() => {
try { actualizarEstadosDesdeBackend(); } catch { /* silencioso */ }
}, 500);
}
}
}
if (window._jornadaCargadaCleanup) window._jornadaCargadaCleanup();
function _jornadaCargadaHandler(e) {
if (ENV?.isDev) console.log('📅 Evento jornadaCargada recibido:', e.detail?.jornada?.nombre);
if (typeof HeroStatsManager !== 'undefined') HeroStatsManager.updateStats();
}
document.addEventListener('jornadaCargada', _jornadaCargadaHandler);
window._jornadaCargadaCleanup = () => document.removeEventListener('jornadaCargada', _jornadaCargadaHandler);
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', _initJornada, { once: true });
} else {
_initJornada();
}
/*----------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en la Lista Oficial--------------------------------------------------------*/
const ListaOficialManager = (() => {
let _officialResults = {};
let _participants    = [];
let _resumen         = {};
let _dataLoaded      = false;
let _loadedAt        = null;
const CACHE_TTL_MS   = 5 * 60 * 1000;
function _picksToObj(picksArray, partidos) {
const obj = {};
if (!Array.isArray(picksArray) || !Array.isArray(partidos)) return obj;
picksArray.forEach((pick, i) => {
const partido = partidos[i];
if (partido && typeof pick === 'string') {
obj[String(partido.id)] = pick;
}
});
return obj;
}
function _calcularPuntos(picksObj, resultadosObj) {
let puntos = 0;
for (const [matchId, pick] of Object.entries(picksObj)) {
if (resultadosObj[matchId] && pick === resultadosObj[matchId]) puntos++;
}
return puntos;
}
function _buildResumen(sorted) {
if (!sorted.length) {
return {
total_participantes: 0,
first_place_points:  0, first_place_count:  0,
second_place_points: 0, second_place_count: 0,
};
}
const fp        = sorted[0].points;
const secondObj = sorted.find(p => p.points < fp);
const sp        = secondObj?.points ?? 0;
return {
total_participantes: sorted.length,
first_place_points:  fp,
first_place_count:   sorted.filter(p => p.points === fp).length,
second_place_points: sp,
second_place_count:  secondObj ? sorted.filter(p => p.points === sp).length : 0,
};
}
function _validateQuinielaItem(q) {
return (
q && typeof q === 'object' &&
typeof q.folio === 'string' && q.folio.trim() &&
Array.isArray(q.picks)
);
}
function _formatPuntos(n) {
if (typeof n !== 'number' || n < 0) return 'Sin datos';
return n === 1 ? 'Con 1 punto' : `Con ${n} puntos`;
}
function _updateResumenElements(totalId, puntosId, count, puntos, emptyText = 'Sin lugar') {
const totalEl  = document.getElementById(totalId);
const puntosEl = document.getElementById(puntosId);
if (totalEl)  totalEl.textContent  = count ?? '0';
if (puntosEl) puntosEl.textContent = count ? _formatPuntos(puntos) : emptyText;
}
function _isCacheValid() {
return _dataLoaded && _loadedAt && (Date.now() - _loadedAt < CACHE_TTL_MS);
}
async function loadData({ force = false } = {}) {
if (!force && _isCacheValid()) return true;
const partidos = AppState.getPartidos();
if (partidos.length === 0) {
console.error('❌ ListaOficialManager.loadData: partidos no cargados en AppState');
return false;
}
const tbody = document.getElementById('resultsBody');
if (tbody) tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;padding:2rem;color:var(--color-text-muted)">Cargando resultados...</td></tr>';
const [resOficial, resResultados] = await Promise.all([
fetchAPI('/api/lista-oficial',        { timeout: 10000, retries: 1 }),
fetchAPI('/api/resultados-oficiales', { timeout: 10000, retries: 1 }),
]);
if (resOficial.error || !resOficial.data) {
console.error('❌ ListaOficialManager: error cargando lista oficial:', resOficial.error);
showToast('Error al cargar la Lista Oficial', 'error');
return false;
}
if (resResultados.error || !resResultados.data) {
console.error('❌ ListaOficialManager: error cargando resultados:', resResultados.error);
showToast('Error al cargar los resultados oficiales', 'error');
return false;
}
const quinielas    = resOficial.data?.quinielas;
const resultadosRaw = resResultados.data?.resultados;
if (!Array.isArray(quinielas)) {
console.error('❌ ListaOficialManager: "quinielas" no es array:', typeof quinielas);
return false;
}
if (!resultadosRaw || typeof resultadosRaw !== 'object') {
console.error('❌ ListaOficialManager: "resultados" inválido:', typeof resultadosRaw);
return false;
}
const resultadosNormalizados = {};
const resultadosEntries = Object.entries(resultadosRaw);
const sonIndicesPositionales = resultadosEntries.every(
([k]) => /^\d+$/.test(k) && parseInt(k, 10) < partidos.length
);
if (sonIndicesPositionales) {
resultadosEntries.forEach(([idx, val]) => {
const partido = partidos[parseInt(idx, 10)];
if (partido && typeof val === 'string') {
resultadosNormalizados[String(partido.id)] = val;
}
});
} else {
resultadosEntries.forEach(([k, v]) => {
if (typeof v === 'string') resultadosNormalizados[k] = v;
});
}
_officialResults = Object.freeze(resultadosNormalizados);
const mapped = [];
for (const q of quinielas) {
if (!_validateQuinielaItem(q)) {
console.warn('⚠️ ListaOficialManager: quiniela inválida descartada:', q);
continue;
}
const picksObj = _picksToObj(q.picks, partidos);
const puntos   = _calcularPuntos(picksObj, _officialResults);
mapped.push({
id:          q.folio.trim(),
name:        typeof q.nombre   === 'string' ? q.nombre.trim()   : 'Sin nombre',
vendor:      typeof q.vendedor === 'string' ? q.vendedor.trim() : 'Sin vendedor',
predictions: picksObj,
points:      puntos,
});
}
_participants = mapped.sort((a, b) => b.points - a.points);
_resumen      = _buildResumen(_participants);
_dataLoaded   = true;
_loadedAt     = Date.now();
if (ENV?.isDev) {
console.log('✅ ListaOficialManager cargado:', {
participantes: _participants.length,
primer_lugar:  _resumen.first_place_count,
segundo_lugar: _resumen.second_place_count,
});
}
return true;
}
function invalidateCache() {
_dataLoaded = false;
_loadedAt   = null;
}
function renderMatchesHeader() {
const partidos = AppState.getPartidos();
const headerCells = document.querySelectorAll(
'#tabListaGeneral .results-table thead .col-match, ' +
'#admin-quinielas-jugando .results-table thead .col-match'
);
headerCells.forEach(th => {
const rawIndex = th.dataset.matchIndex;
const index    = parseInt(rawIndex, 10);
if (!Number.isFinite(index) || index < 1 || index > partidos.length) {
if (ENV?.isDev) console.warn(`⚠️ renderMatchesHeader: matchIndex inválido "${rawIndex}"`);
return;
}
const partido = partidos[index - 1];
if (!partido) return;
th.innerHTML = '';
const wrapper = document.createElement('div');
wrapper.className = 'match-header';
const imgLocal = document.createElement('img');
imgLocal.src       = _isSafeImageUrl(partido.localLogo) ? escapeHtml(partido.localLogo) : '';
imgLocal.alt       = escapeHtml(partido.local);
imgLocal.className = 'match-logo';
imgLocal.width     = 20;
imgLocal.height    = 20;
imgLocal.onerror   = () => { imgLocal.style.visibility = 'hidden'; };
const vs = document.createElement('span');
vs.className   = 'match-vs';
vs.textContent = 'vs';
const imgVisitante = document.createElement('img');
imgVisitante.src       = _isSafeImageUrl(partido.visitanteLogo) ? escapeHtml(partido.visitanteLogo) : '';
imgVisitante.alt       = escapeHtml(partido.visitante);
imgVisitante.className = 'match-logo';
imgVisitante.width     = 20;
imgVisitante.height    = 20;
imgVisitante.onerror   = () => { imgVisitante.style.visibility = 'hidden'; };
wrapper.appendChild(imgLocal);
wrapper.appendChild(vs);
wrapper.appendChild(imgVisitante);
th.appendChild(wrapper);
});
}
function renderResults() {
const tbody = document.getElementById('resultsBody');
if (!tbody) return;
const partidos = AppState.getPartidos();
if (!_participants.length) {
tbody.innerHTML = '';
return;
}
const fp = _resumen.first_place_points;
const sp = _resumen.second_place_points;
const rows = _participants.map(p => {
const isFirst  = p.points === fp;
const isSecond = !isFirst && _resumen.second_place_count > 0 && p.points === sp;
const cls      = isFirst ? 'points-gold' : (isSecond ? 'points-silver' : 'points-normal');
const matchCells = partidos.map(partido => {
const res              = p.predictions[String(partido.id)] || '';
const resultadoOficial = _officialResults[String(partido.id)] || '';
const cellCls = !resultadoOficial
? 'pending'
: (res && res === resultadoOficial ? 'correct' : 'incorrect');
return `<td class="col-match"><span class="result-cell ${cellCls}">${escapeHtml(res) || '-'}</span></td>`;
}).join('');
return (
'<tr>' +
`<td class="col-folio">${escapeHtml(p.id || '-')}</td>` +
`<td class="col-name">${escapeHtml(p.name)}</td>` +
`<td class="col-vendor">${escapeHtml(p.vendor || '-')}</td>` +
matchCells +
`<td class="col-points"><span class="points-cell ${cls}">${p.points}</span></td>` +
'</tr>'
);
}).join('');
tbody.innerHTML = rows;
}
function updateSummary() {
if (!_resumen || typeof _resumen.total_participantes === 'undefined') return;
const totalEl = document.getElementById('totalCount');
if (totalEl) totalEl.textContent = _resumen.total_participantes;
_updateResumenElements(
'firstPlaceCount',  'firstPlacePoints',
_resumen.first_place_count, _resumen.first_place_points,
'Sin participantes'
);
_updateResumenElements(
'secondPlaceCount', 'secondPlacePoints',
_resumen.second_place_count, _resumen.second_place_points,
'Sin segundo lugar'
);
const firstTotalEl  = document.getElementById('firstPlaceTotal');
const secondTotalEl = document.getElementById('secondPlaceTotal');
if (firstTotalEl)  firstTotalEl.textContent  = _resumen.first_place_count;
if (secondTotalEl) secondTotalEl.textContent = _resumen.second_place_count;
}
function renderWinnersList(targetId, place = 'first') {
const PLACES_VALIDOS = new Set(['first', 'second']);
if (!PLACES_VALIDOS.has(place)) {
console.error(`❌ renderWinnersList: place inválido → "${place}"`);
return;
}
const targetPoints = place === 'first'
? _resumen.first_place_points
: _resumen.second_place_points;
const winners = _resumen.second_place_count === 0 && place === 'second'
? []
: _participants.filter(p => p.points === targetPoints);
const container = document.getElementById(targetId);
if (!container) {
if (place === 'first') {
const firstPlaceTotalEl  = document.getElementById('firstPlaceTotal');
const firstPlacePointsEl = document.getElementById('firstPlacePoints');
if (firstPlaceTotalEl)  firstPlaceTotalEl.textContent  = String(winners.length || 0);
if (firstPlacePointsEl) {
firstPlacePointsEl.textContent =
targetPoints === 0 ? 'Sin participantes' :
targetPoints === 1 ? 'Con 1 punto' :
`Con ${targetPoints} puntos`;
}
} else {
const secondPlaceTotalEl  = document.getElementById('secondPlaceTotal');
const secondPlacePointsEl = document.getElementById('secondPlacePoints');
if (secondPlaceTotalEl)  secondPlaceTotalEl.textContent  = String(winners.length || 0);
if (secondPlacePointsEl) {
if (!winners.length || targetPoints === 0) {
secondPlacePointsEl.textContent = 'Sin segundo lugar';
} else if (targetPoints === 1) {
secondPlacePointsEl.textContent = 'Con 1 punto';
} else {
secondPlacePointsEl.textContent = `Con ${targetPoints} puntos`;
}
}
}
return;
}
if (place === 'first') {
_updateResumenElements(
'firstPlaceTotal',  'firstPlacePoints',
winners.length, targetPoints, 'Sin participantes'
);
} else {
_updateResumenElements(
'secondPlaceTotal', 'secondPlacePoints',
winners.length, targetPoints, 'Sin segundo lugar'
);
}
if (!winners.length) {
container.innerHTML = `<p class="empty-text">${place === 'second' ? 'Sin segundo lugar' : 'Sin participantes'}</p>`;
return;
}
container.innerHTML = winners.map(w => {
const puntosTxt = w.points === 1 ? '1 punto' : `${w.points} puntos`;
return (
'<div class="winner-card">' +
`<div class="winner-folio">Folio: ${escapeHtml(w.id)}</div>` +
`<div class="winner-name">${escapeHtml(w.name)}</div>` +
`<div class="winner-vendor">${escapeHtml(w.vendor)}</div>` +
`<div class="winner-points">${puntosTxt}</div>` +
'</div>'
);
}).join('');
}
function initFirstPlacePage() {
renderWinnersList('firstPlaceList', 'first');
updateSummary();
}
function initSecondPlacePage() {
renderWinnersList('secondPlaceList', 'second');
updateSummary();
}
return Object.freeze({
loadData,
invalidateCache,
renderMatchesHeader,
renderResults,
updateSummary,
renderWinnersList,
initFirstPlacePage,
initSecondPlacePage,
getParticipants: () => [..._participants],
getResumen:      () => ({ ..._resumen }),
getOfficialResults: () => ({ ..._officialResults }),
});
})();
async function loadDataFromAPI() {
return ListaOficialManager.loadData();
}
function renderMatchesHeader() {
ListaOficialManager.renderMatchesHeader();
}
const quiniela = {
renderResults:       () => ListaOficialManager.renderResults(),
updateSummary:       () => ListaOficialManager.updateSummary(),
renderWinnersList:   (id, place) => ListaOficialManager.renderWinnersList(id, place),
initFirstPlacePage:  () => ListaOficialManager.initFirstPlacePage(),
initSecondPlacePage: () => ListaOficialManager.initSecondPlacePage(),
};
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en el verificador de la quiniela (Lista Oficial) -----------------------------*/
const ParticipantSearch = (() => {
function _normalize(str) {
if (typeof str !== 'string') str = String(str ?? '');
return str
.toLowerCase()
.normalize('NFD')
.replace(/\p{Diacritic}/gu, '')
.trim();
}
let _debounceTimer  = null;
const DEBOUNCE_MS   = 350;
let _input          = null;
let _container      = null;
let _inputHandler   = null;
let _keydownHandler = null;
function _renderEmpty(icon, text) {
if (!_container) return;
_container.innerHTML =
`<div class="no-results">` +
`<span class="no-results-icon">${icon}</span>` +
`<p>${text}</p>` +
`</div>`;
}
function _renderLoading() {
if (!_container) return;
_container.innerHTML =
`<div class="no-results">` +
`<span class="no-results-icon">⏳</span>` +
`<p>Buscando...</p>` +
`</div>`;
}
function _renderCard(q, firstPoints, secondPoints, partidos, resultados) {
const isFirst     = q.points === firstPoints && firstPoints > 0;
const isSecond    = !isFirst && secondPoints > 0 && q.points === secondPoints;
const placeClass  = isFirst ? ' first-place' : (isSecond ? ' second-place' : '');
const puntosTexto = q.points === 1 ? '1 Punto' : `${q.points} Puntos`;
const predictionsHtml = partidos.map(partido => {
const matchId          = String(partido.id);
const pick             = q.predictions?.[matchId] || '-';
const resultadoOficial = resultados[matchId] || '';
const cellCls = !resultadoOficial
? ''
: (pick && pick === resultadoOficial ? 'correct' : 'incorrect');
return (
`<div class="verify-item${cellCls ? ` ${cellCls}` : ''}">` +
`<span class="match-result">${escapeHtml(pick)}</span>` +
`</div>`
);
}).join('');
return (
`<div class="verify-card${placeClass}">` +
`<div class="verify-header">` +
`<div>` +
`<h4>${escapeHtml(q.name)}</h4>` +
`<p>Vendedor: ${escapeHtml(q.vendor)}</p>` +
`</div>` +
`<div class="verify-points"><span>${puntosTexto}</span></div>` +
`</div>` +
`<div class="verify-predictions">${predictionsHtml}</div>` +
`<div class="verify-folio">Folio: ${escapeHtml(q.id)}</div>` +
`</div>`
);
}
async function _doSearch() {
if (!_input || !_container) return;
const rawTerm = _input.value.trim();
if (!rawTerm) {
_renderEmpty('🔎', 'Buscar jugada');
return;
}
_renderLoading();
const ok = await ListaOficialManager.loadData();
if (!ok) {
_renderEmpty('❌', 'Error al cargar datos. Intenta de nuevo.');
return;
}
const participants = ListaOficialManager.getParticipants();
const resumen      = ListaOficialManager.getResumen();
if (!participants.length) {
_renderEmpty('❌', 'No hay jugadas cargadas.');
return;
}
const termNorm = _normalize(rawTerm);
const filtered = participants.filter(p => {
const nombreNorm = _normalize(p.name);
const vendorNorm = _normalize(p.vendor);
const folioNorm  = _normalize(p.id);
return (
nombreNorm.includes(termNorm) ||
vendorNorm.includes(termNorm) ||
folioNorm.includes(termNorm)
);
});
if (ENV?.isDev) {
console.log(`🔍 ParticipantSearch: "${rawTerm}" → ${filtered.length}/${participants.length}`);
}
if (!filtered.length) {
_container.innerHTML =
`<div class="no-results">` +
`<span class="no-results-icon">😔</span>` +
`<p>No se encontró "${escapeHtml(rawTerm)}"</p>` +
`</div>`;
return;
}
const fp = resumen.first_place_points;
const sp = resumen.second_place_points;
const partidos   = AppState.getPartidos();
const resultados = ListaOficialManager.getOfficialResults?.() ?? {};
_container.innerHTML = filtered
.map(q => _renderCard(q, fp, sp, partidos, resultados))
.join('');
}
function search() {
clearTimeout(_debounceTimer);
_debounceTimer = setTimeout(_doSearch, DEBOUNCE_MS);
}
function searchImmediate() {
clearTimeout(_debounceTimer);
_doSearch();
}
function init() {
_input     = document.getElementById('searchInput');
_container = document.getElementById('searchResults');
if (!_input || !_container) {
if (ENV?.isDev) console.warn('⚠️ ParticipantSearch.init: elementos del DOM no encontrados');
return;
}
if (_inputHandler)   _input.removeEventListener('input',   _inputHandler);
if (_keydownHandler) _input.removeEventListener('keydown', _keydownHandler);
_inputHandler   = () => search();
_keydownHandler = (e) => {
if (e.key === 'Enter') {
e.preventDefault();
searchImmediate();
}
};
_input.addEventListener('input',   _inputHandler);
_input.addEventListener('keydown', _keydownHandler);
_renderEmpty('🔎', 'Buscar jugada');
if (ENV?.isDev) console.log('✅ ParticipantSearch inicializado');
}
return Object.freeze({ init, search, searchImmediate });
})();
if (typeof quiniela !== 'undefined') {
quiniela.searchParticipant = () => ParticipantSearch.searchImmediate();
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => ParticipantSearch.init(), { once: true });
} else {
ParticipantSearch.init();
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en el simulador de la quiniela  ---------------------------------------*/
const SimuladorManager = (() => {
let _simState      = {};
let _rankedCache   = null;
let _initialized   = false;
let _gridListener  = null;
let _resetListener = null;
let _processing    = false;
function _getPartidos() {
return AppState.getPartidos();
}
function _initSimState() {
const partidos = _getPartidos();
_simState = {};
partidos.forEach(p => { _simState[String(p.id)] = '-'; });
_rankedCache = null;
}
function _isComplete() {
return Object.values(_simState).every(v => v !== '-');
}
function _calculatePointsFromObj(predictionsObj) {
if (!predictionsObj || typeof predictionsObj !== 'object') return 0;
let points = 0;
for (const [matchId, pick] of Object.entries(predictionsObj)) {
const simResult = _simState[matchId];
if (simResult && simResult !== '-' && pick === simResult) points++;
}
return points;
}
function _getRanked() {
if (_rankedCache) return _rankedCache;
const participants = ListaOficialManager.getParticipants();
if (!participants.length) {
_rankedCache = [];
return _rankedCache;
}
const ranked = participants.map(p => ({
folio:    p.id,
nombre:   p.name,
vendedor: p.vendor,
picks:    p.predictions,
puntos:   _calculatePointsFromObj(p.predictions),
}));
ranked.sort((a, b) => {
if (b.puntos !== a.puntos) return b.puntos - a.puntos;
return String(a.folio).localeCompare(String(b.folio), 'es', { numeric: true });
});
_rankedCache = ranked;
return _rankedCache;
}
function _setGridDisabled(disabled) {
const grid = document.getElementById('simulationGrid');
if (!grid) return;
grid.querySelectorAll('.sim-result-btn').forEach(btn => {
btn.disabled = disabled;
});
grid.style.opacity       = disabled ? '0.55' : '1';
grid.style.pointerEvents = disabled ? 'none' : '';
// Spinner overlay
let overlay = document.getElementById('_simProcessingOverlay');
if (disabled) {
if (!overlay) {
overlay = document.createElement('div');
overlay.id = '_simProcessingOverlay';
overlay.setAttribute('aria-live', 'polite');
overlay.setAttribute('aria-label', 'Calculando resultados...');
overlay.style.cssText = [
'position:absolute',
'inset:0',
'display:flex',
'align-items:center',
'justify-content:center',
'background:oklch(from var(--color-bg,#f7f6f2) l c h / 0.55)',
'z-index:10',
'border-radius:inherit',
'pointer-events:none',
].join(';');
overlay.innerHTML =
'<div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem">' +
'<div style="width:28px;height:28px;border:3px solid var(--color-primary,#01696f);' +
'border-top-color:transparent;border-radius:50%;animation:_simSpin 0.7s linear infinite"></div>' +
'<span style="font-size:0.75rem;color:var(--color-text-muted,#7a7974);font-weight:500">Calculando...</span>' +
'</div>';
if (!document.getElementById('_simSpinStyle')) {
const style = document.createElement('style');
style.id = '_simSpinStyle';
style.textContent = '@keyframes _simSpin{to{transform:rotate(360deg)}}';
document.head.appendChild(style);
}
}
const parent = grid.parentElement;
if (parent) {
const pos = getComputedStyle(parent).position;
if (pos === 'static') parent.style.position = 'relative';
parent.appendChild(overlay);
}
} else {
overlay?.remove();
}
}
function _renderGrid() {
const grid = document.getElementById('simulationGrid');
if (!grid) return;
const partidos = _getPartidos();
const fragment = document.createDocumentFragment();
partidos.forEach(partido => {
const matchId = String(partido.id);
const current = _simState[matchId] ?? '-';
const card = document.createElement('div');
card.className = 'sim-match-card';
const row = document.createElement('div');
row.className = 'sim-match-row';
row.dataset.matchId = matchId;
const btnL         = _createSimBtn('L', matchId, current === 'L');
const teamLocal    = _createTeamEl(partido.localLogo,     partido.local,     false);
const btnE         = _createSimBtn('E', matchId, current === 'E');
const teamVisitante = _createTeamEl(partido.visitanteLogo, partido.visitante, true);
const btnV         = _createSimBtn('V', matchId, current === 'V');
row.appendChild(btnL);
row.appendChild(teamLocal);
row.appendChild(btnE);
row.appendChild(teamVisitante);
row.appendChild(btnV);
card.appendChild(row);
fragment.appendChild(card);
});
if (_gridListener) {
grid.removeEventListener('click', _gridListener);
_gridListener = null;
}
grid.innerHTML = '';
grid.appendChild(fragment);
_gridListener = function(e) {
if (_processing) return;
const btn = e.target.closest('.sim-result-btn[data-match-id][data-result]');
if (!btn) return;
const matchId = btn.dataset.matchId;
const result  = btn.dataset.result;
if (!matchId || !['L', 'E', 'V'].includes(result)) return;
_processing = true;
_setGridDisabled(true);
const row = btn.closest('.sim-match-row');
if (row) {
row.querySelectorAll('.sim-result-btn').forEach(b => {
b.classList.remove('selected');
b.setAttribute('aria-pressed', 'false');
});
}
btn.classList.add('selected');
btn.setAttribute('aria-pressed', 'true');
_simState[matchId] = result;
_rankedCache = null;
requestAnimationFrame(() => {
const ranked = _getRanked();
_renderResults(ranked);
_updateSummary(ranked);
_processing = false;
_setGridDisabled(false);
});
};
grid.addEventListener('click', _gridListener);
}
function _createSimBtn(result, matchId, isSelected) {
const btn = document.createElement('button');
btn.className       = `sim-result-btn${isSelected ? ' selected' : ''}`;
btn.dataset.matchId = matchId;
btn.dataset.result  = result;
btn.textContent     = result;
btn.setAttribute('aria-pressed', String(isSelected));
btn.setAttribute('aria-label', `Resultado ${result}`);
return btn;
}
function _createTeamEl(logoUrl, teamName, isRight) {
const div = document.createElement('div');
div.className = `sim-team-inline${isRight ? ' right' : ''}`;
const img = document.createElement('img');
img.src       = _isSafeImageUrl(logoUrl) ? escapeHtml(logoUrl) : '';
img.alt       = escapeHtml(teamName ?? '');
img.width     = 20;
img.height    = 20;
img.onerror   = () => { img.style.visibility = 'hidden'; };
img.className = 'team-logo-sim';
const span = document.createElement('span');
span.textContent = teamName ?? '';
if (isRight) {
div.appendChild(span);
div.appendChild(img);
} else {
div.appendChild(img);
div.appendChild(span);
}
return div;
}
function _renderResults(ranked) {
const tbody = document.getElementById('simulationResultsBody');
if (!tbody) return;
if (!ranked.length) {
tbody.innerHTML = '<tr><td colspan="100%" class="sim-empty-state">No hay datos para simular</td></tr>';
return;
}
const partidos     = _getPartidos();
const firstPoints  = ranked[0].puntos;
const secondObj    = ranked.find(r => r.puntos < firstPoints);
const secondPoints = secondObj?.puntos ?? 0;
const isSimComplete = _isComplete();
const rows = ranked.map(q => {
const isFirst  = q.puntos === firstPoints;
const isSecond = !isFirst && secondPoints > 0 && q.puntos === secondPoints;
const cls      = isFirst ? 'points-gold' : (isSecond ? 'points-silver' : 'points-normal');
const matchCells = partidos.map(partido => {
const matchId   = String(partido.id);
const pick      = q.picks?.[matchId] || '-';
const simResult = _simState[matchId];
const cellCls   = simResult === '-'
? 'pending'
: (pick && pick === simResult ? 'correct' : 'incorrect');
return `<td class="col-match"><span class="result-cell ${cellCls}">${escapeHtml(pick)}</span></td>`;
}).join('');
const completeBadge = isSimComplete && isFirst
? '<span class="sim-winner-badge">🏆</span>'
: '';
return (
'<tr>' +
`<td class="col-folio">${escapeHtml(q.folio)}</td>` +
`<td class="col-name">${escapeHtml(q.nombre)}${completeBadge}</td>` +
`<td class="col-vendor">${escapeHtml(q.vendedor)}</td>` +
matchCells +
`<td class="col-points"><span class="points-cell ${cls}">${q.puntos}</span></td>` +
'</tr>'
);
}).join('');
tbody.innerHTML = rows;
}
function _updateSummary(ranked) {
const simFirstPlace  = document.getElementById('simFirstPlace');
const simSecondPlace = document.getElementById('simSecondPlace');
const simTotal       = document.getElementById('simTotal');
if (!ranked.length) {
if (simFirstPlace)  simFirstPlace.textContent  = '0';
if (simSecondPlace) simSecondPlace.textContent = '0';
if (simTotal)       simTotal.textContent       = '0';
return;
}
const firstPoints = ranked[0].puntos;
const firstCount  = ranked.filter(q => q.puntos === firstPoints).length;
const secondObj   = ranked.find(q => q.puntos < firstPoints);
const secondCount = secondObj
? ranked.filter(q => q.puntos === secondObj.puntos).length
: 0;
if (simFirstPlace)  simFirstPlace.textContent  = firstCount;
if (simSecondPlace) simSecondPlace.textContent = secondCount;
if (simTotal)       simTotal.textContent       = ranked.length;
}
async function init() {
if (_initialized) {
reset();
return;
}
const grid = document.getElementById('simulationGrid');
const ok = await ListaOficialManager.loadData();
if (!ok) {
if (grid) grid.innerHTML = '<div class="sim-error-state">❌ Error al cargar el simulador</div>';
console.error('❌ SimuladorManager.init: no se pudieron cargar los datos');
return;
}
const partidos = _getPartidos();
if (partidos.length === 0) {
if (grid) grid.innerHTML = '<div class="sim-error-state">⚠️ No hay partidos configurados</div>';
console.error('❌ SimuladorManager.init: AppState sin partidos');
return;
}
_initSimState();
_rankedCache = null;
_renderGrid();
const ranked = _getRanked();
_renderResults(ranked);
_updateSummary(ranked);
const resetBtn = document.getElementById('resetSimulation');
if (resetBtn) {
if (_resetListener) resetBtn.removeEventListener('click', _resetListener);
_resetListener = () => reset();
resetBtn.addEventListener('click', _resetListener);
}
_initialized = true;
if (ENV?.isDev) console.log('✅ SimuladorManager inicializado:', partidos.length, 'partidos');
}
function reset() {
_initSimState();
_renderGrid();
const ranked = _getRanked();
_renderResults(ranked);
_updateSummary(ranked);
}
function destroy() {
const grid     = document.getElementById('simulationGrid');
const resetBtn = document.getElementById('resetSimulation');
if (grid && _gridListener)      grid.removeEventListener('click', _gridListener);
if (resetBtn && _resetListener) resetBtn.removeEventListener('click', _resetListener);
_gridListener  = null;
_resetListener = null;
_rankedCache   = null;
_initialized   = false;
_processing    = false;
_setGridDisabled(false);
}
return Object.freeze({ init, reset, destroy });
})();
const simulador = {
init:  () => SimuladorManager.init(),
reset: () => SimuladorManager.reset(),
};
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en los horarios de la quiniela  --------------------------------------------------*/
function _isSafeImageUrl(url) {
if (typeof url !== 'string' || !url.trim()) return false;
if (url.startsWith('/') && !url.startsWith('//')) return true;
try {
const parsed = new URL(url);
return parsed.protocol === 'https:' ||
(ENV?.isDev && parsed.protocol === 'http:');
} catch {
return false;
}
}
function _createLogoImg(url, altText, className) {
const img = document.createElement('img');
img.src       = _isSafeImageUrl(url) ? escapeHtml(url) : '';
img.alt       = typeof altText === 'string' ? escapeHtml(altText) : '';
img.className = className ?? '';
if (className === 'team-logo') {
img.width  = 40;
img.height = 40;
} else if (className === 'match-tv-logo') {
img.width  = 44;
img.height = 44;
}
img.loading = 'lazy';
img.onerror = () => {
img.style.visibility = 'hidden';
img.onerror = null;
};
return img;
}
function _createTeamDiv(logoUrl, teamName) {
const div = document.createElement('div');
div.className = 'match-team';
const img = _createLogoImg(logoUrl, teamName, 'team-logo');
const span = document.createElement('span');
span.textContent = teamName ?? 'Equipo';
div.appendChild(img);
div.appendChild(span);
return div;
}
async function renderMatchesHorarios() {
const container = document.getElementById('matchesHorarios');
if (!container) return;
let partidos = AppState.getPartidos();
if (partidos.length === 0) {
container.innerHTML = '<p class="empty-state-msg" style="padding:1rem;text-align:center">Cargando partidos...</p>';
await cargarPartidos(2, 8000, false);
partidos = AppState.getPartidos();
}
if (partidos.length === 0) {
container.innerHTML = '<p class="empty-state-msg">No hay partidos configurados para esta jornada.</p>';
if (ENV?.isDev) console.warn('renderMatchesHorarios AppState sin partidos');
return;
}
container.innerHTML = partidos.map(partido => {
const logoLocal  = _isSafeImageUrl(partido.localLogo)     ? escapeHtml(partido.localLogo)     : '';
const logoVisita = _isSafeImageUrl(partido.visitanteLogo)  ? escapeHtml(partido.visitanteLogo)  : '';
const logoTv     = _isSafeImageUrl(partido.televisionLogo) ? escapeHtml(partido.televisionLogo) : '';
const tvHtml = (logoTv || partido.televisora)
? (
'<span>' +
`<img src="${logoTv}" alt="${escapeHtml(partido.televisora ?? 'Televisora')}"` +
' class="match-tv-logo" width="44" height="44" loading="lazy"' +
` onerror="this.style.visibility='hidden';this.onerror=null">` +
'</span>'
)
: '<span class="match-tv-unavailable">—</span>';
return (
'<div class="match-card">' +
'<div class="match-league match-league-header">' +
`<span>${escapeHtml(partido.horario ?? 'Horario por confirmar')}</span>` +
'</div>' +
'<div class="match-teams">' +
'<div class="match-team">' +
`<img src="${logoLocal}" alt="${escapeHtml(partido.local ?? '')}"` +
` class="team-logo" width="40" height="40" loading="lazy"` +
` onerror="this.style.visibility='hidden';this.onerror=null">` +
`<span>${escapeHtml(partido.local ?? 'Equipo')}</span>` +
'</div>' +
'<div class="match-vs">VS</div>' +
'<div class="match-team">' +
`<img src="${logoVisita}" alt="${escapeHtml(partido.visitante ?? '')}"` +
` class="team-logo" width="40" height="40" loading="lazy"` +
` onerror="this.style.visibility='hidden';this.onerror=null">` +
`<span>${escapeHtml(partido.visitante ?? 'Equipo')}</span>` +
'</div>' +
'</div>' +
`<div class="match-info match-info-center">${tvHtml}</div>` +
'</div>'
);
}).join('');
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en los Porcentajes en tiempo real basados en Lista Oficial ----------------------*/
const _PCT_COLOR_MAP = {
'pct-high': '#00A859',
'pct-mid':  '#333333',
'pct-low':  '#dc2626',
};
const PorcentajesManager = (() => {
async function cargar() {
const container = document.getElementById('matchesPorcentajes');
if (!container) return;
container.innerHTML = '<p class="loading-state-msg">Cargando porcentajes...</p>';
const ok = await ListaOficialManager.loadData();
if (!ok) {
container.innerHTML = '<p class="error-state-msg">No se pudieron cargar los porcentajes.</p>';
return;
}
renderPorcentajes();
}
function calculateRealPercentages() {
const partidos     = AppState.getPartidos();
const participants = ListaOficialManager.getParticipants();
const empty = () => ({ L: 0, E: 0, V: 0, total: 0 });
if (partidos.length === 0) return [];
if (participants.length === 0) return partidos.map(empty);
return partidos.map(partido => {
const matchId = String(partido.id);
let countL = 0, countE = 0, countV = 0;
for (const p of participants) {
const pick = p.predictions?.[matchId];
if      (pick === 'L') countL++;
else if (pick === 'E') countE++;
else if (pick === 'V') countV++;
}
const total = countL + countE + countV;
if (total === 0) return empty();
const raw = [
{ key: 'L', value: (countL / total) * 100 },
{ key: 'E', value: (countE / total) * 100 },
{ key: 'V', value: (countV / total) * 100 },
];
raw.forEach(item => { item.floor = Math.floor(item.value); });
const sumFloor  = raw.reduce((s, i) => s + i.floor, 0);
const remainder = 100 - sumFloor;
raw
.slice()
.sort((a, b) => (b.value - b.floor) - (a.value - a.floor))
.slice(0, remainder)
.forEach(item => { item.floor += 1; });
const result = {};
raw.forEach(item => { result[item.key] = item.floor; });
return { ...result, total };
});
}
function getMostFavored(perc) {
const max = Math.max(perc.L, perc.E, perc.V);
const min = Math.min(perc.L, perc.E, perc.V);
function getIntensity(val) {
if (val === max && max !== min) return 'pct-high';
if (val === min && max !== min) return 'pct-low';
return 'pct-mid';
}
return {
L: getIntensity(perc.L),
E: getIntensity(perc.E),
V: getIntensity(perc.V),
};
}
function renderPorcentajes() {
const container = document.getElementById('matchesPorcentajes');
if (!container) return;
const partidos        = AppState.getPartidos();
const realPercentages = calculateRealPercentages();
const totalQuinielas  = ListaOficialManager.getResumen()?.total_participantes ?? 0;
if (partidos.length === 0) {
container.innerHTML = '<p class="empty-state-msg">No hay partidos configurados.</p>';
return;
}
container.innerHTML = partidos.map((partido, index) => {
const perc    = realPercentages[index] ?? { L: 0, E: 0, V: 0, total: 0 };
const favored = getMostFavored(perc);
const logoLocal  = _isSafeImageUrl(partido.localLogo)     ? escapeHtml(partido.localLogo)     : '';
const logoVisita = _isSafeImageUrl(partido.visitanteLogo)  ? escapeHtml(partido.visitanteLogo)  : '';
const participantesTxt = `Porcentajes basados a ${perc.total} participante${perc.total !== 1 ? 's' : ''} en la lista 📊`;
const pctHtml = ['L', 'E', 'V'].map(key => {
const val           = perc[key];
const cls           = favored[key];
const color         = _PCT_COLOR_MAP[cls] || '#9ca3af';
return (
'<div class="percentage-item">' +
`<span class="percentage-label">${key}</span>` +
'<div class="percentage-bar">' +
`<div class="percentage-fill ${cls}"` +
` style="width:${val}%;background-color:${color}"` +
` role="progressbar"` +
` aria-valuenow="${val}"` +
` aria-valuemin="0"` +
` aria-valuemax="100"` +
` aria-label="${key}: ${val}%">` +
'</div>' +
'</div>' +
`<span class="percentage-value" style="color:${color};font-weight:600">${val}%</span>` +
'</div>'
);
}).join('');
return (
'<div class="match-card">' +
'<div class="match-league match-pct-header">' +
`<span class="match-pct-subtitle">${escapeHtml(participantesTxt)}</span>` +
'</div>' +
'<div class="match-teams">' +
'<div class="match-team">' +
`<img src="${logoLocal}" alt="${escapeHtml(partido.local ?? '')}" class="team-logo" width="40" height="40" loading="lazy" onerror="this.style.visibility='hidden';this.onerror=null">` +
`<span>${escapeHtml(partido.local ?? 'Equipo')}</span>` +
'</div>' +
'<div class="match-vs">VS</div>' +
'<div class="match-team">' +
`<img src="${logoVisita}" alt="${escapeHtml(partido.visitante ?? '')}" class="team-logo" width="40" height="40" loading="lazy" onerror="this.style.visibility='hidden';this.onerror=null">` +
`<span>${escapeHtml(partido.visitante ?? 'Equipo')}</span>` +
'</div>' +
'</div>' +
`<div class="match-percentages">${pctHtml}</div>` +
'</div>'
);
}).join('');
if (ENV?.isDev) {
console.log(`📊 PorcentajesManager: ${partidos.length} partidos, ${totalQuinielas} quinielas`);
}
}
return Object.freeze({
cargar,
renderPorcentajes,
calculateRealPercentages,
});
})();
async function cargarPorcentajes() {
return PorcentajesManager.cargar();
}
function renderMatchesPorcentajes() {
PorcentajesManager.renderPorcentajes();
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en las Funciones de la quiniela - quiniela Guardada ----------------------*/
function _buildMiniQuinielaHtml(q) {
const partidos = AppState.getPartidos();
const vendedorNombre = (typeof q.vendedor === 'string' && q.vendedor.trim())
? escapeHtml(q.vendedor.trim())
: 'Sin vendedor';
const jornadaNombre = escapeHtml(window.jornadaActual?.nombre ?? 'Jornada');
const folioHtml = q.folio
? `<div style="font-size:0.65rem;color:#6b7280;margin-top:2px;">Folio: ${escapeHtml(String(q.folio))}</div>`
: '';
const BTN_BASE = 'width:24px;height:24px;min-width:24px;min-height:24px;border:1px solid;border-radius:3px;font-size:0.65rem;font-weight:700;cursor:default;flex-shrink:0;padding:0;display:flex;align-items:center;justify-content:center;';
const SEL_ON   = 'background:#006847;color:white;border-color:#006847;';
const SEL_OFF  = 'background:#ffffff;color:#6b7280;border-color:#d1d5db;';
const rowsHtml = partidos.map(partido => {
const preds      = q.predictions?.[String(partido.id)] ?? [];
const lSel       = Array.isArray(preds) && preds.includes('L');
const eSel       = Array.isArray(preds) && preds.includes('E');
const vSel       = Array.isArray(preds) && preds.includes('V');
const logoLocal  = _isSafeImageUrl(partido.localLogo)    ? escapeHtml(partido.localLogo)    : '';
const logoVisita = _isSafeImageUrl(partido.visitanteLogo) ? escapeHtml(partido.visitanteLogo) : '';
const nLocal     = escapeHtml(partido.local    ?? '');
const nVisita    = escapeHtml(partido.visitante ?? '');
return (
'<div style="display:flex;align-items:center;gap:2px;padding:2px 0;">' +
`<button disabled style="${BTN_BASE}${lSel ? SEL_ON : SEL_OFF}">L</button>` +
'<div style="flex:1;display:flex;align-items:center;gap:2px;font-size:0.6rem;color:#374151;min-width:0;">' +
`<img src="${logoLocal}" alt="${nLocal}" loading="lazy" style="width:14px;height:14px;object-fit:contain;flex-shrink:0;" onerror="this.style.display='none';this.onerror=null">` +
`<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${nLocal}</span>` +
'</div>' +
`<button disabled style="${BTN_BASE}${eSel ? SEL_ON : SEL_OFF}">E</button>` +
'<div style="flex:1;display:flex;align-items:center;gap:2px;font-size:0.6rem;justify-content:flex-end;color:#374151;min-width:0;">' +
`<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right;">${nVisita}</span>` +
`<img src="${logoVisita}" alt="${nVisita}" loading="lazy" style="width:14px;height:14px;object-fit:contain;flex-shrink:0;" onerror="this.style.display='none';this.onerror=null">` +
'</div>' +
`<button disabled style="${BTN_BASE}${vSel ? SEL_ON : SEL_OFF}">V</button>` +
'</div>'
);
}).join('');
return (
'<div style="background:#ffffff;padding:10px;border-radius:10px;margin-bottom:10px;border:2px solid #e5e7eb;max-width:580px;width:100%;">' +
'<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">' +
`<div style="font-size:0.9rem;font-weight:700;color:#1f2937;margin-bottom:2px;">${escapeHtml(q.name || 'Sin nombre')}</div>` +
`<div style="font-size:0.65rem;color:#6b7280;">Vendedor: ${vendedorNombre} • ${jornadaNombre}</div>` +
folioHtml +
'</div>' +
rowsHtml +
`<button data-mini-q-delete data-qid="${String(q.id ?? '')}" data-qname="${escapeHtml(q.name || 'Sin nombre')}" style="background:#ef4444;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:0.7rem;font-weight:600;width:100%;margin-top:6px;">Eliminar 🗑️</button>` +
'</div>'
);
}
function _confirmDeleteQuiniela(quinielaId, quinielaName) {
const content = document.createElement('div');
content.style.cssText = 'text-align:center;padding:10px 0;';
const icon = document.createElement('p');
icon.style.cssText = 'font-size:2.5rem;margin-bottom:10px;';
icon.textContent = '⚠️';
const msg = document.createElement('p');
msg.style.cssText = 'font-size:0.95rem;color:#ffffff;margin-bottom:16px;';
msg.textContent = `¿Eliminar la quiniela de ${quinielaName || 'Sin nombre'}?`;
const btnConfirm = document.createElement('button');
btnConfirm.textContent = 'Sí, eliminar';
btnConfirm.style.cssText = 'width:100%;padding:10px;background:#ef4444;color:white;border:none;border-radius:8px;font-size:0.875rem;font-weight:700;cursor:pointer;margin-bottom:8px;';
btnConfirm.addEventListener('click', () => {
closeModal();
deleteQuinielaPorId(quinielaId);
setTimeout(() => showSaved(), 100);
}, { once: true });
const btnCancel = document.createElement('button');
btnCancel.textContent = 'Cancelar';
btnCancel.style.cssText = 'width:100%;padding:10px;background:transparent;color:#9ca3af;border:2px solid #e5e7eb;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer;';
btnCancel.addEventListener('click', closeModal, { once: true });
content.appendChild(icon);
content.appendChild(msg);
content.appendChild(btnConfirm);
content.appendChild(btnCancel);
openModal(content);
}
function showSaved() {
const savedQuinielas = AppState.getSaved();
if (savedQuinielas.length === 0) {
const emptyEl = document.createElement('div');
emptyEl.style.cssText = 'text-align:center;padding:30px 0;';
const icon = document.createElement('span');
icon.style.cssText = 'font-size:3rem;display:block;margin-bottom:16px;';
icon.textContent = '📋';
const msg = document.createElement('p');
msg.style.cssText = 'color:#9ca3af;';
msg.textContent = 'No tienes quinielas guardadas';
emptyEl.appendChild(icon);
emptyEl.appendChild(msg);
openModal(emptyEl);
return;
}
const price = 30;
const count = savedQuinielas.length;
const total = count * price;
const container = document.createElement('div');
container.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
const validCards = savedQuinielas.filter(q => q && q.predictions);
container.innerHTML = validCards.map(q => _buildMiniQuinielaHtml(q)).join('');
container.addEventListener('click', function onDeleteClick(e) {
const btn = e.target.closest('[data-mini-q-delete]');
if (!btn) return;
const qid  = parseInt(btn.dataset.qid, 10);
const qname = btn.dataset.qname || 'Sin nombre';
if (!Number.isFinite(qid)) return;
_confirmDeleteQuiniela(qid, qname);
});
const footer = document.createElement('div');
footer.style.cssText = 'background:#006847;padding:10px 16px;border-radius:12px;text-align:center;width:100%;max-width:580px;margin-top:10px;';
const countEl = document.createElement('div');
countEl.style.cssText = 'font-size:0.9rem;color:white;font-weight:600;';
countEl.textContent = `Quinielas guardadas: ${count}`;
const totalEl = document.createElement('div');
totalEl.style.cssText = 'font-size:0.9rem;color:white;font-weight:600;';
totalEl.textContent = `Total: $${total}`;
footer.appendChild(countEl);
footer.appendChild(totalEl);
container.appendChild(footer);
openModal(container);
}
function sendQuiniela() {
if (WhatsAppSender.isSending()) {
showErrorModal('Ya hay un envío en proceso. Por favor espera. ⏳');
return;
}
const quinielasSnapshot = AppState.getSaved();
if (quinielasSnapshot.length === 0) {
showErrorModal('No tienes quinielas guardadas para enviar.');
return;
}
const count      = quinielasSnapshot.length;
const totalPrice = count * 30;
const overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
const card = document.createElement('div');
card.style.cssText = 'background:linear-gradient(135deg,#ffffff 0%,#f8f9fa 100%);border-radius:20px;padding:25px;max-width:350px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);border:3px solid #006847;text-align:center';
const iconEl = document.createElement('div');
iconEl.style.cssText = 'font-size:80px;margin-bottom:15px';
iconEl.textContent = '📲';
const titleEl = document.createElement('h2');
titleEl.style.cssText = 'color:#006847;margin:0 0 10px 0;font-size:22px;font-weight:800';
titleEl.textContent = 'Enviar por WhatsApp';
const summaryEl = document.createElement('div');
summaryEl.style.cssText = 'background:#f8f9fa;padding:15px;border-radius:12px;margin:15px 0';
const countEl = document.createElement('div');
countEl.style.cssText = 'color:#666;font-size:13px;margin-bottom:8px';
countEl.textContent = `${count} quiniela${count !== 1 ? 's' : ''} guardada${count !== 1 ? 's' : ''}`;
const priceEl = document.createElement('div');
priceEl.style.cssText = 'color:#006847;font-size:24px;font-weight:900';
priceEl.textContent = `$${totalPrice}`;
summaryEl.appendChild(countEl);
summaryEl.appendChild(priceEl);
const warningEl = document.createElement('p');
warningEl.style.cssText = 'color:#666;font-size:13px;margin:15px 0';
warningEl.textContent = 'Se enviarán tus quinielas por WhatsApp';
const btnConfirm = document.createElement('button');
btnConfirm.textContent = 'Enviar ahora ✅';
btnConfirm.style.cssText = 'width:100%;padding:14px;margin-bottom:10px;background:linear-gradient(135deg,#25D366 0%,#128C7E 100%);color:white;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(37,211,102,0.4)';
btnConfirm.addEventListener('click', () => {
btnConfirm.disabled    = true;
btnConfirm.textContent = '⏳ Enviando...';
btnConfirm.style.opacity = '0.7';
btnConfirm.style.cursor  = 'not-allowed';
overlay.remove();
if (typeof procesarEnvioWhatsApp === 'function') {
try { procesarEnvioWhatsApp(quinielasSnapshot, totalPrice); }
catch (e) { showErrorModal('Error al preparar el envío. Intenta de nuevo.'); }
} else {
showErrorModal('Error de configuración. Contacta al desarrollador.');
}
}, { once: true });
const btnCancel = document.createElement('button');
btnCancel.textContent = 'Cancelar';
btnCancel.style.cssText = 'width:100%;padding:12px;background:transparent;color:#999;border:2px solid #ddd;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer';
btnCancel.addEventListener('click', () => overlay.remove(), { once: true });
card.appendChild(iconEl);
card.appendChild(titleEl);
card.appendChild(summaryEl);
card.appendChild(warningEl);
card.appendChild(btnConfirm);
card.appendChild(btnCancel);
overlay.appendChild(card);
document.body.appendChild(overlay);
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
function deleteQuinielaPorId(quinielaId) {
if (typeof quinielaId !== 'number' || !Number.isFinite(quinielaId)) {
console.error('deleteQuinielaPorId: id inválido', quinielaId);
return;
}
AppState.removeSavedById(quinielaId);
if (typeof updateQuinielaCount === 'function') updateQuinielaCount();
if (typeof updatePrice         === 'function') updatePrice();
if (typeof updateSavedBadge    === 'function') updateSavedBadge();
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en las Quinielas Enviadas - Sección Jugadas -----------------------------------*/
let officialResults = {};
function calcularPuntosQuiniela(predictionsObj, resultados) {
const res = resultados ?? officialResults;
if (!res || Object.keys(res).length === 0) return 0;
const partidos = AppState.getPartidos();
let puntos = 0;
partidos.forEach(partido => {
const pickArr = predictionsObj?.[String(partido.id)];
const pick = Array.isArray(pickArr) ? pickArr[0] : pickArr;
const resultado = res[String(partido.id)];
if (resultado && pick && resultado === pick) puntos++;
});
return puntos;
}
async function actualizarEstadosDesdeBackend() {
const vendedor = VendedorManager.current;
if (!vendedor) {
if (ENV?.isDev) console.warn('⚠️ actualizarEstadosDesdeBackend: sin vendedor');
return;
}
const jornadaNombre = window.jornadaActual?.nombre;
if (!jornadaNombre) {
if (ENV?.isDev) console.warn('⚠️ actualizarEstadosDesdeBackend: sin jornada');
return;
}
const qs = new URLSearchParams({ vendedor, jornada: jornadaNombre }).toString();
let resPend, resEsp, resJug;
try {
[resPend, resEsp, resJug] = await Promise.all([
fetchAPI(`/api/pendientes?${qs}`),
fetchAPI(`/api/espera?${qs}`),
fetchAPI(`/api/jugando?${qs}`),
]);
} catch (err) {
if (ENV?.isDev) console.warn('⚠️ actualizarEstadosDesdeBackend: error en Promise.all', err);
return;
}
const dataPend = resPend?.data;
const dataEsp = resEsp?.data;
const dataJug = resJug?.data;
const todosFetchsOk = !resPend?.error && !resEsp?.error && !resJug?.error;
if (!todosFetchsOk && ENV?.isDev) {
console.warn('⚠️ actualizarEstadosDesdeBackend: algún endpoint falló — reset omitido', {
pendientes: resPend?.error ?? 'ok',
espera: resEsp?.error ?? 'ok',
jugando: resJug?.error ?? 'ok',
});
}
const partidos = AppState.getPartidos();
function normalizarQuiniela(q, estado) {
const preds = {};
if (Array.isArray(q.picks)) {
q.picks.forEach((pick, idx) => {
const p = partidos[idx];
const key = p ? String(p.id) : String(idx);
preds[key] = (pick && pick !== '-') ? [pick] : [];
});
}
return {
id: q.id,
nombre: q.nombre,
vendedor: q.vendedor,
folio: q.folio,
predictions: preds,
estado,
jornada: jornadaNombre,
};
}
const allQuinielas = [];
if (dataPend?.pendientes) dataPend.pendientes.forEach(q => allQuinielas.push(normalizarQuiniela(q, 'pendiente')));
if (dataEsp?.espera) dataEsp.espera.forEach(q => allQuinielas.push(normalizarQuiniela(q, 'espera')));
if (dataJug?.jugando) dataJug.jugando.forEach(q => allQuinielas.push(normalizarQuiniela(q, 'jugando')));
if (allQuinielas.length === 0 && ENV?.isDev) {
console.warn('⚠️ actualizarEstadosDesdeBackend: 0 quinielas desde backend');
}
let sent = AppState.getSent();
const norm = s => (typeof s === 'string' ? s.trim().toLowerCase() : '');
const toKey = (preds) => partidos.map(p => {
const pred = preds?.[String(p.id)];
if (!pred || (Array.isArray(pred) && pred.length === 0)) return '-';
return Array.isArray(pred) ? [...pred].sort().join('') : String(pred);
}).join('|');
allQuinielas.forEach(qBackend => {
let local = sent.find(q => q.pythonId != null && String(q.pythonId) === String(qBackend.id));
if (!local && qBackend.folio != null) {
local = sent.find(q => q.folio != null && String(q.folio) === String(qBackend.folio));
}
if (!local) {
local = sent.find(q => {
if (norm(q.name) !== norm(qBackend.nombre)) return false;
if (norm(q.vendedor) !== norm(qBackend.vendedor)) return false;
return toKey(q.predictions) === toKey(qBackend.predictions);
});
}
if (local) {
local.estado = qBackend.estado;
local.folio = qBackend.folio;
local.pythonId = qBackend.id;
if (ENV?.isDev) console.log(`✅ Actualizada: ${local.name} → ${local.estado} (${local.folio ?? 'sin folio'})`);
} else {
if (ENV?.isDev) console.warn(`⚠️ No encontrado local para backend id=${qBackend.id} nombre="${qBackend.nombre}"`);
}
});
if (todosFetchsOk) {
const idsEnBackend = allQuinielas.map(q => String(q.id));
sent = sent.map(q => {
if (
q.jornada === jornadaNombre &&
q.pythonId != null &&
!idsEnBackend.includes(String(q.pythonId))
) {
if (ENV?.isDev) console.log(`🔄 Regresa a pendiente: ${q.name}`);
return { ...q, estado: 'pendiente', folio: null, pythonId: null };
}
return q;
});
}
AppState.replaceSent(sent);
deduplicarSentQuinielas();
if (typeof updateHeroStats === 'function') updateHeroStats();
if (ENV?.isDev) console.log(`🔄 Sincronización completa: ${allQuinielas.length} del backend`);
}
async function renderMyQuinielas() {
const container = document.getElementById('myQuinielasList');
if (!container) return;
let localResultados = {};
try {
const { data: dataResultados } = await fetchAPI('/api/resultados-oficiales');
localResultados = dataResultados?.resultados ?? {};
officialResults = localResultados;
} catch (e) {
console.error('❌ renderMyQuinielas: error cargando resultados', e);
localResultados = {};
officialResults = {};
}
await actualizarEstadosDesdeBackend();
const partidos = AppState.getPartidos();
const jornadaNombre = window.jornadaActual?.nombre ?? 'Jornada actual';
const sent = AppState.getSent();
const deJornada = sent.filter(q => q.jornada === jornadaNombre);
if (deJornada.length === 0) {
container.innerHTML = `
<div class="empty-state">
<span class="empty-icon">📋</span>
<p>Aún no has enviado quinielas para la ${escapeHtml(jornadaNombre)}</p>
<button class="btn-primary" onclick="navigateTo('quiniela')">Crear mi primera quiniela</button>
</div>`;
return;
}
const hayResultados = Object.keys(localResultados).length > 0;
const conDatos = deJornada
.map(q => ({
q,
jugando: q.estado === 'jugando',
puntos: hayResultados ? calcularPuntosQuiniela(q.predictions, localResultados) : 0,
}))
.sort((a, b) => {
if (a.jugando !== b.jugando) return a.jugando ? -1 : 1;
if (b.puntos !== a.puntos) return b.puntos - a.puntos;
const folioA = parseInt(a.q.folio) || 0;
const folioB = parseInt(b.q.folio) || 0;
return folioA - folioB;
});
container.innerHTML = conDatos.map(({ q, jugando, puntos }) => {
const cardClass = jugando ? 'jugando' : 'no-jugando';
const folioHtml = (jugando && q.folio) ? `<div class="jugada-folio">Folio: ${escapeHtml(String(q.folio))}</div>` : '';
const vendedorName = escapeHtml(q.vendedor || 'Sin vendedor');
const miniQuiniela = partidos.map(partido => {
const predArr = q.predictions?.[String(partido.id)];
const pick = Array.isArray(predArr) ? (predArr[0] || '-') : (predArr || '-');
const resultado = localResultados[String(partido.id)];
const pickSan = pick.trim().toUpperCase();
let pickClass = 'quiniela-pick';
if (resultado) pickClass += pickSan === resultado ? ' correct' : ' incorrect';
const logoLocal = isSafeImageUrl(partido.localLogo) ? escapeHtml(partido.localLogo) : '';
const logoVisita = isSafeImageUrl(partido.visitanteLogo) ? escapeHtml(partido.visitanteLogo) : '';
return `
<div class="quiniela-row">
<div class="quiniela-team">
<img src="${logoLocal}" alt="${escapeHtml(partido.local)}" loading="lazy" width="20" height="20" onerror="this.style.visibility='hidden';this.onerror=null">
<span>${escapeHtml(partido.local)}</span>
</div>
<div class="${pickClass}">${escapeHtml(pick)}</div>
<div class="quiniela-team" style="justify-content:flex-end;">
<span style="text-align:right;">${escapeHtml(partido.visitante)}</span>
<img src="${logoVisita}" alt="${escapeHtml(partido.visitante)}" loading="lazy" width="20" height="20" onerror="this.style.visibility='hidden';this.onerror=null">
</div>
</div>`;
}).join('');
return `
<div class="jugada-card ${cardClass}">
<div class="jugada-header ${cardClass}">
<div class="jugada-info">
<div class="jugada-name">${escapeHtml(q.name)}</div>
<div class="jugada-vendedor">Vendedor: ${vendedorName} • ${escapeHtml(q.jornada)}</div>
${folioHtml}
</div>
<div class="jugada-status">
<span class="status-badge ${cardClass}">${jugando ? 'Jugando ✓' : 'No jugando ✗'}</span>
</div>
</div>
${miniQuiniela}
<button class="btn-puntos">Puntos: ${puntos}</button>
</div>`;
}).join('');
if (ENV?.isDev) console.log(`✅ renderMyQuinielas: ${deJornada.length} quinielas renderizadas`);
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en trabajar para no duplicar quinielas-----------------------------------*/
function _generarKeyContenido(q, partidos) {
const nombre = (q.name || q.nombre || '').trim().toLowerCase();
const vendedor = (q.vendedor || '').trim().toLowerCase();
const jornada = (q.jornada || '').trim().toLowerCase();
const picks = partidos.length > 0
? partidos.map(p => {
const pred = q.predictions?.[String(p.id)];
if (!pred || (Array.isArray(pred) && pred.length === 0)) return '-';
return Array.isArray(pred) ? [...pred].sort().join('') : String(pred).trim().toUpperCase();
}).join('|')
: Object.keys(q.predictions ?? {}).sort().map(k => {
const v = (q.predictions ?? {})[k];
return `${k}:${Array.isArray(v) ? [...v].sort().join('') : String(v).toUpperCase()}`;
}).join('|');
return `cnt:${nombre}|${vendedor}|${jornada}|${picks}`;
}
function deduplicarSentQuinielas() {
const current = AppState.getSent();
if (current.length === 0) {
return { removed: 0, total: 0, errors: 0 };
}
if (typeof generarKeyQuiniela !== 'function') {
console.error('❌ deduplicarSentQuinielas: generarKeyQuiniela no está definida');
return { removed: 0, total: current.length, errors: 1 };
}
const partidos = AppState.getPartidos();
const jornadaFallback = window.jornadaActual?.nombre ?? 'no-jornada';
const vistas = new Set();
const limpias = [];
let errors = 0;
for (const q of current) {
if (!q || typeof q !== 'object' || Array.isArray(q)) {
if (ENV?.isDev) console.warn('⚠️ deduplicarSentQuinielas: item corrupto descartado:', typeof q);
errors++;
continue;
}
let key;
try {
key = generarKeyQuiniela(q);
} catch (e) {
console.error('❌ deduplicarSentQuinielas: error generando key:', e, 'folio:', q?.folio);
errors++;
continue;
}
if (typeof key !== 'string' || !key.trim()) {
const nombre = (q.name || q.nombre || 'sin-nombre').trim().toLowerCase();
const picks = partidos.length > 0
? partidos.map(p => {
const pred = q.predictions?.[String(p.id)];
if (!pred || (Array.isArray(pred) && pred.length === 0)) return '-';
return Array.isArray(pred) ? [...pred].sort().join('') : String(pred).toUpperCase();
}).join('|')
: JSON.stringify(q.predictions ?? {});
key = `fb:${nombre}_${q.jornada ?? jornadaFallback}_${picks}`;
if (ENV?.isDev) {
console.warn(`⚠️ deduplicarSentQuinielas: key inválida para folio ${q.folio}, fallback generado`);
}
}
if (!vistas.has(key)) {
vistas.add(key);
limpias.push(q);
} else {
if (ENV?.isDev) {
console.warn(`⚠️ Duplicado (pase 1) eliminado: folio=${q.folio}, nombre="${q.name}"`);
}
}
}
if (partidos.length > 0) {
const porContenido = new Map();
for (const q of limpias) {
const ckey = _generarKeyContenido(q, partidos);
if (!porContenido.has(ckey)) {
porContenido.set(ckey, q);
} else {
const existente = porContenido.get(ckey);
const scoreExistente = (existente.pythonId != null ? 4 : 0) + (existente.folio != null ? 2 : 0);
const scoreCurrent  = (q.pythonId != null ? 4 : 0) + (q.folio != null ? 2 : 0);
let ganador, perdedor;
if (scoreCurrent > scoreExistente) {
ganador = q;
perdedor = existente;
} else if (scoreCurrent === scoreExistente) {
ganador = (q.id ?? 0) >= (existente.id ?? 0) ? q : existente;
perdedor = ganador === q ? existente : q;
} else {
ganador = existente;
perdedor = q;
}
porContenido.set(ckey, ganador);
if (ENV?.isDev) {
console.warn(`⚠️ Duplicado (pase 2 contenido) eliminado: folio=${perdedor?.folio ?? 'null'}, pythonId=${perdedor?.pythonId ?? 'null'}, nombre="${perdedor?.name}"`);
}
}
}
const limp2 = [...porContenido.values()];
const removedP2 = limpias.length - limp2.length;
if (removedP2 > 0) {
limpias.length = 0;
limpias.push(...limp2);
}
}
const removed = current.length - limpias.length;
if (removed === 0 && errors === 0) {
if (ENV?.isDev) console.log('✅ deduplicarSentQuinielas: sin duplicados encontrados');
return { removed: 0, total: current.length, errors: 0 };
}
if (errors > 0 && ENV?.isDev) {
console.warn(`⚠️ deduplicarSentQuinielas: ${errors} item(s) con errores descartados`);
}
if (removed > 0) {
AppState.replaceSent(limpias);
if (typeof updateSavedBadge === 'function') updateSavedBadge();
if (typeof updateQuinielaCount === 'function') updateQuinielaCount();
if (ENV?.isDev) {
console.log(`🧹 deduplicarSentQuinielas: ${removed} duplicado(s) eliminado(s), ${limpias.length} quinielas limpias`);
}
}
return { removed, total: limpias.length, errors };
}
function limpiarDuplicados() {
return deduplicarSentQuinielas();
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en trabajar el Sistema de envío de quinielas por WhatsApp -----------------------*/
const WhatsAppSender = (() => {
let sending = false;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_INTENTOS = 3;
const RETRY_DELAY_MS = 1500;
const INTER_REQUEST_MS = 100;
function isSending() {
return sending;
}
function generarKeyQuiniela(q) {
if (!q || typeof q !== 'object') return null;
if (q.pythonId != null) return `py-${q.pythonId}`;
if (q.folio) return `fo-${q.folio}`;
const partidos = AppState.getPartidos();
const jornadaId = AppState.getJornada?.()?.id ?? 'sin-jornada';
const picksKey = partidos.map(p => {
const pred = q.predictions?.[String(p.id)];
if (!pred) return '-';
if (Array.isArray(pred)) return [...pred].sort().join('');
return String(pred);
}).join('');
return `jo${jornadaId}|nm${q.name}|vd${q.vendedor}|pk${picksKey}`;
}
function generarIdempotencyKey(q) {
if (q._idempotencyKey) return q._idempotencyKey;
const jornadaId = AppState.getJornada?.()?.id ?? 'sin-jornada';
const raw = `${jornadaId}|${q.name ?? ''}|${q.vendedor ?? ''}|${JSON.stringify(q.predictions ?? {})}`;
let hash = 0;
for (let i = 0; i < raw.length; i++) {
hash = Math.imul(31, hash) + raw.charCodeAt(i) | 0;
}
const key = `idem-${Math.abs(hash).toString(36)}-${raw.length}`;
q._idempotencyKey = key;
return key;
}
async function procesarEnvioWhatsApp(quinielas, totalPrice) {
if (sending) {
if (ENV?.isDev) console.warn('WhatsAppSender: envío ya en proceso');
return;
}
sending = true;
const btnEnviar = document.querySelector('[data-action="send-quiniela"]');
if (btnEnviar) btnEnviar.disabled = true;
const quinielasSnapshot = quinielas.map(q => ({ ...q }));
if (quinielasSnapshot.length === 0) {
showErrorModal('No hay quinielas para enviar.');
finalizarEnvio(btnEnviar);
return;
}
for (const q of quinielasSnapshot) {
if (typeof validarQuiniela !== 'function') break;
const validacion = validarQuiniela(q);
if (!validacion?.valida) {
showErrorModal(`Error en ${escapeHtml(q.name ?? 'Sin nombre')}: ${escapeHtml(validacion?.error ?? 'Error de validación')}`);
finalizarEnvio(btnEnviar);
return;
}
}
let loadingModal = null;
if (typeof mostrarModalCargando === 'function') {
try { loadingModal = mostrarModalCargando(quinielasSnapshot.length); } catch (e) { console.error('mostrarModalCargando falló', e); }
}
try {
const resultado = await _enviarQuinielasAPython(quinielasSnapshot, loadingModal);
if (!resultado || !Array.isArray(resultado.exitosas) || !Array.isArray(resultado.fallidas)) {
throw new Error('Respuesta inesperada del servidor');
}
cerrarModal(loadingModal);
if (resultado.exitosas.length === 0) {
if (typeof mostrarErrorEnvio === 'function') {
try { mostrarErrorEnvio(resultado.fallidas); } catch (e) { showErrorModal('Error al enviar. Intenta de nuevo.'); }
} else {
showErrorModal('No se pudo enviar ninguna quiniela.');
}
return;
}
AppState.markAsSent(resultado.exitosas);
AppState.clearSaved();
if (typeof updateSavedBadge === 'function') updateSavedBadge();
if (typeof renderMyQuinielas === 'function') renderMyQuinielas();
if (typeof updateHeroStats === 'function') updateHeroStats();
deduplicarSentQuinielas();
if (typeof mostrarConfirmacionEnvio === 'function') {
try {
await mostrarConfirmacionEnvio(resultado.exitosas.length, totalPrice, resultado.fallidas.length, resultado.exitosas);
} catch (e) { console.error('mostrarConfirmacionEnvio falló', e); }
}
} catch (error) {
cerrarModal(loadingModal);
console.error('WhatsAppSender error crítico:', error?.message ?? error);
showErrorModal('Error de conexión con el servidor. Intenta de nuevo.');
} finally {
finalizarEnvio(btnEnviar);
}
}
async function _enviarQuinielasAPython(quinielas, loadingModal) {
const exitosas = [];
const fallidas = [];
const keysVistas = new Set();
const quinielasUnicas = quinielas.filter(q => {
const key = generarKeyQuiniela(q);
if (!key || keysVistas.has(key)) return false;
keysVistas.add(key);
return true;
});
const filtradas = quinielas.length - quinielasUnicas.length;
if (filtradas > 0 && ENV?.isDev) console.warn(`WhatsAppSender: ${filtradas} duplicadas filtradas antes de enviar`);
const total = quinielasUnicas.length;
for (let i = 0; i < total; i++) {
const q = quinielasUnicas[i];
actualizarProgreso(loadingModal, i + 1, total);
const resultado = await enviarConRetry(q, i + 1, total);
if (resultado.ok) {
exitosas.push({ ...q, ...resultado.data });
} else {
fallidas.push({ quiniela: q.name ?? 'Sin nombre', razon: resultado.razon });
}
if (i < total - 1) await sleep(INTER_REQUEST_MS);
}
if (ENV?.isDev) console.log(`WhatsAppSender: ${exitosas.length}/${total} exitosas`);
return { exitosas, fallidas };
}
async function enviarConRetry(q, current, total) {
const partidos = AppState.getPartidos();
const predictions = {};
for (const partido of partidos) {
const pick = q.predictions?.[String(partido.id)];
if (pick) predictions[String(partido.id)] = pick;
}
const nombre = typeof q.name === 'string' ? q.name.trim() : '';
if (!nombre) return { ok: false, razon: 'Nombre de quiniela vacío' };
const userIdVal = typeof userId !== 'undefined' ? userId : null; 
const vendedor = q.vendedor || VendedorManager?.current || 'Desconocido'; 
const payload = {
nombre,
vendedor,
predictions,
...(userIdVal !== null ? { userId: userIdVal } : {}),
};
const idempotencyKey = generarIdempotencyKey(q);
let lastError = null;
for (let attempt = 1; attempt <= MAX_INTENTOS; attempt++) { 
try {
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
let response;
try {
response = await fetch(apiUrl('api/quinielas'), {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-Idempotency-Key': idempotencyKey,
},
body: JSON.stringify(payload),
signal: controller.signal,
});
} finally {
clearTimeout(timeoutId);
}
let data;
try { data = await response.json(); } catch { data = {}; }
if (response.ok && data.id != null) { 
if (ENV?.isDev) console.log(`${current}/${total} Quiniela enviada (ID: ${data.id})`);
return { ok: true, data: { pythonId: data.id, folio: data.folio ?? null, estado: data.estado ?? null } }; 
}
if (response.status === 409 && data.id != null) { 
if (ENV?.isDev) console.log(`✅ Idempotente: quiniela ya existía (ID=${data.id})`);
return { ok: true, data: { pythonId: data.id, folio: data.folio ?? null, estado: data.estado ?? null } }; 
}
if (response.status >= 400 && response.status < 500) {
const razon = data.error || data.detail || `Error ${response.status}`;
return { ok: false, razon: escapeHtml(String(razon).slice(0, 200)) };
}
lastError = data.error || data.detail || `Error ${response.status}`;
} catch (error) {
const isTimeout = error.name === 'AbortError';
lastError = isTimeout ? 'Timeout de conexión' : (error.message ?? 'Error de red');
if (!navigator.onLine) return { ok: false, razon: 'Sin conexión a internet' };
if (attempt < MAX_INTENTOS) { // MEJORA 5: condición correcta con MAX_INTENTOS
if (ENV?.isDev) console.warn(`Reintento ${attempt}/${MAX_INTENTOS - 1}...`);
await sleep(RETRY_DELAY_MS * attempt);
}
}
}
return { ok: false, razon: escapeHtml(String(lastError ?? 'Error desconocido').slice(0, 200)) };
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function cerrarModal(modal) {
if (modal && typeof modal.remove === 'function') {
try { if (document.body.contains(modal)) modal.remove(); } catch (e) { /* ignorar */ }
}
}
function actualizarProgreso(modal, current, total) {
if (!modal) return;
const progressEl = modal.querySelector?.('[data-progress]');
if (progressEl) progressEl.textContent = `${current}/${total}`;
}
function finalizarEnvio(btnEnviar) {
sending = false;
if (btnEnviar) btnEnviar.disabled = false;
}
return Object.freeze({
isSending,
generarKeyQuiniela,
procesarEnvioWhatsApp,
});
})();
function generarKeyQuiniela(q) { return WhatsAppSender.generarKeyQuiniela(q); }
async function procesarEnvioWhatsApp(quinielas, totalPrice) { return WhatsAppSender.procesarEnvioWhatsApp(quinielas, totalPrice); }
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en trabajar la Estructura para el mensaje de whats app -----------------------*/
function getVendedorFromURL() {
const params = new URLSearchParams(window.location.search);
const raw = params.get('vendedor') ?? '';
const sanitized = raw
.replace(/[<>"'&]/g, '')
.trim()
.slice(0, 60);
return sanitized || null;
}
function generarMensajeWhatsApp(quinielas, totalPrice) {
if (!Array.isArray(quinielas) || quinielas.length === 0) return '';
const partidos = AppState.getPartidos();
const precioSeguro = (typeof totalPrice === 'number' && isFinite(totalPrice))
? totalPrice.toFixed(2)
: (parseFloat(totalPrice) > 0 ? parseFloat(totalPrice).toFixed(2) : '0.00');
let mensaje = '';
quinielas.forEach((q, index) => {
const nombre = typeof q.name === 'string' && q.name.trim()
? q.name.trim()
: 'Sin nombre';
mensaje += `*${nombre}*\n`;
let hayPicks = false;
partidos.forEach((partido, idx) => {
const pred = q.predictions?.[String(partido.id)];
let resultado = '-';
if (Array.isArray(pred) && pred.length > 0) {
resultado = String(pred[0]);
} else if (typeof pred === 'string' && pred.length > 0) {
resultado = pred;
}
if (resultado !== '-') {
hayPicks = true;
mensaje += `P${idx + 1} ${resultado}\n`;
}
});
if (!hayPicks) {
mensaje += `⚠️ Sin pronósticos registrados\n`;
if (ENV?.isDev) console.warn(`generarMensajeWhatsApp: quiniela "${nombre}" sin picks. Verifica IDs de partidos vs predictions.`);
}
if (index < quinielas.length - 1) mensaje += '\n';
});
mensaje += '\n━━━━━━━━━━━━━━\n';
mensaje += `Total: ${quinielas.length} ${quinielas.length === 1 ? 'quiniela' : 'quinielas'}`;
mensaje += `\nA pagar: $${precioSeguro}`;
mensaje += '\n\nEn unos momentos te envío el comprobante';
return mensaje;
}
function _validarWhatsAppUrl(url) {
if (typeof url !== 'string' || !url.trim()) return false;
try {
const parsed = new URL(url);
return (
parsed.protocol === 'https:' &&
(parsed.hostname === 'wa.me' || parsed.hostname === 'api.whatsapp.com')
);
} catch {
return false;
}
}
function buildFallbackWhatsAppUrl(mensaje, vendedor = null) {
const libro = typeof VENDEDOR_WHATSAPP !== 'undefined' ? VENDEDOR_WHATSAPP : {};
const numero = (vendedor && libro[vendedor]) || '';
if (!numero) {
console.error('❌ WhatsAppMessenger: sin número para vendedor →', vendedor);
return null;
}
return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
function mostrarErrorEnvio(fallidas) {
const lista = Array.isArray(fallidas) ? fallidas : [];
const content = document.createElement('div');
content.className = 'error-envio-modal';
const icon = document.createElement('div');
icon.className = 'error-envio-icon';
icon.textContent = '❌';
const title = document.createElement('h2');
title.className = 'error-envio-title';
title.textContent = 'Error al enviar';
const subtitle = document.createElement('p');
subtitle.className = 'error-envio-subtitle';
subtitle.textContent =
`No se ${lista.length === 1 ? 'pudo guardar' : 'pudieron guardar'} ` +
`${lista.length} ${lista.length === 1 ? 'quiniela' : 'quinielas'}`;
const errorList = document.createElement('div');
errorList.className = 'error-envio-list';
lista.forEach(f => {
const item = document.createElement('div');
item.className = 'error-envio-item';
const nameEl = document.createElement('div');
nameEl.className = 'error-envio-item-name';
nameEl.textContent = f?.quiniela ?? 'Sin nombre';
const razonEl = document.createElement('div');
razonEl.className = 'error-envio-item-reason';
razonEl.textContent = f?.razon ?? 'Error desconocido';
item.appendChild(nameEl);
item.appendChild(razonEl);
errorList.appendChild(item);
});
const btnClose = document.createElement('button');
btnClose.className = 'btn-danger error-envio-close';
btnClose.textContent = 'Cerrar';
btnClose.addEventListener('click', closeModal);
content.appendChild(icon);
content.appendChild(title);
content.appendChild(subtitle);
content.appendChild(errorList);
content.appendChild(btnClose);
openModal(content);
}
async function mostrarConfirmacionEnvio(exitosas, totalPrice, fallidas, quinielasData) {
const exitosasEl   = document.getElementById('exitosasCount');
const totalPriceEl = document.getElementById('totalPriceAmount');
const mensajeEl    = document.getElementById('mensajeEnvio');
const btnWhatsApp  = document.getElementById('btnIrWhatsApp');
const modalEl      = document.getElementById('modalEnvioExitoso');
if (!exitosasEl || !totalPriceEl || !mensajeEl || !btnWhatsApp || !modalEl) {
console.error('❌ mostrarConfirmacionEnvio: elementos del DOM no encontrados:', {
exitosasEl:   !!exitosasEl,
totalPriceEl: !!totalPriceEl,
mensajeEl:    !!mensajeEl,
btnWhatsApp:  !!btnWhatsApp,
modalEl:      !!modalEl,
});
if (typeof openModal === 'function') {
const fallbackEl = document.createElement('p');
fallbackEl.textContent =
`¡${exitosas} Quiniela${exitosas !== 1 ? 's' : ''} ` +
`enviada${exitosas !== 1 ? 's' : ''} con éxito!`;
openModal(fallbackEl);
}
return;
}
exitosasEl.textContent   = exitosas;
totalPriceEl.textContent = `$${totalPrice}`;
if (fallidas > 0) {
mensajeEl.textContent =
`${exitosas} ${exitosas === 1 ? 'Quiniela enviada' : 'Quinielas enviadas'}. ` +
`${fallidas} ${fallidas === 1 ? 'falló' : 'fallaron'}.`;
} else {
mensajeEl.textContent = '';
const line1 = document.createTextNode('¡Todas tus quinielas están listas!');
const br    = document.createElement('br');
const line2 = document.createTextNode('Ve a WhatsApp para compartirlas.');
mensajeEl.appendChild(line1);
mensajeEl.appendChild(br);
mensajeEl.appendChild(line2);
}
const vendedorDesdeQuinielas =
Array.isArray(quinielasData) && quinielasData.length > 0
? (quinielasData.find(q => typeof q.vendedor === 'string' && q.vendedor.trim())?.vendedor ?? null)
: null;
const currentVendedorSafe = typeof currentVendedor !== 'undefined' ? currentVendedor : null; 
const vendedorFinal =
VendedorManager?.current
?? currentVendedorSafe
?? vendedorDesdeQuinielas;
if (!vendedorFinal) {
console.error(
'❌ mostrarConfirmacionEnvio: vendedor no identificado.',
'VendedorManager.current =', VendedorManager?.current,
'| currentVendedor =', currentVendedorSafe
);
showToast(
'No se detectó tu vendedor. Abre la app desde el link de tu vendedor e intenta de nuevo.',
'error'
);
return;
}
if (ENV?.isDev) console.log('✅ mostrarConfirmacionEnvio: vendedor resuelto →', vendedorFinal);
const mensaje = generarMensajeWhatsApp(quinielasData ?? [], totalPrice);
if (!mensaje) {
console.error('❌ mostrarConfirmacionEnvio: mensaje vacío, no se puede enviar a WhatsApp');
showToast('Error generando el mensaje. Recarga e intenta de nuevo.', 'error');
return;
}
let whatsappUrl      = null;
let servidorEnvioOk  = false;
try {
const controller = new AbortController();
const timeoutId  = setTimeout(() => controller.abort(), 8_000);
let resp;
try {
resp = await fetch('/api/enviar-whatsapp', {
method:  'POST',
headers: { 'Content-Type': 'application/json' },
body:    JSON.stringify({ vendedor: vendedorFinal, mensaje }),
signal:  controller.signal,
});
} finally {
clearTimeout(timeoutId);
}
if (resp.ok) {
let data;
try { data = await resp.json(); } catch { data = {}; }
servidorEnvioOk = data?.enviado === true; // el backend debe mandar { enviado: true }
if (_validarWhatsAppUrl(data?.url)) {
whatsappUrl = data.url;
} else if (ENV?.isDev) {
console.warn('⚠️ URL de WhatsApp del backend inválida:', data?.url);
}
}
} catch (e) {
if (ENV?.isDev) console.warn('⚠️ No se pudo obtener URL del backend, usando fallback. Error:', e?.message);
}
if (!whatsappUrl) {
whatsappUrl = buildFallbackWhatsAppUrl(mensaje, vendedorFinal);
}
const newBtn = btnWhatsApp.cloneNode(true);
btnWhatsApp.parentNode?.replaceChild(newBtn, btnWhatsApp);
if (whatsappUrl) {
if (servidorEnvioOk) {
newBtn.textContent = '📲 Ver en WhatsApp';
if (ENV?.isDev) console.log('ℹ️ Servidor ya envió el mensaje. Botón en modo "ver", no reenvío.');
} else {
newBtn.textContent = '📲 Enviar a WhatsApp';
}
newBtn.disabled = false;
newBtn.addEventListener('click', () => {
window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
cerrarModalEnvio();
}, { once: true });
} else {
newBtn.disabled    = true;
newBtn.textContent = 'WhatsApp no disponible';
console.error('❌ mostrarConfirmacionEnvio: no hay URL de WhatsApp disponible');
}
modalEl.classList.add('show');
}
function cerrarModalEnvio() {
const modalEl = document.getElementById('modalEnvioExitoso');
if (!modalEl) return;
modalEl.classList.remove('show');
const exitosasEl   = document.getElementById('exitosasCount');
const totalPriceEl = document.getElementById('totalPriceAmount');
const mensajeEl    = document.getElementById('mensajeEnvio');
const btnEl        = document.getElementById('btnIrWhatsApp');
if (exitosasEl)   exitosasEl.textContent   = '';
if (totalPriceEl) totalPriceEl.textContent = '';
if (mensajeEl)    mensajeEl.textContent    = '';
if (btnEl) {                                
btnEl.disabled    = false;
btnEl.textContent = '📲 Enviar a WhatsApp';
}
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en trabajar el reglamento de nuestra quiniela ------------------------------------*/
function showReglamento() {
openModal(`
<h3>📋 Reglamento</h3>
<p style="font-size: 0.875rem; color: var(--gris-300); line-height: 1.6;">
<strong>1-Primer Lugar:</strong> Será el participante que obtenga el mayor número de aciertos.<br>
En caso de empate , el monto total del premio se repartirá en partes iguales.<br>
<br>
<strong>2-Segundo Lugar:</strong> Un acierto menos <br>que el primer lugar.<br>
Solamente será repartido y entregado el monto asignado al segundo lugar, siempre y cuando se cumpla el requisito. <br>
<br>
<strong>3-El monto publicado</strong> es lo que se le entregará al ganador(es).<br>
<br>
<strong>4-Solo se podra apostar por:<br></strong> Equipo local, empate o equipo visitante.<br>
El resultado válido para cada partido será únicamente el obtenido durante el tiempo reglamentario, es decir,
los 90 minutos más el tiempo agregado.<br>
<br>
<strong>5-Es responsabilidad del participante</strong> verificar que su quiniela esté<br>correctamente registrada.<br>
En caso de existir algún error y no ser reportado antes de la publicación de la lista final, no se podrán realizar correcciones posteriormente.<br>
<br>
<strong>6-Quiniela no capturada:</strong><br>
Si tu quiniela no fue registrada por algún error, ya sea por parte del vendedor o por un fallo nuestro, simplemente se te reembolsará el costo total de la quiniela.<br>
<br>
<strong>7-Participacion de la quiniela:</strong><br>
Tu quiniela participará conforme a cómo fue capturada y publicada en la lista final.<br>
Si no estás de acuerdo con los resultados registrados, podrás solicitar el reembolso antes de que inicie el 2 partido.<br>
<br>
<strong>8-Publicacion de la lista final:</strong><br>
Cada semana, antes de iniciar el primer partido, se publicará la lista final de participantes, la cual no podrá ser modificada una vez publicada. <br>
<br>
<strong>9-Partidos suspendidos o pospuestos:</strong><br>
Si un partido es suspendido durante su transcurso, se tomará en cuenta siempre y cuando se reanude y finalice dentro <br>de la misma jornada.<br>
De lo contrario, se considerará como resultado oficial el marcador al momento <br>de la suspensión.<br>
Por otra parte, si un partido es pospuesto antes de iniciar y no se juega dentro de la misma jornada, dicho partido no será tomado en cuenta.<br>
</p>
`);
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se enfoca en la ayuda al cliente para realizar la quiniela ------------------------------------*/
function showHelpModal() {
openModal(`
<h3 style="text-align:center;">¿Cómo jugar tu quiniela? ⚽</h3>
<p style="text-align:center; opacity:.85; margin-top:.5rem;">
Rápido, fácil y desde tu celular 📲
</p>
<div style="margin-top:1.5rem;">
<div style="margin-bottom: 1rem;">
<span style="font-size: 1.5rem;">1</span>
<p>Selecciona el resultado<br>
<small>Local 🤝 Empate 🤝 Visita</small></p>
</div>
<div style="margin-bottom: 1rem;">
<span style="font-size: 1.5rem;">2</span>
<p>Completa <strong>todos</strong> los partidos<br>
<small>No dejes ninguno vacío 👀</small></p>
</div>
<div style="margin-bottom: 1rem;">
<span style="font-size: 1.5rem;">3</span>
<p>Escribe tu nombre y <br> guarda tu quiniela 💾 <br>
<small>Así queda registrada correctamente</small></p>
</div>
<div style="margin-bottom: 1rem;">
<span style="font-size: 1.5rem;">4</span>
<p>Envía tu quiniela por <strong>WhatsApp</strong> 📲<br>
<small>Un solo toque y listo</small></p>
</div>
<div style="margin-bottom: 1rem;">
<span style="font-size: 1.5rem;">5</span>
<p><strong>¡Muy importante!</strong><br>
<small>Envíala antes del cierre ⏰</small></p>
</div>
</div>
<p style="text-align:center; margin-top:1.2rem; font-weight:600;">
🍀 ¡Mucha suerte! 🍀
</p>
`);
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para: reglamento, ayuda, errores, quinielas guardadas-------------------------------*/
function openModal(content) {
const existingModal = document.getElementById('customModal');
if (existingModal) existingModal.remove();
const _previousFocus = document.activeElement ?? null;
const modal = document.createElement('div');
modal.id = 'customModal';
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-label', 'Ventana de información');
modal._previousFocus = _previousFocus;
modal.style.cssText = `
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.9);
display: flex;
align-items: center;
justify-content: center;
z-index: 9999;
padding: 20px;
overflow-y: auto;
-webkit-overflow-scrolling: touch;
`;
const modalContent = document.createElement('div');
modalContent.style.cssText = `
background: #0a0a0a;
border: 2px solid var(--verde);
border-radius: 12px;
padding: 24px;
max-width: 600px;
width: 100%;
max-height: 90vh;
overflow-y: auto;
-webkit-overflow-scrolling: touch;
position: relative;
color: var(--blanco);
`;
if (typeof content === 'string') {
modalContent.innerHTML = content;
} else if (content instanceof Node) {
modalContent.appendChild(content);
}
const closeBtn = document.createElement('button');
closeBtn.textContent = 'Cerrar ✖️';
closeBtn.setAttribute('aria-label', 'Cerrar ventana');
closeBtn.setAttribute('type', 'button');
closeBtn.onclick = closeModal;
closeBtn.style.cssText = `
margin-top: 20px;
width: 100%;
padding: 12px;
background: var(--verde);
color: white;
border: none;
border-radius: 8px;
font-size: 0.875rem;
font-weight: 700;
cursor: pointer;
-webkit-tap-highlight-color: transparent;
touch-action: manipulation;
`;
modalContent.appendChild(closeBtn);
modal.appendChild(modalContent);
document.body.appendChild(modal);
document.body.style.overflow = 'hidden';
closeBtn.focus();
const handleKeydown = (e) => {
if (e.key === 'Escape') closeModal();
};
modal._escapeHandler = handleKeydown;
document.addEventListener('keydown', handleKeydown);
modal.addEventListener('click', (e) => {
if (e.target === modal) closeModal();
});
}
function closeModal() {
const modal = document.getElementById('customModal');
if (!modal) return;
if (typeof modal._escapeHandler === 'function') {
document.removeEventListener('keydown', modal._escapeHandler);
}
const prevFocus = modal._previousFocus ?? null;
modal.remove();
document.body.style.overflow = '';
if (prevFocus && typeof prevFocus.focus === 'function') {
prevFocus.focus();
}
}
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para mi seccion de ayuda-------------------------------*/
function debounce(func, wait) {
if (typeof func !== 'function') {
throw new TypeError(`debounce: se esperaba una función, recibido ${typeof func}`);
}
if (typeof wait !== 'number' || wait < 0) {
throw new TypeError(`debounce: wait debe ser un número >= 0, recibido ${wait}`);
}
let timeout = null;
function executedFunction(...args) {
const context = this;
clearTimeout(timeout);
timeout = setTimeout(() => {
timeout = null;          
func.apply(context, args); 
}, wait);
}
executedFunction.cancel = function() {
clearTimeout(timeout);
timeout = null;
};
executedFunction.flush = function(...args) {
if (timeout !== null) {
clearTimeout(timeout);
timeout = null;
func.apply(this, args);
}
};
executedFunction.isPending = function() {
return timeout !== null;
};
return executedFunction;
}
async function copyToClipboard(text) {
if (typeof text !== 'string') {
console.error(`copyToClipboard: se esperaba string, recibido ${typeof text}`);
return false;
}
if (text.length === 0) {
console.warn('copyToClipboard: text está vacío');
return false;
}
if (navigator?.clipboard?.writeText) {
try {
await navigator.clipboard.writeText(text);
return true;
} catch (err) {
if (ENV?.isDev) console.warn('copyToClipboard: Clipboard API falló, usando fallback:', err.message);
}
}
let textArea = null;
try {
textArea = document.createElement('textarea');
textArea.value       = text;
textArea.setAttribute('aria-hidden', 'true');
textArea.setAttribute('readonly', '');      
textArea.style.cssText = [
'position: fixed',
'top: 0',
'left: 0',
'width: 2em',
'height: 2em',
'padding: 0',
'border: none',
'outline: none',
'box-shadow: none',
'background: transparent',
'opacity: 0',
'pointer-events: none',
'z-index: -1',
].join(';');
document.body.appendChild(textArea);
if (navigator.userAgent.match(/ipad|iphone/i)) {
textArea.contentEditable = 'true';
textArea.readOnly        = false;
const range = document.createRange();
range.selectNodeContents(textArea);
const selection = window.getSelection();
selection?.removeAllRanges();
selection?.addRange(range);
textArea.setSelectionRange(0, 999999);
} else {
textArea.select();
}
const success = document.execCommand('copy');
if (!success) {
if (ENV?.isDev) console.warn('copyToClipboard: execCommand("copy") retornó false');
return false;
}
return true;
} catch (err) {
console.error('copyToClipboard: fallback falló:', err);
return false;
} finally {
if (textArea && document.body.contains(textArea)) {
document.body.removeChild(textArea);
}
}
}
const HelpCards = (() => {
let _cards       = [];
let _controller  = null;
let _initialized = false;
function init() {
if (_initialized) destroy();
const cardEls = document.querySelectorAll('.help-card');
if (cardEls.length === 0) {
if (ENV?.isDev) console.warn('⚠️ HelpCards.init: no se encontraron elementos .help-card');
return;
}
_controller = new AbortController();
const { signal } = _controller;
_cards = Array.from(cardEls);
_cards.forEach(card => {
card.setAttribute('tabindex', '0');
card.setAttribute('role',     'button');
card.setAttribute('aria-expanded', 'false');
const panel = card.querySelector('.help-card-content, .help-card-body');
if (panel) {
if (!panel.id) panel.id = `help-panel-${Math.random().toString(36).slice(2, 7)}`;
card.setAttribute('aria-controls', panel.id);
panel.setAttribute('role',           'region');
panel.setAttribute('aria-labelledby', card.id || '');
}
card.addEventListener('click', () => _toggle(card), { signal });
card.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
_toggle(card);
}
}, { signal });
});
_initialized = true;
if (ENV?.isDev) console.log(`✅ HelpCards: ${_cards.length} tarjetas inicializadas`);
}
function _toggle(targetCard) {
if (!_cards.includes(targetCard)) return;
const isOpen = targetCard.classList.contains('active');
_cards.forEach(card => {
if (card !== targetCard && card.classList.contains('active')) {
card.classList.remove('active');
card.setAttribute('aria-expanded', 'false'); 
}
});
targetCard.classList.toggle('active', !isOpen);
targetCard.setAttribute('aria-expanded', String(!isOpen));
if (typeof navigator.vibrate === 'function') {
try { navigator.vibrate(10); } catch { /* silencioso */ }
}
}
function destroy() {
if (_controller) {
_controller.abort(); 
_controller = null;
}
_cards.forEach(card => {
card.removeAttribute('tabindex');
card.removeAttribute('role');
card.removeAttribute('aria-expanded');
card.removeAttribute('aria-controls');
card.classList.remove('active');
});
_cards       = [];
_initialized = false;
if (ENV?.isDev) console.log('🧹 HelpCards: listeners eliminados');
}
return Object.freeze({ init, destroy });
})();
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => HelpCards.init(), { once: true });
} else {
HelpCards.init();
}
// ════════════════════════════════════════════════════════════════
// Tarjetas para deposito ⚽
// ════════════════════════════════════════════════════════════════
const TODAS_LAS_CUENTAS = {
// ╔══════════════════════════════════════╗
// ║             ALEXANDER                ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_alexander:     { key:"banorte_alexander",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_alexander:        { key:"bbva_alexander",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_alexander: { key:"mercadopago_alexander", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_alexander:      { key:"azteca_alexander",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_alexander:   { key:"santander_alexander",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_alexander:   { key:"bancoppel_alexander",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_alexander:        { key:"spin_alexander",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             ALFONSO                  ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_alfonso:     { key:"banorte_alfonso",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_alfonso:        { key:"bbva_alfonso",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_alfonso: { key:"mercadopago_alfonso", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_alfonso:      { key:"azteca_alfonso",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_alfonso:   { key:"santander_alfonso",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_alfonso:   { key:"bancoppel_alfonso",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_alfonso:        { key:"spin_alfonso",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             ARTURO                   ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_arturo:     { key:"banorte_arturo",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_arturo:        { key:"bbva_arturo",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_arturo: { key:"mercadopago_arturo", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_arturo:      { key:"azteca_arturo",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_arturo:   { key:"santander_arturo",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_arturo:   { key:"bancoppel_arturo",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_arturo:        { key:"spin_arturo",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             AZAEL                    ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_azael:     { key:"banorte_azael",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_azael:        { key:"bbva_azael",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_azael: { key:"mercadopago_azael", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_azael:      { key:"azteca_azael",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_azael:   { key:"santander_azael",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_azael:   { key:"bancoppel_azael",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_azael:        { key:"spin_azael",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             BOOSTERS                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_boosters:     { key:"banorte_boosters",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_boosters:        { key:"bbva_boosters",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_boosters: { key:"mercadopago_boosters", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_boosters:      { key:"azteca_boosters",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_boosters:   { key:"santander_boosters",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_boosters:   { key:"bancoppel_boosters",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_boosters:        { key:"spin_boosters",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             CHECO                    ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_checo:     { key:"banorte_checo",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_checo:        { key:"bbva_checo",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_checo: { key:"mercadopago_checo", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_checo:      { key:"azteca_checo",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_checo:   { key:"santander_checo",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_checo:   { key:"bancoppel_checo",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_checo:        { key:"spin_checo",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },
// ║ Choneke  ║             
bbva_choneke: { key:"bbva_choneke", clase:"help-deposit-card--bbva", logoClase:"help-bank-logo--bbva", banco:"Bancomer", titular:"Concepción", numero:"4152 3140 8370 2913", numeroCopy:"4152314083702913" },
// ╔══════════════════════════════════════╗
// ║             DANI                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_dani:     { key:"banorte_dani",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_dani:        { key:"bbva_dani",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_dani: { key:"mercadopago_dani", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_dani:      { key:"azteca_dani",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_dani:   { key:"santander_dani",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_dani:   { key:"bancoppel_dani",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_dani:        { key:"spin_dani",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             DEL ANGEL                ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_delangel:     { key:"banorte_delangel",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_delangel:        { key:"bbva_delangel",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_delangel: { key:"mercadopago_delangel", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_delangel:      { key:"azteca_delangel",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_delangel:   { key:"santander_delangel",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_delangel:   { key:"bancoppel_delangel",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_delangel:        { key:"spin_delangel",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             EL LEONA                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_elleona:     { key:"banorte_elleona",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_elleona:        { key:"bbva_elleona",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_elleona: { key:"mercadopago_elleona", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_elleona:      { key:"azteca_elleona",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_elleona:   { key:"santander_elleona",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_elleona:   { key:"bancoppel_elleona",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_elleona:        { key:"spin_elleona",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             EL PIOJO                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_elpiojo:     { key:"banorte_elpiojo",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_elpiojo:        { key:"bbva_elpiojo",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_elpiojo: { key:"mercadopago_elpiojo", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_elpiojo:      { key:"azteca_elpiojo",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_elpiojo:   { key:"santander_elpiojo",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_elpiojo:   { key:"bancoppel_elpiojo",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_elpiojo:        { key:"spin_elpiojo",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             ENERGETICOS              ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_energeticos:     { key:"banorte_energeticos",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_energeticos:        { key:"bbva_energeticos",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_energeticos: { key:"mercadopago_energeticos", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_energeticos:      { key:"azteca_energeticos",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_energeticos:   { key:"santander_energeticos",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_energeticos:   { key:"bancoppel_energeticos",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_energeticos:        { key:"spin_energeticos",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             ENOC                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_enoc:     { key:"banorte_enoc",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_enoc:        { key:"bbva_enoc",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_enoc: { key:"mercadopago_enoc", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_enoc:      { key:"azteca_enoc",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_enoc:   { key:"santander_enoc",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_enoc:   { key:"bancoppel_enoc",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_enoc:        { key:"spin_enoc",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             EVER                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_ever:     { key:"banorte_ever",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_ever:        { key:"bbva_ever",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_ever: { key:"mercadopago_ever", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_ever:      { key:"azteca_ever",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_ever:   { key:"santander_ever",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_ever:   { key:"bancoppel_ever",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_ever:        { key:"spin_ever",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             FER                      ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_fer:     { key:"banorte_fer",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_fer:        { key:"bbva_fer",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_fer: { key:"mercadopago_fer", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_fer:      { key:"azteca_fer",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_fer:   { key:"santander_fer",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_fer:   { key:"bancoppel_fer",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_fer:        { key:"spin_fer",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             FIGUEROA                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_figueroa:     { key:"banorte_figueroa",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_figueroa:        { key:"bbva_figueroa",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_figueroa: { key:"mercadopago_figueroa", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_figueroa:      { key:"azteca_figueroa",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_figueroa:   { key:"santander_figueroa",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_figueroa:   { key:"bancoppel_figueroa",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_figueroa:        { key:"spin_figueroa",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             GERA                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_gera:     { key:"banorte_gera",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_gera:        { key:"bbva_gera",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_gera: { key:"mercadopago_gera", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_gera:      { key:"azteca_gera",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_gera:   { key:"santander_gera",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_gera:   { key:"bancoppel_gera",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_gera:        { key:"spin_gera",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             GIOSOTO                  ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_giosoto:     { key:"banorte_giosoto",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_giosoto:        { key:"bbva_giosoto",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_giosoto: { key:"mercadopago_giosoto", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_giosoto:      { key:"azteca_giosoto",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_giosoto:   { key:"santander_giosoto",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_giosoto:   { key:"bancoppel_giosoto",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_giosoto:        { key:"spin_giosoto",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             GUERRERO                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_guerrero:     { key:"banorte_guerrero",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_guerrero:        { key:"bbva_guerrero",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_guerrero: { key:"mercadopago_guerrero", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_guerrero:      { key:"azteca_guerrero",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_guerrero:   { key:"santander_guerrero",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_guerrero:   { key:"bancoppel_guerrero",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_guerrero:        { key:"spin_guerrero",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             JAVIER GARCIA            ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_javiergarcia:     { key:"banorte_javiergarcia",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_javiergarcia:        { key:"bbva_javiergarcia",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_javiergarcia: { key:"mercadopago_javiergarcia", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_javiergarcia:      { key:"azteca_javiergarcia",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_javiergarcia:   { key:"santander_javiergarcia",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_javiergarcia:   { key:"bancoppel_javiergarcia",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_javiergarcia:        { key:"spin_javiergarcia",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             JJ                       ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_jj:     { key:"banorte_jj",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_jj:        { key:"bbva_jj",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_jj: { key:"mercadopago_jj", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_jj:      { key:"azteca_jj",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_jj:   { key:"santander_jj",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_jj:   { key:"bancoppel_jj",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_jj:        { key:"spin_jj",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             JOSE LUIS                ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_joseluis:     { key:"banorte_joseluis",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_joseluis:        { key:"bbva_joseluis",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_joseluis: { key:"mercadopago_joseluis", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_joseluis:      { key:"azteca_joseluis",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_joseluis:   { key:"santander_joseluis",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_joseluis:   { key:"bancoppel_joseluis",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_joseluis:        { key:"spin_joseluis",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             JUAN DE DIOS             ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_juandedios:     { key:"banorte_juandedios",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_juandedios:        { key:"bbva_juandedios",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_juandedios: { key:"mercadopago_juandedios", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_juandedios:      { key:"azteca_juandedios",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_juandedios:   { key:"santander_juandedios",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_juandedios:   { key:"bancoppel_juandedios",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_juandedios:        { key:"spin_juandedios",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             JUANILLO                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_juanillo:     { key:"banorte_juanillo",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_juanillo:        { key:"bbva_juanillo",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_juanillo: { key:"mercadopago_juanillo", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_juanillo:      { key:"azteca_juanillo",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_juanillo:   { key:"santander_juanillo",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_juanillo:   { key:"bancoppel_juanillo",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_juanillo:        { key:"spin_juanillo",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             KANY                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_kany:     { key:"banorte_kany",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_kany:        { key:"bbva_kany",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_kany: { key:"mercadopago_kany", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_kany:      { key:"azteca_kany",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_kany:   { key:"santander_kany",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_kany:   { key:"bancoppel_kany",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_kany:        { key:"spin_kany",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             MANU                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_manu:     { key:"banorte_manu",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_manu:        { key:"bbva_manu",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_manu: { key:"mercadopago_manu", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_manu:      { key:"azteca_manu",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_manu:   { key:"santander_manu",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_manu:   { key:"bancoppel_manu",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_manu:        { key:"spin_manu",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             MARCHAN                  ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_marchan:     { key:"banorte_marchan",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_marchan:        { key:"bbva_marchan",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_marchan: { key:"mercadopago_marchan", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_marchan:      { key:"azteca_marchan",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_marchan:   { key:"santander_marchan",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_marchan:   { key:"bancoppel_marchan",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_marchan:        { key:"spin_marchan",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             MARCOS                   ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_marcos:     { key:"banorte_marcos",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_marcos:        { key:"bbva_marcos",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_marcos: { key:"mercadopago_marcos", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_marcos:      { key:"azteca_marcos",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_marcos:   { key:"santander_marcos",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_marcos:   { key:"bancoppel_marcos",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_marcos:        { key:"spin_marcos",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             MAZATAN                  ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_mazatan:     { key:"banorte_mazatan",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_mazatan:        { key:"bbva_mazatan",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_mazatan: { key:"mercadopago_mazatan", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_mazatan:      { key:"azteca_mazatan",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_mazatan:   { key:"santander_mazatan",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_mazatan:   { key:"bancoppel_mazatan",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_mazatan:        { key:"spin_mazatan",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             MEMO                     ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_memo:     { key:"banorte_memo",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_memo:        { key:"bbva_memo",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_memo: { key:"mercadopago_memo", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_memo:      { key:"azteca_memo",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_memo:   { key:"santander_memo",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_memo:   { key:"bancoppel_memo",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_memo:        { key:"spin_memo",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },
// ╔══════════════════════════════════════╗
// ║             Pantoja                  ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_pantoja:     { key:"banorte_pantoja",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",      titular:"Pantoja", numero:"4189 1432 9148 8206", numeroCopy:"4189143291488206" },
// 7️⃣ Spin by Oxxo
spin_pantoja:        { key:"spin_pantoja",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo", titular:"Pantoja", numero:"4217 4702 7563 9215", numeroCopy:"4217470275639215" },
//║Patty║
bbva_patty_1:       { key:"bbva_patty_1",       clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",     titular:"Patty", numero:"4152 3131 4283 9989", numeroCopy:"4152313142839989" },
bbva_patty_2:       { key:"bbva_patty_2",       clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",     titular:"Patty", numero:"4152 3140 7229 3171", numeroCopy:"4152314072293171" },
bbva_patty_3:       { key:"bbva_patty_3",       clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",     titular:"Patty", numero:"4152 3138 2630 4649", numeroCopy:"4152313826304649" },
banorte_patty:      { key:"banorte_patty",      clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",      titular:"Patty", numero:"4189 1432 1647 2863", numeroCopy:"4189143216472863" },
spin_patty_1:       { key:"spin_patty_1",       clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo", titular:"Patty", numero:"4217 4700 9325 7828", numeroCopy:"4217470093257828" },
spin_patty_2:       { key:"spin_patty_2",       clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo", titular:"Patty", numero:"7289 6900 0003 0832 894", numeroCopy:"7289690000030832894" },
azteca_patty:       { key:"azteca_patty",       clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca", titular:"Patty", numero:"4198 2101 4171 8824", numeroCopy:"4198210141718824" },
scotiabank_patty:   { key:"scotiabank_patty",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Scotiabank",   titular:"Patty", numero:"4043 1300 0616 9680", numeroCopy:"4043130006169680" },
// ╔══════════════════════════════════════╗
// ║             POLLOGOL                 ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_pollogol:     { key:"banorte_pollogol",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_pollogol:        { key:"bbva_pollogol",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_pollogol: { key:"mercadopago_pollogol", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_pollogol:      { key:"azteca_pollogol",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_pollogol:   { key:"santander_pollogol",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_pollogol:   { key:"bancoppel_pollogol",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_pollogol:        { key:"spin_pollogol",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             RANITA                   ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_ranita:     { key:"banorte_ranita",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_ranita:        { key:"bbva_ranita",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_ranita: { key:"mercadopago_ranita", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_ranita:      { key:"azteca_ranita",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_ranita:   { key:"santander_ranita",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_ranita:   { key:"bancoppel_ranita",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_ranita:        { key:"spin_ranita",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },

// ╔══════════════════════════════════════╗
// ║             ROLANDO                  ║
// ╚══════════════════════════════════════╝
// 1️⃣ Banorte
banorte_rolando:     { key:"banorte_rolando",     clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",       titular:"", numero:"", numeroCopy:"" },
// 2️⃣ Bancomer
bbva_rolando:        { key:"bbva_rolando",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",      titular:"", numero:"", numeroCopy:"" },
// 3️⃣ Mercado Pago
mercadopago_rolando: { key:"mercadopago_rolando", clase:"help-deposit-card--mercadopago", logoClase:"help-bank-logo--mercadopago", banco:"Mercado Pago",  titular:"", numero:"", numeroCopy:"" },
// 4️⃣ Banco Azteca
azteca_rolando:      { key:"azteca_rolando",      clase:"help-deposit-card--azteca",      logoClase:"help-bank-logo--azteca",      banco:"Banco Azteca",  titular:"", numero:"", numeroCopy:"" },
// 5️⃣ Santander
santander_rolando:   { key:"santander_rolando",   clase:"help-deposit-card--santander",   logoClase:"help-bank-logo--santander",   banco:"Santander",     titular:"", numero:"", numeroCopy:"" },
// 6️⃣ Bancoppel
bancoppel_rolando:   { key:"bancoppel_rolando",   clase:"help-deposit-card--bancoppel",   logoClase:"help-bank-logo--bancoppel",   banco:"Bancoppel",     titular:"", numero:"", numeroCopy:"" },
// 7️⃣ Spin by Oxxo
spin_rolando:        { key:"spin_rolando",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo",  titular:"", numero:"", numeroCopy:"" },
// ╔══════════════════════════════════════╗
// ║             El Wero              ║
// ╚══════════════════════════════════════╝
banorte_punto:       { key:"banorte_punto",       clase:"help-deposit-card--banorte",     logoClase:"help-bank-logo--banorte",     banco:"Banorte",      titular:"Irving Emilio Gonzalez Romero", numero:"4189 1430 7518 4476", numeroCopy:"4189143075184476" },
bbva_punto_1:        { key:"bbva_punto_1",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",     titular:"Irving Emilio Gonzalez Romero", numero:"4152 3137 2949 5908", numeroCopy:"4152313729495908" },
bbva_punto_2:        { key:"bbva_punto_2",        clase:"help-deposit-card--bbva",        logoClase:"help-bank-logo--bbva",        banco:"Bancomer",     titular:"Irving Emilio Gonzalez Romero", numero:"4152 3137 2949 5916", numeroCopy:"4152313729495916" },
spin_punto_1:        { key:"spin_punto_1",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo", titular:"Irving Emilio Gonzalez Romero", numero:"4217 4700 8441 1996", numeroCopy:"4217470084411996" },
spin_punto_2:        { key:"spin_punto_2",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo", titular:"Irving Emilio Gonzalez Romero", numero:"4217 4700 0587 8323", numeroCopy:"4217470005878323" },
spin_punto_3:        { key:"spin_punto_3",        clase:"help-deposit-card--spin",        logoClase:"help-bank-logo--spin",        banco:"Spin by Oxxo", titular:"Irving Emilio Gonzalez Romero", numero:"4217 4700 8443 4659", numeroCopy:"4217470084434659" },
};
const VENDEDOR_CUENTAS = {
"Alexander":     ["banorte_alexander","bbva_alexander","mercadopago_alexander","azteca_alexander","santander_alexander","bancoppel_alexander","spin_alexander"],
"Alfonso":       ["banorte_alfonso","bbva_alfonso","mercadopago_alfonso","azteca_alfonso","santander_alfonso","bancoppel_alfonso","spin_alfonso"],
"Arturo":        ["banorte_arturo","bbva_arturo","mercadopago_arturo","azteca_arturo","santander_arturo","bancoppel_arturo","spin_arturo"],
"Azael":         ["banorte_azael","bbva_azael","mercadopago_azael","azteca_azael","santander_azael","bancoppel_azael","spin_azael"],
"Boosters":      ["banorte_boosters","bbva_boosters","mercadopago_boosters","azteca_boosters","santander_boosters","bancoppel_boosters","spin_boosters"],
"Checo":         ["banorte_checo","bbva_checo","mercadopago_checo","azteca_checo","santander_checo","bancoppel_checo","spin_checo"],
"Choneke":       ['bbva_choneke'],
"Dani":          ["banorte_dani","bbva_dani","mercadopago_dani","azteca_dani","santander_dani","bancoppel_dani","spin_dani"],
"Del Angel":     ["banorte_delangel","bbva_delangel","mercadopago_delangel","azteca_delangel","santander_delangel","bancoppel_delangel","spin_delangel"],
"El Leona":      ["banorte_elleona","bbva_elleona","mercadopago_elleona","azteca_elleona","santander_elleona","bancoppel_elleona","spin_elleona"],
"El Piojo":      ["banorte_elpiojo","bbva_elpiojo","mercadopago_elpiojo","azteca_elpiojo","santander_elpiojo","bancoppel_elpiojo","spin_elpiojo"],
"Energeticos":   ["banorte_energeticos","bbva_energeticos","mercadopago_energeticos","azteca_energeticos","santander_energeticos","bancoppel_energeticos","spin_energeticos"],
"Enoc":          ["banorte_enoc","bbva_enoc","mercadopago_enoc","azteca_enoc","santander_enoc","bancoppel_enoc","spin_enoc"],
"Ever":          ["banorte_ever","bbva_ever","mercadopago_ever","azteca_ever","santander_ever","bancoppel_ever","spin_ever"],
"Fer":           ["banorte_fer","bbva_fer","mercadopago_fer","azteca_fer","santander_fer","bancoppel_fer","spin_fer"],
"Figueroa":      ["banorte_figueroa","bbva_figueroa","mercadopago_figueroa","azteca_figueroa","santander_figueroa","bancoppel_figueroa","spin_figueroa"],
"Gera":          ["banorte_gera","bbva_gera","mercadopago_gera","azteca_gera","santander_gera","bancoppel_gera","spin_gera"],
"GioSoto":       ["banorte_giosoto","bbva_giosoto","mercadopago_giosoto","azteca_giosoto","santander_giosoto","bancoppel_giosoto","spin_giosoto"],
"Guerrero":      ["banorte_guerrero","bbva_guerrero","mercadopago_guerrero","azteca_guerrero","santander_guerrero","bancoppel_guerrero","spin_guerrero"],
"Javier Garcia": ["banorte_javiergarcia","bbva_javiergarcia","mercadopago_javiergarcia","azteca_javiergarcia","santander_javiergarcia","bancoppel_javiergarcia","spin_javiergarcia"],
"JJ":            ["banorte_jj","bbva_jj","mercadopago_jj","azteca_jj","santander_jj","bancoppel_jj","spin_jj"],
"Jose Luis":     ["banorte_joseluis","bbva_joseluis","mercadopago_joseluis","azteca_joseluis","santander_joseluis","bancoppel_joseluis","spin_joseluis"],
"Juan de Dios":  ["banorte_juandedios","bbva_juandedios","mercadopago_juandedios","azteca_juandedios","santander_juandedios","bancoppel_juandedios","spin_juandedios"],
"Juanillo":      ["banorte_juanillo","bbva_juanillo","mercadopago_juanillo","azteca_juanillo","santander_juanillo","bancoppel_juanillo","spin_juanillo"],
"Kany":          ["banorte_kany","bbva_kany","mercadopago_kany","azteca_kany","santander_kany","bancoppel_kany","spin_kany"],
"Manu":          ["banorte_manu","bbva_manu","mercadopago_manu","azteca_manu","santander_manu","bancoppel_manu","spin_manu"],
"Marchan":       ["banorte_marchan","bbva_marchan","mercadopago_marchan","azteca_marchan","santander_marchan","bancoppel_marchan","spin_marchan"],
"Marcos":        ["banorte_marcos","bbva_marcos","mercadopago_marcos","azteca_marcos","santander_marcos","bancoppel_marcos","spin_marcos"],
"Mazatan":       ["banorte_mazatan","bbva_mazatan","mercadopago_mazatan","azteca_mazatan","santander_mazatan","bancoppel_mazatan","spin_mazatan"],
"Memo":          ["banorte_memo","bbva_memo","mercadopago_memo","azteca_memo","santander_memo","bancoppel_memo","spin_memo"],
"Pantoja":       ["banorte_pantoja", "spin_pantoja"],
"Patty":         ['bbva_patty_1', 'bbva_patty_2', 'bbva_patty_3', 'banorte_patty', 'spin_patty_1', 'spin_patty_2', 'azteca_patty', 'scotiabank_patty'],
"PolloGol":      ["banorte_pollogol","bbva_pollogol","mercadopago_pollogol","azteca_pollogol","santander_pollogol","bancoppel_pollogol","spin_pollogol"],
"Ranita":        ["banorte_ranita","bbva_ranita","mercadopago_ranita","azteca_ranita","santander_ranita","bancoppel_ranita","spin_ranita"],
"Rolando":       ["banorte_rolando","bbva_rolando","mercadopago_rolando","azteca_rolando","santander_rolando","bancoppel_rolando","spin_rolando"],
"•":             ['banorte_punto', 'bbva_punto_1', 'bbva_punto_2', 'spin_punto_1', 'spin_punto_2', 'spin_punto_3'],
};
const DepositCards = {
getCuentas() {
const vendedor = currentVendedor || localStorage.getItem('vendedor') || '';
const keys = VENDEDOR_CUENTAS[vendedor] ?? VENDEDOR_CUENTAS["default"];
return keys
.map(k => TODAS_LAS_CUENTAS[k])
.filter(c => c && c.numero && c.numero.trim() !== "" && c.numero !== "XXXX XXXX XXXX XXXX");
},
buildCard(c) {
return `<article class="help-deposit-card ${c.clase}"><div class="help-deposit-card__header"><div class="help-deposit-card__logo"><span class="help-bank-logo ${c.logoClase}">${c.banco}</span></div><div class="help-deposit-card__security">🔒</div></div><div class="help-deposit-card__body"><div class="help-deposit-card__label">Número de tarjeta</div><div class="help-deposit-card__number">${c.numero}</div></div><div class="help-deposit-card__footer"><span class="help-deposit-card__name">Titular: ${c.titular}</span><button class="help-deposit-card__copy" data-copy="${c.numeroCopy}"><span>📋</span> Copiar</button></div></article>`;
},
renderCards() {
const container = document.querySelector('.help-deposit-cards');
if (!container) return;
const cuentas = this.getCuentas();
if (!cuentas.length) {
container.innerHTML = `<p style="text-align:center;color:var(--gris-300);padding:20px;">No hay métodos de pago para este vendedor.</p>`;
return;
}
container.innerHTML = cuentas.map(c => this.buildCard(c)).join('');
container.querySelectorAll('.help-deposit-card__copy').forEach(btn => {
btn.addEventListener('click', async (e) => {
e.stopPropagation();
const ok = await copyToClipboard(btn.dataset.copy);
if (ok) {
const orig = btn.innerHTML;
btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>¡Listo!</span>`;
btn.classList.add('copied');
showToast('Copiado al portapapeles', 'success');
if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2000);
}
});
});
},
init() {
this.renderCards();
}
};
const FAQ = {
init() {
const items = document.querySelectorAll(".help-faq-item");
items.forEach((item) => {
const question = item.querySelector(".help-faq-question");
question.addEventListener("click", () => this.toggle(item));
question.setAttribute("aria-expanded", "false");
});
},
toggle(item) {
const isOpen = item.classList.contains("active");
const question = item.querySelector(".help-faq-question");
document.querySelectorAll(".help-faq-item.active").forEach((openItem) => {
if (openItem !== item) {
openItem.classList.remove("active");
openItem.querySelector(".help-faq-question").setAttribute("aria-expanded", "false");
}
});
item.classList.toggle("active");
question.setAttribute("aria-expanded", !isOpen);
if ("vibrate" in navigator) navigator.vibrate(10);
},
};
const ScrollAnimations = {
observer: null,
init() {
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
this.showAllElements();
return;
}
const options = {
root: null,
rootMargin: "0px 0px -50px 0px",
threshold: 0.1,
};
this.observer = new IntersectionObserver((entries) => {
entries.forEach((entry) => {
if (entry.isIntersecting) {
const delay = this.getStaggerDelay(entry.target);
setTimeout(() => {
entry.target.classList.add("visible");
}, delay);
this.observer.unobserve(entry.target);
}
});
}, options);
const elements = document.querySelectorAll(".help-card, .help-deposit-card, .help-step, .help-faq-item");
elements.forEach((el) => this.observer.observe(el));
},
getStaggerDelay(element) {
const siblings = element.parentElement.children;
const index = Array.from(siblings).indexOf(element);
return index * 100;
},
showAllElements() {
const elements = document.querySelectorAll(".help-card, .help-deposit-card, .help-step, .help-faq-item");
elements.forEach((el) => el.classList.add("visible"));
},
};
const TouchFeedback = {
init() {
const interactiveElements = document.querySelectorAll(
".help-card, .help-deposit-card, .help-faq-question, .help-whatsapp-button, .help-deposit-card__copy"
);
interactiveElements.forEach((el) => {
el.addEventListener("touchstart", () => { el.style.opacity = "0.9"; }, { passive: true });
el.addEventListener("touchend", () => { el.style.opacity = ""; }, { passive: true });
el.addEventListener("touchcancel", () => { el.style.opacity = ""; }, { passive: true });
});
},
};
const SmoothScroll = {
init() {
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
anchor.addEventListener("click", (e) => {
e.preventDefault();
const targetId = anchor.getAttribute("href");
const target = document.querySelector(targetId);
if (target) {
target.scrollIntoView({ behavior: "smooth", block: "start" });
}
});
});
},
};
function initHelpPage() {
HelpCards.init();
DepositCards.init();
FAQ.init();
ScrollAnimations.init();
TouchFeedback.init();
SmoothScroll.init();
console.log("✅ Ayuda inicializada");
}
document.addEventListener("visibilitychange", () => {
if (document.visibilityState === "visible" && !ScrollAnimations.observer) {
ScrollAnimations.init();
}
});
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para Inicialización - cuando la página carga completamente -------------------------------*/
const AppInit = (() => {
let _pollingId = null;
let _pageController = null;
function _buildSimHeaderContent(partido) {
if (!partido || typeof partido !== 'object') return document.createDocumentFragment();
const wrap = document.createElement('div');
wrap.className = 'match-header';
const localImg = document.createElement('img');
localImg.src = (typeof _isSafeImageUrl === 'function' && _isSafeImageUrl(partido.localLogo))
? partido.localLogo
: '';
localImg.alt = partido.local ?? '';
localImg.className = 'match-logo';
localImg.loading = 'lazy';
localImg.onerror = function() { this.style.visibility = 'hidden'; this.onerror = null; };
const vsSpan = document.createElement('span');
vsSpan.className = 'match-vs';
vsSpan.textContent = 'vs';
const visitImg = document.createElement('img');
visitImg.src = (typeof _isSafeImageUrl === 'function' && _isSafeImageUrl(partido.visitanteLogo))
? partido.visitanteLogo
: '';
visitImg.alt = partido.visitante ?? '';
visitImg.className = 'match-logo';
visitImg.loading = 'lazy';
visitImg.onerror = function() { this.style.visibility = 'hidden'; this.onerror = null; };
wrap.appendChild(localImg);
wrap.appendChild(vsSpan);
wrap.appendChild(visitImg);
return wrap;
}
function _updateSimHeaders() {
const partidos = AppState.getPartidos();
const simHeaders = document.querySelectorAll(
'#tabSimulador .results-table thead .col-match'
);
simHeaders.forEach(th => {
const rawIndex = th.dataset.matchIndex;
const index = parseInt(rawIndex, 10);
if (!Number.isInteger(index) || index < 1) {
if (ENV?.isDev) console.warn(`⚠️ SimHeaders: data-match-index inválido "${rawIndex}"`);
return;
}
const partido = partidos[index - 1];
if (!partido) return;
th.textContent = '';
th.appendChild(_buildSimHeaderContent(partido));
});
}
async function _loadInitialData() {
await Promise.all([
cargarPartidos(),
cargarJornadaActual(),
]);
}
function _renderInitialUI() {
const renders = [
['updateHeroStats',       updateHeroStats],
['actualizarJornada',     actualizarJornada],
['renderMatchesHorarios', renderMatchesHorarios],
['renderQuinielaMatches', renderQuinielaMatches],
['renderMatchesHeader',   renderMatchesHeader],
['updateQuinielaCount',   updateQuinielaCount],
['updatePrice',           updatePrice],
['updateSavedBadge',      updateSavedBadge],
['_updateSimHeaders',     _updateSimHeaders],
];
renders.forEach(([name, fn]) => {
try {
fn();
} catch (err) {
console.error(`❌ AppInit._renderInitialUI: ${name} falló:`, err);
}
});
}
function _initModules(signal) {
const modules = [
['initHelpPage', () => {
if (typeof initHelpPage === 'function') initHelpPage(signal);
}],
];
modules.forEach(([name, fn]) => {
try {
fn();
} catch (err) {
console.error(`❌ AppInit._initModules: ${name} falló:`, err);
}
});
}
async function _loadOfflineData() {
const TIMEOUT_MS = 15_000;
const timeoutPromise = new Promise((_, reject) =>
setTimeout(() => reject(new Error('loadDataFromAPI timeout')), TIMEOUT_MS)
);
try {
const success = await Promise.race([loadDataFromAPI(), timeoutPromise]);
if (success) {
if (ENV?.isDev) console.log('✅ Datos de Lista Oficial cargados');
try { if (typeof quiniela?.initFirstPlacePage === 'function') quiniela.initFirstPlacePage(); } catch (e) { console.error('❌ initFirstPlacePage:', e); }
try { if (typeof quiniela?.initSecondPlacePage === 'function') quiniela.initSecondPlacePage(); } catch (e) { console.error('❌ initSecondPlacePage:', e); }
try { if (typeof simulador?.init === 'function') simulador.init(); } catch (e) { console.error('❌ simulador.init:', e); }
} else {
console.warn('⚠️ Lista Oficial no disponible — funcionalidad reducida');
}
} catch (err) {
console.warn('⚠️ loadDataFromAPI no respondió:', err.message);
}
}
function _startPolling() {
_pollingId = setInterval(async () => {
try {
await cargarPorcentajes();
} catch (err) {
if (ENV?.isDev) console.warn('⚠️ cargarPorcentajes falló en polling:', err.message);
}
}, 30_000);
}
function _stopPolling() {
if (_pollingId !== null) {
clearInterval(_pollingId);
_pollingId = null;
}
}
function _initSearchUI(signal) {
const searchBtn   = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
if (!searchBtn && !searchInput) return;
const doSearch = () => quiniela?.searchParticipant?.();
const debouncedSearch = debounce(doSearch, 300);
if (searchBtn) {
searchBtn.addEventListener('click', doSearch, { signal });
}
if (searchInput) {
searchInput.addEventListener('input', debouncedSearch, { signal });
searchInput.addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
e.preventDefault();
debouncedSearch.flush();
}
}, { signal });
}
}
function _handleInitialRoute(signal) {
const renderRoute = (hash) => {
try {
const page = (hash ?? '').replace('#', '') || 'inicio';
if (page === 'resultados' && typeof renderMyQuinielas === 'function') {
renderMyQuinielas();
}
} catch (err) {
if (ENV?.isDev) console.warn('⚠️ _handleInitialRoute renderRoute falló:', err.message);
}
};
renderRoute(window.location.hash);
window.addEventListener('hashchange', (e) => {
try {
const newHash = new URL(e.newURL).hash;
renderRoute(newHash);
} catch (err) {
if (ENV?.isDev) console.warn('⚠️ _handleInitialRoute hashchange falló:', err.message);
}
}, { signal });
}
async function _loadInitialPorcentajes() {
try {
await cargarPorcentajes();
} catch (err) {
if (ENV?.isDev) console.warn('⚠️ cargarPorcentajes inicial falló:', err.message);
}
}
async function init() {
if (ENV?.isDev) console.log('🚀 Quinielas El Wero: iniciando...');
destroy();
_pageController = new AbortController();
const { signal } = _pageController;
try {
await _loadInitialData();
await _loadInitialPorcentajes();
_renderInitialUI();
_initModules(signal);
_initSearchUI(signal);
_handleInitialRoute(signal);
_startPolling();
_loadOfflineData().catch(err => {
if (ENV?.isDev) console.warn('⚠️ _loadOfflineData (background) falló:', err.message);
});
if (ENV?.isDev) console.log('✅ Inicialización completa');
} catch (err) {
console.error('❌ Error crítico en inicialización:', err);
if (typeof showToast === 'function') {
showToast('Error al cargar la aplicación. Recarga la página.', 'error');
}
}
}
function destroy() {
_stopPolling();
if (_pageController) {
_pageController.abort();
_pageController = null;
}
if (ENV?.isDev) console.log('🧹 AppInit destruido');
}
return Object.freeze({ init, destroy });
})();
document.addEventListener('DOMContentLoaded', () => AppInit.init(), { once: true });
/*------------Esto de abajo se encarga de trabajar en nuestro archivo y se usa Activación del panel Admin - Modo secreto  -------------------------------*/
const AdminPanel = (() => {
let _activated = false;
let _clickCount = 0;
let _lastClickTime = 0;
let _failedAttempts = 0;
let _lockoutUntil = 0;
let _controller = null;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000;
const CLICK_RESET_MS = 2000;
const FETCH_TIMEOUT = 8000;
function _isLockedOut() {
return Date.now() < _lockoutUntil;
}
function _getRemainingLockout() {
return Math.ceil((_lockoutUntil - Date.now()) / 1000 / 60);
}
function init() {
try {
if (_controller) _destroy();
_controller = new AbortController();
const signal = _controller.signal;
const storedActivated = sessionStorage.getItem('adminActivated');
const vendedor = localStorage.getItem('vendedor');
if (storedActivated === 'true' && vendedor) {
_activated = true;
_addAdminButton();
}
const headerText = document.querySelector('.brand-name');
if (!headerText) {
if (ENV?.isDev) console.warn('⚠️ AdminPanel: .brand-name no encontrado');
return;
}
headerText.classList.add('brand-name--clickable');
headerText.addEventListener('click', (e) => {
try {
e.preventDefault();
if (_activated) {
if (typeof navigateTo === 'function') navigateTo('admin');
return;
}
const now = Date.now();
if (now - _lastClickTime > CLICK_RESET_MS) _clickCount = 0;
_lastClickTime = now;
_clickCount++;
_showClickFeedback(headerText);
if (_clickCount >= 3) {
_clickCount = 0;
_mostrarPINAcceso();
}
} catch (err) {
if (ENV?.isDev) console.error('❌ AdminPanel header click:', err);
}
}, { signal });
document.addEventListener('visibilitychange', _handleVisibilityChange, { signal });
window.addEventListener('beforeunload', _handleBeforeUnload, { signal });
} catch (err) {
if (ENV?.isDev) console.error('❌ AdminPanel.init:', err);
}
}
function _showClickFeedback(element) {
element.classList.add('brand-name--active-feedback');
setTimeout(() => element.classList.remove('brand-name--active-feedback'), 200);
}
function _mostrarPINAcceso() {
try {
const vendedor = localStorage.getItem('vendedor');
if (!vendedor) return;
if (_isLockedOut()) {
if (typeof showToast === 'function') {
showToast(`Demasiados intentos. Espera ${_getRemainingLockout()} min.`, 'error');
}
return;
}
document.getElementById('modalAdminPIN')?.remove();
const overlay = document.createElement('div');
overlay.id = 'modalAdminPIN';
overlay.className = 'admin-pin-overlay';
const box = document.createElement('div');
box.className = 'admin-pin-box';
const icon = document.createElement('div');
icon.className = 'admin-pin-icon';
icon.setAttribute('aria-hidden', 'true');
icon.textContent = '⚙️';
const title = document.createElement('h2');
title.className = 'admin-pin-title';
title.textContent = 'Panel de Vendedor';
const nameEl = document.createElement('p');
nameEl.className = 'admin-pin-name';
nameEl.textContent = vendedor;
const hint = document.createElement('p');
hint.className = 'admin-pin-hint';
hint.textContent = 'Ingresa tu PIN de 4 dígitos';
const attemptsEl = document.createElement('p');
attemptsEl.className = 'admin-pin-attempts';
attemptsEl.id = 'adminPinAttempts';
const remaining = MAX_ATTEMPTS - _failedAttempts;
attemptsEl.textContent = `${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
const dotsContainer = document.createElement('div');
dotsContainer.className = 'admin-pin-dots';
dotsContainer.id = 'pinDisplayAdmin';
for (let i = 0; i < 4; i++) {
const dot = document.createElement('div');
dot.className = 'pin-dot-admin';
dotsContainer.appendChild(dot);
}
const pad = document.createElement('div');
pad.className = 'admin-pin-pad';
pad.id = 'pinPadAdmin';
const context = {
pinIngresado: '',
isSubmitting: false,
container: overlay,
dotsContainer,
errorEl: null,
pad,
attemptsEl,
};
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'];
digits.forEach(n => {
const btn = document.createElement('button');
btn.type = 'button';
btn.className = n === null ? 'pin-btn-admin pin-btn-admin--empty' : 'pin-btn-admin';
if (n !== null) {
btn.dataset.num = String(n);
btn.textContent = String(n);
btn.addEventListener('click', () => _handlePinInput(n, context));
} else {
btn.setAttribute('aria-hidden', 'true');
btn.setAttribute('tabindex', '-1');
}
pad.appendChild(btn);
});
const cancelBtn = document.createElement('button');
cancelBtn.type = 'button';
cancelBtn.className = 'admin-pin-cancel';
cancelBtn.id = 'btnCancelarAdmin';
cancelBtn.textContent = 'Cancelar';
cancelBtn.addEventListener('click', () => overlay.remove());
const errorEl = document.createElement('p');
errorEl.className = 'admin-pin-error';
errorEl.id = 'errorAdmin';
errorEl.setAttribute('role', 'alert');
errorEl.setAttribute('aria-live', 'polite');
context.errorEl = errorEl;
box.appendChild(icon);
box.appendChild(title);
box.appendChild(nameEl);
box.appendChild(hint);
box.appendChild(attemptsEl);
box.appendChild(dotsContainer);
box.appendChild(pad);
box.appendChild(cancelBtn);
box.appendChild(errorEl);
overlay.appendChild(box);
document.body.appendChild(overlay);
overlay.addEventListener('click', (e) => {
if (e.target === overlay) overlay.remove();
});
if (_isLockedOut()) {
_lockPinPad(context);
}
} catch (err) {
if (ENV?.isDev) console.error('❌ _mostrarPINAcceso:', err);
}
}
function _handlePinInput(value, ctx) {
if (ctx.isSubmitting) return;
if (value === '⌫') {
ctx.pinIngresado = ctx.pinIngresado.slice(0, -1);
_actualizarDots(ctx.pinIngresado, ctx.dotsContainer);
return;
}
if (ctx.pinIngresado.length >= 4) return;
ctx.pinIngresado += String(value);
_actualizarDots(ctx.pinIngresado, ctx.dotsContainer);
if (ctx.pinIngresado.length === 4) {
_verificarPIN(ctx.pinIngresado, ctx);
}
}
function _actualizarDots(pin, dotsContainer) {
const dots = dotsContainer.querySelectorAll('.pin-dot-admin');
dots.forEach((dot, i) => {
dot.classList.toggle('filled', i < pin.length);
dot.classList.remove('error');
});
}
function _lockPinPad(ctx) {
ctx.pad.querySelectorAll('.pin-btn-admin').forEach(btn => {
btn.disabled = true;
});
ctx.errorEl.textContent = `Demasiados intentos. Espera ${_getRemainingLockout()} min.`;
}
async function _verificarPIN(pin, ctx) {
const vendedor = localStorage.getItem('vendedor');
if (!vendedor) return;
ctx.isSubmitting = true;
ctx.pad.querySelectorAll('.pin-btn-admin').forEach(btn => btn.disabled = true);
ctx.errorEl.textContent = '';
const fetchController = new AbortController();
const timeoutId = setTimeout(() => fetchController.abort(), FETCH_TIMEOUT);
try {
const response = await fetch(`${API_BASE}/api/verificar-pin`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ vendedor, pin }),
signal: fetchController.signal,
});
clearTimeout(timeoutId);
if (response.ok) {
const data = await response.json();
const token = data?.token;
if (token) {
sessionStorage.setItem('adminToken', token);
}
sessionStorage.setItem('adminActivated', 'true');
_activated = true;
_failedAttempts = 0;
ctx.container.remove();
_addAdminButton();
setTimeout(() => {
const adminBtn = document.querySelector('.nav-item[data-page="admin"]');
adminBtn?.click();
}, 300);
} else {
_failedAttempts++;
if (_failedAttempts >= MAX_ATTEMPTS) {
_lockoutUntil = Date.now() + LOCKOUT_MS;
_lockPinPad(ctx);
return;
}
const remaining = MAX_ATTEMPTS - _failedAttempts;
ctx.attemptsEl.textContent = `${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`;
ctx.errorEl.textContent = '❌ PIN incorrecto';
const dots = ctx.dotsContainer.querySelectorAll('.pin-dot-admin');
dots.forEach(dot => dot.classList.add('error'));
if (typeof navigator.vibrate === 'function') {
try { navigator.vibrate([100, 50, 100]); } catch {}
}
setTimeout(() => {
ctx.pinIngresado = '';
_actualizarDots('', ctx.dotsContainer);
ctx.pad.querySelectorAll('.pin-btn-admin').forEach(btn => btn.disabled = false);
ctx.isSubmitting = false;
}, 600);
}
} catch (err) {
clearTimeout(timeoutId);
const isTimeout = err.name === 'AbortError';
ctx.errorEl.textContent = isTimeout ? '⏱ Tiempo de espera agotado' : '❌ Error de conexión';
ctx.pad.querySelectorAll('.pin-btn-admin').forEach(btn => btn.disabled = false);
ctx.isSubmitting = false;
ctx.pinIngresado = '';
_actualizarDots('', ctx.dotsContainer);
}
}
function _addAdminButton() {
const navItems = document.getElementById('navItems');
if (!navItems) return;
if (document.querySelector('.nav-item[data-page="admin"]')) return;
const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'nav-item';
btn.setAttribute('data-page', 'admin');
const iconSpan = document.createElement('span');
iconSpan.className = 'nav-icon';
iconSpan.setAttribute('aria-hidden', 'true');
iconSpan.textContent = '⚙️';
const labelSpan = document.createElement('span');
labelSpan.className = 'nav-label';
labelSpan.textContent = 'Admin';
btn.appendChild(iconSpan);
btn.appendChild(labelSpan);
btn.addEventListener('click', () => {
const adminPage = document.getElementById('pageAdmin');
const isAdminActive = adminPage?.classList.contains('active');
document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
if (isAdminActive) {
if (typeof navigateTo === 'function') navigateTo('inicio');
} else {
btn.classList.add('active');
if (typeof navigateTo === 'function') navigateTo('admin');
}
document.getElementById('floatingNav')?.classList.remove('open');
});
navItems.appendChild(btn);
}
function _handleVisibilityChange() {
}
function _handleBeforeUnload() {
if (_activated) {
sessionStorage.removeItem('adminActivated');
sessionStorage.removeItem('adminToken');
}
}
function deactivate() {
_activated = false;
_failedAttempts = 0;
sessionStorage.removeItem('adminActivated');
sessionStorage.removeItem('adminToken');
const btn = document.querySelector('.nav-item[data-page="admin"]');
if (btn) btn.remove();
if (typeof navigateTo === 'function') navigateTo('inicio');
if (typeof showToast === 'function') showToast('Sesión cerrada 🔒', 'success');
}
function _destroy() {
if (_controller) {
_controller.abort();
_controller = null;
}
}
return Object.freeze({ init, deactivate });
})();
document.addEventListener('DOMContentLoaded', () => AdminPanel.init(), { once: true });
const AdminContent = (() => {
let _controller = null;
let _animFrames = [];
let _currentFilters = 'all';
const FETCH_TIMEOUT = 10_000;
async function _safeFetch(url, options = {}) {
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
try {
const response = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeoutId);
return response;
} catch (err) {
clearTimeout(timeoutId);
throw err;
}
}
function _esc(value) {
if (value === null || value === undefined) return '-';
return String(value);
}
async function renderAdminContent() {
_cleanup();
_controller = new AbortController();
const signal = _controller.signal;
try {
await _cargarDatosAdmin();
_animateAdminNumbers();
_initFilters(signal);
} catch (err) {
if (ENV?.isDev) console.error('❌ renderAdminContent:', err);
if (typeof showToast === 'function') {
showToast('Error cargando el panel admin', 'error');
}
}
}
async function _cargarDatosAdmin() {
const vendedor = localStorage.getItem('vendedor');
if (!vendedor) {
if (ENV?.isDev) console.warn('⚠️ cargarDatosAdmin: vendedor no configurado');
_renderQuinielas([]);
return;
}
if (!jornadaActual?.nombre) {
if (ENV?.isDev) console.warn('⚠️ cargarDatosAdmin: jornadaActual no disponible');
_renderQuinielas([]);
return;
}
const params = new URLSearchParams({
vendedor: vendedor,
jornada: jornadaActual.nombre,
});
try {
/*----Esto de abajo se encarga de trabajar en nuestro archivo y se usa para cargar pendientes, espera y jugando en paralelo para construir lista completa -----------*/
const [resPend, resEsp, resJug] = await Promise.allSettled([
_safeFetch(`${API_BASE}/api/pendientes?${params.toString()}`),
_safeFetch(`${API_BASE}/api/espera?${params.toString()}`),
_safeFetch(`${API_BASE}/api/jugando?${params.toString()}`),
]);
let allQuinielas = [];
if (resPend.status === 'fulfilled' && resPend.value?.ok) {
const d = await resPend.value.json();
if (d?.success && Array.isArray(d.pendientes)) {
allQuinielas.push(...d.pendientes.map(q => ({ ...q, estado: 'pendiente' })));
}
}
if (resEsp.status === 'fulfilled' && resEsp.value?.ok) {
const d = await resEsp.value.json();
if (d?.success && Array.isArray(d.espera)) {
allQuinielas.push(...d.espera.map(q => ({ ...q, estado: 'espera' })));
}
}
if (resJug.status === 'fulfilled' && resJug.value?.ok) {
const d = await resJug.value.json();
if (d?.success && Array.isArray(d.jugando)) {
allQuinielas.push(...d.jugando.map(q => ({ ...q, estado: 'jugando' })));
}
}
if (ENV?.isDev) console.log(`✅ ${allQuinielas.length} quinielas totales — ${vendedor}`);
_renderQuinielas(allQuinielas);
_renderAcceptedList(allQuinielas);
_actualizarEstadisticas(allQuinielas);
} catch (err) {
const isTimeout = err.name === 'AbortError';
if (ENV?.isDev) {
console.error(isTimeout ? '⏱ cargarDatosAdmin: timeout' : '❌ cargarDatosAdmin:', err);
}
_renderQuinielas([]);
_renderAcceptedList([]);
_actualizarEstadisticas([]);
}
}
function _actualizarEstadisticas(quinielas) {
const totalEl = document.querySelector('#adminTotalQuinielas [data-count]');
const pendientesEl = document.querySelector('#adminPendientes [data-count]');
const jugandoEl = document.querySelector('#adminJugando [data-count]');
const total = quinielas.length;
const pendientes = quinielas.filter(q => q.estado === 'pendiente').length;
const jugando = quinielas.filter(q => q.estado === 'jugando').length;
if (totalEl) totalEl.setAttribute('data-count', String(total));
if (pendientesEl) pendientesEl.setAttribute('data-count', String(pendientes));
if (jugandoEl) jugandoEl.setAttribute('data-count', String(jugando));
}
function _animateAdminNumbers() {
_animFrames.forEach(id => cancelAnimationFrame(id));
_animFrames = [];
const counters = document.querySelectorAll('#pageAdmin [data-count]');
counters.forEach(counter => {
const target = parseInt(counter.getAttribute('data-count'), 10);
if (!Number.isFinite(target) || target < 0) {
counter.textContent = '0';
return;
}
if (target === 0) {
counter.textContent = '0';
return;
}
const DURATION_MS = 600;
let start = null;
function step(timestamp) {
if (!start) start = timestamp;
const elapsed = timestamp - start;
const progress = Math.min(elapsed / DURATION_MS, 1);
const eased = 1 - Math.pow(1 - progress, 3);
counter.textContent = Math.round(eased * target);
if (progress < 1) {
const frameId = requestAnimationFrame(step);
_animFrames.push(frameId);
}
}
const frameId = requestAnimationFrame(step);
_animFrames.push(frameId);
});
}
function _getStatusBadgeEl(estado) {
const span = document.createElement('span');
span.className = `admin-status-badge admin-status-badge--${_esc(estado)}`;
const labels = {
jugando: '🎮 Jugando',
espera: '⏳ En espera',
};
span.textContent = labels[estado] ?? '📝 Pendiente';
return span;
}
function _renderQuinielas(quinielas) {
const container = document.getElementById('adminQuinielasContainer');
if (!container) return;
container.innerHTML = '';
if (!Array.isArray(partidos) || partidos.length === 0) {
_appendEmptyMessage(container, 'Partidos no disponibles');
return;
}
if (!quinielas.length) {
_appendEmptyMessage(container, 'No hay quinielas para mostrar', '📋');
return;
}
const fragment = document.createDocumentFragment();
quinielas.forEach(q => {
const card = document.createElement('div');
card.className = 'admin-quiniela-card';
const header = document.createElement('div');
header.className = 'admin-quiniela-card__header';
const info = document.createElement('div');
const title = document.createElement('h4');
title.className = 'admin-quiniela-card__title';
title.textContent = _esc(q.nombre);
const meta = document.createElement('p');
meta.className = 'admin-quiniela-card__meta';
meta.textContent = `Folio: ${_esc(q.folio)} | ID: ${_esc(q.id)}`;
info.appendChild(title);
info.appendChild(meta);
header.appendChild(info);
header.appendChild(_getStatusBadgeEl(q.estado));
card.appendChild(header);
const preds = document.createElement('div');
preds.className = 'admin-quiniela-card__preds';
partidos.slice(0, 3).forEach(partido => {
const pred = q.predictions?.[partido.id];
const pick = Array.isArray(pred) ? pred[0] : pred ?? '-';
const badge = document.createElement('span');
badge.className = 'admin-pred-badge';
badge.textContent = _esc(pick);
preds.appendChild(badge);
});
const ellipsis = document.createElement('span');
ellipsis.className = 'admin-pred-ellipsis';
ellipsis.textContent = '...';
preds.appendChild(ellipsis);
card.appendChild(preds);
const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'admin-quiniela-card__detail-btn';
btn.textContent = 'Ver completa';
btn.dataset.quinielaId = String(q.id);
btn.dataset.action = 'ver-detalle';
card.appendChild(btn);
fragment.appendChild(card);
});
container.appendChild(fragment);
container.addEventListener('click', _handleContainerClick, { signal: _controller.signal });
}
function _handleContainerClick(e) {
const btn = e.target.closest('[data-action="ver-detalle"]');
if (!btn) return;
const rawId = btn.dataset.quinielaId;
const id = parseInt(rawId, 10);
if (!Number.isInteger(id) || id <= 0) {
if (ENV?.isDev) console.warn(`⚠️ verDetalle: ID inválido "${rawId}"`);
return;
}
_verDetalleAdmin(id);
}
async function _verDetalleAdmin(quinielaId) {
if (!Number.isInteger(quinielaId) || quinielaId <= 0) return;
const modal = document.getElementById('adminDetailModal');
const title = document.getElementById('adminModalTitle');
const status = document.getElementById('adminModalStatus');
const body = document.getElementById('adminModalBody');
if (!modal || !title || !status || !body) {
if (ENV?.isDev) console.error('❌ verDetalleAdmin: elementos del modal no encontrados');
return;
}
body.innerHTML = '';
const loadingEl = document.createElement('p');
loadingEl.className = 'admin-modal-loading';
loadingEl.textContent = 'Cargando...';
body.appendChild(loadingEl);
modal.style.display = 'flex';
modal.setAttribute('aria-hidden', 'false');
try {
const response = await _safeFetch(`${API_BASE}/api/quinielas/${quinielaId}`);
if (!response.ok) {
if (typeof showToast === 'function') showToast('Error cargando detalle', 'error');
modal.style.display = 'none';
return;
}
const data = await response.json();
const q = data?.quiniela;
if (!q) {
if (typeof showToast === 'function') showToast('Quiniela no encontrada', 'error');
modal.style.display = 'none';
return;
}
title.textContent = _esc(q.nombre);
status.textContent = '';
status.className = `admin-modal-status admin-modal-status--${_esc(q.estado)}`;
const statusLabels = { jugando: 'Jugando', espera: 'En espera' };
status.textContent = statusLabels[q.estado] ?? 'Pendiente';
body.innerHTML = '';
const infoSection = document.createElement('div');
infoSection.className = 'admin-modal-info';
const infoFields = [
['Folio', q.folio],
['Vendedor', q.vendedor],
['ID', q.id],
['Jornada', q.jornada],
['Estado', q.estado],
];
infoFields.forEach(([label, value]) => {
const p = document.createElement('p');
p.className = 'admin-modal-info__row';
const strong = document.createElement('strong');
strong.textContent = `${label}: `;
p.appendChild(strong);
p.appendChild(document.createTextNode(_esc(value)));
infoSection.appendChild(p);
});
body.appendChild(infoSection);
const predsTitle = document.createElement('h4');
predsTitle.className = 'admin-modal-preds-title';
predsTitle.textContent = 'Predicciones completas:';
body.appendChild(predsTitle);
if (!Array.isArray(partidos) || !partidos.length) {
const noPartidos = document.createElement('p');
noPartidos.textContent = 'Partidos no disponibles';
body.appendChild(noPartidos);
} else {
const predsList = document.createElement('div');
predsList.className = 'admin-modal-preds-list';
partidos.forEach(partido => {
const pred = q.predictions?.[partido.id];
const pick = Array.isArray(pred) ? pred.join('/') : (pred ?? '-');
const row = document.createElement('div');
row.className = 'admin-modal-pred-row';
const localDiv = document.createElement('div');
localDiv.className = 'admin-modal-pred-team';
const localImg = document.createElement('img');
localImg.className = 'admin-modal-team-logo';
localImg.src = partido.localLogo ?? '';
localImg.alt = _esc(partido.local);
localImg.width = 20;
localImg.height = 20;
localImg.loading = 'lazy';
const localName = document.createElement('span');
localName.className = 'admin-modal-team-name';
localName.textContent = _esc(partido.local);
localDiv.appendChild(localImg);
localDiv.appendChild(localName);
const pickDiv = document.createElement('div');
pickDiv.className = 'admin-modal-pred-pick';
pickDiv.textContent = _esc(pick);
const visitDiv = document.createElement('div');
visitDiv.className = 'admin-modal-pred-team admin-modal-pred-team--right';
const visitName = document.createElement('span');
visitName.className = 'admin-modal-team-name';
visitName.textContent = _esc(partido.visitante);
const visitImg = document.createElement('img');
visitImg.className = 'admin-modal-team-logo';
visitImg.src = partido.visitanteLogo ?? '';
visitImg.alt = _esc(partido.visitante);
visitImg.width = 20;
visitImg.height = 20;
visitImg.loading = 'lazy';
visitDiv.appendChild(visitName);
visitDiv.appendChild(visitImg);
row.appendChild(localDiv);
row.appendChild(pickDiv);
row.appendChild(visitDiv);
predsList.appendChild(row);
});
body.appendChild(predsList);
}
} catch (err) {
const isTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('❌ verDetalleAdmin:', err);
if (typeof showToast === 'function') {
showToast(isTimeout ? 'Tiempo de espera agotado' : 'Error cargando detalle', 'error');
}
modal.style.display = 'none';
modal.setAttribute('aria-hidden', 'true');
}
}
function _renderAcceptedList(quinielas) {
const container = document.getElementById('adminAcceptedList');
if (!container) return;
container.innerHTML = '';
const jugando = quinielas.filter(q => q.estado === 'jugando');
if (!jugando.length) {
_appendEmptyMessage(container, 'No hay quinielas jugando aún');
return;
}
const fragment = document.createDocumentFragment();
jugando.forEach(q => {
const card = document.createElement('div');
card.className = 'admin-accepted-card';
const info = document.createElement('div');
const nameEl = document.createElement('h4');
nameEl.className = 'admin-accepted-card__name';
nameEl.textContent = _esc(q.nombre);
const meta = document.createElement('p');
meta.className = 'admin-accepted-card__meta';
meta.textContent = `${_esc(q.folio)} • ${_esc(q.vendedor)}`;
info.appendChild(nameEl);
info.appendChild(meta);
const badge = _getStatusBadgeEl('jugando');
card.appendChild(info);
card.appendChild(badge);
fragment.appendChild(card);
});
container.appendChild(fragment);
}
function _appendEmptyMessage(container, message, icon = null) {
const wrap = document.createElement('div');
wrap.className = 'admin-empty-state';
if (icon) {
const iconEl = document.createElement('div');
iconEl.className = 'admin-empty-state__icon';
iconEl.setAttribute('aria-hidden', 'true');
iconEl.textContent = icon;
wrap.appendChild(iconEl);
}
const msg = document.createElement('p');
msg.textContent = message;
wrap.appendChild(msg);
container.appendChild(wrap);
}
function _initFilters(signal) {
const filterBtns = document.querySelectorAll('#pageAdmin .filter-btn');
filterBtns.forEach(btn => {
btn.addEventListener('click', () => {
filterBtns.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
const filtro = btn.getAttribute('data-filter');
_currentFilters = filtro;
if (typeof mostrarAdminTab === 'function') {
const tabMap = {
'pendientes': 'pendientes',
'espera': 'espera',
'jugando': 'jugando',
};
const tabName = tabMap[filtro];
if (tabName) mostrarAdminTab(tabName);
}
}, { signal });
});
const closeModalBtns = document.querySelectorAll('[data-close-modal]');
closeModalBtns.forEach(btn => {
btn.addEventListener('click', () => {
const modal = document.getElementById('adminDetailModal');
if (!modal) return;
modal.style.display = 'none';
modal.setAttribute('aria-hidden', 'true');
}, { signal });
});
}
function _cleanup() {
_animFrames.forEach(id => cancelAnimationFrame(id));
_animFrames = [];
if (_controller) {
_controller.abort();
_controller = null;
}
}
function destroy() {
_cleanup();
if (ENV?.isDev) console.log('🧹 AdminContent destruido');
}
return Object.freeze({ renderAdminContent, destroy });
})();
document.addEventListener('DOMContentLoaded', () => AdminPanel.init(), { once: true });
/*-----------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para actualizar informacion de la quiniela------------------------------------------*/
function actualizarJornadaActual() {
const jornada = window.jornadaActual ?? null;
if (!jornada || typeof jornada !== 'object') {
if (ENV?.isDev) console.warn('⚠️ actualizarJornadaActual: jornadaActual no disponible');
return { success: false, razon: 'sin-datos' };
}
try {
const jornadaNum    = document.querySelector('.week-card__number');
const jornadaRange  = document.querySelector('.week-card__range');
const jornadaStatus = document.querySelector('.week-card__status');
const progressBar   = document.querySelector('.progress-bar__fill');
const progressLabel = document.querySelector('.progress-labels span:nth-child(2)');
if (jornadaNum && jornada.numero !== null && jornada.numero !== undefined) {
jornadaNum.textContent = String(jornada.numero);
}
if (jornadaRange) {
jornadaRange.textContent = jornada.nombre ?? '';
}
const inicio = new Date(jornada.inicio);
const fin    = new Date(jornada.fin);
const inicioEsValido = !isNaN(inicio.getTime());
const finEsValido    = !isNaN(fin.getTime());
if (!inicioEsValido || !finEsValido) {
if (ENV?.isDev) {
console.warn(
'⚠️ actualizarJornadaActual: fechas inválidas',
{ inicio: jornada.inicio, fin: jornada.fin }
);
}
if (jornadaStatus) jornadaStatus.textContent = 'Fechas no disponibles';
return { success: false, razon: 'fechas-invalidas' };
}
const ahora          = new Date();
const totalMs        = fin - inicio;
const transcurridoMs = ahora - inicio;
const faltaMs        = fin - ahora;
if (totalMs <= 0) {
if (ENV?.isDev) {
console.warn(
'⚠️ actualizarJornadaActual: fin <= inicio',
{ inicio: inicio.toISOString(), fin: fin.toISOString() }
);
}
if (jornadaStatus) jornadaStatus.textContent = 'Configuración de jornada inválida';
return { success: false, razon: 'rango-invalido' };
}
const porcentaje           = Math.max(0, Math.min(100, (transcurridoMs / totalMs) * 100));
const porcentajeRedondeado = Math.round(porcentaje);
if (progressBar) {
progressBar.style.setProperty('--progress', porcentajeRedondeado + '%');
}
if (progressLabel) {
progressLabel.textContent = porcentajeRedondeado + '% completado';
}
if (jornadaStatus) {
if (faltaMs > 0) {
jornadaStatus.textContent = _formatearCountdown(faltaMs);
} else {
jornadaStatus.textContent = 'Jornada cerrada';
}
}
return {
success:    true,
porcentaje: porcentajeRedondeado,
faltaMs,
cerrada:    faltaMs <= 0,
};
} catch (err) {
if (ENV?.isDev) console.error('❌ actualizarJornadaActual:', err);
return { success: false, razon: 'error-inesperado', error: err };
}
}
function _formatearCountdown(ms) {
if (typeof ms !== 'number' || !isFinite(ms) || ms <= 0) return 'Jornada cerrada';
const totalMinutos = Math.floor(ms / (1000 * 60));
const totalHoras   = Math.floor(ms / (1000 * 60 * 60));
const dias         = Math.floor(ms / (1000 * 60 * 60 * 24));
const horas        = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutos      = Math.floor((ms % (1000 * 60 * 60))       / (1000 * 60));
if (dias > 0) {
return horas > 0
? `Cierra en ${dias}d ${horas}h`
: `Cierra en ${dias}d`;
}
if (totalHoras === 0) {
return totalMinutos === 1
? 'Cierra en 1m'
: `Cierra en ${totalMinutos}m`;
}
return minutos > 0
? `Cierra en ${horas}h ${minutos}m`
: `Cierra en ${horas}h`;
}
/*-----------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para el sistema de confirmación/rechazo de quinielas---------------------------------*/
const QuinielasAdmin = (() => {
const _state = {
quinielaId:   null,
nombre:       '',
vendedor:     '',
isSubmitting: false,
};
let _controller = null;
const FETCH_TIMEOUT = 10_000;
function _resetState() {
_state.quinielaId   = null;
_state.nombre       = '';
_state.vendedor     = '';
_state.isSubmitting = false;
}
async function _safeFetch(url, options = {}) {
const controller = new AbortController();
const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
try {
const response = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeoutId);
return response;
} catch (err) {
clearTimeout(timeoutId);
throw err;
}
}
async function _safeJson(response) {
try {
return await response.json();
} catch {
return { success: false, error: 'Respuesta no válida del servidor' };
}
}
function _callIfFunction(fn) {
if (typeof fn === 'function') fn();
}
function _refrescarTablas() {
Promise.allSettled([
typeof cargarPendientesTabla === 'function' ? cargarPendientesTabla() : Promise.resolve(),
typeof cargarJugandoTabla    === 'function' ? cargarJugandoTabla()    : Promise.resolve(),
typeof cargarEsperaTabla     === 'function' ? cargarEsperaTabla()     : Promise.resolve(),
]).finally(() => {
_callIfFunction(updateHeroStats);
});
}
function init() {
if (_controller) destroy();
_controller = new AbortController();
document.addEventListener('click', _handleGlobalClick, {
signal: _controller.signal
});
}
function _handleGlobalClick(e) {
const btnConfirmar = e.target.closest('.btn-confirmar');
const btnRechazar  = e.target.closest('.btn-rechazar');
if (btnConfirmar) {
const row = btnConfirmar.closest('.admin-row');
if (!row) return;
const id = parseInt(row.dataset.id, 10);
if (!Number.isInteger(id) || id <= 0) {
if (typeof showToast === 'function') showToast('ID de quiniela inválido', 'error');
return;
}
const nombre   = row.dataset.nombre   || '';
const vendedor = row.dataset.vendedor || (typeof currentVendedor !== 'undefined' ? currentVendedor : '') || '';
_mostrarModalConfirmar(id, nombre, vendedor);
return;
}
if (btnRechazar) {
const row = btnRechazar.closest('.admin-row');
if (!row) return;
const id = parseInt(row.dataset.id, 10);
if (!Number.isInteger(id) || id <= 0) {
if (typeof showToast === 'function') showToast('ID de quiniela inválido', 'error');
return;
}
const nombre = row.dataset.nombre || '';
_mostrarModalRechazar(id, nombre);
}
}
function _mostrarModalConfirmar(id, nombre, vendedor) {
_cerrarModalRechazar();
_state.quinielaId = id;
_state.nombre     = nombre;
_state.vendedor   = vendedor;
const msgEl   = document.getElementById('confirmarMessage');
const modalEl = document.getElementById('modalConfirmar');
if (msgEl) {
msgEl.textContent = `"${nombre}" pasará a estado "jugando"`;
}
if (modalEl) modalEl.classList.add('show');
}
function _cerrarModalConfirmar() {
const modalEl = document.getElementById('modalConfirmar');
if (modalEl) {
modalEl.classList.remove('show');
modalEl.classList.remove('loading');
}
_resetState();
}
function _mostrarModalRechazar(id, nombre) {
_cerrarModalConfirmar();
_state.quinielaId = id;
_state.nombre     = nombre;
const msgEl   = document.getElementById('rechazarMessage');
const modalEl = document.getElementById('modalRechazar');
if (msgEl) {
msgEl.textContent = `"${nombre}" será eliminada permanentemente`;
}
if (modalEl) modalEl.classList.add('show');
}
function _cerrarModalRechazar() {
const modalEl = document.getElementById('modalRechazar');
if (modalEl) {
modalEl.classList.remove('show');
modalEl.classList.remove('loading');
}
_resetState();
}
async function ejecutarConfirmar() {
if (!_state.quinielaId) return;
if (_state.isSubmitting) return;
_state.isSubmitting = true;
const id       = _state.quinielaId;
const nombre   = _state.nombre;
const vendedor = _state.vendedor;
const modalEl  = document.getElementById('modalConfirmar');
if (modalEl) modalEl.classList.add('loading');
try {
const response = await _safeFetch(
`${API_BASE}/api/quinielas/${id}/confirmar`,
{
method:  'PATCH',
headers: { 'Content-Type': 'application/json' },
}
);
const result = await _safeJson(response);
_cerrarModalConfirmar();
if (result.success) {
if (result.estado === 'espera') {
if (typeof showToast === 'function') {
showToast(`⏸️ ${nombre} fue a En Espera (límite alcanzado)`, 'warning');
}
} else {
const folio = result.quiniela?.folio;
if (typeof showToast === 'function') {
showToast(
folio
? `${nombre} — Folio: ${folio} ✅`
: `${nombre} ✅`,
'success'
);
}
}
_refrescarTablas();
} else {
if (typeof showToast === 'function') {
showToast(`Error: ${result.error || 'No se pudo confirmar'}`, 'error');
}
}
} catch (err) {
_cerrarModalConfirmar();
const isTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('❌ ejecutarConfirmar:', err);
if (typeof showToast === 'function') {
showToast(
isTimeout ? `⏱ Tiempo de espera agotado al confirmar "${nombre}"` : 'Error de conexión',
'error'
);
}
}
}
async function ejecutarRechazo() {
if (!_state.quinielaId) return;
if (_state.isSubmitting) return;
_state.isSubmitting = true;
const id      = _state.quinielaId;
const nombre  = _state.nombre;
const modalEl = document.getElementById('modalRechazar');
if (modalEl) modalEl.classList.add('loading');
try {
const response = await _safeFetch(
`${API_BASE}/api/quinielas/${id}/rechazar`,
{ method: 'PATCH' }
);
const result = await _safeJson(response);
_cerrarModalRechazar();
if (response.ok && result.success) {
if (typeof showToast === 'function') {
showToast(`"${nombre}" rechazada ❌`, 'error');
}
_refrescarTablas();
} else {
if (typeof showToast === 'function') {
showToast(`Error: ${result.error || 'No se pudo rechazar'}`, 'error');
}
}
} catch (err) {
_cerrarModalRechazar();
const isTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('ejecutarRechazo: ❌', err);
if (typeof showToast === 'function') {
showToast(
isTimeout ? `⏱ Tiempo de espera agotado al rechazar "${nombre}"` : 'Error de conexión',
'error'
);
}
}
}
function validarQuiniela(quiniela) {
const nombre = (quiniela?.name ?? '').trim();
if (!nombre) {
return { valida: false, error: 'Nombre vacío' };
}
if (!quiniela.predictions || Object.keys(quiniela.predictions).length === 0) {
return { valida: false, error: 'Sin predicciones' };
}
const partidos = AppState.getPartidos();
if (!Array.isArray(partidos) || !partidos.length) {
return { valida: false, error: 'Partidos no disponibles' };
}
const partidosIncompletos = partidos.filter(partido => {
const pred = quiniela.predictions[partido.id];
if (!Array.isArray(pred) || pred.length === 0) return true;
return !['L', 'E', 'V'].includes(pred[0]);
});
if (partidosIncompletos.length > 0) {
return {
valida: false,
error:  `Predicciones incompletas (${partidosIncompletos.length} partidos)`,
};
}
return { valida: true, error: '' };
}
function mostrarModalCargando(cantidad) {
document.getElementById('modal-cargando')?.remove();
const cantidadNormalizada = Number.isFinite(cantidad) && cantidad >= 0
? Math.floor(cantidad)
: 0;
const overlay = document.createElement('div');
overlay.id        = 'modal-cargando';
overlay.className = 'loading-modal-overlay';
const box = document.createElement('div');
box.className = 'loading-modal-box';
const icon = document.createElement('div');
icon.className   = 'loading-modal-icon';
icon.setAttribute('aria-hidden', 'true');
icon.textContent = '⏳';
const title = document.createElement('h2');
title.className   = 'loading-modal-title';
title.textContent = 'Enviando...';
const countEl = document.createElement('p');
countEl.className   = 'loading-modal-count';
countEl.textContent = `${cantidadNormalizada} quiniela${cantidadNormalizada === 1 ? '' : 's'}`;
const barTrack = document.createElement('div');
barTrack.className = 'loading-modal-track';
const barFill = document.createElement('div');
barFill.className = 'loading-modal-fill';
barTrack.appendChild(barFill);
box.appendChild(icon);
box.appendChild(title);
box.appendChild(countEl);
box.appendChild(barTrack);
overlay.appendChild(box);
document.body.appendChild(overlay);
return overlay;
}
function cerrarModalCargando() {
document.getElementById('modal-cargando')?.remove();
}
function destroy() {
if (_controller) {
_controller.abort();
_controller = null;
}
_resetState();
}
return Object.freeze({
init,
destroy,
ejecutarConfirmar,
ejecutarRechazo,
validarQuiniela,
mostrarModalCargando,
cerrarModalCargando,
cerrarModalConfirmar: _cerrarModalConfirmar,
cerrarModalRechazar:  _cerrarModalRechazar,
});
})();
document.addEventListener('DOMContentLoaded', () => QuinielasAdmin.init(), { once: true });
/*-------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para exponer funciones de modales como globales para onclick del HTML-----------------------*/
function ejecutarConfirmar()      { QuinielasAdmin.ejecutarConfirmar(); }
function ejecutarRechazo()        { QuinielasAdmin.ejecutarRechazo(); }
function cerrarModalConfirmar()   { QuinielasAdmin.cerrarModalConfirmar(); }
function cerrarModalRechazar()    { QuinielasAdmin.cerrarModalRechazar(); }
/*-------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para la Tabla para las quinielas por confirmarL---------------------------------------------*/
async function cargarPendientesTabla() {
const tbody = document.getElementById('pendientesTableBody');
const countElement = document.getElementById('totalQuinielasCount');
const resumenElement = document.getElementById('pendingCount');
if (!tbody) {
if (ENV?.isDev) console.warn('⚠️ cargarPendientesTabla: #pendientesTableBody no encontrado');
return;
}
_renderEstadoPendientes(tbody, 'cargando', 'Cargando por confirmar ⏳...');
const vendedor = getVendedorAdmin();
if (!vendedor) {
_renderEstadoPendientes(tbody, 'sin-vendedor', 'Vendedor no identificado ⚠️');
if (countElement) countElement.textContent = '0 En total';
if (resumenElement) resumenElement.textContent = '0';
return;
}
try {
if (!Array.isArray(partidos) || !partidos.length) {
try {
await cargarPartidos();
} catch (e) {
if (ENV?.isDev) console.warn('⚠️ cargarPendientesTabla: cargarPartidos falló:', e);
}
}
_actualizarHeadersPendientes();
const params = new URLSearchParams({
vendedor,
jornada: jornadaActual?.nombre ?? window.jornadaActual?.nombre ?? '',
});
const response = await _fetchConTimeout(`${API_BASE}/api/pendientes?${params.toString()}`);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
const lista = data.pendientes ?? [];
if (!lista.length) {
_renderEstadoPendientes(tbody, 'vacio', 'No hay quinielas por confirmar ✅');
if (countElement) countElement.textContent = '0 En total';
if (resumenElement) resumenElement.textContent = '0';
return;
}
if (countElement) countElement.textContent = `${lista.length} En total`;
if (resumenElement) resumenElement.textContent = String(lista.length);
tbody.innerHTML = '';
const fragment = document.createDocumentFragment();
lista.forEach(q => fragment.appendChild(_buildFilaPendiente(q)));
tbody.appendChild(fragment);
if (ENV?.isDev) console.log(`✅ cargarPendientesTabla: ${lista.length} registros`);
} catch (err) {
const esTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('❌ cargarPendientesTabla:', err);
_renderEstadoPendientes(tbody, 'error', esTimeout ? 'Tiempo de espera agotado ⏱' : 'Error al cargar datos ❌');
if (countElement) countElement.textContent = '0 En total';
if (resumenElement) resumenElement.textContent = '0';
}
}
async function _fetchConTimeout(url, opciones = {}, ms = 10_000) {
const controller = new AbortController();
const timerId = setTimeout(() => controller.abort(), ms);
try {
const response = await fetch(url, { ...opciones, signal: controller.signal });
clearTimeout(timerId);
return response;
} catch (err) {
clearTimeout(timerId);
throw err;
}
}
function _renderEstadoPendientes(tbody, tipo, texto) {
const numCols = 2 + (Array.isArray(partidos) ? partidos.length : 9);
tbody.innerHTML = '';
const tr = document.createElement('tr');
const td = document.createElement('td');
td.colSpan = numCols;
td.className = `admin-tabla-estado admin-tabla-estado--${tipo}`;
td.textContent = texto;
tr.appendChild(td);
tbody.appendChild(tr);
}
function _actualizarHeadersPendientes() {
const headerCells = document.querySelectorAll('#adminPendientes .results-table thead .col-match');
headerCells.forEach(th => {
const index = parseInt(th.dataset.matchIndex, 10);
if (!Number.isInteger(index) || index < 1) return;
const partido = partidos?.[index - 1];
if (!partido) return;
const wrap = document.createElement('div');
wrap.className = 'match-header';
const localImg = document.createElement('img');
localImg.className = 'match-logo';
localImg.src = partido.localLogo ?? '';
localImg.alt = partido.local ?? '';
localImg.width = 24;
localImg.height = 24;
localImg.loading = 'lazy';
const vs = document.createElement('span');
vs.className = 'match-vs';
vs.textContent = 'vs';
const visitImg = document.createElement('img');
visitImg.className = 'match-logo';
visitImg.src = partido.visitanteLogo ?? '';
visitImg.alt = partido.visitante ?? '';
visitImg.width = 24;
visitImg.height = 24;
visitImg.loading = 'lazy';
wrap.appendChild(localImg);
wrap.appendChild(vs);
wrap.appendChild(visitImg);
th.textContent = '';
th.appendChild(wrap);
});
}
function _buildFilaPendiente(q) {
const tr = document.createElement('tr');
tr.className = 'admin-row';
tr.dataset.id = String(q.id ?? '');
tr.dataset.nombre = String(q.nombre ?? '');
tr.dataset.vendedor = String(q.vendedor ?? '');
const tdNombre = document.createElement('td');
tdNombre.className = 'col-name';
tdNombre.textContent = q.nombre ?? '-';
tr.appendChild(tdNombre);
const picks = Array.isArray(q.picks) ? q.picks : [];
picks.forEach(pick => {
const td = document.createElement('td');
td.className = 'col-match';
const span = document.createElement('span');
span.className = 'result-cell';
span.textContent = pick ?? '-';
td.appendChild(span);
tr.appendChild(td);
});
const tdAcciones = document.createElement('td');
tdAcciones.className = 'col-actions';
const btnConfirmar = document.createElement('button');
btnConfirmar.type = 'button';
btnConfirmar.className = 'btn-confirmar';
btnConfirmar.textContent = 'Confirmar ✅';
const btnRechazar = document.createElement('button');
btnRechazar.type = 'button';
btnRechazar.className = 'btn-rechazar';
btnRechazar.textContent = 'Rechazar ❌';
btnRechazar.style.cssText = 'background:#dc2626;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-weight:600;cursor:pointer;';
tdAcciones.appendChild(btnConfirmar);
tdAcciones.appendChild(btnRechazar);
tr.appendChild(tdAcciones);
return tr;
}
/*-------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para la Tabla para las quinielas en espera-------------------------------------------------*/
async function cargarEsperaTabla() {
const tbody = document.getElementById('esperaTableBody');
const countElement = document.getElementById('esperaCount');
const resumenEspera = document.getElementById('waitingCount');
if (!tbody) {
if (ENV?.isDev) console.warn('⚠️ cargarEsperaTabla: #esperaTableBody no encontrado');
return;
}
_renderEstadoTabla(tbody, 'cargando', 'Cargando en espera ⏳...');
const vendedor = getVendedorAdmin();
if (!vendedor) {
_renderEstadoTabla(tbody, 'sin-vendedor', 'Vendedor no identificado ⚠️');
if (countElement) countElement.textContent = '0 en espera';
if (resumenEspera) resumenEspera.textContent = '0';
return;
}
try {
if (!Array.isArray(partidos) || !partidos.length) {
try {
await cargarPartidos();
} catch (e) {
if (ENV?.isDev) console.warn('⚠️ cargarEsperaTabla: cargarPartidos falló:', e);
}
}
_actualizarHeadersEspera();
const params = new URLSearchParams({
vendedor,
jornada: jornadaActual?.nombre ?? window.jornadaActual?.nombre ?? '',
});
const response = await _fetchConTimeout(`${API_BASE}/api/espera?${params.toString()}`);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
const lista = data.espera ?? [];
if (!lista.length) {
_renderEstadoTabla(tbody, 'vacio', 'No hay quinielas en espera ✅');
if (countElement) countElement.textContent = '0 en espera';
if (resumenEspera) resumenEspera.textContent = '0';
return;
}
if (countElement) countElement.textContent = `${lista.length} en espera`;
if (resumenEspera) resumenEspera.textContent = String(lista.length);
tbody.innerHTML = '';
const fragment = document.createDocumentFragment();
lista.forEach(q => fragment.appendChild(_buildFilaEspera(q)));
tbody.appendChild(fragment);
if (ENV?.isDev) console.log(`✅ cargarEsperaTabla: ${lista.length} registros`);
} catch (err) {
const esTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('❌ cargarEsperaTabla:', err);
_renderEstadoTabla(tbody, 'error', esTimeout ? 'Tiempo de espera agotado ⏱' : 'Error al cargar datos ❌');
if (countElement) countElement.textContent = '0 en espera';
if (resumenEspera) resumenEspera.textContent = '0';
}
}
function _actualizarHeadersEspera() {
const headerCells = document.querySelectorAll('#adminEspera .results-table thead .col-match');
headerCells.forEach(th => {
const index = parseInt(th.dataset.matchIndex, 10);
if (!Number.isInteger(index) || index < 1) return;
const partido = partidos?.[index - 1];
if (!partido) return;
const wrap = document.createElement('div');
wrap.className = 'match-header';
const localImg = document.createElement('img');
localImg.className = 'match-logo';
localImg.src = partido.localLogo ?? '';
localImg.alt = partido.local ?? '';
localImg.width = 24;
localImg.height = 24;
localImg.loading = 'lazy';
const vs = document.createElement('span');
vs.className = 'match-vs';
vs.textContent = 'vs';
const visitImg = document.createElement('img');
visitImg.className = 'match-logo';
visitImg.src = partido.visitanteLogo ?? '';
visitImg.alt = partido.visitante ?? '';
visitImg.width = 24;
visitImg.height = 24;
visitImg.loading = 'lazy';
wrap.appendChild(localImg);
wrap.appendChild(vs);
wrap.appendChild(visitImg);
th.textContent = '';
th.appendChild(wrap);
});
}
function _buildFilaEspera(q) {
const tr = document.createElement('tr');
tr.className = 'admin-row';
tr.dataset.id = String(q.id ?? '');
tr.dataset.nombre = String(q.nombre ?? '');
tr.dataset.vendedor = String(q.vendedor ?? '');
const tdNombre = document.createElement('td');
tdNombre.className = 'col-name';
tdNombre.textContent = q.nombre ?? '-';
tr.appendChild(tdNombre);
const picks = Array.isArray(q.picks) ? q.picks : [];
picks.forEach(pick => {
const td = document.createElement('td');
td.className = 'col-match';
const span = document.createElement('span');
span.className = 'result-cell';
span.textContent = pick ?? '-';
td.appendChild(span);
tr.appendChild(td);
});
const tdAcciones = document.createElement('td');
tdAcciones.className = 'col-actions';
const badge = document.createElement('span');
badge.className = 'admin-espera-badge';
badge.textContent = 'En espera ⏳';
tdAcciones.appendChild(badge);
tr.appendChild(tdAcciones);
return tr;
}
function _renderEstadoTabla(tbody, tipo, texto) {
const numCols = 4 + (Array.isArray(partidos) ? partidos.length : 9);
tbody.innerHTML = '';
const tr = document.createElement('tr');
const td = document.createElement('td');
td.colSpan = numCols;
td.className = `admin-tabla-estado admin-tabla-estado--${tipo}`;
td.textContent = texto;
tr.appendChild(td);
tbody.appendChild(tr);
}
/*-------Esto de abajo se encarga de trabajar en nuestro archivo y se usa para Leer el vendedor desde el URL-------------------------------------------------*/
function getQueryParam(name) {
if (!name || typeof name !== 'string') {
if (ENV?.isDev) console.warn('⚠️ getQueryParam: name inválido:', name);
return null;
}
try {
const params = new URLSearchParams(window.location.search);
const value = params.get(name);
return value !== null ? value.trim() : null;
} catch (e) {
if (ENV?.isDev) console.error('⚠️ getQueryParam: URLSearchParams falló:', e);
return null;
}
}
function getVendedorAdmin() {
return VendedorManager?.current ?? '';
}
/*-------Esto de abajo se encarga de trabajar en nuestro archivo y se usa la Tabla que trabaja en las quinielas jugando-------------------------------------------------*/
async function cargarJugandoTabla() {
const tbody = document.getElementById('jugandoTableBody');
const countElement = document.getElementById('jugandoCount');
const resumenJugando = document.getElementById('playingCount');
if (!tbody) {
if (ENV?.isDev) console.warn('⚠️ cargarJugandoTabla: #jugandoTableBody no encontrado');
return;
}
_renderEstadoJugando(tbody, 'cargando', 'Cargando quinielas jugando ⏳...');
const vendedor = getVendedorAdmin();
if (!vendedor) {
_renderEstadoJugando(tbody, 'sin-vendedor', 'Vendedor no identificado ⚠️');
if (countElement) countElement.textContent = '0 jugando';
if (resumenJugando) resumenJugando.textContent = '0';
return;
}
try {
if (!Array.isArray(partidos) || !partidos.length) {
try {
await cargarPartidos();
} catch (e) {
if (ENV?.isDev) console.warn('⚠️ cargarJugandoTabla: cargarPartidos falló:', e);
}
}
_actualizarHeadersJugando();
const params = new URLSearchParams({
vendedor,
jornada: jornadaActual?.nombre ?? window.jornadaActual?.nombre ?? '',
});
const [resJugando, resResultados] = await Promise.allSettled([
_fetchConTimeout(`${API_BASE}/api/jugando?${params.toString()}`),
_fetchConTimeout(`${API_BASE}/api/resultados-oficiales`),
]);
if (resJugando.status === 'rejected' || !resJugando.value?.ok) {
throw new Error('Error al cargar quinielas jugando');
}
const dataJugando = await resJugando.value.json();
const lista = dataJugando.jugando ?? [];
let resultadosObj = {};
if (resResultados.status === 'fulfilled' && resResultados.value?.ok) {
const dataResultados = await resResultados.value.json();
resultadosObj = dataResultados.resultados ?? {};
} else {
if (ENV?.isDev) console.warn('⚠️ cargarJugandoTabla: resultados-oficiales no disponibles — scoring desactivado');
}
if (!lista.length) {
_renderEstadoJugando(tbody, 'vacio', 'No hay quinielas jugando ✅');
if (countElement) countElement.textContent = '0 jugando';
if (resumenJugando) resumenJugando.textContent = '0';
return;
}
const numPartidos = Array.isArray(partidos) ? partidos.length : 9;
const listaConPuntos = lista.map(q => {
const picks = Array.isArray(q.picks) ? q.picks : [];
let puntos = 0;
for (let i = 0; i < numPartidos; i++) {
const pick = picks[i];
const resultado = resultadosObj[String(i)];
if (resultado && pick && pick === resultado) puntos++;
}
return { ...q, picks, puntos };
});
listaConPuntos.sort((a, b) => {
if (b.puntos !== a.puntos) return b.puntos - a.puntos;
const numA = parseInt(a.folio, 10);
const numB = parseInt(b.folio, 10);
if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
return String(a.folio ?? '').localeCompare(String(b.folio ?? ''));
});
const primerPuntos = listaConPuntos[0]?.puntos ?? 0;
const segundoObj = listaConPuntos.find(q => q.puntos < primerPuntos);
const segundoPuntos = segundoObj?.puntos ?? 0;
if (countElement) countElement.textContent = `${lista.length} jugando`;
if (resumenJugando) resumenJugando.textContent = String(lista.length);
tbody.innerHTML = '';
const fragment = document.createDocumentFragment();
listaConPuntos.forEach(q => {
fragment.appendChild(
_buildFilaJugando(q, resultadosObj, primerPuntos, segundoPuntos, numPartidos)
);
});
tbody.appendChild(fragment);
if (ENV?.isDev) console.log(`✅ cargarJugandoTabla: ${lista.length} registros`);
} catch (err) {
const esTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('❌ cargarJugandoTabla:', err);
_renderEstadoJugando(tbody, 'error', esTimeout ? 'Tiempo de espera agotado ⏱' : 'Error al cargar datos ❌');
if (countElement) countElement.textContent = '0 jugando';
if (resumenJugando) resumenJugando.textContent = '0';
}
}
function _renderEstadoJugando(tbody, tipo, texto) {
const numCols = 4 + (Array.isArray(partidos) ? partidos.length : 9);
tbody.innerHTML = '';
const tr = document.createElement('tr');
const td = document.createElement('td');
td.colSpan = numCols;
td.className = `admin-tabla-estado admin-tabla-estado--${tipo}`;
td.textContent = texto;
tr.appendChild(td);
tbody.appendChild(tr);
}
function _actualizarHeadersJugando() {
const headerCells = document.querySelectorAll('#adminJugando .results-table thead .col-match');
headerCells.forEach(th => {
const index = parseInt(th.dataset.matchIndex, 10);
if (!Number.isInteger(index) || index < 1) return;
const partido = partidos?.[index - 1];
if (!partido) return;
const wrap = document.createElement('div');
wrap.className = 'match-header';
const localImg = document.createElement('img');
localImg.className = 'match-logo';
localImg.src = partido.localLogo ?? '';
localImg.alt = partido.local ?? '';
localImg.width = 24;
localImg.height = 24;
localImg.loading = 'lazy';
const vs = document.createElement('span');
vs.className = 'match-vs';
vs.textContent = 'vs';
const visitImg = document.createElement('img');
visitImg.className = 'match-logo';
visitImg.src = partido.visitanteLogo ?? '';
visitImg.alt = partido.visitante ?? '';
visitImg.width = 24;
visitImg.height = 24;
visitImg.loading = 'lazy';
wrap.appendChild(localImg);
wrap.appendChild(vs);
wrap.appendChild(visitImg);
th.textContent = '';
th.appendChild(wrap);
});
}
function _buildFilaJugando(q, resultadosObj, primerPuntos, segundoPuntos, numPartidos) {
const tr = document.createElement('tr');
tr.className = 'admin-row';
const esPrimero = primerPuntos > 0 && q.puntos === primerPuntos;
const esSegundo = !esPrimero && segundoPuntos > 0 && q.puntos === segundoPuntos;
const tdFolio = document.createElement('td');
tdFolio.className = 'col-folio';
tdFolio.textContent = q.folio ?? '-';
tr.appendChild(tdFolio);
const tdNombre = document.createElement('td');
tdNombre.className = 'col-name';
tdNombre.textContent = q.nombre ?? 'Sin nombre';
tr.appendChild(tdNombre);
const tdVendedor = document.createElement('td');
tdVendedor.className = 'col-vendor';
tdVendedor.textContent = q.vendedor ?? 'Sin vendedor';
tr.appendChild(tdVendedor);
for (let i = 0; i < numPartidos; i++) {
const pick = q.picks[i];
const resultado = resultadosObj[String(i)];
const cls = !resultado ? 'pending' : (pick === resultado ? 'correct' : 'incorrect');
const td = document.createElement('td');
td.className = 'col-match';
const span = document.createElement('span');
span.className = `result-cell ${cls}`;
span.textContent = pick ?? '-';
td.appendChild(span);
tr.appendChild(td);
}
const tdPuntos = document.createElement('td');
tdPuntos.className = 'col-points';
const spanPuntos = document.createElement('span');
spanPuntos.className = `points-cell ${esPrimero ? 'points-gold' : esSegundo ? 'points-silver' : 'points-normal'}`;
spanPuntos.textContent = String(q.puntos);
tdPuntos.appendChild(spanPuntos);
tr.appendChild(tdPuntos);
return tr;
}
/*-------Esto de abajo se encarga de trabajar en nuestro archivo y se usa la Tabla que trabaja la lista oficial-------------------------------------------------*/
async function cargarListaOficialTabla() {
const tbody = document.getElementById('listaOficialTableBody');
const countElement = document.getElementById('listaOficialCount');
const totalCount = document.getElementById('totalCount');
if (!tbody) {
if (ENV?.isDev) console.warn('⚠️ cargarListaOficialTabla: #listaOficialTableBody no encontrado');
return;
}
_renderEstadoListaOficial(tbody, 'cargando', 'Cargando lista oficial ⏳...');
try {
const [resOficial, resResultados] = await Promise.allSettled([
_fetchConTimeout(`${API_BASE}/api/lista-oficial`),
_fetchConTimeout(`${API_BASE}/api/resultados-oficiales`),
]);
if (resOficial.status === 'rejected' || !resOficial.value?.ok) {
throw new Error('Error al cargar lista oficial');
}
const dataOficial = await resOficial.value.json();
const lista = dataOficial.quinielas ?? [];
let resultadosObj = {};
if (resResultados.status === 'fulfilled' && resResultados.value?.ok) {
const dataResultados = await resResultados.value.json();
resultadosObj = dataResultados.resultados ?? {};
} else {
if (ENV?.isDev) console.warn('⚠️ cargarListaOficialTabla: resultados-oficiales no disponibles');
}
if (ENV?.isDev) console.log(`✅ cargarListaOficialTabla: ${lista.length} quinielas`);
if (totalCount) totalCount.textContent = String(lista.length);
if (!lista.length) {
_renderEstadoListaOficial(tbody, 'vacio', 'No hay quinielas en lista oficial ✅');
if (countElement) countElement.textContent = '0 quinielas';
return;
}
const numPartidos = Array.isArray(partidos) ? partidos.length : 9;
const listaConPuntos = lista.map(q => {
const picks = Array.isArray(q.picks) ? q.picks : [];
let puntos = 0;
for (let i = 0; i < numPartidos; i++) {
const pick = picks[i];
const resultado = resultadosObj[String(i)];
if (resultado && pick && pick === resultado) puntos++;
}
return { ...q, picks, puntos };
});
listaConPuntos.sort((a, b) => {
if (b.puntos !== a.puntos) return b.puntos - a.puntos;
const numA = parseInt(a.folio, 10);
const numB = parseInt(b.folio, 10);
if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
return String(a.folio ?? '').localeCompare(String(b.folio ?? ''));
});
const primerPuntos = listaConPuntos[0]?.puntos ?? 0;
const segundoObj = listaConPuntos.find(q => q.puntos < primerPuntos);
const segundoPuntos = segundoObj?.puntos ?? 0;
if (countElement) countElement.textContent = `${lista.length} quinielas`;
tbody.innerHTML = '';
const fragment = document.createDocumentFragment();
listaConPuntos.forEach(q => {
fragment.appendChild(
_buildFilaListaOficial(q, resultadosObj, primerPuntos, segundoPuntos, numPartidos)
);
});
tbody.appendChild(fragment);
} catch (err) {
const esTimeout = err.name === 'AbortError';
if (ENV?.isDev) console.error('❌ cargarListaOficialTabla:', err);
_renderEstadoListaOficial(tbody, 'error', esTimeout ? 'Tiempo de espera agotado ⏱' : 'Error al cargar datos ❌');
if (countElement) countElement.textContent = '0 quinielas';
}
}
function _renderEstadoListaOficial(tbody, tipo, texto) {
const numCols = 4 + (Array.isArray(partidos) ? partidos.length : 9);
tbody.innerHTML = '';
const tr = document.createElement('tr');
const td = document.createElement('td');
td.colSpan = numCols;
td.className = `admin-tabla-estado admin-tabla-estado--${tipo}`;
td.textContent = texto;
tr.appendChild(td);
tbody.appendChild(tr);
}
function _buildFilaListaOficial(q, resultadosObj, primerPuntos, segundoPuntos, numPartidos) {
const tr = document.createElement('tr');
const esPrimero = primerPuntos > 0 && q.puntos === primerPuntos;
const esSegundo = !esPrimero && segundoPuntos > 0 && q.puntos === segundoPuntos;
const tdFolio = document.createElement('td');
tdFolio.className = 'col-folio';
tdFolio.textContent = q.folio ?? '-';
tr.appendChild(tdFolio);
const tdNombre = document.createElement('td');
tdNombre.className = 'col-name';
tdNombre.textContent = q.nombre ?? 'Sin nombre';
tr.appendChild(tdNombre);
const tdVendedor = document.createElement('td');
tdVendedor.className = 'col-vendor';
tdVendedor.textContent = q.vendedor ?? 'Sin vendedor';
tr.appendChild(tdVendedor);
for (let i = 0; i < numPartidos; i++) {
const pick = q.picks[i];
const resultado = resultadosObj[String(i)];
const cls = !resultado ? 'pending' : (pick === resultado ? 'correct' : 'incorrect');
const td = document.createElement('td');
td.className = 'col-match';
const span = document.createElement('span');
span.className = `result-cell ${cls}`;
span.textContent = pick ?? '-';
td.appendChild(span);
tr.appendChild(td);
}
const tdPuntos = document.createElement('td');
tdPuntos.className = 'col-points';
const spanPuntos = document.createElement('span');
spanPuntos.className = `points-cell ${esPrimero ? 'points-gold' : esSegundo ? 'points-silver' : 'points-normal'}`;
spanPuntos.textContent = String(q.puntos);
tdPuntos.appendChild(spanPuntos);
tr.appendChild(tdPuntos);
return tr;
}
/*----Esto de abajo se encarga de trabajar en nuestro archivo y se usa para la navegacion de las subpestañas como Horarios , porcentajes , 1 lugar , listas=----------*/
function _initTabNavegacion(selectorBtns, selectorContents, handlers, signal) {
const btns = document.querySelectorAll(selectorBtns);
const contents = document.querySelectorAll(selectorContents);
if (!btns.length) {
if (ENV?.isDev) console.warn(`⚠️ _initTabNavegacion: no se encontraron botones para "${selectorBtns}"`);
return;
}
btns.forEach(btn => {
btn.addEventListener('click', function() {
const tab = this.getAttribute('data-tab');
if (!tab) {
if (ENV?.isDev) console.warn('⚠️ Tab btn sin data-tab:', this);
return;
}
const targetId = this.dataset.target ||
('tab' + tab.trim().charAt(0).toUpperCase() + tab.trim().slice(1));
btns.forEach(b => b.classList.remove('active'));
contents.forEach(c => c.classList.remove('active'));
this.classList.add('active');
const content = document.getElementById(targetId);
if (content) {
content.classList.add('active');
} else {
if (ENV?.isDev) console.warn(`⚠️ Tab content no encontrado: #${targetId}`);
}
const handler = handlers[tab];
if (typeof handler === 'function') {
try {
handler();
} catch (err) {
if (ENV?.isDev) console.error(`❌ Error en handler del tab "${tab}":`, err);
}
}
}, { signal });
});
const tabInicial = Array.from(btns).find(b => b.classList.contains('active'));
if (tabInicial) {
tabInicial.click();
} else if (btns[0]) {
btns[0].click();
}
}
function initNavegacionTabs() {
const controllerAnalisis = new AbortController();
const controllerResultados = new AbortController();
_initTabNavegacion(
'#pageAnalisis .tab-btn',
'#pageAnalisis .tab-content',
{
'horarios': () => {
if (typeof renderMatchesHorarios === 'function') renderMatchesHorarios();
else if (ENV?.isDev) console.warn('⚠️ renderMatchesHorarios no definida');
},
'porcentajes': () => {
if (typeof renderMatchesPorcentajes === 'function') renderMatchesPorcentajes();
else if (ENV?.isDev) console.warn('⚠️ renderMatchesPorcentajes no definida');
},
},
controllerAnalisis.signal
);
_initTabNavegacion(
'#pageResultados .tab-btn',
'#pageResultados .tab-content',
{
'jugadas': () => {
if (typeof renderMyQuinielas === 'function') renderMyQuinielas();
else if (ENV?.isDev) console.warn('⚠️ renderMyQuinielas no definida');
},
'listaGeneral': () => {
if (typeof cargarListaOficialTabla === 'function') {
cargarListaOficialTabla();
} else if (ENV?.isDev) {
console.warn('⚠️ cargarListaOficialTabla no definida');
}
},
'podio1': () => {
quiniela?.initFirstPlacePage?.();
},
'podio2': () => {
quiniela?.initSecondPlacePage?.();
},
'verificar': () => {
if (quiniela?.searchParticipant) {
const searchInput = document.getElementById('searchInput');
if (searchInput) searchInput.value = '';
quiniela.searchParticipant();
}
},
'simulador': () => {
simulador?.init?.();
},
},
controllerResultados.signal
);
return { controllerAnalisis, controllerResultados };
}
document.addEventListener('DOMContentLoaded', initNavegacionTabs, { once: true });
/*----Esto de abajo se encarga de trabajar en nuestro archivo y se usa para la Aplicacion=----------*/
const PWA = (() => {
let _prompt = null;
let _bannerTimer = null;
let _isInstalando = false;
function _yaEstaInstalada() {
return window.matchMedia?.('(display-mode: standalone)').matches
|| window.navigator.standalone === true;
}
function _ocultarBanner() {
if (_bannerTimer) {
clearTimeout(_bannerTimer);
_bannerTimer = null;
}
const banner = document.getElementById('pwaBanner');
if (banner) banner.style.display = 'none';
}
function _persistirVendedorActual() {
const vendedor = VendedorManager?.current;
if (vendedor) {
ls.set('vendedor', vendedor);
if (ENV?.isDev) console.log('✅ PWA: vendedor persistido antes de instalar:', vendedor);
}
}
function _mostrarBanner() {
if (_yaEstaInstalada()) return;
const vendedor = VendedorManager?.current;
if (!vendedor) return;
if (ls.get('pwaDismissed_' + vendedor)) return;
if (_bannerTimer) {
clearTimeout(_bannerTimer);
_bannerTimer = null;
}
_bannerTimer = setTimeout(() => {
_bannerTimer = null;
const banner = document.getElementById('pwaBanner');
if (banner) banner.style.display = 'flex';
}, 4000);
}
window.addEventListener('beforeinstallprompt', e => {
e.preventDefault();
_prompt = e;
_mostrarBanner();
});
window.addEventListener('appinstalled', () => {
_prompt = null;
_persistirVendedorActual();
_ocultarBanner();
if (typeof showToast === 'function') {
showToast('¡App instalada! 🎉', 'success');
}
});
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
navigator.serviceWorker.register('/service-worker.js')
.then(() => { if (ENV?.isDev) console.log('✅ SW registrado'); })
.catch(err => { if (ENV?.isDev) console.error('❌ SW error:', err); });
});
}
async function instalarPWA() {
if (!_prompt || _isInstalando) return;
_isInstalando = true;
_persistirVendedorActual();
try {
await _prompt.prompt();
const { outcome } = await _prompt.userChoice;
_ocultarBanner();
if (outcome === 'accepted') {
if (typeof showToast === 'function') showToast('¡App instalada! 🎉', 'success');
} else {
if (ENV?.isDev) console.log('PWA: prompt descartado por el usuario');
}
} catch (err) {
if (ENV?.isDev) console.error('❌ PWA instalarPWA:', err);
} finally {
_prompt = null;
_isInstalando = false;
}
}
function cerrarBanner() {
const vendedor = VendedorManager?.current;
_ocultarBanner();
ls.set('pwaDismissed_' + (vendedor || 'sin_vendedor'), '1');
}
return Object.freeze({ instalarPWA, cerrarBanner });
})();
