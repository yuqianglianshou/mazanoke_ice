const APP_VERSION = 'v1.0.0'
const CACHE_VERSION = APP_VERSION;
const CACHE_NAME = `image-compression-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/fonts.css',
  '/assets/css/variables.css',
  '/assets/css/style.css',
  '/assets/js/browser-image-compression.js',
  '/assets/js/script.js',
  '/assets/images/android-chrome-192x192.png',
  '/assets/images/android-chrome-512x512.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/images/symbol-192x192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Skip requests with unsupported schemes (e.g., 'chrome-extension://', 'file://')
  if (['chrome-extension:', 'file:', 'about:'].includes(requestUrl.protocol)) {
    return; // Don't cache or handle requests with unsupported schemes
  }

  if (event.request.url.includes('/index.html')) {
    // Network-first strategy for index.html
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // Stale-while-revalidate for other resources
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Clone the response before putting it in cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache); // Only cache valid requests
          });
          return networkResponse;  // Return the network response for the fetch request
        });
        return cachedResponse || fetchPromise;  // Return either the cached or the network response
      })
    );
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('image-compression-cache-') && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
