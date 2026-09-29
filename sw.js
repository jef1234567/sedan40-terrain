// Page : réseau d'abord, sans cache HTTP (GitHub Pages garde 10 min), cache de l'appli en secours hors ligne. Tuiles et polices : cache d'abord, rangées en mode CORS.
const C='sedan40-terrain-v7', TILES='sedan40-tuiles-v1';
const FILES=['./','index.html','manifest.json','icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==TILES).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.hostname.endsWith('open-meteo.com')) return; // relief : toujours en ligne
  if(r.mode==='navigate'){
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put('index.html',cp));return res;}).catch(()=>caches.match('index.html')));
    return;
  }
  const tile=u.hostname.endsWith('tile.opentopomap.org'), font=u.hostname.includes('fonts.g');
  const bucket=(tile?TILES:C);
  e.respondWith(caches.match(r.url,{ignoreSearch:!tile&&!font}).then(hit=>{
    if(hit) return hit;
    if(tile||font){ // requête CORS pour obtenir une réponse lisible et stockable (pas de réponse opaque)
      return fetch(r.url,{mode:'cors'}).then(res=>{ if(res.ok){const cp=res.clone();caches.open(bucket).then(c=>c.put(r.url,cp));} return res; }).catch(()=>fetch(r));
    }
    return fetch(r).then(res=>{ if(res.ok&&u.origin===location.origin){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));} return res; });
  }));
});
