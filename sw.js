const CACHE_NAME = "prism-v10.3-beta4";

const APP_FILES = [

  "./",

  "./index.html",
  "./onboarding.js",
  "./pro-experience.js",

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

    caches.open(CACHE_NAME).then(async cache => {
      // The app shell must update together. An unavailable optional image must
      // not prevent the new onboarding script from replacing an old version.
      await cache.addAll(APP_FILES.slice(0, 6).map(file => new Request(file, {cache: "reload"})));
      await Promise.allSettled(APP_FILES.slice(6).map(file => cache.add(file)));
      await self.skipWaiting();
    })

  );

});

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys =>

      Promise.all(

        keys

          .filter(key => key !== CACHE_NAME)

          .map(key => caches.delete(key))

      )

    ).then(() => self.clients.claim())

  );

});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Always check the internet first for the main app.

  if (

    url.pathname.endsWith("/") ||

    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/onboarding.js") ||
    url.pathname.endsWith("/pro-experience.js")

  ) {

    event.respondWith(

      fetch(event.request, {cache: "no-cache"})

        .then(response => {

          const copy = response.clone();

          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));

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

        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));

        return response;

      });

    })

  );

});
