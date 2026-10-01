// Final MYLIFTCOACH visual cleanup: remove remaining PRISM-era blue styling and stale logo artwork.
(() => {
  'use strict';

  const ICON='images/myliftcoach-icon.svg?v=21';

  const style=document.createElement('style');
  style.id='myliftcoachVisualCleanup';
  style.textContent=`
    /* Navigation drawer: replace remaining PRISM blue palette with MYLIFTCOACH black/purple. */
    #sideMenu{background:linear-gradient(160deg,#100918,#08060d 68%)!important;border-right:1px solid #39234b!important}
    #sideMenu .menu-head{background:#100918!important;border-bottom-color:#39234b!important}
    #sideMenu .menu-link .menu-icon{color:#b8a7c9!important}
    #sideMenu .menu-link.active{background:#21132f!important;border-color:#5a2c80!important;color:#c77dff!important}
    #sideMenu .menu-link.active .menu-icon{color:#c77dff!important}
    #sideMenu .menu-link:active,#sideMenu .menu-close:active{background:#2d1640!important}
    #sideMenu .menu-version{color:#9587a5!important;border-top-color:#39234b!important}

    /* Pro surfaces: remove the remaining navy/blue PRISM presentation. */
    .prism-pro-feature-detail{border-color:#5a3473!important;background:#17101f!important;color:#f5effb!important}
    .prism-pro-feature-detail small{color:#b7a8c4!important}
    .prism-pro-page .pro-back{color:#caa7f2!important}
    .prism-pro-hero{border-color:#5b3478!important;background:radial-gradient(circle at 86% 8%,#2c1242 0%,#171020 38%,#09070d 77%)!important;box-shadow:0 12px 35px rgba(39,12,60,.34)!important}
    .prism-pro-hero p{color:#c7bdcf!important}
    .prism-pro-benefit{border-color:#412951!important;background:#130d19!important;box-shadow:0 7px 18px rgba(20,7,29,.32)!important}
    .prism-pro-benefit .pro-symbol{border-color:#6f3c93!important;color:#d08cff!important}
    .prism-pro-benefit p{color:#c3b8cb!important}

    /* Match Pro CTA buttons to the app's existing purple controls instead of bright blue. */
    .prism-pro-page button:not(.pro-back):not(.prism-pro-close),
    .prism-pro-overlay button:not(.prism-pro-close){
      background:linear-gradient(135deg,#7023ef,#9d46ff)!important;
      border:1px solid #a867ff!important;
      color:#fff!important;
      box-shadow:none!important;
    }
    .prism-pro-page button:not(.pro-back):not(.prism-pro-close):active,
    .prism-pro-overlay button:not(.prism-pro-close):active{background:#6320ad!important}

    /* Home hero uses the canonical MYLIFTCOACH icon instead of the old PRISM artwork. */
    .lh-hero-mark{background-image:url('${ICON}')!important;background-repeat:no-repeat!important;background-position:center!important;background-size:66px 66px!important}
    .lh-hero-mark img{opacity:0!important}
  `;
  document.head.appendChild(style);

  function replaceLegacyLogo(){
    document.querySelectorAll('.lh-hero-mark img,.menu-brand img,.myliftcoach-pro-mark').forEach(img=>{
      if(img.getAttribute('src')!==ICON)img.setAttribute('src',ICON);
      img.setAttribute('alt','MYLIFTCOACH');
    });
  }

  replaceLegacyLogo();
  const observer=new MutationObserver(()=>replaceLegacyLogo());
  if(document.body)observer.observe(document.body,{subtree:true,childList:true});
  else document.addEventListener('DOMContentLoaded',()=>{
    replaceLegacyLogo();
    observer.observe(document.body,{subtree:true,childList:true});
  },{once:true});
})();
