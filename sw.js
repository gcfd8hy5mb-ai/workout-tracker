const CACHE_NAME = "prism-v10.1-beta1";

const APP_FILES = [

  "./",

  "./index.html",

  "./manifest.json",

  "./sw.js",
  "./images/app-icon.png",
  "./images/app-icon-512.png",
  "./images/app-icon-192.png",
  "./images/apple-touch-icon-180.png",
  "./images/favicon-32.png",
  "./images/biceps-curl.png",
  "./images/calf-raise.png",
  "./images/lat-pulldown.png",
  "./images/lateral-raise.png",
  "./images/leg-extension.png",
  "./images/leg-press.png",
  "./images/machine-chest-press.png",
  "./images/pec-deck.png",
  "./images/preacher-curl.png",
  "./images/seated-leg-curl.png",
  "./images/seated-row.png",
  "./images/shoulder-press.png",
  "./images/triceps-extension.png",
  "./images/triceps-pushdown.png"

];

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))

  );

  self.skipWaiting();

});

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys =>

      Promise.all(

        keys

          .filter(key => key !== CACHE_NAME)

          .map(key => caches.delete(key))

      )

    )

  );

  self.clients.claim();

});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Always check the internet first for the main app.

  if (

    url.pathname.endsWith("/") ||

    url.pathname.endsWith("/index.html")

  ) {

    event.respondWith(

      fetch(event.request)

        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {

            cache.put(event.request, copy);

          });

          return response;

        })

        .catch(() => {

          return caches.match(event.request);

        })

    );

    return;

  }

  // Other files can use the cache first.

  event.respondWith(

    caches.match(event.request).then(cached => {

      if (cached) return cached;

      return fetch(event.request).then(response => {

        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {

          cache.put(event.request, copy);

        });

        return response;

      });

    })

  );

});
