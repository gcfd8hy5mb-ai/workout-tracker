// MYLIFTCOACH menu-return swipe — swipe right from the left edge to reopen the side menu
// when the current page was entered from that menu. Deeper detail pages keep native swipe-back.
(() => {
  'use strict';

  const EDGE_PX=42;
  const MIN_X=72;
  const MAX_Y=58;
  const MAX_MS=700;
  let menuOrigin=false;
  let pendingMenuNavigation=false;
  let edgeStart=null;

  function menu(){return document.getElementById('sideMenu');}
  function isInteractiveTarget(target){
    return !!target?.closest?.('button,a,input,select,textarea,label,[role="button"],[contenteditable="true"],canvas,svg,.no-swipe');
  }
  function isMenuCloseControl(target){
    const control=target?.closest?.('button,a,[role="button"]');
    if(!control)return false;
    const label=String(control.getAttribute?.('aria-label')||'').toLowerCase();
    return control.matches?.('#closeMenu,.menu-close,.drawer-close,[data-close-menu],[data-myliftcoach-close-menu]')||label.includes('close');
  }
  function isMenuAction(target){
    const drawer=menu();
    const control=target?.closest?.('button,a,[role="button"],.menu-link');
    return !!(drawer&&control&&drawer.contains(control)&&!isMenuCloseControl(control));
  }
  function validSwipe(start,touch){
    if(!start||!touch)return false;
    const dx=touch.clientX-start.x;
    const dy=touch.clientY-start.y;
    const elapsed=Date.now()-start.time;
    return elapsed<=MAX_MS&&dx>=MIN_X&&Math.abs(dy)<=MAX_Y&&dx>=Math.abs(dy)*1.3;
  }

  function wrapRouter(){
    const original=window.showScreen;
    if(typeof original!=='function'||original.__myliftcoachMenuReturnSwipe)return;
    const wrapped=function(id){
      const fromMenu=pendingMenuNavigation;
      pendingMenuNavigation=false;
      const result=original.apply(this,arguments);
      menuOrigin=fromMenu;
      return result;
    };
    wrapped.__myliftcoachMenuReturnSwipe=true;
    wrapped.__myliftcoachMenuReturnSwipeBase=original;
    window.showScreen=wrapped;
  }

  function bindMenuOrigin(){
    document.addEventListener('click',event=>{
      if(isMenuAction(event.target)){
        pendingMenuNavigation=true;
        return;
      }
      if(event.target?.closest?.('.prism-bottom-nav button')){
        pendingMenuNavigation=false;
        menuOrigin=false;
      }
    },true);
  }

  function bindGesture(){
    document.addEventListener('touchstart',event=>{
      const drawer=menu();
      if(!menuOrigin||drawer?.classList.contains('open')||event.touches.length!==1||isInteractiveTarget(event.target)){
        edgeStart=null;
        return;
      }
      const touch=event.touches[0];
      if(touch.clientX>EDGE_PX){edgeStart=null;return;}
      edgeStart={x:touch.clientX,y:touch.clientY,time:Date.now()};
    },{capture:true,passive:true});

    document.addEventListener('touchend',event=>{
      if(!edgeStart||event.changedTouches.length!==1){edgeStart=null;return;}
      const shouldOpen=validSwipe(edgeStart,event.changedTouches[0]);
      edgeStart=null;
      if(!shouldOpen)return;
      const drawer=menu();
      if(drawer?.classList.contains('open')||typeof window.openMenu!=='function')return;
      event.stopImmediatePropagation();
      window.openMenu();
    },{capture:true,passive:true});

    document.addEventListener('touchcancel',()=>{edgeStart=null;},{capture:true,passive:true});
  }

  function boot(){wrapRouter();bindMenuOrigin();bindGesture();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
