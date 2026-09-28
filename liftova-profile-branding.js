/* LIFTOVA profile branding compatibility layer. Presentation only. */
(() => {
  'use strict';
  const liftovaIcon = () => '<img src="images/liftova-icon.svg" alt="">';
  function applyBranding(root=document){
    root.querySelectorAll('.prism-avatar img[src*="app-icon"],.prism-avatar-option img[src*="app-icon"]').forEach(img=>{img.src='images/liftova-icon.svg';});
    const area=document.getElementById('prismLocalProfile');
    if(!area)return;
    const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{n.nodeValue=n.nodeValue.replace(/PRISM Account/g,'LIFTOVA Account').replace(/Your PRISM Profile/g,'Your LIFTOVA Profile').replace(/Your PRISM data/g,'Your LIFTOVA data');});
  }
  function install(){
    if(typeof window.prismAvatarMarkup==='function'&&!window.prismAvatarMarkup.__liftova){
      const original=window.prismAvatarMarkup;
      const branded=function(id){if((id??window.prismLocalProfile?.avatarId)==='prism')return liftovaIcon();return original(id)};
      branded.__liftova=true;window.prismAvatarMarkup=branded;
    }
    applyBranding();
    const host=document.getElementById('prismLocalProfile');
    if(host&&!host.__liftovaBrandObserver){const observer=new MutationObserver(()=>applyBranding(host));observer.observe(host,{childList:true,subtree:true});host.__liftovaBrandObserver=observer;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  setTimeout(install,0);
})();
