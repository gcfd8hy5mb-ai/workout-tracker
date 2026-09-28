// LIFTOVA final native-feel touch interaction layer.
(() => {
  'use strict';
  const interactive='button,.menu-link,.back,[role=button],a[href],.exercise-card,.workout-card';

  function haptic(){
    try{ if(navigator.vibrate) navigator.vibrate(7); }catch(_){}
  }

  function installPressStates(){
    document.addEventListener('pointerdown',event=>{
      const el=event.target.closest?.(interactive);
      if(!el || el.matches(':disabled,[aria-disabled=true]'))return;
      el.classList.add('liftova-pressed');
    },{passive:true});
    const clear=event=>event.target.closest?.(interactive)?.classList.remove('liftova-pressed');
    document.addEventListener('pointerup',clear,{passive:true});
    document.addEventListener('pointercancel',clear,{passive:true});
    document.addEventListener('pointerleave',clear,{passive:true,capture:true});
    document.addEventListener('click',event=>{
      const el=event.target.closest?.(interactive);
      if(el && !el.matches(':disabled,[aria-disabled=true]'))haptic();
    },{passive:true});
  }

  function preventDoubleTapZoom(){
    let last=0;
    document.addEventListener('touchend',event=>{
      if(event.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
      const now=Date.now();
      if(now-last<280)event.preventDefault();
      last=now;
    },{passive:false});
  }

  function installStyles(){
    const style=document.createElement('style');
    style.id='liftovaNativeInteractionStyles';
    style.textContent=`
      button,.menu-link,.back,[role=button],a[href]{touch-action:manipulation}
      .liftova-pressed{transform:scale(.975)!important;opacity:.86!important;transition:transform .06s ease,opacity .06s ease!important}
      button,.menu-link,.back,[role=button],.exercise-card,.workout-card{min-touch-target-size:44px}
      button:not(:disabled),.menu-link,.back,[role=button],a[href]{-webkit-tap-highlight-color:transparent}
      button:disabled,[aria-disabled=true]{pointer-events:none}
      @media(hover:none) and (pointer:coarse){button,.menu-link,.back,[role=button]{min-height:44px}.exercise-card,.workout-card{touch-action:manipulation}}
      @media(prefers-reduced-motion:reduce){.liftova-pressed{transition:none!important;transform:none!important}}
    `;
    document.head.appendChild(style);
  }

  function boot(){installStyles();installPressStates();preventDoubleTapZoom();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
