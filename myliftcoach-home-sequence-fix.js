// MYLIFTCOACH Home schedule correction.
// The week strip and Today's Workout are driven by the active plan + local weekday.
// Custom workouts are only used when there is no active preset/suggested plan.
(() => {
  'use strict';

  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const customWorkouts=()=>{const v=readJson('customWorkoutsV5',[]);return Array.isArray(v)?v.filter(w=>w&&w.name&&Array.isArray(w.exercises)&&w.exercises.length):[]};

  const rowsForIds=ids=>{
    try{
      if(typeof exerciseLibrary==='undefined'||!Array.isArray(exerciseLibrary))return [];
      return (ids||[]).map(id=>exerciseLibrary.find(ex=>String(ex.id)===String(id))).filter(Boolean);
    }catch{return []}
  };

  const muscleSummary=rows=>{
    const counts={};
    rows.forEach(ex=>String(ex?.muscle||'').split(/[·,\/]/).map(x=>x.trim()).filter(Boolean).forEach(m=>counts[m]=(counts[m]||0)+1));
    return {text:Object.keys(counts).slice(0,4).join(' · '),entries:Object.entries(counts).slice(0,5)};
  };

  function activePlan(){
    try{
      let plans=[];
      if(typeof workoutGoals!=='undefined'&&workoutGoals&&!workoutGoals.skipped){
        if(workoutGoals.basic&&typeof presetWorkouts!=='undefined'){
          plans=Object.entries(presetWorkouts).map(([key,day])=>({workoutKey:'preset-'+key,name:day.title,ids:day.exercises,kind:'plan'}));
        }else if(typeof suggestedWorkouts==='function'){
          plans=suggestedWorkouts(workoutGoals).map((day,index)=>({workoutKey:typeof suggestedWorkoutKey==='function'?suggestedWorkoutKey(index):'suggested-'+index,name:day.title,ids:day.exercises,kind:'plan'}));
        }
      }
      if(!plans.length&&typeof presetWorkouts!=='undefined'){
        plans=Object.entries(presetWorkouts).map(([key,day])=>({workoutKey:'preset-'+key,name:day.title,ids:day.exercises,kind:'plan'}));
      }
      return plans;
    }catch{return []}
  }

  function trainingSlots(count){
    if(count>=7)return [0,1,2,3,4,5,6];
    if(count===6)return [0,1,2,3,4,5];
    if(count===5)return [0,1,2,3,4];
    if(count===4)return [0,1,3,4];
    if(count===3)return [0,2,4];
    if(count===2)return [0,3];
    if(count===1)return [0];
    return [];
  }

  const compactName=name=>String(name||'Workout').replace(/^day\s*\d+\s*[—–:\-]\s*/i,'').trim()||'Workout';

  function weeklySchedule(){
    const plans=activePlan();
    const customs=customWorkouts();
    const source=plans.length?plans:customs.map(w=>({workoutKey:'custom-'+w.id,name:w.name,ids:w.exercises,kind:'custom'}));
    if(!source.length)return Array(7).fill(null);

    let requested=source.length;
    try{
      if(typeof workoutGoals!=='undefined'&&workoutGoals&&!workoutGoals.skipped){
        const days=Number(workoutGoals.days||workoutGoals.trainingDays);
        if(Number.isFinite(days)&&days>0)requested=Math.min(days,source.length);
      }
    }catch{}
    requested=Math.max(1,Math.min(7,requested));
    const slots=trainingSlots(requested);
    const week=Array(7).fill(null);
    slots.forEach((weekday,index)=>{
      const workout=source[index%source.length];
      if(workout)week[weekday]={...workout,rows:rowsForIds(workout.ids)};
    });
    return week;
  }

  function ensureWorkoutDetails(card,workout){
    const rows=workout?.rows||[];
    const summary=muscleSummary(rows);
    const title=card.querySelector('h2');
    const desc=card.querySelector(':scope > p');
    if(title)title.textContent=String(workout?.name||'Today’s Workout').toUpperCase();
    if(desc)desc.textContent=summary.text||'Training day';

    let meta=card.querySelector('.lh-meta');
    if(!meta){
      meta=document.createElement('div');
      meta.className='lh-meta';
      const overview=card.querySelector('.lh-overview');
      if(overview)overview.before(meta);else card.appendChild(meta);
    }
    const count=rows.length;
    const minutes=Math.max(30,count*6);
    meta.innerHTML=`<span><b>◴</b>${minutes} min<small>EST. TIME</small></span><span><b>▥</b>${count||'—'} exercises<small>TOTAL</small></span><span><b>◎</b>Hypertrophy<small>FOCUS</small></span>`;
    meta.removeAttribute('hidden');
    meta.style.display='';

    let overview=card.querySelector('.lh-overview');
    if(!overview){
      overview=document.createElement('div');
      overview.className='lh-overview';
      overview.innerHTML='<strong>WORKOUT OVERVIEW</strong><ul></ul>';
      card.appendChild(overview);
    }
    const ul=overview.querySelector('ul');
    if(ul)ul.innerHTML=summary.entries.length?summary.entries.map(([m,n])=>`<li>${m}: ${n} exercise${n===1?'':'s'}</li>`).join(''):'<li>Workout scheduled</li>';
    overview.removeAttribute('hidden');
    overview.style.display='';
  }

  function showRestDay(card){
    const title=card.querySelector('h2');
    const desc=card.querySelector(':scope > p');
    if(title)title.textContent='REST DAY';
    if(desc)desc.textContent='Recovery · No workout scheduled';
    const meta=card.querySelector('.lh-meta');
    if(meta){meta.setAttribute('hidden','');meta.style.display='none'}
    const overview=card.querySelector('.lh-overview');
    if(overview){overview.setAttribute('hidden','');overview.style.display='none'}
  }

  function apply(){
    const shell=document.querySelector('.liftova-home-shell');
    const card=shell?.querySelector('.lh-workout');
    if(!shell||!card)return;

    const schedule=weeklySchedule();
    const todayIndex=(new Date().getDay()+6)%7; // Monday=0 … Sunday=6, local time.
    const days=[...shell.querySelectorAll('.lh-day')];
    days.forEach((day,index)=>{
      const label=day.querySelector('span');
      if(label)label.textContent=schedule[index]?compactName(schedule[index].name):'Rest';
      day.classList.toggle('active',index===todayIndex);
    });

    const todayWorkout=schedule[todayIndex];
    if(todayWorkout)ensureWorkoutDetails(card,todayWorkout);
    else showRestDay(card);
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
