// LIFTOVA native-feel navigation layer.
// Enhances screen transitions and back behavior without replacing existing routing.
(() => {
  'use strict';

  const TAB_ROOTS = new Set(['home','workoutsScreen','libraryScreen','overallProgressScreen','profileScreen']);
  const stack = [];
  let currentId = null;
  let navigatingBack = false;

  function visibleScreenId(){
    const el=[...document.querySelectorAll('.container > section[id], main > section[id]')]
      .find(node=>!node.classList.contains('hidden'));
    return el?.id || null;
  }

  function animateScreen(id,direction='forward'){
    const screen=document.getElementById(id);
    if(!screen || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    screen.classList.remove('liftova-native-enter','liftova-native-back');
    void screen.offsetWidth;
    screen.classList.add(direction==='back'?'liftova-native-back':'liftova-native-enter');
    setTimeout(()=>screen.classList.remove('liftova-native-enter','liftova-native-back'),230);
  }

  function rememberScroll(id){
    if(!id)return;
    const entry=stack.findLast?.(item=>item.id===id) || [...stack].reverse().find(item=>item.id===id);
    if(entry)entry.scrollY=window.scrollY;
  }

  function restoreScroll(id){
    const entry=stack.findLast?.(item=>item.id===id) || [...stack].reverse().find(item=>item.id===id);
    requestAnimationFrame(()=>window.scrollTo(0,entry?.scrollY || 0));
  }

  function installStyles(){
    if(document.getElementById('liftovaNativeNavigationStyles'))return;
    const style=document.createElement('style');
    style.id='liftovaNativeNavigationStyles';
    style.textContent=`
      html{overscroll-behavior:none;background:#07050d}
      body{min-height:100dvh;overscroll-behavior-y:none;-webkit-user-select:none;user-select:none}
      input,textarea,[contenteditable=true]{-webkit-user-select:text;user-select:text}
      .container>section{transform-origin:center center;will-change:transform,opacity}
      .container>section.liftova-native-enter{animation:liftovaNativePush .2s cubic-bezier(.22,.78,.25,1) both}
      .container>section.liftova-native-back{animation:liftovaNativePop .2s cubic-bezier(.22,.78,.25,1) both}
      @keyframes liftovaNativePush{from{opacity:.72;transform:translate3d(14px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}
      @keyframes liftovaNativePop{from{opacity:.72;transform:translate3d(-10px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}
      .prism-bottom-nav{padding-bottom:max(5px,env(safe-area-inset-bottom))!important}
      .prism-bottom-nav button,.menu-link,.back,button{cursor:default!important}
      .back{min-width:44px;min-height:44px!important;touch-action:manipulation}
      @media(prefers-reduced-motion:reduce){.container>section.liftova-native-enter,.container>section.liftova-native-back{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function wrapRouter(){
    const original=window.showScreen;
    if(typeof original!=='function' || original.__liftovaNativeNavigation)return;

    function nativeShowScreen(id){
      const previous=currentId || visibleScreenId();
      if(previous && previous!==id)rememberScroll(previous);

      if(!navigatingBack && previous && previous!==id){
        if(TAB_ROOTS.has(id)) stack.length=0;
        else if(!stack.length || stack[stack.length-1].id!==previous) stack.push({id:previous,scrollY:window.scrollY});
      }

      const result=original.apply(this,arguments);
      currentId=id;
      animateScreen(id,navigatingBack?'back':'forward');
      if(navigatingBack)restoreScroll(id); else requestAnimationFrame(()=>window.scrollTo(0,0));
      navigatingBack=false;
      return result;
    }
    nativeShowScreen.__liftovaNativeNavigation=true;
    window.showScreen=nativeShowScreen;
  }

  function goBack(){
    const previous=stack.pop();
    if(!previous || typeof window.showScreen!=='function')return false;
    navigatingBack=true;
    window.showScreen(previous.id);
    return true;
  }

  function interceptBackControls(){
    document.addEventListener('click',event=>{
      const back=event.target.closest?.('.back,[data-liftova-back]');
      if(!back || !stack.length)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      goBack();
    },true);
  }

  function syncBottomNav(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('.prism-bottom-nav button');
      if(!button)return;
      stack.length=0;
    },true);
  }

  function boot(){
    installStyles();
    currentId=visibleScreenId();
    wrapRouter();
    interceptBackControls();
    syncBottomNav();
    window.LiftovaNavigation={back:goBack,getStack:()=>stack.map(item=>item.id)};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
