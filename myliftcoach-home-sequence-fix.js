// MYLIFTCOACH Home schedule correction + weekday editor.
// Single authority for the week strip and Today's Workout: custom workouts override presets.
(() => {
  'use strict';

  const OVERRIDES_KEY='myliftcoachWeeklyDayOverridesV1';
  const dayNames=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  let editingWeekday=null;

  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const customWorkouts=()=>{const v=readJson('customWorkoutsV5',[]);return Array.isArray(v)?v.filter(w=>w&&w.name&&Array.isArray(w.exercises)&&w.exercises.length):[]};
  const dayOverrides=()=>{const v=readJson(OVERRIDES_KEY,{});return v&&typeof v==='object'?v:{}};
  const saveOverrides=value=>localStorage.setItem(OVERRIDES_KEY,JSON.stringify(value));

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

  function customPlan(){
    return customWorkouts().map((workout,index)=>({
      workoutKey:'custom-'+workout.id,
      name:workout.name,
      ids:[...workout.exercises],
      kind:'custom',
      customIndex:index
    }));
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
  const setText=(element,value)=>{if(element&&element.textContent!==value)element.textContent=value};
  const setMarkup=(element,value)=>{if(element&&element.innerHTML!==value)element.innerHTML=value};

  function requestedTrainingDays(sourceLength){
    let requested=sourceLength;
    try{
      if(typeof workoutGoals!=='undefined'&&workoutGoals&&!workoutGoals.skipped){
        const days=Number(workoutGoals.days||workoutGoals.trainingDays);
        if(Number.isFinite(days)&&days>0)requested=days;
      }
    }catch{}
    return Math.max(1,Math.min(7,requested||1));
  }

  function baseWeeklySchedule(){
    // Once the user creates at least one custom workout, custom workouts become
    // the active program source. Preset/suggested plans are fallback only.
    const customs=customPlan();
    const plans=activePlan();
    const source=customs.length?customs:plans;
    if(!source.length)return Array(7).fill(null);
    const requested=requestedTrainingDays(source.length);
    const slots=trainingSlots(requested);
    const week=Array(7).fill(null);
    slots.forEach((weekday,index)=>{
      const workout=source[index%source.length];
      if(workout)week[weekday]={...workout,rows:rowsForIds(workout.ids)};
    });
    return week;
  }

  function weeklySchedule(){
    const week=baseWeeklySchedule();
    const overrides=dayOverrides();
    for(let i=0;i<7;i++){
      const override=overrides[i];
      if(!override)continue;
      if(override.rest){week[i]=null;continue}
      if(Array.isArray(override.ids))week[i]={workoutKey:`weekday-${i}`,name:override.name||`${dayNames[i]} Workout`,ids:[...override.ids],rows:rowsForIds(override.ids),kind:'override'};
    }
    return week;
  }

  function clearCardAction(card){
    delete card.dataset.customWorkoutIndex;
    delete card.dataset.scheduledWorkoutKey;
    delete card.dataset.scheduledWorkoutKind;
    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-label');
  }

  function ensureWorkoutDetails(card,workout){
    const rows=workout?.rows||[];
    const summary=muscleSummary(rows);
    const title=card.querySelector('h2');
    const desc=card.querySelector(':scope > p');
    setText(title,String(workout?.name||'Today’s Workout').toUpperCase());
    setText(desc,summary.text||'Training day');
    let meta=card.querySelector('.lh-meta');
    if(!meta){meta=document.createElement('div');meta.className='lh-meta';const overview=card.querySelector('.lh-overview');if(overview)overview.before(meta);else card.appendChild(meta)}
    const count=rows.length,minutes=Math.max(30,count*6);
    setMarkup(meta,`<span><b>◴</b>${minutes} min<small>EST. TIME</small></span><span><b>▥</b>${count||'—'} exercises<small>TOTAL</small></span><span><b>◎</b>Hypertrophy<small>FOCUS</small></span>`);
    meta.removeAttribute('hidden');meta.style.display='';
    let overview=card.querySelector('.lh-overview');
    if(!overview){overview=document.createElement('div');overview.className='lh-overview';overview.innerHTML='<strong>WORKOUT OVERVIEW</strong><ul></ul>';card.appendChild(overview)}
    const ul=overview.querySelector('ul');
    setMarkup(ul,summary.entries.length?summary.entries.map(([m,n])=>`<li>${m}: ${n} exercise${n===1?'':'s'}</li>`).join(''):'<li>Workout scheduled</li>');
    overview.removeAttribute('hidden');overview.style.display='';
    clearCardAction(card);
    card.dataset.scheduledWorkoutKey=workout.workoutKey||'';
    card.dataset.scheduledWorkoutKind=workout.kind||'';
    if(workout.kind==='custom'&&Number.isInteger(workout.customIndex)){
      card.dataset.customWorkoutIndex=String(workout.customIndex);
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`Open ${workout.name}`);
    }
  }

  function showRestDay(card){
    const title=card.querySelector('h2'),desc=card.querySelector(':scope > p');
    setText(title,'REST DAY');
    setText(desc,'Recovery · No workout scheduled');
    const meta=card.querySelector('.lh-meta');if(meta){meta.setAttribute('hidden','');meta.style.display='none'}
    const overview=card.querySelector('.lh-overview');if(overview){overview.setAttribute('hidden','');overview.style.display='none'}
    clearCardAction(card);
  }

  function openDisplayedCustom(event){
    const card=event.target.closest?.('.liftova-home-shell .lh-workout[data-custom-workout-index]');
    if(!card)return;
    if(event.type==='keydown'&&event.key!=='Enter'&&event.key!==' ')return;
    if(event.type==='keydown')event.preventDefault();
    const index=Number(card.dataset.customWorkoutIndex);
    if(!Number.isInteger(index))return;
    try{if(typeof openCustomWorkout==='function')openCustomWorkout(index)}catch(error){console.error('MYLIFTCOACH could not open scheduled custom workout',error)}
  }

  function ensureEditorActions(){
    const screen=document.getElementById('builderScreen');
    const save=screen?.querySelector('.save-button');
    if(!screen||!save)return;
    let actions=screen.querySelector('.myliftcoach-day-editor-actions');
    if(!actions){
      actions=document.createElement('div');actions.className='myliftcoach-day-editor-actions';
      actions.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px';
      const rest=document.createElement('button');rest.type='button';rest.textContent='Make Rest Day';rest.style.cssText='min-height:46px;border:1px solid #4b345f;border-radius:12px;background:#15101d;color:#d5c4e6;font-weight:750';
      rest.onclick=()=>{
        if(editingWeekday===null)return;
        const overrides=dayOverrides();overrides[editingWeekday]={rest:true};saveOverrides(overrides);editingWeekday=null;
        if(typeof goHome==='function')goHome();else if(typeof showScreen==='function')showScreen('home');
        queue();
      };
      const reset=document.createElement('button');reset.type='button';reset.textContent='Reset to Plan';reset.style.cssText='min-height:46px;border:1px solid #4b345f;border-radius:12px;background:#0d0b11;color:#bca6d0;font-weight:750';
      reset.onclick=()=>{
        if(editingWeekday===null)return;
        const overrides=dayOverrides();delete overrides[editingWeekday];saveOverrides(overrides);editingWeekday=null;
        if(typeof goHome==='function')goHome();else if(typeof showScreen==='function')showScreen('home');
        queue();
      };
      actions.append(rest,reset);save.after(actions);
    }
    actions.hidden=editingWeekday===null;
  }

  function openDayEditor(index){
    const schedule=weeklySchedule();
    const workout=schedule[index];
    editingWeekday=index;
    try{builderSelected=workout?.ids?[...workout.ids]:[]}catch{}
    const name=document.getElementById('customWorkoutName');
    const search=document.getElementById('builderSearch');
    if(name)name.value=workout?.name||`${dayNames[index]} Workout`;
    if(search)search.value='';
    if(typeof showScreen==='function')showScreen('builderScreen');
    if(typeof setBottomNav==='function')setBottomNav('Workouts');
    if(typeof renderBuilderSelected==='function')renderBuilderSelected();
    if(typeof renderBuilderLibrary==='function')renderBuilderLibrary();
    const save=document.querySelector('#builderScreen .save-button');if(save)save.textContent=`Save ${dayNames[index]}`;
    ensureEditorActions();
  }

  const originalSaveCustomWorkout=window.saveCustomWorkout;
  if(typeof originalSaveCustomWorkout==='function'){
    window.saveCustomWorkout=function(...args){
      if(editingWeekday===null)return originalSaveCustomWorkout.apply(this,args);
      const name=document.getElementById('customWorkoutName')?.value.trim()||`${dayNames[editingWeekday]} Workout`;
      let ids=[];try{ids=[...(builderSelected||[])]}catch{}
      if(!ids.length){alert('Add at least one exercise, or choose Make Rest Day.');return}
      const overrides=dayOverrides();overrides[editingWeekday]={name,ids};saveOverrides(overrides);editingWeekday=null;
      const save=document.querySelector('#builderScreen .save-button');if(save)save.textContent='Save Workout';
      ensureEditorActions();
      if(typeof goHome==='function')goHome();else if(typeof showScreen==='function')showScreen('home');
      queue();
    };
  }

  function bindDay(day,index){
    if(day.dataset.myliftcoachDayEditor==='1')return;
    day.dataset.myliftcoachDayEditor='1';day.setAttribute('role','button');day.setAttribute('tabindex','0');day.setAttribute('aria-label',`View or edit ${dayNames[index]} workout`);
    day.style.cursor='pointer';
    day.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openDayEditor(index)});
    day.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDayEditor(index)}});
  }

  function apply(){
    const shell=document.querySelector('.liftova-home-shell');
    const card=shell?.querySelector('.lh-workout');
    if(!shell||!card)return;
    const schedule=weeklySchedule();
    const todayIndex=(new Date().getDay()+6)%7;
    const days=[...shell.querySelectorAll('.lh-day')];
    days.forEach((day,index)=>{
      const label=day.querySelector('span');setText(label,schedule[index]?compactName(schedule[index].name):'Rest');
      day.classList.toggle('active',index===todayIndex);bindDay(day,index);
    });
    const todayWorkout=schedule[todayIndex];if(todayWorkout)ensureWorkoutDetails(card,todayWorkout);else showRestDay(card);
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  window.myliftcoachWeeklySchedule=weeklySchedule;
  window.myliftcoachRefreshHomeSchedule=queue;
  document.addEventListener('click',openDisplayedCustom);
  document.addEventListener('keydown',openDisplayedCustom);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',queue,{once:true});else queue();
  window.addEventListener('storage',queue);
  const observer=new MutationObserver(queue);
  const observe=()=>{const home=document.getElementById('home');if(home)observer.observe(home,{subtree:true,childList:true})};
  if(document.body)observe();
  else document.addEventListener('DOMContentLoaded',observe,{once:true});
})();
