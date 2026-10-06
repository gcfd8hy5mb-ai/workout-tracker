const CACHE_NAME = "myliftcoach-home-v22-anatomy";
const UPGRADE_VERSION = "22";

// Keep the install shell deliberately small. Runtime/presentation modules are network-first below,
// so an installed PWA cannot remain pinned to a stale presentation or scheduling bundle.
const APP_FILES = [
  "./", "./index.html", "./onboarding.js?v=10.3-beta5", "./pro-experience.js", "./manifest.json", "./sw.js",
  "./persistence/storage-model.js", "./persistence/scoped-storage.js", "./persistence/photo-scope.js", "./persistence/reconcile.js",
  "./persistence/account-sync.js", "./persistence/account-controller.js", "./persistence/photo-sync.js", "./persistence/account-ui.js",
  "./supabase-config.js", "./liftova-home.js?v=12", "./liftova-home.css?v=12", "./liftova-onboarding.js?v=7",
  "./liftova-workouts.js?v=7", "./liftova-active-workout.js?v=7", "./liftova-library.js?v=7", "./liftova-progress.js?v=7",
  "./liftova-profile.js?v=7", "./liftova-pro.js?v=7", "./liftova-polish.js?v=8",
  "./liftova-workout-tab-v3.js?v=1", "./liftova-anatomy.js?v=1", "./liftova-anatomy.css?v=1",
  "./myliftcoach-startup-smooth.js?v=1", "./myliftcoach-startup-smooth.css?v=1", "./myliftcoach-anatomy-v2.js?v=1",
  "./myliftcoach-library-ux.js?v=1", "./myliftcoach-swipe-ux.js?v=1", "./myliftcoach-daily-tracking-ux.js?v=1",
  "./myliftcoach-profile-brand-lock.js?v=3", "./myliftcoach-visual-cleanup.js?v=1", "./myliftcoach-home-sequence-fix.js?v=4",
  "./myliftcoach-custom-workout-fix.js?v=2", "./myliftcoach-core-ux-v1.css?v=1", "./myliftcoach-core-ux-v2.css?v=1",
  "./myliftcoach-core-ux-v3.css?v=1", "./myliftcoach-core-ux-v4.css?v=1", "./myliftcoach-anatomy-polish.css?v=2",
  "./myliftcoach-home-dashboard-ux.css?v=1", "./myliftcoach-library-ux.css?v=1", "./myliftcoach-daily-tracking-ux.css?v=1",
  "./myliftcoach-history-records-ux.css?v=1", "./images/myliftcoach-anatomy-realistic.webp", "./images/myliftcoach-anatomy-body-mask.png", "./images/app-icon.png?v=11",
  "./images/apple-touch-icon-180.png?v=10", "./cloud-backup.js"
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
    style.textContent = "html,body{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch!important}body:not(.prism-drawer-open){overflow-y:auto!important;touch-action:pan-y!important}body.prism-onboarding-active{overflow-y:auto!important;min-height:100vh!important;min-height:100dvh!important;height:auto!important;touch-action:pan-y!important}body.prism-onboarding-active .container,body.prism-onboarding-active #onboardingScreen,body.prism-onboarding-active #prismJourneyContent,body.prism-onboarding-active .journey-shell{height:auto!important;max-height:none!important;overflow:visible!important}body.prism-onboarding-active .container{min-height:100vh!important;min-height:100dvh!important;padding-bottom:calc(96px + env(safe-area-inset-bottom))!important}body.prism-onboarding-active .journey-profile-actions{position:static!important;inset:auto!important;transform:none!important;margin-top:18px!important;padding:0 0 calc(36px + env(safe-area-inset-bottom))!important;background:transparent!important}body.prism-onboarding-active .journey-profile-actions .journey-actions{margin-top:10px!important;background:transparent!important}";
    document.getElementById(style.id)?.remove();document.head.appendChild(style);
    const clearStaleDrawerLock=()=>{const menu=document.getElementById("sideMenu");if(!menu||!menu.classList.contains("open")){document.body.classList.remove("prism-drawer-open");document.body.style.overflow="";}};
    clearStaleDrawerLock();
    if(typeof closeMenu==="function"&&!closeMenu.__prismScrollPatched){const originalCloseMenu=closeMenu;const patchedCloseMenu=function(...args){try{return originalCloseMenu.apply(this,args)}finally{document.body.classList.remove("prism-drawer-open");document.body.style.overflow="";}};patchedCloseMenu.__prismScrollPatched=true;window.closeMenu=patchedCloseMenu;}
    const menu=document.getElementById("sideMenu");if(menu&&window.MutationObserver)new MutationObserver(clearStaleDrawerLock).observe(menu,{attributes:true,attributeFilter:["class","aria-hidden"]});
    const actions=document.querySelector(".journey-profile-actions");if(actions)actions.style.bottom="";
  } catch(error){console.warn("MYLIFTCOACH Android scroll hotfix could not initialize",error);}
})();
`;

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES.slice(0,6).map(file=>new Request(file,{cache:"reload"})));
    await Promise.allSettled(APP_FILES.slice(6).map(file=>cache.add(new Request(file,{cache:"reload"}))));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const upgrading=keys.some(key=>key!==CACHE_NAME);
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of clients){
      client.postMessage({type:"MYLIFTCOACH_UPGRADE_READY",version:UPGRADE_VERSION});
      if(upgrading && typeof client.navigate==="function"){
        try{
          const target=new URL(client.url);
          target.searchParams.set("myliftcoach_upgrade",UPGRADE_VERSION);
          await client.navigate(target.href);
        }catch(error){console.warn("MYLIFTCOACH client upgrade navigation failed",error);}
      }
    }
  })());
});

self.addEventListener("message",event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='GET_MYLIFTCOACH_VERSION')event.source?.postMessage({type:'MYLIFTCOACH_VERSION',version:UPGRADE_VERSION});
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith("/onboarding.js")){
    event.respondWith(fetch(event.request,{cache:"no-store"}).then(async response=>{
      if(!response.ok)return response;
      const source=await response.text(),headers=new Headers(response.headers);
      headers.set("content-type","application/javascript; charset=utf-8");
      return new Response(source+ANDROID_ONBOARDING_HOTFIX,{status:response.status,statusText:response.statusText,headers});
    }).catch(async()=>{
      const cached=await caches.match(event.request);
      if(!cached)throw new Error("No cached onboarding script available");
      const source=await cached.text(),headers=new Headers(cached.headers);
      headers.set("content-type","application/javascript; charset=utf-8");
      return new Response(source+ANDROID_ONBOARDING_HOTFIX,{status:cached.status,statusText:cached.statusText,headers});
    }));return;
  }
  const presentation=url.pathname.endsWith("/")||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/myliftcoach-base.css")||url.pathname.endsWith("/pro-experience.js")||url.pathname.endsWith("/ask-prism.js")||url.pathname.endsWith("/coach-today.js")||url.pathname.endsWith("/in-workout-coach.js")||url.pathname.endsWith("/adaptive-set-coach.js")||url.pathname.endsWith("/adaptive-programming.js")||url.pathname.endsWith("/post-workout-coach.js")||url.pathname.endsWith("/coach-learning.js")||url.pathname.endsWith("/coach-intervention-memory.js")||url.pathname.endsWith("/next-session-coach.js")||url.pathname.endsWith("/preworkout-plan.js")||url.pathname.endsWith("/plateau-detection.js")||url.pathname.endsWith("/exercise-library-expansion.js")||url.pathname.endsWith("/exercise-library-expansion-v1.js")||url.pathname.endsWith("/exercise-library-expansion-2.js")||url.pathname.endsWith("/exercise-library-expansion-3.js")||url.pathname.endsWith("/exercise-library-expansion-4.js")||url.pathname.endsWith("/exercise-library-expansion-5.js")||url.pathname.includes("/persistence/")||url.pathname.endsWith("/supabase-config.js")||url.pathname.endsWith("/cloud-backup.js")||url.pathname.includes("/liftova-")||url.pathname.includes("/myliftcoach-");
  if(presentation){
    event.respondWith(fetch(event.request,{cache:"no-store"}).then(response=>{
      const copy=response.clone();
      if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request)));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;
  })));
});