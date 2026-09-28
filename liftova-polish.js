// Final visual/branding cleanup for LIFTOVA.
// Presentation only; PRISM-prefixed storage keys/functions remain untouched for compatibility.
(() => {
  'use strict';

  const BRAND = 'LIFTOVA';
  const replaceBrand = text => typeof text === 'string' ? text.replace(/PRISM/g, BRAND).replace(/Prism/g, 'Liftova') : text;

  function updateMetadata(){
    document.title = 'LIFTOVA · Train · Track · Progress';
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute('content', BRAND);
    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', '#07050d');
    let favicon=document.querySelector('link[rel="icon"]');
    if(!favicon){ favicon=document.createElement('link'); favicon.rel='icon'; document.head.appendChild(favicon); }
    favicon.type='image/svg+xml'; favicon.href='images/liftova-icon.svg';
    let touch=document.querySelector('link[rel="apple-touch-icon"]');
    if(!touch){ touch=document.createElement('link'); touch.rel='apple-touch-icon'; document.head.appendChild(touch); }
    touch.href='images/liftova-icon.svg';
  }

  function updateHeaderBrand(){
    const header=document.querySelector('header');
    if(!header)return;
    const image=header.querySelector('img');
    if(image){ image.src='images/liftova-icon.svg'; image.alt='LIFTOVA'; image.style.objectFit='contain'; image.style.background='transparent'; }
    const wordmark=header.querySelector('.prism-wordmark');
    if(wordmark) wordmark.textContent='LIFTOVA';
  }

  function updateMenuBrand(){
    const menu=document.getElementById('sideMenu');
    if(!menu)return;
    const image=menu.querySelector('.menu-brand img');
    if(image){ image.src='images/liftova-icon.svg'; image.alt='LIFTOVA'; }
    const strong=menu.querySelector('.menu-brand strong');
    if(strong) strong.textContent='LIFTOVA';
  }

  function cleanNode(root=document.body){
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){ const next=replaceBrand(node.nodeValue); if(next!==node.nodeValue) node.nodeValue=next; }
    root.querySelectorAll?.('[aria-label],[title],[alt],[placeholder]').forEach(el=>{
      for(const attr of ['aria-label','title','alt','placeholder']){
        if(!el.hasAttribute(attr)) continue;
        const current=el.getAttribute(attr), next=replaceBrand(current);
        if(next!==current) el.setAttribute(attr,next);
      }
    });
  }

  function addStyle(){
    if(document.getElementById('liftovaFinalPolish')) return;
    const style=document.createElement('style');
    style.id='liftovaFinalPolish';
    style.textContent=`
      :root{--liftova-purple:#8c3cff;--liftova-purple-2:#b36cff;--liftova-bg:#07050d;--liftova-surface:#0e0c13;--liftova-surface-2:#121019;--liftova-border:#30243f;--liftova-muted:#958da1;--liftova-text:#f8f5ff;}
      html,body{background:#07050d!important;color:#f8f5ff!important;-webkit-tap-highlight-color:transparent;}
      body{overscroll-behavior-y:none;}
      header{background:rgba(7,5,13,.96)!important;border-bottom:1px solid rgba(154,85,255,.22)!important;box-shadow:0 7px 22px rgba(0,0,0,.24)!important;}
      header img{background:transparent!important;border:0!important;box-shadow:none!important;}
      .prism-wordmark{letter-spacing:.16em!important;background:linear-gradient(180deg,#fff,#b8b3c4);-webkit-background-clip:text;background-clip:text;color:transparent!important;}
      .prism-header-label small{color:#958e9f!important;letter-spacing:.07em!important;}
      .menu-toggle,.header-today{min-height:40px!important;background:#121019!important;color:#fff!important;border:1px solid #30243f!important;border-radius:11px!important;box-shadow:none!important;}
      .menu-toggle:active,.header-today:active{background:#1b1426!important;transform:scale(.98);}
      .prism-eyebrow{color:#a55bff!important;}

      #menuScrim{background:rgba(0,0,0,.76)!important;backdrop-filter:blur(3px)!important;}
      #sideMenu{background:radial-gradient(circle at 15% 0,rgba(133,54,255,.16),transparent 30%),linear-gradient(165deg,#100b18,#08070d 68%)!important;border-right:1px solid rgba(162,91,255,.28)!important;box-shadow:18px 0 52px rgba(0,0,0,.52)!important;}
      #sideMenu .menu-head{background:transparent!important;border-bottom-color:rgba(255,255,255,.06)!important;padding-bottom:14px!important;}
      #sideMenu .menu-brand img{background:transparent!important;border:0!important;border-radius:10px!important;filter:drop-shadow(0 0 11px rgba(151,75,255,.24))!important;}
      #sideMenu .menu-brand strong{color:#fff!important;letter-spacing:.15em!important;}
      #sideMenu .menu-brand small{color:#8f879a!important;}
      #sideMenu .drawer-section+.drawer-section{border-top-color:rgba(255,255,255,.06)!important;}
      #sideMenu .menu-group,#sideMenu .menu-group-toggle{color:#81798d!important;font-size:9px!important;letter-spacing:.09em!important;}
      #sideMenu .menu-link{min-height:45px!important;color:#dcd7e3!important;border:1px solid transparent!important;background:transparent!important;border-radius:11px!important;margin:2px 0!important;font-size:12px!important;}
      #sideMenu .menu-link .menu-icon{color:#938a9e!important;}
      #sideMenu .menu-link.active{background:rgba(126,45,239,.16)!important;border-color:rgba(164,91,255,.28)!important;color:#d2adff!important;box-shadow:none!important;}
      #sideMenu .menu-link.active .menu-icon{color:#b96fff!important;}
      #sideMenu .menu-close{background:#14101c!important;border-color:#30243f!important;color:#fff!important;box-shadow:none!important;}
      #sideMenu .menu-version{border-top-color:rgba(255,255,255,.06)!important;color:#6f6878!important;font-size:9px!important;}

      .prism-bottom-nav{padding-top:5px!important;background:rgba(7,5,13,.97)!important;border-top:1px solid rgba(154,85,255,.22)!important;box-shadow:0 -8px 26px rgba(0,0,0,.32)!important;backdrop-filter:blur(18px)!important;}
      .prism-bottom-nav button{min-height:49px!important;color:#8e8798!important;background:transparent!important;border:0!important;border-radius:12px!important;font-size:9px!important;transition:background .14s ease,color .14s ease,transform .08s ease!important;}
      .prism-bottom-nav button svg{color:currentColor!important;}
      .prism-bottom-nav button:active{transform:scale(.96)!important;}
      .prism-bottom-nav button[aria-current=page]{color:#c897ff!important;background:rgba(125,43,245,.12)!important;box-shadow:inset 0 0 0 1px rgba(160,91,255,.1)!important;}

      .container>section:not(.hidden){animation:liftovaScreenIn .14s ease-out both;}
      @keyframes liftovaScreenIn{from{opacity:.82;transform:translateY(2px)}to{opacity:1;transform:none}}
      button,input,select,textarea{font-family:inherit;}
      button{touch-action:manipulation;}
      button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:2px solid rgba(166,88,255,.55)!important;outline-offset:2px!important;}
      button:disabled{opacity:.42!important;cursor:not-allowed!important;}
      .card{box-shadow:none;}
      .back{display:inline-flex;align-items:center;min-height:38px;color:#bca2ff!important;font-size:11px!important;font-weight:760!important;}
      .empty{color:#948c9f!important;}

      /* Final consistency pass: controls, cards, dialogs and status surfaces */
      .container input:not([type=checkbox]):not([type=radio]),.container select,.container textarea{background:#100e16;color:#f8f5ff;border:1px solid #302740;border-radius:11px;box-shadow:none;}
      .container input::placeholder,.container textarea::placeholder{color:#706a78;opacity:1;}
      .container input:focus,.container select:focus,.container textarea:focus{border-color:#7146a6!important;box-shadow:0 0 0 3px rgba(140,60,255,.08)!important;}
      .container hr{border:0;border-top:1px solid rgba(255,255,255,.07);}
      .container .small,.container small{line-height:1.4;}
      .container .badge,.container [class*=badge]{box-shadow:none;}
      .container button:not(.prism-bottom-nav button):not(.menu-toggle):not(.header-today){box-shadow:none;}
      .container button:active{transform:scale(.985);}
      [role=dialog],dialog,.modal,.sheet,.prism-modal{background:#0e0c13!important;color:#f8f5ff!important;border-color:#352944!important;box-shadow:0 18px 55px rgba(0,0,0,.55)!important;}
      .toast,.prism-toast,[role=status]{border-radius:11px!important;box-shadow:0 10px 30px rgba(0,0,0,.38)!important;}
      .danger,.danger-button,.delete-button,[data-danger=true]{box-shadow:none!important;}
      .container table{border-collapse:separate;border-spacing:0;color:#eeeaf4;}
      .container th{color:#8f879a;font-size:9px;letter-spacing:.07em;text-transform:uppercase;}
      .container td,.container th{border-color:rgba(255,255,255,.07)!important;}
      .container a{color:#b98aff;}
      .container h1,.container h2,.container h3{color:#fff;}
      .container p{line-height:1.5;}
      ::selection{background:rgba(142,61,255,.38);color:#fff;}
      *{scrollbar-color:#3d2b51 #0b0910;}
      html.prism-account-booting::after{content:'Restoring your LIFTOVA account…'!important;background:#07050d url('images/liftova-splash.svg') center/cover no-repeat!important;color:transparent!important;}
      @media(max-width:430px){.container{padding-left:max(13px,env(safe-area-inset-left))!important;padding-right:max(13px,env(safe-area-inset-right))!important}.container>section:not(.hidden){max-width:100%;overflow-x:hidden}.container button{min-width:0}}
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}}
    `;
    document.head.appendChild(style);
  }

  function run(){ updateMetadata(); addStyle(); cleanNode(); updateHeaderBrand(); updateMenuBrand(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();

  let screenObserver;
  function watchScreen(id){
    screenObserver?.disconnect();
    const screen=document.getElementById(id);
    if(!screen)return;
    screenObserver=new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes){
        if(node.nodeType===Node.TEXT_NODE)node.nodeValue=replaceBrand(node.nodeValue);
        else if(node.nodeType===Node.ELEMENT_NODE)cleanNode(node);
      }
    });
    screenObserver.observe(screen,{subtree:true,childList:true});
    requestAnimationFrame(()=>cleanNode(screen));
  }
  const originalShowScreen=window.showScreen;
  if(typeof originalShowScreen==='function'&&!originalShowScreen.__liftovaBrand){
    const brandedShowScreen=function(id){ const result=originalShowScreen.apply(this,arguments); watchScreen(id); return result; };
    brandedShowScreen.__liftovaBrand=true;
    window.showScreen=brandedShowScreen;
  }
  const visibleScreen=[...document.querySelectorAll('.container > section[id],main > section[id]')].find(el=>!el.classList.contains('hidden'));
  if(visibleScreen)watchScreen(visibleScreen.id);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden){ updateHeaderBrand(); updateMenuBrand(); } });
})();
