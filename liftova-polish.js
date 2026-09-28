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
    if(image){
      image.src='images/liftova-icon.svg';
      image.alt='LIFTOVA';
      image.style.objectFit='contain';
      image.style.background='transparent';
    }
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
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      const next=replaceBrand(node.nodeValue);
      if(next!==node.nodeValue) node.nodeValue=next;
    }
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
      :root{--liftova-purple:#8c3cff;--liftova-purple-2:#b36cff;--liftova-bg:#07050d;}
      html,body{background:#07050d!important;}
      header{background:rgba(7,5,13,.96)!important;border-bottom:1px solid rgba(154,85,255,.28)!important;box-shadow:0 10px 32px rgba(0,0,0,.28)!important;}
      header img{background:transparent!important;border:0!important;box-shadow:none!important;}
      .prism-wordmark{letter-spacing:.16em!important;background:linear-gradient(180deg,#fff,#b8b3c4);-webkit-background-clip:text;background-clip:text;color:transparent!important;}
      .prism-header-label small{color:#a8a2b5!important;letter-spacing:.08em!important;}
      .menu-toggle,.header-today{background:linear-gradient(160deg,#17121f,#0c0a12)!important;color:#fff!important;border-color:#392451!important;box-shadow:0 8px 20px rgba(0,0,0,.2)!important;}
      .menu-toggle:active,.header-today:active{background:#21162f!important;}
      .prism-eyebrow{color:#a55bff!important;}

      #menuScrim{background:rgba(0,0,0,.74)!important;backdrop-filter:blur(2px)!important;}
      #sideMenu{background:radial-gradient(circle at 15% 0,rgba(133,54,255,.18),transparent 30%),linear-gradient(165deg,#100b18,#08070d 68%)!important;border-right:1px solid rgba(162,91,255,.38)!important;box-shadow:18px 0 52px rgba(0,0,0,.52)!important;}
      #sideMenu .menu-head{background:#100b18!important;border-bottom-color:rgba(161,91,255,.2)!important;}
      #sideMenu .menu-brand img{background:transparent!important;border:0!important;border-radius:10px!important;filter:drop-shadow(0 0 13px rgba(151,75,255,.3))!important;}
      #sideMenu .menu-brand strong{color:#fff!important;letter-spacing:.15em!important;}
      #sideMenu .menu-brand small{color:#9e97aa!important;}
      #sideMenu .drawer-section+#sideMenu .drawer-section,#sideMenu .drawer-section+.drawer-section{border-top-color:rgba(255,255,255,.07)!important;}
      #sideMenu .menu-group,#sideMenu .menu-group-toggle{color:#8f85a1!important;}
      #sideMenu .menu-link{color:#e8e3ee!important;border-color:transparent!important;background:transparent!important;}
      #sideMenu .menu-link .menu-icon{color:#9d93ab!important;}
      #sideMenu .menu-link.active{background:linear-gradient(135deg,rgba(111,34,231,.28),rgba(151,66,255,.13))!important;border-color:rgba(164,91,255,.38)!important;color:#c79cff!important;box-shadow:inset 0 0 24px rgba(120,40,255,.09)!important;}
      #sideMenu .menu-link.active .menu-icon{color:#b96fff!important;}
      #sideMenu .menu-close{background:#17111f!important;border-color:#3a2850!important;color:#fff!important;}
      #sideMenu .menu-version{border-top-color:rgba(255,255,255,.07)!important;color:#766f80!important;}

      .prism-bottom-nav{background:rgba(7,5,13,.97)!important;border-top:1px solid rgba(154,85,255,.28)!important;box-shadow:0 -12px 34px rgba(0,0,0,.36)!important;backdrop-filter:blur(18px)!important;}
      .prism-bottom-nav button{color:#9d96aa!important;background:transparent!important;border:0!important;}
      .prism-bottom-nav button svg{color:currentColor!important;}
      .prism-bottom-nav button[aria-current=page]{color:#c17aff!important;background:linear-gradient(180deg,rgba(125,43,245,.2),rgba(92,25,187,.16))!important;border-radius:18px!important;box-shadow:inset 0 0 0 1px rgba(160,91,255,.12)!important;}
      button:focus-visible{outline-color:rgba(166,88,255,.55)!important;}
      html.prism-account-booting::after{content:'Restoring your LIFTOVA account…'!important;background:#07050d url('images/liftova-splash.svg') center/cover no-repeat!important;color:transparent!important;}
    `;
    document.head.appendChild(style);
  }

  function run(){ updateMetadata(); addStyle(); cleanNode(); updateHeaderBrand(); updateMenuBrand(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();

  // Watch only the active screen. New cards and async results can arrive after
  // navigation; clean just those added nodes instead of rescanning the app.
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
    const brandedShowScreen=function(id){
      const result=originalShowScreen.apply(this,arguments);
      watchScreen(id);
      return result;
    };
    brandedShowScreen.__liftovaBrand=true;
    window.showScreen=brandedShowScreen;
  }
  const visibleScreen=[...document.querySelectorAll('.container > section[id],main > section[id]')].find(el=>!el.classList.contains('hidden'));
  if(visibleScreen)watchScreen(visibleScreen.id);

  // Avoid document-wide mutation observers: they caused iOS freezes on large screens.
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden){ updateHeaderBrand(); updateMenuBrand(); } });
})();
