/* MYLIFTCOACH startup + rendered-detail stabilizer. */
(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('myliftcoach-starting');
  let revealed=false,observer=null,identityCheckStarted=false,identityRetry=null;

  function mount(){
    if(revealed||document.getElementById('myliftcoachStartupCover'))return;
    const cover=document.createElement('div');cover.id='myliftcoachStartupCover';cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=22" alt=""><strong>MYLIFTCOACH</strong></div>';
    (document.body||document.documentElement).appendChild(cover);
  }
  function retryIdentitySoon(delay=100){if(revealed||identityRetry)return;identityRetry=setTimeout(()=>{identityRetry=null;verifyScopedOwnerEarly()},delay)}
  async function verifyScopedOwnerEarly(){
    if(revealed||identityCheckStarted||!root.classList.contains('prism-account-booting'))return;
    const manager=window.PRISMDeviceStore,cloud=window.PRISMCloud;if(!manager?.owner)return;if(!cloud?.currentUser){retryIdentitySoon(50);return}
    identityCheckStarted=true;
    const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error('identity-check-timeout')),700));
    try{const user=await Promise.race([cloud.currentUser(),timeout]);if(user?.id===manager.owner){root.classList.remove('prism-account-booting');check()}}
    catch{}finally{identityCheckStarted=false;if(manager?.owner&&!revealed&&root.classList.contains('prism-account-booting'))retryIdentitySoon(150)}
  }
  function canonicalSurfaceReady(){
    if(root.classList.contains('prism-account-booting'))return false;
    if(document.getElementById('liftovaAuthGate'))return true;
    const home=document.getElementById('home');if(home&&!home.classList.contains('hidden'))return !!home.querySelector('.liftova-home-shell');
    return !!document.querySelector('#welcomeScreen:not(.hidden),#onboardingScreen:not(.hidden),#goalReviewScreen:not(.hidden),#setupScreen:not(.hidden),#workoutsScreen:not(.hidden),#workoutScreen:not(.hidden),#overallProgressScreen:not(.hidden),#profileScreen:not(.hidden)');
  }
  function addDetailControls(){
    const area=document.getElementById('prismWorkoutDetail');
    if(!area||area.classList.contains('hidden')||area.querySelector('.mlc-detail-insights'))return;
    const tabBar=Array.from(area.querySelectorAll('div')).find(el=>el.children.length&&Array.from(el.children).some(child=>child.tagName==='BUTTON'&&/^EXERCISES$/i.test((child.textContent||'').trim())));
    const panel=document.createElement('div');panel.className='mlc-detail-insights';panel.setAttribute('role','group');panel.setAttribute('aria-label','Workout details');
    const make=(label,handler)=>{const b=document.createElement('button');b.type='button';b.className='mlc-detail-insight';b.textContent=label;b.addEventListener('click',handler);return b};
    panel.append(
      make('HISTORY',()=>{if(typeof window.showGlobalHistory==='function')window.showGlobalHistory()}),
      make('PROGRESSION',()=>{if(typeof window.showOverallProgress==='function')window.showOverallProgress()})
    );
    if(tabBar)tabBar.insertAdjacentElement('afterend',panel);
    else{const stats=Array.from(area.children).find(el=>el.querySelector&&el.querySelector('.stat-card'));area.insertBefore(panel,stats||area.firstChild)}
  }
  function watchDetail(){
    const area=document.getElementById('prismWorkoutDetail');if(!area)return;
    new MutationObserver(addDetailControls).observe(area,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});addDetailControls();
  }
  function loadOwnerShadowTools(){for(const [src,key] of [['myliftcoach-shadow-cloud.js?v=1','shadow-cloud'],['myliftcoach-admin-shadow-dashboard-v4.js?v=1','admin-shadow']]){if(document.querySelector(`script[data-myliftcoach-${key}]`))continue;const script=document.createElement('script');script.src=src;script.async=true;script.setAttribute(`data-myliftcoach-${key}`,'true');document.head.appendChild(script)}}
  function reveal(force=false){
    if(revealed||(!force&&!canonicalSurfaceReady()))return false;revealed=true;observer?.disconnect();if(identityRetry){clearTimeout(identityRetry);identityRetry=null}
    root.classList.add('myliftcoach-ready');
    const finish=()=>{document.getElementById('myliftcoachStartupCover')?.remove();root.classList.remove('myliftcoach-starting','myliftcoach-ready');const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,400));idle(loadOwnerShadowTools,{timeout:1200})};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,70);return true;
  }
  function check(){if(revealed)return;mount();verifyScopedOwnerEarly();reveal()}
  function boot(){mount();watchDetail();observer=new MutationObserver(()=>{check();addDetailControls()});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});check();setTimeout(()=>reveal(true),900)}
  if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
  document.addEventListener('myliftcoach:home-ready',check);
})();
