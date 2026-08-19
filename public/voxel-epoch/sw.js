const CACHE='voxel-epoch-v4';
const CORE=['./','./index.html','./styles.css','./favicon.svg','./manifest.webmanifest','./src/main.js','./src/config.js','./src/textures.js','./src/world.js','./src/player.js','./src/entities.js','./src/gameplay.js','./src/ui.js','./src/save.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const isCode=event.request.mode==='navigate'||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.html');

  if(isCode){
    event.respondWith(
      fetch(event.request)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});
          return res;
        })
        .catch(()=>caches.match(event.request).then(hit=>hit||(event.request.mode==='navigate'?caches.match('./index.html'):Promise.reject(new Error('offline')))))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});
      return res;
    }))
  );
});
