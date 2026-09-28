// Final visual/branding cleanup for the LIFTOVA redesign branch.
// This changes presentation text only; PRISM-prefixed storage keys/functions remain untouched for compatibility.
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
      header{background:rgba(7,5,13,.94)!important;border-bottom-color:rgba(154,85,255,.2)!important;}
      .prism-wordmark{letter-spacing:.16em!important;background:linear-gradient(180deg,#fff,#b8b3c4);-webkit-background-clip:text;background-clip:text;color:transparent!important;}
      .prism-eyebrow{color:#a55bff!important;}
      .prism-bottom-nav{background:rgba(8,6,14,.96)!important;border-top-color:rgba(154,85,255,.24)!important;}
      .prism-bottom-nav button[aria-current=page]{color:#b66dff!important;background:rgba(126,48,255,.15)!important;}
      button:focus-visible{outline-color:rgba(166,88,255,.55)!important;}
    `;
    document.head.appendChild(style);
  }

  function run(){ updateMetadata(); addStyle(); cleanNode(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===Node.ELEMENT_NODE) cleanNode(node);
        else if(node.nodeType===Node.TEXT_NODE){
          const next=replaceBrand(node.nodeValue); if(next!==node.nodeValue) node.nodeValue=next;
        }
      }
    }
  });
  const startObserver=()=>{ if(document.body) observer.observe(document.body,{childList:true,subtree:true}); };
  if(document.body) startObserver(); else document.addEventListener('DOMContentLoaded',startObserver,{once:true});
})();
