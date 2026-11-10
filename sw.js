/* SmallClaimsPro service worker: offline fallback + static asset caching.
 * Never caches form posts, Netlify Functions, or other sites. */
const VERSION = "scp-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/.netlify/")) return;

  // Pages: always try the network first so content is never stale.
  if (req.mode === "navigate") {
    const net = fetch(req).then((res) => ({ res, copy: res.ok ? res.clone() : null }));
    // Keep the worker alive until the cache write finishes.
    event.waitUntil(
      net.then(({ copy }) => copy && caches.open(VERSION).then((c) => c.put(req, copy))).catch(() => {})
    );
    event.respondWith(
      net
        .then(({ res }) => res)
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html")))
    );
    return;
  }

  // Static files: serve from cache, refresh in the background.
  if (/\.(?:css|js|png|svg|webp|jpg|jpeg|woff2?)$/.test(url.pathname)) {
    const cache = caches.open(VERSION);
    const net = cache.then((c) =>
      fetch(req).then(async (res) => {
        if (res.ok) await c.put(req, res.clone());
        return res;
      })
    );
    // Keep the worker alive until the background refresh is cached.
    event.waitUntil(net.catch(() => {}));
    event.respondWith(cache.then((c) => c.match(req)).then((hit) => hit || net));
  }
});
