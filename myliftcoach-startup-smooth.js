/* MYLIFTCOACH startup handoff. Owns launch presentation only. */
(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('myliftcoach-starting');
  const trace=name=>window.MYLIFTCOACHStartupTrace?.mark(name);
  trace('presentation-start');
  let revealed=false,observer=null,identityCheckStarted=false,identityRetry=null;
  // An installed preview must never leave a solid teal overlay indefinitely.
  const startedAt=Date.now();
  function showBootFailure(){
    if(revealed||document.getElementById('mlcStartupFailure'))return;
    observer?.disconnect();
    if(identityRetry){clearTimeout(identityRetry);identityRetry=null;}
    const failure=document.createElement('section');failure.id='mlcStartupFailure';
    failure.setAttribute('role','alert');
    failure.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#003b49;color:#fffdf8;visibility:visible!important;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;gap:18px;padding:32px;font:16px -apple-system,BlinkMacSystemFont,sans-serif';
    const title=document.createElement('h1');title.textContent='MYLIFTCOACH could not finish opening';title.style.cssText='font-size:23px;line-height:1.3;margin:0';
    const note=document.createElement('p');note.textContent='Account verification or startup took too long. Your saved workouts have not been deleted.';note.style.cssText='max-width:330px;line-height:1.5';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.style.cssText='padding:15px 28px;border:0;border-radius:12px;background:#d7f8ee;color:#003b49;font:600 16px -apple-system,sans-serif';retry.addEventListener('click',()=>location.reload());
    failure.append(title,note,retry);(document.body||document.documentElement).appendChild(failure);
    trace('startup-timeout');
  }
  setTimeout(showBootFailure,12000);

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
        trace('account-verified');
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
    return !!(home&&!home.classList.contains('hidden')&&shell);
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
    trace('home-interactive');
    observer?.disconnect();
    if(identityRetry){clearTimeout(identityRetry);identityRetry=null;}
    const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,600));
    if(window.PRISMDeviceStore?.owner && !document.getElementById('liftovaAuthGate')) idle(loadOwnerShadowTools,{timeout:1800});
  }

  function reveal(){
    if(revealed||document.getElementById('mlcStartupFailure')||!surfaceReady())return false;
    revealed=true;
    trace('surface-ready');
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
