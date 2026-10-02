/* MYLIFTCOACH startup paint stabilizer. Keeps first launch frame intentional on iOS/PWA. */
(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('myliftcoach-starting');
  let revealed=false,observer=null,identityCheckStarted=false,identityRetry=null,detailRendererInstalled=false;

  function mount(){
    if(revealed||document.getElementById('myliftcoachStartupCover')) return;
    const cover=document.createElement('div');
    cover.id='myliftcoachStartupCover';cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=21" alt=""><strong>MYLIFTCOACH</strong></div>';
    (document.body||document.documentElement).appendChild(cover);
  }
  function retryIdentitySoon(delay=250){if(revealed||identityRetry)return;identityRetry=setTimeout(()=>{identityRetry=null;verifyScopedOwnerEarly();},delay)}
  async function verifyScopedOwnerEarly(){
    if(revealed||identityCheckStarted||!root.classList.contains('prism-account-booting'))return;
    const manager=window.PRISMDeviceStore,cloud=window.PRISMCloud;if(!manager?.owner)return;if(!cloud?.currentUser){retryIdentitySoon(75);return}
    identityCheckStarted=true;let timedOut=false;const timeout=new Promise((_,reject)=>setTimeout(()=>{timedOut=true;reject(new Error('identity-check-timeout'))},1800));
    try{const user=await Promise.race([cloud.currentUser(),timeout]);if(user?.id===manager.owner){root.classList.remove('prism-account-booting');check();return}}
    catch{}finally{identityCheckStarted=false;if(manager?.owner&&!revealed&&root.classList.contains('prism-account-booting'))retryIdentitySoon(timedOut?250:500)}
  }
  function canonicalSurfaceReady(){
    if(root.classList.contains('prism-account-booting'))return false;if(document.getElementById('liftovaAuthGate'))return true;
    const home=document.getElementById('home');if(home&&!home.classList.contains('hidden'))return !!home.querySelector('.liftova-home-shell');
    return !!document.querySelector('#welcomeScreen:not(.hidden),#onboardingScreen:not(.hidden),#goalReviewScreen:not(.hidden),#setupScreen:not(.hidden),#workoutsScreen:not(.hidden),#workoutScreen:not(.hidden),#overallProgressScreen:not(.hidden),#profileScreen:not(.hidden)');
  }
  function installWorkoutDetailRenderer(){
    if(detailRendererInstalled||typeof window.showPrismWorkoutDetail!=='function')return false;
    const base=window.showPrismWorkoutDetail;
    window.showPrismWorkoutDetail=function(item){
      base(item);const area=document.getElementById('prismWorkoutDetail');if(!area||area.querySelector('.mlc-detail-insights'))return;
      const exerciseHeading=Array.from(area.children).find(node=>node.tagName==='H3'&&node.textContent.trim()==='Exercises');
      const panel=document.createElement('div');panel.className='mlc-detail-insights';
      const history=document.createElement('button');history.type='button';history.className='mlc-detail-insight';history.innerHTML='<span><strong>Workout History</strong><small>Review completed sessions and logged sets</small></span><b aria-hidden="true">›</b>';history.onclick=()=>{if(typeof window.showGlobalHistory==='function')window.showGlobalHistory()};
      const progress=document.createElement('button');progress.type='button';progress.className='mlc-detail-insight';progress.innerHTML='<span><strong>Progression</strong><small>See strength, volume, and training progress</small></span><b aria-hidden="true">›</b>';progress.onclick=()=>{if(typeof window.showOverallProgress==='function')window.showOverallProgress()};
      panel.append(history,progress);area.insertBefore(panel,exerciseHeading||area.firstChild);
    };
    detailRendererInstalled=true;return true;
  }
  function ensureRenderer(){if(installWorkoutDetailRenderer())return;if(!detailRendererInstalled)setTimeout(ensureRenderer,50)}
  function loadOwnerShadowTools(){for(const [src,key] of [['myliftcoach-shadow-cloud.js?v=1','shadow-cloud'],['myliftcoach-admin-shadow-dashboard-v4.js?v=1','admin-shadow']]){if(document.querySelector(`script[data-myliftcoach-${key}]`))continue;const script=document.createElement('script');script.src=src;script.async=true;script.setAttribute(`data-myliftcoach-${key}`,'true');document.head.appendChild(script)}}
  function reveal(){
    if(revealed||!canonicalSurfaceReady())return false;revealed=true;observer?.disconnect();if(identityRetry){clearTimeout(identityRetry);identityRetry=null}installWorkoutDetailRenderer();root.classList.add('myliftcoach-ready');
    const finish=()=>{document.getElementById('myliftcoachStartupCover')?.remove();root.classList.remove('myliftcoach-starting','myliftcoach-ready');const idle=window.requestIdleCallback||((fn)=>setTimeout(fn,600));idle(loadOwnerShadowTools,{timeout:1800})};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,110);return true;
  }
  function check(){if(revealed)return;mount();verifyScopedOwnerEarly();installWorkoutDetailRenderer();reveal()}
  ensureRenderer();if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  const startObserver=()=>{if(observer||revealed)return;observer=new MutationObserver(check);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});check()};
  if(document.documentElement)startObserver();else document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  document.addEventListener('myliftcoach:home-ready',check);document.addEventListener('DOMContentLoaded',check,{once:true});setTimeout(check,2500);
})();
