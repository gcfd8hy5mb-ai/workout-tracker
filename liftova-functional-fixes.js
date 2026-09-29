// Runtime compatibility fixes for legacy completion rendering plus visible brand migration.
(() => {
  'use strict';
  function patchWorkoutSummary() {
    const original = window.showWorkoutSummary;
    if (typeof original !== 'function' || original.__liftovaFunctionalFix) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      document.querySelectorAll('#completionContent .summary-exercise span').forEach(el => {
        el.textContent = el.textContent.replace(/\s*·\s*Next:\s*(?:undefined|NaN)\s*lb\s*×\s*8[–-]10/g, '');
      });
      return result;
    };
    wrapped.__liftovaFunctionalFix = true;
    window.showWorkoutSummary = wrapped;
  }

  const BRAND='MYLIFTCOACH';
  const replaceBrand=text => String(text||'')
    .replace(/LIFTOVA/gi, BRAND)
    .replace(/\bPRISM\b/g, BRAND);

  function patchVisibleBrand(root=document){
    document.title='MYLIFTCOACH · Train · Track · Progress';
    const mobileTitle=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(mobileTitle)mobileTitle.content=BRAND;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(p.tagName))return NodeFilter.FILTER_REJECT;
      return /LIFTOVA|\bPRISM\b/i.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.nodeValue=replaceBrand(node.nodeValue);});
    root.querySelectorAll?.('[aria-label],[title],[alt]').forEach(el=>{
      ['aria-label','title','alt'].forEach(attr=>{
        const value=el.getAttribute(attr);if(value && /LIFTOVA|\bPRISM\b/i.test(value))el.setAttribute(attr,replaceBrand(value));
      });
    });
  }

  function installBranding(){
    patchVisibleBrand();
    if(document.body && !document.body.__myLiftCoachBrandObserver){
      let queued=false;
      const observer=new MutationObserver(()=>{
        if(queued)return;queued=true;
        requestAnimationFrame(()=>{queued=false;patchVisibleBrand();});
      });
      observer.observe(document.body,{childList:true,subtree:true,characterData:true});
      document.body.__myLiftCoachBrandObserver=observer;
    }
  }

  patchWorkoutSummary();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installBranding,{once:true});else installBranding();
  setTimeout(patchWorkoutSummary, 0);
  setTimeout(patchWorkoutSummary, 750);
  setTimeout(installBranding,0);
  setTimeout(installBranding,750);
})();
