const CACHE_NAME = "prism-v10.3-beta17";

const APP_FILES = [
  "./",
  "./index.html",
  "./onboarding.js?v=10.3-beta5",
  "./pro-experience.js",
  "./manifest.json",
  "./sw.js",
  "./coach-checkin.js?v=1",
  "./athlete-profile.js?v=1",
  "./adaptive-programming.js?v=3",
  "./coach-engine.js?v=3",
  "./ask-prism.js?v=1",
  "./in-workout-coach.js?v=2",
  "./set-coach.js?v=1",
  "./adaptive-set-coach.js?v=1",
  "./next-session-coach.js?v=1",
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
    style.id = "prism-android-scroll-hotfix";
    style.textContent = "html,body{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch!important}body:not(.prism-drawer-open){overflow-y:auto!important;touch-action:pan-y!important}body.prism-onboarding-active{overflow-y:auto!important;min-height:100vh!important;min-height:100dvh!important;height:auto!important;touch-action:pan-y!important}body.prism-onboarding-active .container,body.prism-onboarding-active #onboardingScreen,body.prism-onboarding-active #prismJourneyContent,body.prism-onboarding-active .journey-shell{height:auto!important;max-height:none!important;overflow:visible!important}body.prism-onboarding-active .container{min-height:100vh!important;min-height:100dvh!important;padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}body.prism-onboarding-active .journey-profile-actions{position:static!important;inset:auto!important;transform:none!important;margin-top:18px!important;padding:0 0 calc(36px + env(safe-area-inset-bottom))!important;background:transparent!important}body.prism-onboarding-active .journey-profile-actions .journey-actions{margin-top:10px!important}";
    document.getElementById(style.id)?.remove();document.head.appendChild(style);
    const clearStaleDrawerLock=()=>{const menu=document.getElementById("sideMenu");if(!menu||!menu.classList.contains("open")){document.body.classList.remove("prism-drawer-open");document.body.style.overflow="";}};
    clearStaleDrawerLock();
    if(typeof closeMenu==="function"&&!closeMenu.__prismScrollPatched){const originalCloseMenu=closeMenu;const patchedCloseMenu=function(...args){try{return originalCloseMenu.apply(this,args)}finally{document.body.classList.remove("prism-drawer-open");document.body.style.overflow="";}};patchedCloseMenu.__prismScrollPatched=true;window.closeMenu=patchedCloseMenu;}
    const menu=document.getElementById("sideMenu");if(menu&&window.MutationObserver)new MutationObserver(clearStaleDrawerLock).observe(menu,{attributes:true,attributeFilter:["class","aria-hidden"]});
    const actions=document.querySelector(".journey-profile-actions");if(actions)actions.style.bottom="";
  } catch(error){console.warn("PRISM Android scroll hotfix could not initialize",error);}
})();
`;
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{await cache.addAll(APP_FILES.slice(0,6).map(file=>new Request(file,{cache:"reload"})));await Promise.allSettled(APP_FILES.slice(6).map(file=>cache.add(file)));await self.skipWaiting();}));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.pathname.endsWith("/onboarding.js")){event.respondWith(fetch(event.request,{cache:"no-cache"}).then(async response=>{if(!response.ok)return response;const source=await response.text(),headers=new Headers(response.headers);headers.set("content-type","application/javascript; charset=utf-8");return new Response(source+ANDROID_ONBOARDING_HOTFIX,{status:response.status,statusText:response.statusText,headers});}).catch(async()=>{const cached=await caches.match(event.request);if(!cached)throw new Error("No cached onboarding script available");const source=await cached.text(),headers=new Headers(cached.headers);headers.set("content-type","application/javascript; charset=utf-8");return new Response(source+ANDROID_ONBOARDING_HOTFIX,{status:cached.status,statusText:cached.statusText,headers});}));return;}if(url.pathname.endsWith("/")||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/pro-experience.js")){event.respondWith(fetch(event.request,{cache:"no-cache"}).then(response=>{const copy=response.clone();if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request)));return;}event.respondWith(caches.match(event.request).then(cached=>{if(cached)return cached;return fetch(event.request).then(response=>{const copy=response.clone();if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;});}));});