const CACHE="home-remote-v4";
const ASSETS=[
  "/",
  "/admin.html",
  "/manifest.webmanifest",
  "/heart.svg",
  "/cats-bg.svg",
  "/cat-stickers.svg",
  "/%D0%98%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5%20ChatGPT%2019%20%D0%BD%D0%BE%D1%8F%D0%B1.%202026%20%D0%B3.,%2020_12_43.png"
];
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"||new URL(event.request.url).pathname.startsWith("/api/"))return;
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request,{cache:"no-store"}).catch(()=>caches.match("/")));
    return;
  }
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
