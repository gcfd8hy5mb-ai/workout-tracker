(() => {
  'use strict';

  const BRAND='MYLIFTCOACH';
  const TITLE='MYLIFTCOACH · Train · Track · Progress';
  const ICON='images/myliftcoach-icon.svg?v=21';
  const LEGACY=/\b(?:LIFTOVA|PRISM)\b/g;

  function ensureHead(){
    if(document.title!==TITLE)document.title=TITLE;
    let meta=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(!meta){meta=document.createElement('meta');meta.name='apple-mobile-web-app-title';document.head.appendChild(meta)}
    if(meta.content!==BRAND)meta.content=BRAND;
    let icon=document.querySelector('link[rel="icon"]');
    if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}
    if(icon.type!=='image/svg+xml')icon.type='image/svg+xml';
    if(icon.getAttribute('href')!==ICON)icon.href=ICON;
  }

  function replaceLegacyText(root=document){
    if(root.nodeType===Node.TEXT_NODE){
      const parent=root.parentElement;
      if(!parent||['SCRIPT','STYLE','NOSCRIPT','TITLE'].includes(parent.tagName))return;
      const value=root.nodeValue||'';
      LEGACY.lastIndex=0;
      if(LEGACY.test(value)){
        LEGACY.lastIndex=0;
        root.nodeValue=value.replace(LEGACY,BRAND);
      }
      LEGACY.lastIndex=0;
      return;
    }
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes)replaceLegacyText(node);
  }

  function replaceLegacyIcons(root=document){
    const images=[];
    if(root.matches?.('img'))images.push(root);
    root.querySelectorAll?.('img').forEach(img=>images.push(img));
    images.forEach(img=>{
      const src=img.getAttribute('src')||'';
      if(/(?:liftova-icon\.svg|app-icon\.png)/i.test(src)){
        if(src!==ICON)img.src=ICON;
        if(img.alt!==BRAND)img.alt=BRAND;
      }
    });
    root.querySelectorAll?.('[style*="app-icon.png"],[style*="liftova-icon.svg"]').forEach(el=>{
      const style=el.getAttribute('style')||'';
      const next=style.replace(/images\/(?:app-icon\.png|liftova-icon\.svg)(?:\?[^'";)\s]+)?/gi,ICON);
      if(next!==style)el.setAttribute('style',next);
    });
  }

  function apply(root=document){
    replaceLegacyText(root);
    replaceLegacyIcons(root);
  }

  ensureHead();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>apply(),{once:true});
  else apply();

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE)apply(node);
      }
      if(record.type==='characterData')replaceLegacyText(record.target);
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

  window.MYLIFTCOACHBrand=Object.freeze({name:BRAND,icon:ICON,apply,ensureHead});
})();
