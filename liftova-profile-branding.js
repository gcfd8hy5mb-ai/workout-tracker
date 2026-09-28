/* LIFTOVA compatibility layer: branding plus mobile navigation/chrome fixes. */
(() => {
  'use strict';
  const liftovaIcon = () => '<img src="images/liftova-icon.svg" alt="">';

  function applyBranding(root=document){
    root.querySelectorAll('.prism-avatar img[src*="app-icon"],.prism-avatar-option img[src*="app-icon"]').forEach(img=>{img.src='images/liftova-icon.svg';});
    const area=document.getElementById('prismLocalProfile');
    if(area){
      const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(n=>{n.nodeValue=n.nodeValue.replace(/PRISM Account/g,'LIFTOVA Account').replace(/Your PRISM Profile/g,'Your LIFTOVA Profile').replace(/Your PRISM data/g,'Your LIFTOVA data');});
    }
    /* The legacy stylesheet makes every header fixed. Only the app-level header
       belongs in that layer; headers rendered inside Library/Pro/content screens
       must remain in normal document flow or they cover the screen title/controls. */
    document.querySelectorAll('header').forEach(header=>{
      if(header.closest('.liftova-home-shell'))return;
      const appLevel=header.parentElement===document.body || header.matches('.app-header');
      if(!appLevel){
        header.style.setProperty('position','static','important');
        header.style.setProperty('inset','auto','important');
        header.style.setProperty('width','auto','important');
        header.style.setProperty('height','auto','important');
        header.style.setProperty('min-height','0','important');
        header.style.setProperty('z-index','auto','important');
        header.style.setProperty('transform','none','important');
      }
    });
  }

  function openHomeWorkout(){
    const card=document.querySelector('.liftova-home-shell .lh-workout');
    if(!card)return false;
    const wanted=(card.querySelector('h2')?.textContent||'').trim().toLowerCase();
    if(!wanted)return false;
    try{
      if(typeof suggestedWorkouts==='function' && typeof workoutGoals!=='undefined' && workoutGoals && !workoutGoals.skipped && !workoutGoals.basic){
        const days=suggestedWorkouts(workoutGoals)||[];
        const index=days.findIndex(day=>String(day?.title||'').trim().toLowerCase()===wanted);
        if(index>=0 && typeof openSuggestedWorkout==='function'){openSuggestedWorkout(index);return true;}
      }
      if(typeof presetWorkouts!=='undefined' && presetWorkouts){
        const match=Object.entries(presetWorkouts).find(([,day])=>String(day?.title||'').trim().toLowerCase()===wanted);
        if(match && typeof openPresetWorkout==='function'){openPresetWorkout(match[0]);return true;}
      }
    }catch(err){console.warn('LIFTOVA workout-card navigation fallback',err);}
    const workoutNav=document.querySelector('[data-prism-tab="Workout"],[data-prism-tab="Workouts"]');
    if(workoutNav){workoutNav.click();return true;}
    return false;
  }

  function wireInteractions(){
    if(document.__liftovaInteractionFixes)return;
    document.__liftovaInteractionFixes=true;
    document.addEventListener('click',event=>{
      const card=event.target.closest?.('.liftova-home-shell .lh-workout');
      if(card){event.preventDefault();openHomeWorkout();return;}
      const button=event.target.closest?.('button,[role="button"],a');
      if(!button)return;
      const label=(button.textContent||button.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
      if(/^overview$/i.test(label)){
        event.preventDefault();
        if(typeof window.goHome==='function')window.goHome();
        else if(typeof window.showScreen==='function')window.showScreen('home');
      }
    },true);
  }

  function install(){
    if(typeof window.prismAvatarMarkup==='function'&&!window.prismAvatarMarkup.__liftova){
      const original=window.prismAvatarMarkup;
      const branded=function(id){if((id??window.prismLocalProfile?.avatarId)==='prism')return liftovaIcon();return original(id)};
      branded.__liftova=true;window.prismAvatarMarkup=branded;
    }
    applyBranding();
    wireInteractions();
    const host=document.body;
    if(host&&!host.__liftovaBrandObserver){
      let queued=false;
      const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyBranding();});});
      observer.observe(host,{childList:true,subtree:true});
      host.__liftovaBrandObserver=observer;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  setTimeout(install,0);
})();
