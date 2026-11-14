const CACHE_NAME = "rider-kpi-cloud-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./data.enc.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/data.enc.json") || url.pathname.endsWith("data.enc.json")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("./data.enc.json", clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./data.enc.json"))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const net = fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
