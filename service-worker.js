// TKD Academia - Service Worker
const CACHE_VERSION = 'tkd-v3.1-planes';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(CACHE_FILES).catch(function(){});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE_VERSION) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var url = event.request.url;
  // Para Firebase y CDNs: siempre ir a la red (datos en tiempo real)
  if(url.indexOf('firebaseio') > -1 ||
     url.indexOf('googleapis') > -1 ||
     url.indexOf('gstatic.com') > -1 ||
     url.indexOf('cloudflare') > -1 ||
     url.indexOf('wa.me') > -1){
    return;
  }
  // Para el resto: cache-first con actualización en background
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var fetchPromise = fetch(event.request).then(function(networkResp){
        if(networkResp && networkResp.status === 200 && event.request.method === 'GET'){
          var copy = networkResp.clone();
          caches.open(CACHE_VERSION).then(function(cache){ cache.put(event.request, copy); });
        }
        return networkResp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
