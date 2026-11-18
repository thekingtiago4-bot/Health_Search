/* Health Search · aplicativo: abre mesmo sem internet e sempre busca a versão nova quando há conexão */
const CACHE='hs-app-v192';
/* v10.6.00: partes pesadas (pasta a/, com ?v=) ficam num cache proprio que nao e apagado a cada versao.
   Mudou algum arquivo de a/? Suba o V no HSA (index.html) E este PARTES. */
const PARTES='hs-partes-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png']).catch(()=>{}))); });
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==PARTES).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||(u.origin!==location.origin&&u.hostname!=='cdn.jsdelivr.net')||u.pathname.endsWith('version.json')) return;
  /* pasta a/: o endereco ja leva a versao (?v=), entao o que esta guardado vale — pega do aparelho, sem rede */
  if(u.origin===location.origin&&/\/a\/[^/]+$/.test(u.pathname)){ e.respondWith(caches.open(PARTES).then(async c=>{ const h=await c.match(e.request); if(h) return h;
    const r=await fetch(e.request); if(r&&r.ok) c.put(e.request,r.clone()); return r; })); return; }
  /* sempre pede ao servidor sem usar o cache do navegador (no-cache = confere se mudou); sem internet, usa a cópia guardada */
  /* v10.5.11: so guarda resposta boa (antes guardava ate pagina de erro 404) e, quando a rede
     falha, tenta a copia guardada ignorando o ?v=... do endereco — sem isso um endereco com
     ?v= nao casava com nada no cache e o navegador mostrava "Nao e possivel acessar esse site". */
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{ if(r&&r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); } return r; })
    .catch(async()=>{ const c=await caches.match(e.request);                    if(c) return c;
      const s2=await caches.match(e.request,{ignoreSearch:true});               if(s2) return s2;
      if(e.request.mode==='navigate'){ const i=await caches.match('./index.html',{ignoreSearch:true})||await caches.match('./',{ignoreSearch:true}); if(i) return i; }
      return new Response('<meta charset="utf-8"><body style="font-family:system-ui;background:#0b1f22;color:#fff;padding:24px"><h2>Sem conexao com o servidor do app</h2><p>Este computador nao esta conseguindo falar com <b>thekingtiago4-bot.github.io</b>. Verifique a internet ou se a rede da empresa esta bloqueando o endereco.</p>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}}); })); });
/* v10.6.07: tocar na notificação abre (ou traz para frente) o Health Search */
self.addEventListener('notificationclick',e=>{ e.notification.close(); e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{ for(const c of cs){ if('focus' in c) return c.focus(); } return self.clients.openWindow('./'); })); });
