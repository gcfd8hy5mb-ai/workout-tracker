(() => {
  'use strict';

  const BRAND='MYLIFTCOACH';
  const ICON='images/myliftcoach-icon.svg?v=21';
  const LEGACY=/\b(?:LIFTOVA|PRISM)\b/g;

  function ensureHead(){
    document.title='MYLIFTCOACH · Train · Track · Progress';
    let meta=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(!meta){meta=document.createElement('meta');meta.name='apple-mobile-web-app-title';document.head.appendChild(meta)}
    meta.content=BRAND;
    let icon=document.querySelector('link[rel="icon"]');
    if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}
    icon.type='image/svg+xml';icon.href=ICON;
  }

  function replaceLegacyText(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const parent=node.parentElement;
      if(!parent||['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName))continue;
      if(!LEGACY.test(node.nodeValue||'')){LEGACY.lastIndex=0;continue}
      LEGACY.lastIndex=0;
      node.nodeValue=(node.nodeValue||'').replace(LEGACY,BRAND);
    }
  }

  function replaceLegacyIcons(root=document){
    root.querySelectorAll?.('img').forEach(img=>{
      const src=img.getAttribute('src')||'';
      if(/(?:liftova-icon\.svg|app-icon\.png)/i.test(src)){
        img.src=ICON;
        img.alt=BRAND;
      }
    });
    root.querySelectorAll?.('[style*="app-icon.png"],[style*="liftova-icon.svg"]').forEach(el=>{
      const style=el.getAttribute('style')||'';
      el.setAttribute('style',style.replace(/images\/(?:app-icon\.png|liftova-icon\.svg)(?:\?[^'";)\s]+)?/gi,ICON));
    });
  }

  function apply(root=document){
    ensureHead();
    replaceLegacyText(root);
    replaceLegacyIcons(root);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(),{once:true});
  else apply();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===Node.ELEMENT_NODE)apply(node);
        else if(node.nodeType===Node.TEXT_NODE&&node.parentElement)replaceLegacyText(node.parentElement);
      }
      if(record.type==='characterData'&&record.target.parentElement)replaceLegacyText(record.target.parentElement);
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

  window.MYLIFTCOACHBrand=Object.freeze({name:BRAND,icon:ICON,apply});
})();
