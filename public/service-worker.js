const CACHE_NAME="fala-pavao-v5";
const APP_SHELL=["./","./index.html","./style.css","./app.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png","./icons/pavv.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const u=new URL(e.request.url);
  if(u.pathname.startsWith("/api/")||u.pathname==="/admin.html") return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE_NAME).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request)));
});
