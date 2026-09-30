// MYLIFTCOACH Profile / Settings presentation layer. Existing account and persistence logic stays intact.
(() => {
  'use strict';
  const style = document.createElement('style');
  style.id = 'myliftcoach-profile-styles';
  style.textContent = `
    #profileScreen{color:#f7f7f8;padding-bottom:110px}
    #profileScreen .prism-section-head{margin:2px 0 12px;padding:4px 2px 0}
    #profileScreen .prism-eyebrow{color:#ff6a2a;letter-spacing:.16em;font-size:9px;font-weight:850}
    #profileScreen .prism-section-head h2{font-size:28px;margin:4px 0 0;letter-spacing:-.04em;color:#fff}
    #profileScreen .myliftcoach-profile-hero{position:relative;overflow:hidden;margin:0 0 12px;padding:16px;border:1px solid rgba(255,106,42,.32);border-radius:19px;background:radial-gradient(circle at 90% 0,rgba(255,106,42,.14),transparent 42%),linear-gradient(145deg,#171411,#0b0b0c 66%);box-shadow:none}
    #profileScreen .myliftcoach-profile-brand{display:flex;align-items:center;gap:11px;position:relative;z-index:1}
    #profileScreen .myliftcoach-profile-mark{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(145deg,#ff5a1f,#ff8a3d);font-size:15px;font-weight:900;color:#fff;letter-spacing:-.04em}
    #profileScreen .myliftcoach-profile-brand strong{display:block;font-size:16px;letter-spacing:.08em;color:#fff}
    #profileScreen .myliftcoach-profile-brand small{display:block;color:#9f9a96;margin-top:3px;font-size:10px}
    #profileScreen .myliftcoach-profile-mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:13px;position:relative;z-index:1}
    #profileScreen .myliftcoach-profile-mini{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:11px;padding:9px 6px;text-align:center}
    #profileScreen .myliftcoach-profile-mini b{display:block;color:#fff;font-size:14px}
    #profileScreen .myliftcoach-profile-mini span{display:block;color:#89847f;font-size:8px;margin-top:2px;text-transform:uppercase;letter-spacing:.07em}
    #profileScreen .card,#profileScreen .prism-local-section,#profileScreen #prismCloudAccount>.card{background:#101011!important;color:#f7f7f8!important;border:1px solid #2c2927!important;border-radius:17px!important;box-shadow:none!important;padding:14px!important;margin-bottom:10px!important}
    #profileScreen .card h3,#profileScreen .prism-local-section h3{color:#fff!important;font-size:15px!important;margin:0 0 9px!important}
    #profileScreen .small,#profileScreen .journey-note,#profileScreen .prism-local-hero small{color:#96918d!important;font-size:10px!important}
    #profileScreen .prism-local-hero{background:#121110!important;border:1px solid #302c29!important;border-radius:17px!important;padding:14px!important;margin-bottom:10px!important}
    #profileScreen .prism-local-hero strong{color:#fff!important;font-size:17px!important}
    #profileScreen .prism-local-hero span{color:#ff7a35!important}
    #profileScreen .prism-avatar{box-shadow:0 0 0 1px #5a3827!important}
    #profileScreen input,#profileScreen select{background:#121212!important;color:#fff!important;border:1px solid #38332f!important;border-radius:11px!important;min-height:44px!important}
    #profileScreen label{color:#aaa5a1!important;font-size:10px!important;letter-spacing:.035em}
    #profileScreen button{border-radius:11px!important}
    #profileScreen .journey-primary,#profileScreen .prism-primary,#profileScreen form button[type='submit']{background:linear-gradient(135deg,#f05a1f,#ff7a35)!important;color:#fff!important;border:1px solid #ff8a49!important;box-shadow:none!important;font-weight:800!important;min-height:45px!important}
    #profileScreen .prism-profile-links{display:grid;gap:6px;margin:11px 0}
    #profileScreen .prism-profile-links button{display:flex!important;justify-content:space-between!important;align-items:center!important;width:100%!important;min-height:48px!important;padding:0 13px!important;background:#111111!important;color:#eeeae7!important;border:1px solid #2b2826!important;text-align:left!important;font-size:11px!important;font-weight:680!important}
    #profileScreen .prism-profile-links button span{color:#ff7a35!important;font-size:18px!important}
    #profileScreen .prism-tier-card{border-color:#563524!important;background:radial-gradient(circle at 100% 0,rgba(255,106,42,.11),transparent 45%),#12100f!important}
    #profileScreen .prism-pro-badge{background:#e85a21!important;color:#fff!important;border-color:#ff8748!important;box-shadow:none!important}
    #profileScreen .prism-tier-choices button[aria-pressed='true']{background:#d84f1b!important;color:#fff!important;border-color:#ff8748!important}
    #profileScreen #prismAccountSignOut{width:100%!important;margin-top:10px!important;background:#171313!important;color:#ff8ba0!important;border:1px solid #4b2732!important;min-height:45px!important}
    #profileScreen #profileSettings{margin-bottom:18px}
    #profileScreen .myliftcoach-profile-section-label{margin:15px 2px 7px;color:#8d8884;font-size:9px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
  `;
  document.head.appendChild(style);

  function replaceLegacyBrand(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(/PRISM|LIFTOVA/.test(node.nodeValue||''))node.nodeValue=node.nodeValue.replaceAll('PRISM','MYLIFTCOACH').replaceAll('LIFTOVA','MYLIFTCOACH');
    }
  }

  function enforceBranding(){
    replaceLegacyBrand(document.querySelector('header .prism-header-label'));
    replaceLegacyBrand(document.getElementById('profileScreen'));
    replaceLegacyBrand(document.querySelector('#sideMenu .menu-brand-copy'));
    replaceLegacyBrand(document.querySelector('#sideMenu .menu-version'));
  }

  function buildHero(){
    const screen=document.getElementById('profileScreen');
    if(!screen || screen.querySelector('.myliftcoach-profile-hero')) return;
    screen.querySelector('.liftova-profile-hero')?.remove();
    const head=screen.querySelector('.prism-section-head');
    if(!head) return;
    const hero=document.createElement('section');
    hero.className='myliftcoach-profile-hero';
    hero.innerHTML=`<div class="myliftcoach-profile-brand"><div class="myliftcoach-profile-mark">MC</div><div><strong>MYLIFTCOACH</strong><small>Training profile and account</small></div></div><div class="myliftcoach-profile-mini-grid"><div class="myliftcoach-profile-mini"><b id="myliftcoachProfileDays">—</b><span>Days / wk</span></div><div class="myliftcoach-profile-mini"><b id="myliftcoachProfileLevel">—</b><span>Level</span></div><div class="myliftcoach-profile-mini"><b id="myliftcoachProfileUnits">—</b><span>Units</span></div></div>`;
    head.after(hero);
  }

  function addSectionLabels(){
    const screen=document.getElementById('profileScreen');
    if(!screen) return;
    screen.querySelectorAll('.liftova-profile-section-label').forEach(node=>node.remove());
    const add=(target,text)=>{
      if(!target || target.previousElementSibling?.classList.contains('myliftcoach-profile-section-label')) return;
      const label=document.createElement('div');
      label.className='myliftcoach-profile-section-label';
      label.textContent=text;
      target.before(label);
    };
    add(screen.querySelector('.prism-profile-links'),'Quick access');
    add(screen.querySelector('#profileSettings'),'Preferences');
    add(screen.querySelector('#prismCloudAccount'),'Account');
  }

  function refreshHero(){
    buildHero();
    addSectionLabels();
    enforceBranding();
    const screen=document.getElementById('profileScreen');
    if(!screen) return;
    const days=screen.querySelector('#prismEditDays')?.value || (window.workoutGoals?.days ?? '—');
    const level=screen.querySelector('#prismEditLevel')?.value || (window.tracking?.trainingLevel ?? '—');
    const units=screen.querySelector('#prismEditUnits')?.value || (window.tracking?.preferredWeightUnit ?? 'lb');
    const set=(id,val)=>{const el=document.getElementById(id);const next=String(val);if(el&&el.textContent!==next)el.textContent=next;};
    set('myliftcoachProfileDays',days==='—'?'—':`${days}`);
    set('myliftcoachProfileLevel',level);
    set('myliftcoachProfileUnits',String(units).toUpperCase());
  }

  const originalShowProfile=window.showProfile;
  if(typeof originalShowProfile==='function'){
    window.showProfile=function(){const result=originalShowProfile.apply(this,arguments);requestAnimationFrame(refreshHero);return result;};
  }

  const boot=()=>{
    const screen=document.getElementById('profileScreen');
    if(!screen)return;
    new MutationObserver(()=>{if(!screen.classList.contains('hidden'))requestAnimationFrame(refreshHero);}).observe(screen,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
    const header=document.querySelector('header .prism-header-label');
    if(header)new MutationObserver(enforceBranding).observe(header,{childList:true,subtree:true,characterData:true});
    screen.addEventListener('input',refreshHero);
    screen.addEventListener('change',refreshHero);
    enforceBranding();
    refreshHero();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
