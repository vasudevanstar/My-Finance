// Service Worker for My Finance PWA offline caching
const CACHE_NAME = "my-finance-v1";
const OFFLINE_URL = "/dashboard";

const ASSETS_TO_CACHE = [
  "/",
  "/dashboard",
  "/transactions",
  "/accounts",
  "/savings",
  "/reports",
  "/manifest.json",
  "/icon.svg"
];

// Install: Cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("PWA pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate for static assets, network-first for API requests
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bypass cache for Supabase API requests and auth callbacks to guarantee live data
  if (url.hostname.includes("supabase.co") || url.pathname.startsWith("/auth/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for navigational assets
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
