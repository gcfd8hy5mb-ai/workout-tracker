/* MYLIFTCOACH compatibility layer: profile branding plus mobile navigation/chrome fixes. */
(() => {
  'use strict';
  const brandIcon = () => '<img src="images/liftova-icon.svg" alt="MYLIFTCOACH">';

  function scheduledWorkoutForToday(){
    const activeLabel=(document.querySelector('.liftova-home-shell .lh-day.active span')?.textContent||'').trim();
    if(!activeLabel || /^rest$/i.test(activeLabel))return {rest:/^rest$/i.test(activeLabel),label:activeLabel};
    try{
      if(typeof suggestedWorkouts==='function' && typeof workoutGoals!=='undefined' && workoutGoals && !workoutGoals.skipped && !workoutGoals.basic){
        const days=suggestedWorkouts(workoutGoals)||[];
        let index=days.findIndex(day=>String(day?.title||'').toLowerCase().includes(activeLabel.toLowerCase()));
        if(index<0){
          const trainingSlots=['MON','TUE','THU','FRI'];
          const activeDay=(document.querySelector('.liftova-home-shell .lh-day.active strong')?.textContent||'').trim().toUpperCase();
          const slot=trainingSlots.indexOf(activeDay);
          if(slot>=0 && slot<days.length)index=slot;
        }
        if(index>=0){const day=days[index];return {kind:'suggested',index,title:day.title,ids:day.exercises||[],label:activeLabel};}
      }
      if(typeof presetWorkouts!=='undefined' && presetWorkouts){
        const entries=Object.entries(presetWorkouts);
        let index=entries.findIndex(([,day])=>String(day?.title||'').toLowerCase().includes(activeLabel.toLowerCase()));
        if(index>=0){const [key,day]=entries[index];return {kind:'preset',key,title:day.title,ids:day.exercises||[],label:activeLabel};}
      }
    }catch(err){console.warn('MYLIFTCOACH scheduled-workout sync fallback',err);}
    return null;
  }

  function syncHomeWorkoutCard(){
    const card=document.querySelector('.liftova-home-shell .lh-workout');
    if(!card)return;
    const scheduled=scheduledWorkoutForToday();
    if(!scheduled)return;
    card.dataset.liftovaScheduleKind=scheduled.rest?'rest':scheduled.kind||'';
    card.dataset.liftovaScheduleIndex=scheduled.index??'';
    card.dataset.liftovaScheduleKey=scheduled.key??'';
    if(scheduled.rest){
      card.querySelector('h2')?.replaceChildren(document.createTextNode('REST DAY'));
      card.querySelector('p')?.replaceChildren(document.createTextNode('Recovery · No workout scheduled'));
      return;
    }
    const title=String(scheduled.title||scheduled.label||'Today’s Workout').toUpperCase();
    card.querySelector('h2')?.replaceChildren(document.createTextNode(title));
    const rows=(scheduled.ids||[]).map(id=>{try{return typeof getExercise==='function'?getExercise(id):typeof exerciseLibrary!=='undefined'?exerciseLibrary.find(x=>x.id===id):null}catch{return null}}).filter(Boolean);
    const groups={};rows.forEach(ex=>{const muscle=String(ex.muscle||ex.muscleGroup||'').trim();if(muscle)groups[muscle]=(groups[muscle]||0)+1;});
    const muscles=Object.keys(groups);
    if(muscles.length)card.querySelector('p')?.replaceChildren(document.createTextNode(muscles.slice(0,4).join(' · ')));
    const meta=card.querySelectorAll('.lh-meta span');
    if(meta[0])meta[0].innerHTML=`<b>◴</b>${Math.max(30,(scheduled.ids||[]).length*6)} min<small>EST. TIME</small>`;
    if(meta[1])meta[1].innerHTML=`<b>▥</b>${(scheduled.ids||[]).length} exercises<small>TOTAL</small>`;
    const list=card.querySelector('.lh-overview ul');
    if(list && muscles.length)list.innerHTML=Object.entries(groups).slice(0,5).map(([m,n])=>`<li>${m.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}: ${n} exercise${n===1?'':'s'}</li>`).join('');
  }

  function replaceVisibleBrand(text){
    return String(text||'').replace(/LIFTOVA/gi,'MYLIFTCOACH').replace(/\bPRISM\b/g,'MYLIFTCOACH');
  }

  function applyBranding(root=document){
    root.querySelectorAll('.prism-avatar img[src*="app-icon"],.prism-avatar-option img[src*="app-icon"]').forEach(img=>{img.src='images/liftova-icon.svg';img.alt='MYLIFTCOACH';});
    const area=document.getElementById('prismLocalProfile');
    if(area){
      const walker=document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(n=>{const next=replaceVisibleBrand(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;});
    }
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
    syncHomeWorkoutCard();
  }

  function openHomeWorkout(){
    const card=document.querySelector('.liftova-home-shell .lh-workout');
    if(!card)return false;
    if(card.dataset.liftovaScheduleKind==='rest')return true;
    try{
      if(card.dataset.liftovaScheduleKind==='suggested' && card.dataset.liftovaScheduleIndex!=='' && typeof openSuggestedWorkout==='function'){
        openSuggestedWorkout(Number(card.dataset.liftovaScheduleIndex));return true;
      }
      if(card.dataset.liftovaScheduleKind==='preset' && card.dataset.liftovaScheduleKey && typeof openPresetWorkout==='function'){
        openPresetWorkout(card.dataset.liftovaScheduleKey);return true;
      }
    }catch(err){console.warn('MYLIFTCOACH scheduled workout-card navigation fallback',err);}
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
    }catch(err){console.warn('MYLIFTCOACH workout-card navigation fallback',err);}
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
    if(typeof window.prismAvatarMarkup==='function'&&!window.prismAvatarMarkup.__myliftcoach){
      const original=window.prismAvatarMarkup;
      const branded=function(id){if((id??window.prismLocalProfile?.avatarId)==='prism')return brandIcon();return original(id)};
      branded.__myliftcoach=true;window.prismAvatarMarkup=branded;
    }
    applyBranding();
    wireInteractions();
    const host=document.body;
    if(host&&!host.__myliftcoachBrandObserver){
      let queued=false;
      const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyBranding();});});
      observer.observe(host,{childList:true,subtree:true});
      host.__myliftcoachBrandObserver=observer;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  setTimeout(install,0);
})();