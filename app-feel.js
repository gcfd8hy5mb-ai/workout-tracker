/* LIFTOVA App Feel V1 — UI shell only. Do not read/write workout, Coach, auth, or persistence state. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  root.classList.toggle('liftova-standalone',standalone);

  // Keep viewport sizing stable as iOS browser chrome/keyboard changes.
  const syncViewport=()=>{
    const vv=window.visualViewport;
    root.style.setProperty('--liftova-vh',`${(vv?.height||window.innerHeight)*.01}px`);
    root.style.setProperty('--liftova-keyboard-offset',`${Math.max(0,window.innerHeight-(vv?.height||window.innerHeight)-(vv?.offsetTop||0))}px`);
  };
  syncViewport();
  window.visualViewport?.addEventListener('resize',syncViewport,{passive:true});
  window.visualViewport?.addEventListener('scroll',syncViewport,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(syncViewport,80),{passive:true});

  // Avoid accidental double-tap zoom on app controls while leaving content/input gestures alone.
  let lastTap=0;
  document.addEventListener('touchend',event=>{
    const control=event.target.closest?.('button,[role="button"],a,.day-button,.action-button');
    if(!control)return;
    const now=Date.now();
    if(now-lastTap<280)event.preventDefault();
    lastTap=now;
  },{passive:false});

  // Add semantic busy styling whenever existing code uses aria-busy.
  const observer=new MutationObserver(records=>{
    for(const record of records){
      const el=record.target;
      if(el instanceof HTMLElement&&record.attributeName==='aria-busy')el.classList.toggle('liftova-busy',el.getAttribute('aria-busy')==='true');
    }
  });
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['aria-busy']});
})();
