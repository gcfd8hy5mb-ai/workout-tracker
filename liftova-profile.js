// LIFTOVA Profile / Settings presentation layer. Existing account and persistence logic stays intact.
(() => {
  'use strict';
  const style = document.createElement('style');
  style.id = 'liftova-profile-styles';
  style.textContent = `
    #profileScreen{color:#f7f4ff;padding-bottom:110px}
    #profileScreen .prism-section-head{margin:2px 0 18px;padding:4px 2px 0}
    #profileScreen .prism-eyebrow{color:#a66cff;letter-spacing:.16em;font-size:10px;font-weight:800}
    #profileScreen .prism-section-head h2{font-size:31px;margin:4px 0 0;letter-spacing:-.04em;color:#fff}
    #profileScreen .liftova-profile-hero{position:relative;overflow:hidden;margin:0 0 16px;padding:22px;border:1px solid rgba(151,83,255,.42);border-radius:24px;background:radial-gradient(circle at 90% 0,rgba(142,69,255,.27),transparent 42%),linear-gradient(145deg,#171123,#0c0b12 66%);box-shadow:0 18px 45px rgba(0,0,0,.28)}
    #profileScreen .liftova-profile-hero:after{content:'';position:absolute;width:160px;height:160px;border:1px solid rgba(166,108,255,.18);border-radius:50%;right:-70px;top:-80px;box-shadow:0 0 50px rgba(126,50,255,.13)}
    #profileScreen .liftova-profile-brand{display:flex;align-items:center;gap:13px;position:relative;z-index:1}
    #profileScreen .liftova-profile-mark{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(145deg,#7325ef,#a958ff);box-shadow:0 8px 25px rgba(122,40,255,.35);font-size:21px;font-weight:900;color:#fff}
    #profileScreen .liftova-profile-brand strong{display:block;font-size:18px;letter-spacing:.12em;color:#fff}
    #profileScreen .liftova-profile-brand small{display:block;color:#a9a2b5;margin-top:4px;font-size:12px}
    #profileScreen .liftova-profile-mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px;position:relative;z-index:1}
    #profileScreen .liftova-profile-mini{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:11px 9px;text-align:center}
    #profileScreen .liftova-profile-mini b{display:block;color:#fff;font-size:15px}
    #profileScreen .liftova-profile-mini span{display:block;color:#847f90;font-size:10px;margin-top:3px;text-transform:uppercase;letter-spacing:.08em}
    #profileScreen .card,#profileScreen .prism-local-section,#profileScreen #prismCloudAccount>.card{background:linear-gradient(155deg,#121019,#0b0a10)!important;color:#f7f4ff!important;border:1px solid #292133!important;border-radius:21px!important;box-shadow:0 12px 34px rgba(0,0,0,.22)!important;padding:18px!important}
    #profileScreen .card h3,#profileScreen .prism-local-section h3{color:#fff!important;font-size:17px!important;margin-top:0}
    #profileScreen .small,#profileScreen .journey-note,#profileScreen .prism-local-hero small{color:#8f8999!important}
    #profileScreen .prism-local-hero{background:linear-gradient(145deg,#171220,#0d0b12)!important;border:1px solid #30233e!important;border-radius:21px!important;padding:18px!important;margin-bottom:14px!important}
    #profileScreen .prism-local-hero strong{color:#fff!important;font-size:20px!important}
    #profileScreen .prism-local-hero span{color:#a868ff!important}
    #profileScreen .prism-avatar{box-shadow:0 0 0 1px #4a2b6f,0 0 24px rgba(143,68,255,.2)!important}
    #profileScreen input,#profileScreen select{background:#111019!important;color:#fff!important;border:1px solid #352b42!important;border-radius:13px!important;min-height:48px!important}
    #profileScreen label{color:#bcb5c8!important;font-size:12px!important;letter-spacing:.04em}
    #profileScreen button{border-radius:13px!important}
    #profileScreen .journey-primary,#profileScreen .prism-primary,#profileScreen form button[type='submit']{background:linear-gradient(135deg,#7023ef,#9d46ff)!important;color:#fff!important;border:1px solid #a867ff!important;box-shadow:0 9px 25px rgba(116,35,238,.22)!important;font-weight:800!important}
    #profileScreen .prism-profile-links{display:grid;gap:9px;margin:16px 0}
    #profileScreen .prism-profile-links button{display:flex!important;justify-content:space-between!important;align-items:center!important;width:100%!important;min-height:54px!important;padding:0 15px!important;background:#100e15!important;color:#eeeaf4!important;border:1px solid #28202f!important;text-align:left!important;font-weight:650!important}
    #profileScreen .prism-profile-links button span{color:#9d58ff!important;font-size:22px!important}
    #profileScreen .prism-tier-card{border-color:#4b2b6c!important;background:radial-gradient(circle at 100% 0,rgba(137,61,255,.18),transparent 45%),linear-gradient(155deg,#15101e,#0c0a11)!important}
    #profileScreen .prism-pro-badge{background:#7e2cf0!important;color:#fff!important;border-color:#a55eff!important;box-shadow:0 0 16px rgba(133,48,255,.25)!important}
    #profileScreen .prism-tier-choices button[aria-pressed='true']{background:linear-gradient(135deg,#7023ef,#9d46ff)!important;color:#fff!important;border-color:#b06aff!important}
    #profileScreen #prismAccountSignOut{width:100%!important;margin-top:12px!important;background:#17121d!important;color:#ff8ba0!important;border:1px solid #4b2732!important;min-height:48px!important}
    #profileScreen #profileSettings{margin-bottom:24px}
  `;
  document.head.appendChild(style);

  function buildHero(){
    const screen=document.getElementById('profileScreen');
    if(!screen || screen.querySelector('.liftova-profile-hero')) return;
    const head=screen.querySelector('.prism-section-head');
    if(!head) return;
    const hero=document.createElement('section');
    hero.className='liftova-profile-hero';
    hero.innerHTML=`<div class="liftova-profile-brand"><div class="liftova-profile-mark">L</div><div><strong>LIFTOVA</strong><small>Your training, account and preferences</small></div></div><div class="liftova-profile-mini-grid"><div class="liftova-profile-mini"><b id="liftovaProfileDays">—</b><span>Days / wk</span></div><div class="liftova-profile-mini"><b id="liftovaProfileLevel">—</b><span>Level</span></div><div class="liftova-profile-mini"><b id="liftovaProfileUnits">—</b><span>Units</span></div></div>`;
    head.after(hero);
  }

  function refreshHero(){
    buildHero();
    const screen=document.getElementById('profileScreen');
    if(!screen) return;
    const days=screen.querySelector('#prismEditDays')?.value || (window.workoutGoals?.days ?? '—');
    const level=screen.querySelector('#prismEditLevel')?.value || (window.tracking?.trainingLevel ?? '—');
    const units=screen.querySelector('#prismEditUnits')?.value || (window.tracking?.preferredWeightUnit ?? 'lb');
    const set=(id,val)=>{
      const el=document.getElementById(id);
      const next=String(val);
      if(el && el.textContent!==next) el.textContent=next;
    };
    set('liftovaProfileDays',days==='—'?'—':`${days}`);
    set('liftovaProfileLevel',level);
    set('liftovaProfileUnits',String(units).toUpperCase());
  }

  const originalShowProfile=window.showProfile;
  if(typeof originalShowProfile==='function'){
    window.showProfile=function(){
      const result=originalShowProfile.apply(this,arguments);
      requestAnimationFrame(refreshHero);
      return result;
    };
  }

  const boot=()=>{
    const screen=document.getElementById('profileScreen');
    if(!screen) return;
    // Only react to this screen becoming visible. A document-wide childList observer
    // created a feedback loop because refreshHero itself updated text nodes on iOS.
    new MutationObserver(()=>{
      if(!screen.classList.contains('hidden')) requestAnimationFrame(refreshHero);
    }).observe(screen,{attributes:true,attributeFilter:['class']});
    screen.addEventListener('input',refreshHero);
    screen.addEventListener('change',refreshHero);
    refreshHero();
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
