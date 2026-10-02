/* MYLIFTCOACH startup paint stabilizer. Keeps first launch frame intentional on iOS/PWA. */
(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('myliftcoach-starting');
  let revealed=false,observer=null,identityCheckStarted=false;

  function mount(){
    if(document.getElementById('myliftcoachStartupCover')) return;
    const cover=document.createElement('div');
    cover.id='myliftcoachStartupCover';
    cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=10" alt=""><strong>MYLIFTCOACH</strong></div>';
    (document.body||document.documentElement).appendChild(cover);
  }

  async function verifyScopedOwnerEarly(){
    if(identityCheckStarted||!root.classList.contains('prism-account-booting')) return;
    const manager=window.PRISMDeviceStore,cloud=window.PRISMCloud;
    if(!manager?.owner||!cloud?.currentUser){setTimeout(verifyScopedOwnerEarly,50);return;}
    identityCheckStarted=true;
    try{
      const user=await cloud.currentUser();
      /* The device store was selected from the cached session before any app
         state was read. It is safe to show that already-scoped local copy as
         soon as Supabase confirms the exact same user. Full cloud + photo sync
         continues afterward in account-ui without blocking first paint. */
      if(user?.id===manager.owner){
        root.classList.remove('prism-account-booting');
        check();
      }
    }catch{
      /* Fail closed. account-ui owns the normal retry/timeout path. */
    }
  }

  function canonicalSurfaceReady(){
    if(root.classList.contains('prism-account-booting')) return false;
    if(document.getElementById('liftovaAuthGate')) return true;

    const home=document.getElementById('home');
    if(home&&!home.classList.contains('hidden')) return !!home.querySelector('.liftova-home-shell');

    return !!document.querySelector('#welcomeScreen:not(.hidden),#onboardingScreen:not(.hidden),#goalReviewScreen:not(.hidden),#setupScreen:not(.hidden),#workoutsScreen:not(.hidden),#workoutScreen:not(.hidden),#overallProgressScreen:not(.hidden),#profileScreen:not(.hidden)');
  }

  function loadOwnerShadowTools(){
    for(const [src,key] of [['myliftcoach-shadow-cloud.js?v=1','shadow-cloud'],['myliftcoach-admin-shadow-dashboard-v4.js?v=1','admin-shadow']]){
      if(document.querySelector(`script[data-myliftcoach-${key}]`)) continue;
      const script=document.createElement('script');
      script.src=src;script.async=true;script.setAttribute(`data-myliftcoach-${key}`,'true');
      document.head.appendChild(script);
    }
  }

  function reveal(){
    if(revealed||!canonicalSurfaceReady()) return false;
    revealed=true;
    observer?.disconnect();
    root.classList.add('myliftcoach-ready');
    const finish=()=>{
      document.getElementById('myliftcoachStartupCover')?.remove();
      root.classList.remove('myliftcoach-starting','myliftcoach-ready');
      const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,600));
      idle(loadOwnerShadowTools,{timeout:1800});
    };
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else setTimeout(finish,110);
    return true;
  }

  function check(){mount();verifyScopedOwnerEarly();reveal();}
  if(document.body) mount();
  else document.addEventListener('DOMContentLoaded',mount,{once:true});

  const startObserver=()=>{
    if(observer||revealed)return;
    observer=new MutationObserver(check);
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    check();
  };
  if(document.documentElement)startObserver();
  else document.addEventListener('DOMContentLoaded',startObserver,{once:true});

  document.addEventListener('myliftcoach:home-ready',check);
  document.addEventListener('DOMContentLoaded',check,{once:true});
  setTimeout(check,2500);
})();
