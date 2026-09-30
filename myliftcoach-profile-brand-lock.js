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

  function canonicalizeProfile(){
    const screen=document.getElementById('profileScreen');
    if(screen)replaceText(screen);
    const overlay=document.getElementById('prismProOverlay');
    if(overlay)replaceText(overlay);
    const proScreen=document.getElementById('prismProScreen');
    if(proScreen)replaceText(proScreen);
  }

  function afterRender(){
    requestAnimationFrame(()=>requestAnimationFrame(canonicalizeProfile));
  }

  const wrap=name=>{
    const original=window[name];
    if(typeof original!=='function'||original.__myliftcoachBrandLock)return;
    const wrapped=function(...args){
      const result=original.apply(this,args);
      afterRender();
      return result;
    };
    wrapped.__myliftcoachBrandLock=true;
    window[name]=wrapped;
  };

  function install(){
    ['showProfile','renderPrismAccessState','showProPreview','showPrismPro','renderPrismPro'].forEach(wrap);
    const screen=document.getElementById('profileScreen');
    if(screen&&!screen.__myliftcoachBrandLock){
      new MutationObserver(()=>{
        if(!screen.classList.contains('hidden'))afterRender();
      }).observe(screen,{attributes:true,attributeFilter:['class']});
      screen.__myliftcoachBrandLock=true;
    }
    canonicalizeProfile();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
  setTimeout(install,0);
})();
