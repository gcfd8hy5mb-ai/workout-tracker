// MYLIFTCOACH Workout-tab/detail module. Owns only workout/exercise detail presentation.
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const ex=id=>{try{return typeof getExercise==='function'?getExercise(id):null}catch{return null}};
  const display=e=>{const n=String(e?.name||'Exercise');return /machine/i.test(n)&&!/\(machine\)/i.test(n)?n.replace(/\s*machine\s*$/i,'')+' (Machine)':n};
  const profile=e=>window.LiftovaAnatomy?.profile(e)||{primaryLabels:[e?.muscle||'Target'],secondaryLabels:[]};
  const anatomyCache=new Map();
  const anatomy=(e,size='compact')=>{
    const key=[e?.id||'',e?.name||'',e?.muscle||'',size].join('|');
    if(anatomyCache.has(key))return anatomyCache.get(key);
    const markup=window.LiftovaAnatomy?.render?.(e,{size})||'';
    anatomyCache.set(key,markup);
    return markup;
  };
  const fallbackScheme=e=>/fly|lateral|triceps/i.test(String(e?.name||''))?{sets:3,reps:'12',rest:'45–60s'}:{sets:3,reps:'10',rest:'60–90s'};
  const restLabel=seconds=>Number(seconds)>=60?(Number(seconds)%60?String(Math.floor(Number(seconds)/60))+'m '+String(Number(seconds)%60)+'s':String(Number(seconds)/60)+'m'):String(Number(seconds)||60)+'s';
  const itemScheme=(item,e)=>item?.prescription?{sets:item.prescription.sets||3,reps:item.prescription.reps||'8–10',rest:restLabel(item.prescription.restSeconds||90)}:fallbackScheme(e);
  const icon=n=>({back:'‹',more:'•••'}[n]||'');
  function addStyles(){
    if(typeof document.querySelector!=='function'||typeof document.createElement!=='function'||!document.head?.appendChild)return;
    if(document.querySelector('link[data-myliftcoach-workout-detail]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href='liftova-reference-v3.css?v=6';l.dataset.myliftcoachWorkoutDetail='true';document.head.appendChild(l);
  }
  function scheduledItem(){
    try{
      const week=typeof window.myliftcoachWeeklySchedule==='function'?window.myliftcoachWeeklySchedule():null;
      const dayIndex=(new Date().getDay()+6)%7;
      const current=Array.isArray(week)?week[dayIndex]:null;
      if(!current||!Array.isArray(current.ids)||!current.ids.length)return null;
      const workoutKey=String(current.workoutKey||'');
      const base={title:current.name||'Workout',ids:current.ids.filter(id=>!!ex(id)),workoutKey};
      if(!base.ids.length)return null;
      if(current.kind==='custom'&&Number.isInteger(current.customIndex))return {...base,kind:'custom',index:current.customIndex};
      if(workoutKey.startsWith('preset-'))return {...base,kind:'preset',key:workoutKey.slice('preset-'.length)};
      const suggested=workoutKey.match(/-day(\d+)$/);
      if(current.kind==='plan'&&suggested){
        const plan=typeof ensureGeneratedProgram==='function'?ensureGeneratedProgram():null;
        return {...base,kind:'suggested',index:Math.max(0,Number(suggested[1])-1),prescription:plan?.prescription||null,goal:plan?.focusLabel||'Workout'};
      }
      return {...base,kind:'scheduled',prescription:typeof ensureGeneratedProgram==='function'?ensureGeneratedProgram()?.prescription||null:null,goal:typeof ensureGeneratedProgram==='function'?ensureGeneratedProgram()?.focusLabel||'Workout':'Workout'};
    }catch{return null}
  }
  function openHistory(item){
    try{
      window.prismSelectedWorkoutKey=item?.workoutKey||item?.key||null;
      window.prismSelectedWorkoutTitle=item?.title||'Workout';
      if(typeof window.showGlobalHistory==='function'){window.showGlobalHistory();return;}
      if(typeof window.showHistory==='function'){window.showHistory();return;}
      if(typeof window.showScreen==='function')window.showScreen('historyScreen');
    }catch(error){console.error('MYLIFTCOACH workout history could not open',error)}
  }
  function openProgression(item){
    try{
      window.prismSelectedWorkoutKey=item?.workoutKey||item?.key||null;
      window.prismSelectedWorkoutTitle=item?.title||'Workout';
      if(typeof window.showOverallProgress==='function'){window.showOverallProgress();return;}
      if(typeof window.showProgress==='function'){window.showProgress();return;}
      if(typeof window.showScreen==='function')window.showScreen('overallProgressScreen');
    }catch(error){console.error('MYLIFTCOACH workout progression could not open',error)}
  }
  function renderDetail(item){
    const area=document.getElementById('prismWorkoutDetail');if(!area||!item)return;const ids=(item.ids||[]).filter(id=>ex(id));
    const muscles=[...new Set(ids.flatMap(id=>profile(ex(id)).primaryLabels||[]))].slice(0,4);
    const muscleLine=muscles.length?muscles.join(' · '):'TODAY’S TRAINING';
    const minutes=Math.max(20,ids.length*10);
    const goal=item.goal||(item.kind==='suggested'&&typeof ensureGeneratedProgram==='function'?ensureGeneratedProgram()?.focusLabel:null)||(item.kind==='custom'?'Custom':'Workout');
    area.innerHTML=`<div class="lv3-detail-top"><button data-lv3-back>${icon('back')}</button><div><h2>${esc(String(item.title||'Workout').toUpperCase())}</h2><p>${esc(muscleLine.toUpperCase())}</p></div><button data-lv3-more aria-label="Open menu">${icon('more')}</button></div><div class="lv3-tabs" role="tablist" aria-label="Workout detail"><button class="active" type="button" role="tab" aria-selected="true">EXERCISES</button><button type="button" role="tab" data-lv3-history>HISTORY</button><button type="button" role="tab" data-lv3-progression>PROGRESSION</button></div><div class="lv3-workout-metrics"><div><b>${minutes} min</b><span>Estimated Time</span></div><div><b>${ids.length}</b><span>Exercises</span></div><div><b>${esc(goal)}</b><span>Goal</span></div></div><div class="lv3-exercise-list">${ids.map((id,i)=>{const e=ex(id),s=itemScheme(item,e),p=profile(e);return `<button class="lv3-exercise-row" type="button" data-exercise-id="${esc(id)}"><span class="lv3-ex-number">${i+1}</span><span class="lv3-ex-photo">${e?.image?`<img src="${esc(e.image)}" alt="${esc(display(e))}">`:''}</span>${anatomy(e,'compact')}<span class="lv3-ex-copy"><strong>${esc(display(e))}</strong><span class="lv3-muscle-chips"><i>${esc(p.primaryLabels.join(' / '))}</i>${p.secondaryLabels.map(m=>`<em>${esc(m)}</em>`).join('')}</span><small>• ${esc(e?.how||'Use a controlled range of motion.')}</small></span><span class="lv3-set-box"><b>${s.sets} × ${s.reps}</b><small>Rest ${s.rest}</small></span><span class="lv3-chevron">›</span></button>`}).join('')}</div><button class="lv3-start-workout" id="lv3DetailStart">▶ <b>START WORKOUT</b></button>`;
    document.getElementById('workoutDetailScreen')?.classList.add('lv3-workout-detail');
    area.querySelector('[data-lv3-back]')?.addEventListener('click',()=>window.goHome?.());
    area.querySelector('[data-lv3-more]')?.addEventListener('click',()=>window.openMenu?.());
    area.querySelector('[data-lv3-history]')?.addEventListener('click',()=>openHistory(item));
    area.querySelector('[data-lv3-progression]')?.addEventListener('click',()=>openProgression(item));
    area.querySelectorAll('[data-exercise-id]').forEach(b=>b.addEventListener('click',()=>window.showExerciseInfo?.(b.dataset.exerciseId,'workoutDetailScreen')));
    area.querySelector('#lv3DetailStart')?.addEventListener('click',()=>window.startPrismWorkout?.(item));
  }
  function renderExercise(id,returnTo){
    const e=ex(id),area=document.getElementById('prismExerciseInfo');if(!e||!area)return;const p=profile(e);
    area.innerHTML=`<div class="lv3-exercise-top"><button data-ex-back>${icon('back')}</button><h2>${esc(display(e))}</h2><button data-ex-more aria-label="Open menu">${icon('more')}</button></div><div class="lv3-tabs lv3-ex-tabs"><button class="active">OVERVIEW</button></div><section class="lv3-ex-panel active">${e.image?`<img class="lv3-detail-photo" src="${esc(e.image)}" alt="${esc(display(e))}">`:''}<div class="lv3-ex-name"><h3>${esc(display(e))}</h3><div class="lv3-muscle-chips"><i>${esc(p.primaryLabels.join(' / '))}</i>${p.secondaryLabels.map(m=>`<em>${esc(m)}</em>`).join('')}</div></div><div class="lv3-target-title">TARGET MUSCLES</div>${anatomy(e,'detail')}<button class="lv3-add-workout">▶ ADD TO WORKOUT</button></section>`;
    document.getElementById('exerciseInfoScreen')?.classList.add('lv3-exercise-info');area.querySelector('[data-ex-back]')?.addEventListener('click',()=>window.returnFromExerciseInfo?.());area.querySelector('[data-ex-more]')?.addEventListener('click',()=>window.openMenu?.());area.querySelector('.lv3-add-workout')?.addEventListener('click',()=>{if(returnTo==='workoutDetailScreen')window.returnFromExerciseInfo?.();else{window.showBuilder?.();if(!document.getElementById('builderScreen')?.classList.contains('hidden'))window.addBuilderExercise?.(e.id);}});
  }
  function startScheduledWorkout(item){try{activeWorkoutKey=item.workoutKey||'scheduled-'+((new Date().getDay()+6)%7);activeWorkoutTitle=item.title||'Workout';activeWorkoutExerciseIds=[...item.ids];activeCustomIndex=null;activeWorkoutPrescription=item.prescription||null;lastWorkoutContext={type:'scheduled',title:item.title,ids:[...item.ids],workoutKey:activeWorkoutKey};openWorkout(activeWorkoutTitle,activeWorkoutExerciseIds,false);return true}catch(error){console.error('MYLIFTCOACH scheduled workout could not start',error);return false}}
  let installed=false;
  function install(){
    if(installed)return;
    if(typeof showWorkouts!=='function')return;
    installed=true;addStyles();
    const baseDetail=typeof window.showPrismWorkoutDetail==='function'?window.showPrismWorkoutDetail:null;
    const baseExercise=typeof window.showExerciseInfo==='function'?window.showExerciseInfo:null;
    const baseWorkouts=window.showWorkouts,baseStart=window.startPrismWorkout;
    window.showPrismWorkoutDetail=function(item){
      if(!item||!Array.isArray(item.ids))return baseDetail?.apply(this,arguments);
      try{
        if(typeof prismDetailContext!=='undefined')prismDetailContext=item;
        if(typeof window.showScreen==='function')window.showScreen('workoutDetailScreen');
        else if(typeof showScreen==='function')showScreen('workoutDetailScreen');
        if(typeof window.setBottomNav==='function')window.setBottomNav('Workouts');
        else if(typeof setBottomNav==='function')setBottomNav('Workouts');
        renderDetail(item);
        return;
      }catch(error){
        console.error('MYLIFTCOACH direct workout detail render failed',error);
        return baseDetail?.apply(this,arguments);
      }
    };
    if(baseExercise)window.showExerciseInfo=function(id,returnTo){const result=baseExercise.apply(this,arguments);requestAnimationFrame(()=>renderExercise(id,returnTo));return result};
    window.showWorkouts=function(){const item=scheduledItem();if(item?.ids?.length){window.showPrismWorkoutDetail(item);return}return baseWorkouts.apply(this,arguments)};window.showWorkouts.__myliftcoachScheduledWorkout=true;window.showWorkouts.__legacyShowWorkouts=baseWorkouts;
    window.startPrismWorkout=function(item){if(item?.kind==='scheduled'&&startScheduledWorkout(item))return;return baseStart?.apply(this,arguments)};
    document.addEventListener('click',event=>{const start=event.target.closest?.('#lv3StartWorkout');if(start){const item=scheduledItem();if(!item)return;event.preventDefault();event.stopImmediatePropagation();window.startPrismWorkout?.(item);}},true);
    requestAnimationFrame(()=>{const browser=document.getElementById('workoutsScreen');if(browser&&!browser.classList.contains('hidden'))window.showWorkouts()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
