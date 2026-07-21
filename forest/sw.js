/*
 * Forest service worker.
 *
 * Goal: work offline, but always pick up the newest deploy automatically.
 * Strategy is network-first for same-origin GET requests — when the device is
 * online it fetches the latest file from Cloudflare/GitHub and refreshes the
 * cache; when offline it falls back to the cached copy. Bumping CACHE on each
 * deploy (or just letting the byte-diff of this file trigger an update) clears
 * old caches and activates the new worker immediately.
 */

var CACHE = "forest-v1";
var SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./trees.js",
  "./app.js",
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
