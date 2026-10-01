// MYLIFTCOACH swipe UX — conservative native-feeling gestures for Progress + side menu.
(() => {
  'use strict';

  const SCREEN_ID='overallProgressScreen';
  const MIN_X=64;
  const MAX_Y=54;
  const MAX_MS=700;
  const MENU_EDGE_PX=30;

  function isInteractiveTarget(target){
    return !!target?.closest?.('button,a,input,select,textarea,label,[role="button"],[contenteditable="true"],canvas,svg,.no-swipe');
  }

  function validSwipe(start,touch){
    if(!start||!touch)return null;
    const dx=touch.clientX-start.x;
    const dy=touch.clientY-start.y;
    const elapsed=Date.now()-start.time;
    if(elapsed>MAX_MS||Math.abs(dx)<MIN_X||Math.abs(dy)>MAX_Y||Math.abs(dx)<Math.abs(dy)*1.25)return null;
    return {dx,dy,elapsed};
  }

  function progressButtons(screen){
    return [...screen.querySelectorAll('.prism-segments button')].filter(button=>!button.disabled);
  }

  function activeIndex(buttons){
    const index=buttons.findIndex(button=>button.classList.contains('active')||button.getAttribute('aria-selected')==='true');
    return index>=0?index:0;
  }

  function moveProgress(screen,direction){
    const buttons=progressButtons(screen);
    if(buttons.length<2)return false;
    const current=activeIndex(buttons);
    const next=current+direction;
    if(next<0||next>=buttons.length)return false;
    buttons[next].click();
    buttons[next].focus?.({preventScroll:true});
    return true;
  }

  function bindProgress(screen){
    if(!screen||screen.dataset.myliftcoachSwipe==='1')return;
    screen.dataset.myliftcoachSwipe='1';
    let start=null;

    screen.addEventListener('touchstart',event=>{
      if(event.touches.length!==1||isInteractiveTarget(event.target)){start=null;return;}
      const touch=event.touches[0];
      start={x:touch.clientX,y:touch.clientY,time:Date.now()};
    },{passive:true});

    screen.addEventListener('touchend',event=>{
      if(!start||event.changedTouches.length!==1){start=null;return;}
      const swipe=validSwipe(start,event.changedTouches[0]);
      start=null;
      if(!swipe)return;
      moveProgress(screen,swipe.dx<0?1:-1);
    },{passive:true});

    screen.addEventListener('touchcancel',()=>{start=null;},{passive:true});
  }

  function bindMenu(){
    const menu=document.getElementById('sideMenu');
    if(!menu||menu.dataset.myliftcoachMenuSwipe==='1')return;
    menu.dataset.myliftcoachMenuSwipe='1';
    let menuStart=null;
    let edgeStart=null;

    // Swipe left on blank/non-interactive drawer space to dismiss it.
    menu.addEventListener('touchstart',event=>{
      if(event.touches.length!==1||isInteractiveTarget(event.target)){menuStart=null;return;}
      const touch=event.touches[0];
      menuStart={x:touch.clientX,y:touch.clientY,time:Date.now()};
    },{passive:true});
    menu.addEventListener('touchend',event=>{
      if(!menuStart||event.changedTouches.length!==1){menuStart=null;return;}
      const swipe=validSwipe(menuStart,event.changedTouches[0]);
      menuStart=null;
      if(swipe?.dx<0&&menu.classList.contains('open')&&typeof window.closeMenu==='function')window.closeMenu();
    },{passive:true});
    menu.addEventListener('touchcancel',()=>{menuStart=null;},{passive:true});

    // Swipe right from the extreme left edge to reveal the drawer.
    document.addEventListener('touchstart',event=>{
      if(menu.classList.contains('open')||event.touches.length!==1||isInteractiveTarget(event.target)){edgeStart=null;return;}
      const touch=event.touches[0];
      if(touch.clientX>MENU_EDGE_PX){edgeStart=null;return;}
      edgeStart={x:touch.clientX,y:touch.clientY,time:Date.now()};
    },{passive:true});
    document.addEventListener('touchend',event=>{
      if(!edgeStart||event.changedTouches.length!==1){edgeStart=null;return;}
      const swipe=validSwipe(edgeStart,event.changedTouches[0]);
      edgeStart=null;
      if(swipe?.dx>0&&!menu.classList.contains('open')&&typeof window.openMenu==='function')window.openMenu();
    },{passive:true});
    document.addEventListener('touchcancel',()=>{edgeStart=null;},{passive:true});
  }

  function boot(){
    bindProgress(document.getElementById(SCREEN_ID));
    bindMenu();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  const observer=new MutationObserver(boot);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
})();
