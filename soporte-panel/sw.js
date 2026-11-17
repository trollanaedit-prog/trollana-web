/* downloaderV Soporte · service worker
   - Avisos push (Firebase Cloud Messaging) aunque el panel esté cerrado.
   - Abre la conversación al tocar el aviso.
   - Guarda el panel para que arranque al instante. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

let cfg = {};
try { cfg = JSON.parse(new URL(self.location.href).searchParams.get('c') || '{}'); } catch (e) {}
if (cfg.apiKey && self.firebase) {
  firebase.initializeApp(cfg);
  firebase.messaging();
}

const CACHE = 'dv-soporte-v1';
const BASE = ['./', './index.html', './panel.css', './panel.js', '../soporte-config.js', '../icono.png', '../icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Red primero (siempre la versión nueva); si no hay conexión, la guardada.
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && BASE.some((b) => new URL(b, self.location.href).href === u.href.split('#')[0])) {
      const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia));
    }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))));
});

// Avisos creados por el propio panel (los de Firebase se gestionan solos)
self.addEventListener('notificationclick', (e) => {
  const d = e.notification.data || {};
  if (d.FCM_MSG) return;
  e.notification.close();
  const url = new URL(d.url || './', self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(new URL('./', self.location.href).href)) { w.navigate(url).catch(() => {}); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
