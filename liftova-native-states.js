// LIFTOVA native-feel app states: connectivity, busy feedback and background resume.
(() => {
  'use strict';
  let banner;
  let online = navigator.onLine;

  function ensureBanner(){
    if(banner)return banner;
    banner=document.createElement('div');
    banner.className='liftova-status-banner';
    banner.setAttribute('role','status');
    banner.setAttribute('aria-live','polite');
    document.body.appendChild(banner);
    return banner;
  }

  function showStatus(message,type='info',timeout=2200){
    const el=ensureBanner();
    el.textContent=message;
    el.dataset.type=type;
    el.classList.add('show');
    clearTimeout(showStatus.timer);
    if(timeout)showStatus.timer=setTimeout(()=>el.classList.remove('show'),timeout);
  }

  function setConnectivity(){
    const now=navigator.onLine;
    document.documentElement.classList.toggle('liftova-offline',!now);
    if(now!==online){
      showStatus(now?'Back online':'You’re offline — saved changes will sync when connection returns',now?'success':'offline',now?1800:0);
      online=now;
    } else if(!now) showStatus('You’re offline — saved changes will sync when connection returns','offline',0);
  }

  function installBusyFeedback(){
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('button');
      if(!button || button.disabled || button.dataset.liftovaBusy==='true')return;
      if(!/save|sign in|sign up|create|finish|complete|update|upload/i.test(button.textContent||''))return;
      button.dataset.liftovaBusy='true';
      button.classList.add('liftova-busy');
      setTimeout(()=>{button.dataset.liftovaBusy='false';button.classList.remove('liftova-busy')},900);
    },true);
  }

  function installResumeBehavior(){
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)return;
      setConnectivity();
      document.documentElement.classList.add('liftova-resumed');
      requestAnimationFrame(()=>setTimeout(()=>document.documentElement.classList.remove('liftova-resumed'),160));
    });
  }

  function installStyles(){
    const style=document.createElement('style');
    style.id='liftovaNativeStatesStyles';
    style.textContent=`
      .liftova-status-banner{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));z-index:10000;max-width:calc(100vw - 28px);transform:translate(-50%,-140%);opacity:0;padding:10px 14px;border-radius:12px;background:#15111b;color:#f7f2ff;border:1px solid #3b2b4d;box-shadow:0 12px 34px rgba(0,0,0,.42);font-size:11px;font-weight:720;line-height:1.35;text-align:center;transition:transform .18s ease,opacity .18s ease;pointer-events:none}
      .liftova-status-banner.show{transform:translate(-50%,0);opacity:1}
      .liftova-status-banner[data-type=success]{border-color:#286548;background:#10251b;color:#c8f2da}
      .liftova-status-banner[data-type=offline]{border-color:#6a4b2c;background:#24190e;color:#f1d2a8}
      html.liftova-offline .prism-header-label small::after{content:' · OFFLINE';color:#d3a86f}
      button.liftova-busy{pointer-events:none;opacity:.72!important;position:relative}
      button.liftova-busy::after{content:'';display:inline-block;width:11px;height:11px;margin-left:7px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:-2px;animation:liftovaSpin .65s linear infinite}
      @keyframes liftovaSpin{to{transform:rotate(360deg)}}
      html.liftova-resumed .container>section:not(.hidden){animation:liftovaResume .14s ease-out}
      @keyframes liftovaResume{from{opacity:.9}to{opacity:1}}
      @media(prefers-reduced-motion:reduce){.liftova-status-banner{transition:none}.liftova-busy::after{animation-duration:1.2s!important}html.liftova-resumed .container>section:not(.hidden){animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function boot(){
    installStyles();
    ensureBanner();
    setConnectivity();
    installBusyFeedback();
    installResumeBehavior();
    addEventListener('online',setConnectivity);
    addEventListener('offline',setConnectivity);
    window.LiftovaStatus={show:showStatus};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
