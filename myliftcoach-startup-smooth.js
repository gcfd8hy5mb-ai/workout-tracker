/* MYLIFTCOACH startup handoff. Owns launch presentation only. */
(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('myliftcoach-starting');
  let revealed=false,observer=null,identityCheckStarted=false,identityRetry=null;

  function mount(){
    if(revealed||document.getElementById('myliftcoachStartupCover'))return;
    const cover=document.createElement('div');
    cover.id='myliftcoachStartupCover';
    cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=22" alt=""><strong>MYLIFTCOACH</strong><span>TRAIN · TRACK · PROGRESS</span></div>';
    (document.body||document.documentElement).appendChild(cover);
  }

  function retryIdentitySoon(delay=250){
    if(revealed||identityRetry)return;
    identityRetry=setTimeout(()=>{identityRetry=null;verifyScopedOwnerEarly();},delay);
  }

  async function verifyScopedOwnerEarly(){
    if(revealed||identityCheckStarted||!root.classList.contains('prism-account-booting'))return;
    const manager=window.PRISMDeviceStore,cloud=window.PRISMCloud;
    if(!manager?.owner)return;
    if(!cloud?.currentUser){retryIdentitySoon(75);return;}
    identityCheckStarted=true;
    let timedOut=false;
    const timeout=new Promise((_,reject)=>setTimeout(()=>{timedOut=true;reject(new Error('identity-check-timeout'));},1800));
    try{
      const user=await Promise.race([cloud.currentUser(),timeout]);
      /* The device store was selected from the cached session before app state
         was read. Reveal the already account-scoped local copy only after the
         server confirms the exact same user. Full cloud reconciliation, photo
         push/restore and other account work continue in account-ui afterward. */
      if(user?.id===manager.owner){
        root.classList.remove('prism-account-booting');
        check();
        return;
      }
    }catch{
      /* Fail closed: never reveal account data until this owner is confirmed. */
    }finally{
      identityCheckStarted=false;
      if(manager?.owner&&!revealed&&root.classList.contains('prism-account-booting'))retryIdentitySoon(timedOut?250:500);
    }
  }

  function visibleCanonicalHomeReady(){
    const home=document.getElementById('home');
    const shell=home&&home.querySelector('.liftova-home-shell');
    return !!(home&&!home.classList.contains('hidden')&&shell&&shell.dataset.liftovaReady==='true');
  }

  function surfaceReady(){
    if(root.classList.contains('prism-account-booting')) return false;
    if(document.getElementById('liftovaAuthGate'))return true;
    if(visibleCanonicalHomeReady())return true;
    return !!document.querySelector('#welcomeScreen:not(.hidden),#onboardingScreen:not(.hidden),#goalReviewScreen:not(.hidden),#setupScreen:not(.hidden),#workoutsScreen:not(.hidden),#workoutScreen:not(.hidden),#workoutDetailScreen:not(.hidden),#overallProgressScreen:not(.hidden),#profileScreen:not(.hidden)');
  }

  function loadOwnerShadowTools(){
    for(const [src,key] of [['myliftcoach-shadow-cloud.js?v=1','shadow-cloud'],['myliftcoach-admin-shadow-dashboard-v4.js?v=1','admin-shadow']]){
      if(document.querySelector(`script[data-myliftcoach-${key}]`))continue;
      const script=document.createElement('script');
      script.src=src;
      script.async=true;
      script.setAttribute(`data-myliftcoach-${key}`,'true');
      document.head.appendChild(script);
    }
  }

  function finishReveal(){
    document.getElementById('myliftcoachStartupCover')?.remove();
    root.classList.remove('myliftcoach-starting','myliftcoach-ready');
    observer?.disconnect();
    if(identityRetry){clearTimeout(identityRetry);identityRetry=null;}
    const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,600));
    idle(loadOwnerShadowTools,{timeout:1800});
  }

  function reveal(){
    if(revealed||!surfaceReady())return false;
    revealed=true;
    root.classList.add('myliftcoach-ready');
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)finishReveal();
    else setTimeout(finishReveal,110);
    return true;
  }

  function check(){if(revealed)return;mount();verifyScopedOwnerEarly();reveal();}

  function boot(){
    mount();
    observer=new MutationObserver(check);
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-liftova-ready']});
    check();
  }

  if(document.body)boot();
  else document.addEventListener('DOMContentLoaded',boot,{once:true});
  document.addEventListener('myliftcoach:home-ready',check);
})();