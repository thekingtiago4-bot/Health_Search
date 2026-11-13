/* Health Search · aplicativo: abre mesmo sem internet e sempre busca a versão nova quando há conexão */
const CACHE='hs-app-v124';
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png']).catch(()=>{}))); });
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||(u.origin!==location.origin&&u.hostname!=='cdn.jsdelivr.net')||u.pathname.endsWith('version.json')) return;
  /* sempre pede ao servidor sem usar o cache do navegador (no-cache = confere se mudou); sem internet, usa a cópia guardada */
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return r; }).catch(()=>caches.match(e.request))); });
