const cacheName = 'lazy-reversi';
const contentToCache = [
  './index.html',
  './index.css',
  './index.js',
  './sw.js',
  './icon.png',
  './GitHub-Mark-64px.png',
  './manifest.json'
];

self.addEventListener("install", (e) => {
	console.log("Service Worker installed");
	e.waitUntil((async () => {
		const cache = await caches.open(cacheName);
		console.log('[Service Worker] Caching all: app shell and content');
		await cache.addAll(contentToCache);
	  })());
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request)
        })
    )
})
