const cacheName = "lazy-reversi";
const contentToCache = [
	"./index.html",
	"./index.css",
	"./index.js",
	"./sw.js",
	"./icon.png",
	"./GitHub-Mark-64px.png",
	"./manifest.json",
	"./icon512.png",
	"./favicon.png",
	"./apple-icon.png",
];

self.addEventListener("install", (e) => {
	console.log("Service Worker installed");
	e.waitUntil(
		(async () => {
			const cache = await caches.open(cacheName);
			await cache.addAll(contentToCache);
		})()
	);
});

self.addEventListener("fetch", function (event) {
	event.respondWith(fetch(event.request).catch(() => {
		return caches.match(event.request)
	})
	);
});
