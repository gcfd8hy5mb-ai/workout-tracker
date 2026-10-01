// MYLIFTCOACH swipe UX — conservative native-feeling gestures for Progress only.
(() => {
  'use strict';

  const SCREEN_ID='overallProgressScreen';
  const MIN_X=64;
  const MAX_Y=54;
  const MAX_MS=700;

  function isInteractiveTarget(target){
    return !!target?.closest?.('button,a,input,select,textarea,label,[role="button"],[contenteditable="true"],canvas,svg,.no-swipe');
  }

  function progressButtons(screen){
    return [...screen.querySelectorAll('.prism-segments button')].filter(button=>!button.disabled);
  }

  function activeIndex(buttons){
    const index=buttons.findIndex(button=>button.classList.contains('active')||button.getAttribute('aria-selected')==='true');
    return index>=0?index:0;
  }

  function move(screen,direction){
    const buttons=progressButtons(screen);
    if(buttons.length<2)return false;
    const current=activeIndex(buttons);
    const next=current+direction;
    if(next<0||next>=buttons.length)return false;
    buttons[next].click();
    buttons[next].focus?.({preventScroll:true});
    return true;
  }

  function bind(screen){
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
      const touch=event.changedTouches[0];
      const dx=touch.clientX-start.x;
      const dy=touch.clientY-start.y;
      const elapsed=Date.now()-start.time;
      start=null;
      if(elapsed>MAX_MS||Math.abs(dx)<MIN_X||Math.abs(dy)>MAX_Y||Math.abs(dx)<Math.abs(dy)*1.25)return;
      move(screen,dx<0?1:-1);
    },{passive:true});

    screen.addEventListener('touchcancel',()=>{start=null;},{passive:true});
  }

  function boot(){bind(document.getElementById(SCREEN_ID));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  const observer=new MutationObserver(boot);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
})();
