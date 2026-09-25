const CACHE_NAME = "prism-v10.3-beta6";

const APP_FILES = [
  "./",
  "./index.html",
  "./onboarding.js?v=10.3-beta5",
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

const ANDROID_ONBOARDING_HOTFIX = `
;(() => {
  try {
    if (window.visualViewport && typeof prismProfileViewport === "function") {
      window.visualViewport.removeEventListener("resize", prismProfileViewport);
      window.visualViewport.removeEventListener("scroll", prismProfileViewport);
    }

    const style = document.createElement("style");
    style.id = "prism-android-onboarding-scroll-hotfix";
    style.textContent = "body.prism-onboarding-active{overflow-y:auto!important;overflow-x:hidden!important;min-height:100vh!important;min-height:100dvh!important;height:auto!important;overscroll-behavior-y:auto!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}body.prism-onboarding-active .container,body.prism-onboarding-active #onboardingScreen,body.prism-onboarding-active #prismJourneyContent,body.prism-onboarding-active .journey-shell{height:auto!important;max-height:none!important;overflow:visible!important}body.prism-onboarding-active .container{min-height:100vh!important;min-height:100dvh!important;padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}body.prism-onboarding-active .journey-profile-actions{position:static!important;inset:auto!important;top:auto!important;right:auto!important;bottom:auto!important;left:auto!important;transform:none!important;margin-top:18px!important;padding:0 0 calc(36px + env(safe-area-inset-bottom))!important;background:transparent!important}body.prism-onboarding-active .journey-profile-actions .journey-actions{margin-top:10px!important}";

    document.getElementById(style.id)?.remove();
    document.head.appendChild(style);

    const actions = document.querySelector(".journey-profile-actions");
    if (actions) actions.style.bottom = "";
  } catch (error) {
    console.warn("PRISM onboarding scroll hotfix could not initialize", error);
  }
})();
`;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
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

  if (url.pathname.endsWith("/onboarding.js")) {
    event.respondWith(
      fetch(event.request, {cache: "no-cache"})
        .then(async response => {
          if (!response.ok) return response;
          const source = await response.text();
          const headers = new Headers(response.headers);
          headers.set("content-type", "application/javascript; charset=utf-8");
          return new Response(source + ANDROID_ONBOARDING_HOTFIX, {
            status: response.status,
            statusText: response.statusText,
            headers
          });
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (!cached) throw new Error("No cached onboarding script available");
          const source = await cached.text();
          const headers = new Headers(cached.headers);
          headers.set("content-type", "application/javascript; charset=utf-8");
          return new Response(source + ANDROID_ONBOARDING_HOTFIX, {
            status: cached.status,
            statusText: cached.statusText,
            headers
          });
        })
    );
    return;
  }

  if (
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/pro-experience.js")
  ) {
    event.respondWith(
      fetch(event.request, {cache: "no-cache"})
        .then(response => {
          const copy = response.clone();
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

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
