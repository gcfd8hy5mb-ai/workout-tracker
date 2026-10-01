// MYLIFTCOACH-only visible branding for Profile, Beta Access, and Pro previews.
// Historical ids/classes/storage keys remain untouched for compatibility.
(() => {
  'use strict';

  const RETIRED=/\b(?:LIFTOVA|PRISM)\b/gi;
  const BRAND='MYLIFTCOACH';

  function replaceText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const parent=node.parentElement;
      if(!parent||['SCRIPT','STYLE','NOSCRIPT'].includes(parent.tagName))continue;
      const current=node.nodeValue||'';
      const next=current.replace(RETIRED,BRAND);
      if(next!==current)node.nodeValue=next;
    }
  }

  function targets(){
    return [
      document.getElementById('profileScreen'),
      document.getElementById('prismProOverlay'),
      document.getElementById('prismProScreen')
    ].filter(Boolean);
  }

  function canonicalizeProfile(){
    for(const root of targets())replaceText(root);
  }

  let queued=false;
  function queueCanonicalize(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      canonicalizeProfile();
    });
  }

  const wrap=name=>{
    const original=window[name];
    if(typeof original!=='function'||original.__myliftcoachBrandLock)return;
    const wrapped=function(...args){
      const result=original.apply(this,args);
      queueCanonicalize();
      return result;
    };
    wrapped.__myliftcoachBrandLock=true;
    window[name]=wrapped;
  };

  function observeTarget(root){
    if(!root||root.__myliftcoachBrandObserver)return;
    const observer=new MutationObserver(records=>{
      let needsCleanup=false;
      for(const record of records){
        if(record.type==='characterData'){
          const value=record.target.nodeValue||'';
          if(/\b(?:LIFTOVA|PRISM)\b/i.test(value)){needsCleanup=true;break;}
        }
        if(record.type==='childList'){
          for(const node of record.addedNodes){
            const text=node.nodeType===Node.TEXT_NODE?(node.nodeValue||''):(node.textContent||'');
            if(/\b(?:LIFTOVA|PRISM)\b/i.test(text)){needsCleanup=true;break;}
          }
        }
        if(needsCleanup)break;
      }
      if(needsCleanup)queueCanonicalize();
    });
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    root.__myliftcoachBrandObserver=observer;
  }

  function install(){
    ['showProfile','renderPrismAccessState','showProPreview','showPrismPro','renderPrismPro'].forEach(wrap);
    for(const root of targets())observeTarget(root);
    canonicalizeProfile();
    window.MYLIFTCOACHProfileBrandLock={apply:canonicalizeProfile};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  setTimeout(install,0);
})();
