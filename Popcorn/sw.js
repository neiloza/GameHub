/*
 * Popcorn service worker.
 *
 * Goal: work offline (all data lives in localStorage on-device already),
 * but always pick up the newest deploy automatically. Strategy is
 * network-first for same-origin GET requests — when online it fetches the
 * latest file and refreshes the cache; when offline it falls back to the
 * cached copy. Bumping CACHE on each deploy clears old caches.
 */

var CACHE = "popcorn-v2";
var SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/movies.js",
  "./js/videogames.js",
  "./js/tvshows.js",
  "./js/categories.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/favicon.svg",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) {
      return c.add(u).catch(function () { /* ignore individual misses */ });
    }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("./index.html");
      });
    })
  );
});
