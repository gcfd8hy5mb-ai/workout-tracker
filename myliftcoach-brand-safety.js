/* Presentation-only legacy-brand guard. Keep historical storage keys and internal
   prism/liftova identifiers intact; normalize only known tester-facing copy. */
(function(){
  'use strict';
  const replacements=[
    [/LIFTOVA PRO/g,'MYLIFTCOACH PRO'],
    [/Unlock LIFTOVA Coach/g,'Unlock MYLIFTCOACH Coach'],
    [/existing LIFTOVA workout replacement system/g,'existing MYLIFTCOACH workout replacement system'],
    [/LIFTOVA’s existing workout replacement system/g,'MYLIFTCOACH’s existing workout replacement system'],
    [/while LIFTOVA confirms the plateau/g,'while MYLIFTCOACH confirms the plateau'],
    [/LIFTOVA does not currently detect/g,'MYLIFTCOACH does not currently detect'],
    [/saved LIFTOVA training context/g,'saved MYLIFTCOACH training context']
  ];
  function normalize(value){
    let next=String(value||'');
    for(const [pattern,replacement] of replacements)next=next.replace(pattern,replacement);
    return next;
  }
  function scrubText(root){
    if(!root)return;
    if(root.nodeType===Node.TEXT_NODE){
      const next=normalize(root.nodeValue);
      if(next!==root.nodeValue)root.nodeValue=next;
      return;
    }
    if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const next=normalize(node.nodeValue);
      if(next!==node.nodeValue)node.nodeValue=next;
    }
    if(root.nodeType===Node.ELEMENT_NODE){
      for(const attr of ['aria-label','title']){
        if(root.hasAttribute?.(attr)){
          const before=root.getAttribute(attr),after=normalize(before);
          if(after!==before)root.setAttribute(attr,after);
        }
      }
      root.querySelectorAll?.('[aria-label],[title]').forEach(el=>{
        for(const attr of ['aria-label','title']){
          if(!el.hasAttribute(attr))continue;
          const before=el.getAttribute(attr),after=normalize(before);
          if(after!==before)el.setAttribute(attr,after);
        }
      });
    }
  }
  function migrateCoachHistory(){
    try{
      const key='prismAskHistoryV1',rows=JSON.parse(localStorage.getItem(key)||'[]');
      if(!Array.isArray(rows))return;
      let changed=false;
      for(const row of rows){
        if(!row||typeof row!=='object')continue;
        for(const field of ['answer','why']){
          const before=row[field];
          if(typeof before!=='string')continue;
          const after=normalize(before);
          if(after!==before){row[field]=after;changed=true;}
        }
      }
      if(changed)localStorage.setItem(key,JSON.stringify(rows));
    }catch{}
  }
  function run(){migrateCoachHistory();scrubText(document.body);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='characterData')scrubText(record.target);
      else record.addedNodes.forEach(scrubText);
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  window.MYLIFTCOACHBrandSafety=Object.freeze({normalize,run});
})();
