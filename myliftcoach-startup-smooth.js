/* MYLIFTCOACH startup paint stabilizer. Keeps first launch frame intentional on iOS/PWA. */
(() => {
  'use strict';
  const root=document.documentElement;
  let revealed=false;

  function mount(){
    if(document.getElementById('myliftcoachStartupCover')) return;
    root.classList.add('myliftcoach-starting');
    const cover=document.createElement('div');
    cover.id='myliftcoachStartupCover';
    cover.setAttribute('aria-hidden','true');
    cover.innerHTML='<div class="mlc-startup-mark"><img src="images/myliftcoach-icon.svg?v=10" alt=""><strong>MYLIFTCOACH</strong></div>';
    (document.body||document.documentElement).appendChild(cover);
    root.classList.remove('prism-account-booting');
  }

  function reveal(){
    if(revealed) return;
    revealed=true;
    const cover=document.getElementById('myliftcoachStartupCover');
    if(!cover){root.classList.remove('myliftcoach-starting');return;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      setTimeout(()=>{
        root.classList.add('myliftcoach-ready');
        setTimeout(()=>{
          cover.remove();
          root.classList.remove('myliftcoach-starting','myliftcoach-ready');
        },170);
      },70);
    }));
  }

  function loadOwnerShadowTools(){
    for(const [src,key] of [['myliftcoach-shadow-cloud.js?v=1','shadow-cloud'],['myliftcoach-admin-shadow-dashboard-v2.js?v=1','admin-shadow']]){
      if(document.querySelector(`script[data-myliftcoach-${key}]`)) continue;
      const script=document.createElement('script');
      script.src=src;script.async=false;script.setAttribute(`data-myliftcoach-${key}`,'true');
      document.head.appendChild(script);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();

  if(document.readyState==='complete') reveal();
  else window.addEventListener('load',reveal,{once:true});

  loadOwnerShadowTools();
  setTimeout(reveal,1600);
})();