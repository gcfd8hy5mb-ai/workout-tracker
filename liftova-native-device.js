// LIFTOVA installed-app and device behavior layer.
(() => {
  'use strict';
  const standalone=matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;

  function markMode(){
    document.documentElement.classList.toggle('liftova-standalone',standalone);
    document.documentElement.classList.toggle('liftova-browser',!standalone);
  }

  function preventStandaloneLinkEscape(){
    if(!standalone)return;
    document.addEventListener('click',event=>{
      const link=event.target.closest?.('a[href]');
      if(!link || link.target==='_blank' || link.hasAttribute('download'))return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin)return;
      if(url.pathname.startsWith('/workout-tracker/')){
        event.preventDefault();
        location.assign(url.href);
      }
    });
  }

  function preventGestureZoom(){
    document.addEventListener('gesturestart',event=>event.preventDefault(),{passive:false});
  }

  function trackViewport(){
    const viewport=visualViewport;
    const apply=()=>{
      const height=viewport?.height || innerHeight;
      const offset=viewport?.offsetTop || 0;
      document.documentElement.style.setProperty('--liftova-vh',`${height}px`);
      document.documentElement.style.setProperty('--liftova-vtop',`${offset}px`);
      const keyboardOpen=viewport && innerHeight-height>120;
      document.documentElement.classList.toggle('liftova-visual-keyboard',!!keyboardOpen);
    };
    apply();
    viewport?.addEventListener('resize',apply,{passive:true});
    viewport?.addEventListener('scroll',apply,{passive:true});
    addEventListener('orientationchange',()=>setTimeout(apply,120),{passive:true});
  }

  function installStyles(){
    const style=document.createElement('style');
    style.id='liftovaNativeDeviceStyles';
    style.textContent=`
      :root{--liftova-vh:100dvh;--liftova-vtop:0px}
      html,body{min-height:100%;background:#07050d}
      html.liftova-standalone body{min-height:var(--liftova-vh);padding-top:env(safe-area-inset-top);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
      html.liftova-standalone header{padding-top:max(4px,env(safe-area-inset-top))}
      html.liftova-standalone .prism-bottom-nav{padding-bottom:max(7px,env(safe-area-inset-bottom))!important}
      html.liftova-standalone .container{padding-bottom:max(76px,calc(64px + env(safe-area-inset-bottom)))!important}
      html.liftova-visual-keyboard .prism-bottom-nav{visibility:hidden!important;pointer-events:none!important}
      html.liftova-standalone{-webkit-touch-callout:none}
      html.liftova-standalone img{-webkit-user-drag:none}
      @media(display-mode:standalone){a,button{-webkit-tap-highlight-color:transparent}}
    `;
    document.head.appendChild(style);
  }

  function boot(){markMode();installStyles();preventStandaloneLinkEscape();preventGestureZoom();trackViewport();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
