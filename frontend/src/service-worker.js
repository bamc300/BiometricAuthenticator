// This is a custom service worker for the Auth PWA

// Cache names
const CACHE_STATIC_NAME = 'auth-pwa-static-v1';
const CACHE_DYNAMIC_NAME = 'auth-pwa-dynamic-v1';
const CACHE_API_DATA_NAME = 'auth-pwa-api-data-v1';

// Assets to cache during installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/main.js',
  '/polyfills.js',
  '/runtime.js',
  '/styles.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('[Service Worker] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME && key !== CACHE_API_DATA_NAME) {
          console.log('[Service Worker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  
  // Ensure service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API requests handling
  if (url.pathname.startsWith('/api')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Regular assets - Cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && !url.pathname.startsWith('/api')) {
            return caches.open(CACHE_DYNAMIC_NAME)
              .then((cache) => {
                cache.put(event.request.url, res.clone());
                return res;
              });
          }
          return res;
        })
        .catch((err) => {
          console.error('[Service Worker] Fetch error:', err);
          // For navigation requests, return the offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          // Otherwise, let the error propagate
          throw err;
        });
    })
  );
});

// Handle background sync events
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync', event);
  
  if (event.tag === 'sync-auth-data') {
    event.waitUntil(
      syncAuthData()
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received', event);
  
  let data = { title: 'Auth PWA Notification', body: 'New notification from Auth PWA' };
  
  if (event.data) {
    data = JSON.parse(event.data.text());
  }
  
  const options = {
    body: data.body,
    icon: 'assets/icons/icon-192x192.svg',
    badge: 'assets/icons/icon-72x72.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Helper function to handle API requests
async function handleApiRequest(request) {
  const networkPrimary = async () => {
    try {
      // Try network first
      const networkResponse = await fetch(request.clone());
      
      // If successful, cache the response (if it's a GET request)
      if (request.method === 'GET' && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_API_DATA_NAME);
        cache.put(request.url, networkResponse.clone());
        console.log('[Service Worker] Cached API response:', request.url);
      }
      
      return networkResponse;
    } catch (err) {
      console.log('[Service Worker] Network request failed, using cache for:', request.url);
      
      // If network fails, try to get from cache
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If no cache either, return a custom offline response for API
      return new Response(
        JSON.stringify({ 
          error: 'You are offline',
          offline: true,
          message: 'This operation requires an internet connection'
        }),
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  };
  
  // For GET requests, we can try cache first for better performance
  if (request.method === 'GET') {
    try {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Start network fetch in the background to update cache
        networkPrimary().catch(console.error);
        return cachedResponse;
      }
    } catch (err) {
      console.error('[Service Worker] Cache match error:', err);
    }
  }
  
  // For non-GET requests or cache misses, go network-first
  return networkPrimary();
}

// Helper function to sync cached auth data
async function syncAuthData() {
  try {
    // This function would handle sending cached login/registration data to server
    // For the sake of this example, it's just a placeholder
    console.log('[Service Worker] Syncing auth data...');
    
    // In a real implementation, you would:
    // 1. Get pending actions from IndexedDB
    // 2. Send them to the server
    // 3. Remove them from the pending queue if successful
    
    return true;
  } catch (err) {
    console.error('[Service Worker] Sync error:', err);
    return false;
  }
}
