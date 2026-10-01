// MYLIFTCOACH home sequencing/rest-day correction.
// Keeps the dashboard aligned with the most recently completed workout and suppresses workout details on rest days.
(() => {
  'use strict';

  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const workouts=()=>{const v=readJson('customWorkoutsV5',[]);return Array.isArray(v)?v.filter(w=>w&&w.name&&Array.isArray(w.exercises)):[]};
  const history=()=>{for(const key of ['workoutHistoryV52','workoutHistory']){const v=readJson(key,null);if(Array.isArray(v))return v}return []};
  const sessionTime=s=>{
    const raw=s?.completedAt||s?.timestamp||s?.date||s?.day;
    const t=raw?new Date(raw).getTime():NaN;
    return Number.isFinite(t)?t:0;
  };
  const latestMatching=(sessions,predicate)=>{
    let best=null,bestTime=-1,bestIndex=-1;
    sessions.forEach((session,index)=>{
      if(!predicate(session))return;
      const t=sessionTime(session);
      if(t>bestTime||(t===bestTime&&index>bestIndex)){best=session;bestTime=t;bestIndex=index}
    });
    return best;
  };
  const rowsForIds=ids=>{
    if(!Array.isArray(window.exerciseLibrary))return [];
    return (ids||[]).map(id=>window.exerciseLibrary.find(ex=>String(ex.id)===String(id))).filter(Boolean);
  };
  const muscleSummary=rows=>{
    const counts={};
    rows.forEach(ex=>String(ex?.muscle||'').split(/[·,\/]/).map(x=>x.trim()).filter(Boolean).forEach(m=>counts[m]=(counts[m]||0)+1));
    return {text:Object.keys(counts).slice(0,4).join(' · '),entries:Object.entries(counts).slice(0,5)};
  };

  function resolveNextWorkout(){
    const sessions=history();
    const customs=workouts();
    const customKeys=new Set(customs.map(w=>'custom-'+w.id));
    const latestCustom=latestMatching(sessions,s=>customKeys.has(s?.workoutKey));

    let plans=[];
    try{
      if(window.workoutGoals&&!window.workoutGoals.skipped){
        if(window.workoutGoals.basic&&window.presetWorkouts){
          plans=Object.entries(window.presetWorkouts).map(([key,day])=>({workoutKey:'preset-'+key,name:day.title,ids:day.exercises,kind:'plan'}));
        }else if(typeof window.suggestedWorkouts==='function'){
          plans=window.suggestedWorkouts(window.workoutGoals).map((day,index)=>({workoutKey:typeof window.suggestedWorkoutKey==='function'?window.suggestedWorkoutKey(index):'suggested-'+index,name:day.title,ids:day.exercises,kind:'plan'}));
        }
      }
      if(!plans.length&&window.presetWorkouts){
        plans=Object.entries(window.presetWorkouts).map(([key,day])=>({workoutKey:'preset-'+key,name:day.title,ids:day.exercises,kind:'plan'}));
      }
    }catch{}

    const planKeys=new Set(plans.map(p=>p.workoutKey));
    const latestPlan=latestMatching(sessions,s=>planKeys.has(s?.workoutKey));
    const customTime=latestCustom?sessionTime(latestCustom):-1;
    const planTime=latestPlan?sessionTime(latestPlan):-1;

    // Follow whichever workout family the user actually logged most recently.
    if(latestCustom&&customTime>=planTime&&customs.length){
      const i=customs.findIndex(w=>'custom-'+w.id===latestCustom.workoutKey);
      const next=customs[(i+1)%customs.length]||customs[0];
      const rows=rowsForIds(next.exercises);
      return rows.length?{name:next.name,rows,kind:'custom'}:null;
    }
    if(plans.length){
      const i=latestPlan?plans.findIndex(p=>p.workoutKey===latestPlan.workoutKey):-1;
      const next=plans[(i+1)%plans.length]||plans[0];
      const rows=rowsForIds(next.ids);
      return rows.length?{name:next.name,rows,kind:'plan'}:null;
    }
    if(customs.length){
      const next=customs[0],rows=rowsForIds(next.exercises);
      return rows.length?{name:next.name,rows,kind:'custom'}:null;
    }
    return null;
  }

  function apply(){
    const shell=document.querySelector('.liftova-home-shell');
    const card=shell?.querySelector('.lh-workout');
    const title=card?.querySelector('h2');
    if(!card||!title)return;

    const resolved=resolveNextWorkout();
    if(resolved){
      title.textContent=String(resolved.name||'Today’s Workout').toUpperCase();
      const summary=muscleSummary(resolved.rows);
      const desc=card.querySelector(':scope > p');
      if(desc&&summary.text)desc.textContent=summary.text;
      const overview=card.querySelector('.lh-overview');
      if(overview){
        overview.style.display='';
        const ul=overview.querySelector('ul');
        if(ul)ul.innerHTML=summary.entries.map(([m,n])=>`<li>${m}: ${n} exercise${n===1?'':'s'}</li>`).join('');
      }
      const activeDay=shell.querySelector('.lh-day.active span');
      if(activeDay)activeDay.textContent=resolved.name||'Workout';
    }

    // A visible Rest Day must never show stale exercise/muscle overview content.
    const isRest=/\brest\s*day\b/i.test(title.textContent||'');
    if(isRest){
      const desc=card.querySelector(':scope > p');
      if(desc)desc.textContent='Recovery · No workout scheduled';
      card.querySelector('.lh-meta')?.setAttribute('hidden','');
      const overview=card.querySelector('.lh-overview');
      if(overview){overview.setAttribute('hidden','');overview.style.display='none'}
    }else{
      card.querySelector('.lh-meta')?.removeAttribute('hidden');
      const overview=card.querySelector('.lh-overview');
      if(overview){overview.removeAttribute('hidden');overview.style.display=''}
    }
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  window.addEventListener('storage',queue);
  const observer=new MutationObserver(queue);
  if(document.body)observer.observe(document.body,{subtree:true,childList:true});
  else document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{subtree:true,childList:true}),{once:true});
})();
