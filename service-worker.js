// service-worker.js

const CACHE_NAME = 'mbe-quiz-cache-v1'; // CHANGE version number when you update assets
const urlsToCache = [
  './', // Cache the root (index.html)
  'index.html', // Explicitly cache index.html
  // Add paths to any OTHER essential static assets if you had separate CSS/JS files
  // './styles/main.css', // Example if you had separate CSS
  // './scripts/main.js', // Example if you had separate JS (Your main JS is inline, so not needed here)
  'https://ansonlai.github.io/MBE-Practice-Questions/ncbe-sample.json', // Cache the sample data
  'icons/icon-192x192.png', // Cache icons
  'icons/icon-512x512.png'
  // Add other icon paths if you have more
];

// Install event: Cache the core application shell files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete.');
        // Optional: Force the waiting service worker to become the active service worker.
        // self.skipWaiting(); // Use with caution, might break things if assets change drastically mid-session
      })
      .catch(error => {
        console.error('Service Worker: Caching failed during install:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete.');
      // Optional: Tell the active service worker to take control of the page immediately.
      // return self.clients.claim(); // Use with caution alongside skipWaiting
    })
  );
});

// Fetch event: Serve assets from cache first, fallback to network
self.addEventListener('fetch', event => {
  // Don't cache requests that aren't GET
  if (event.request.method !== 'GET') {
      return;
  }

  // Cache-first strategy for requests defined in urlsToCache or same origin
  // For external resources or those not explicitly cached, often network-first is better,
  // but for this simple app, cache-first for known assets is okay.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Found in cache, return it
          // console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // Not in cache, fetch from network
        // console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Optional: Cache dynamically fetched resources if needed, but be careful
            // For this app, we primarily cache the static shell and sample data.
            // If the fetch was successful and it's something we *might* want to cache (e.g., future API calls)
            // you could potentially add logic here to clone the response and put it in the cache.
            // Example (use cautiously):
            /*
            if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            */
            return networkResponse;
          }
        ).catch(error => {
          console.error('Service Worker: Fetch failed:', error);
          // Optional: Return a custom offline fallback page/response here
          // For example: return caches.match('./offline.html');
        });
      })
  );
});