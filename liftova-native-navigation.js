// MYLIFTCOACH native-feel navigation layer.
// Keeps routing behavior intact while making drill-down/back flow feel app-like.
(() => {
  'use strict';

  const TAB_ROOTS=new Set(['home','workoutsScreen','libraryScreen','overallProgressScreen','profileScreen']);
  const stack=[];
  const scrollByScreen=new Map();
  const SWIPE_EDGE_PX=42;
  const SWIPE_MIN_X=72;
  const SWIPE_MAX_Y=58;
  const SWIPE_MAX_MS=700;
  let currentId=null;
  let navigatingBack=false;
  let rootNavigationPending=false;
  let edgeStart=null;

  function visibleScreenId(){
    const el=[...document.querySelectorAll('.container > section[id], main > section[id]')]
      .find(node=>!node.classList.contains('hidden'));
    return el?.id||null;
  }

  function isInteractiveTarget(target){
    return !!target?.closest?.('button,a,input,select,textarea,label,[role="button"],[contenteditable="true"],canvas,svg,.no-swipe');
  }

  function canGoBack(){return stack.length>0;}

  function clampHorizontalScroll(){
    const scrolling=document.scrollingElement;
    if(scrolling&&scrolling.scrollLeft!==0)scrolling.scrollLeft=0;
    if(document.documentElement.scrollLeft!==0)document.documentElement.scrollLeft=0;
    if(document.body?.scrollLeft)document.body.scrollLeft=0;
  }

  function closeTransientUI(){
    const menu=document.getElementById('sideMenu');
    if(menu?.classList.contains('open')&&typeof window.closeMenu==='function')window.closeMenu();
  }

  function animateScreen(id,direction='forward'){
    const screen=document.getElementById(id);
    if(!screen||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    screen.classList.remove('myliftcoach-native-enter','myliftcoach-native-back');
    void screen.offsetWidth;
    screen.classList.add(direction==='back'?'myliftcoach-native-back':'myliftcoach-native-enter');
    setTimeout(()=>screen.classList.remove('myliftcoach-native-enter','myliftcoach-native-back'),180);
  }

  function rememberScroll(id){
    if(id)scrollByScreen.set(id,window.scrollY||0);
  }

  function restoreScroll(id){
    const y=scrollByScreen.get(id)||0;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{clampHorizontalScroll();window.scrollTo({top:y,left:0,behavior:'auto'});}));
  }

  function installStyles(){
    if(document.getElementById('myliftcoachNativeNavigationStyles'))return;
    document.getElementById('liftovaNativeNavigationStyles')?.remove();
    const style=document.createElement('style');
    style.id='myliftcoachNativeNavigationStyles';
    style.textContent=`
      html{overscroll-behavior:none;background:#07050d;overflow-x:hidden!important}
      body{min-height:100dvh;overscroll-behavior-y:none;overflow-x:hidden!important;-webkit-user-select:none;user-select:none}
      input,textarea,[contenteditable=true]{-webkit-user-select:text;user-select:text}
      .container>section{transform-origin:center center;will-change:opacity}
      .container>section.myliftcoach-native-enter{animation:myliftcoachNativePush .15s ease-out both}
      .container>section.myliftcoach-native-back{animation:myliftcoachNativePop .15s ease-out both}
      @keyframes myliftcoachNativePush{from{opacity:.82}to{opacity:1}}
      @keyframes myliftcoachNativePop{from{opacity:.86}to{opacity:1}}
      .prism-bottom-nav{padding-bottom:max(5px,env(safe-area-inset-bottom))!important}
      .prism-bottom-nav button,.menu-link,.back,button{cursor:default!important}
      .back,[data-liftova-back],[data-myliftcoach-back]{min-width:44px;min-height:44px!important;touch-action:manipulation}
      @media(max-width:430px){body.liftova-home-visible .lh-hero{margin-left:-13px!important;margin-right:-13px!important}}
      @media(prefers-reduced-motion:reduce){.container>section.myliftcoach-native-enter,.container>section.myliftcoach-native-back{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function wrapRouter(){
    const original=window.showScreen;
    if(typeof original!=='function'||original.__myliftcoachNativeNavigation)return;

    function nativeShowScreen(id){
      const previous=currentId||visibleScreenId();
      const isRootNavigation=rootNavigationPending||TAB_ROOTS.has(id);
      rootNavigationPending=false;
      if(previous&&previous!==id)rememberScroll(previous);

      if(!navigatingBack&&previous&&previous!==id){
        if(isRootNavigation)stack.length=0;
        else if(!stack.length||stack[stack.length-1].id!==previous)stack.push({id:previous});
      }

      closeTransientUI();
      clampHorizontalScroll();
      const result=original.apply(this,arguments);
      currentId=id;
      animateScreen(id,navigatingBack?'back':'forward');
      if(navigatingBack)restoreScroll(id);
      else requestAnimationFrame(()=>{clampHorizontalScroll();window.scrollTo({top:0,left:0,behavior:'auto'});});
      navigatingBack=false;
      return result;
    }
    nativeShowScreen.__myliftcoachNativeNavigation=true;
    window.showScreen=nativeShowScreen;
  }

  function goBack(){
    const previous=stack.pop();
    if(!previous||typeof window.showScreen!=='function')return false;
    rememberScroll(currentId||visibleScreenId());
    navigatingBack=true;
    window.showScreen(previous.id);
    return true;
  }

  function interceptBackControls(){
    document.addEventListener('click',event=>{
      const back=event.target.closest?.('.back,[data-liftova-back],[data-myliftcoach-back]');
      if(!back||!canGoBack())return;
      event.preventDefault();
      event.stopImmediatePropagation();
      goBack();
    },true);
  }

  function syncRootNavigation(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('.prism-bottom-nav button');
      if(!button)return;
      rememberScroll(currentId||visibleScreenId());
      stack.length=0;
      rootNavigationPending=true;
      setTimeout(()=>{rootNavigationPending=false;},0);
    },true);
  }

  function installSwipeBack(){
    document.addEventListener('touchstart',event=>{
      if(!canGoBack()||event.touches.length!==1||isInteractiveTarget(event.target)){edgeStart=null;return;}
      const touch=event.touches[0];
      if(touch.clientX>SWIPE_EDGE_PX){edgeStart=null;return;}
      edgeStart={x:touch.clientX,y:touch.clientY,time:Date.now()};
    },{passive:true});
    document.addEventListener('touchend',event=>{
      if(!edgeStart||event.changedTouches.length!==1){edgeStart=null;return;}
      const touch=event.changedTouches[0];
      const dx=touch.clientX-edgeStart.x;
      const dy=touch.clientY-edgeStart.y;
      const elapsed=Date.now()-edgeStart.time;
      edgeStart=null;
      if(elapsed>SWIPE_MAX_MS||dx<SWIPE_MIN_X||Math.abs(dy)>SWIPE_MAX_Y||dx<Math.abs(dy)*1.3)return;
      goBack();
    },{passive:true});
    document.addEventListener('touchcancel',()=>{edgeStart=null;},{passive:true});
  }

  function installKeyboardBack(){
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      const menu=document.getElementById('sideMenu');
      if(menu?.classList.contains('open')&&typeof window.closeMenu==='function'){window.closeMenu();return;}
      if(canGoBack())goBack();
    });
  }

  function boot(){
    installStyles();
    clampHorizontalScroll();
    currentId=visibleScreenId();
    wrapRouter();
    interceptBackControls();
    syncRootNavigation();
    installSwipeBack();
    installKeyboardBack();
    window.addEventListener('resize',clampHorizontalScroll,{passive:true});
    window.addEventListener('orientationchange',clampHorizontalScroll,{passive:true});
    window.LiftovaNavigation=window.MYLIFTCOACHNavigation={
      back:goBack,
      canGoBack,
      getCurrent:()=>currentId||visibleScreenId(),
      getStack:()=>stack.map(item=>item.id),
      getScroll:id=>scrollByScreen.get(id)||0
    };
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
