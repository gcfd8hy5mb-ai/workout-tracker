/* LIFTOVA Coach v4 — proactive coaching-cycle orchestration.
 * Reads existing Coach/Adaptive systems; never owns progression decisions.
 */
const LIFTOVA_COACH_CYCLE_VERSION='4.0';
const LIFTOVA_COACH_CYCLE_KEY='liftovaCoachCycleV4';

function liftovaCycleSafe(fn,f=null){try{const v=fn();return v==null?f:v}catch{return f}}
function liftovaCycleState(){try{return JSON.parse(localStorage.getItem(LIFTOVA_COACH_CYCLE_KEY)||'{}')||{}}catch{return{}}}
function liftovaCycleSave(patch){const next={...liftovaCycleState(),...patch,updatedAt:new Date().toISOString()};localStorage.setItem(LIFTOVA_COACH_CYCLE_KEY,JSON.stringify(next));return next}
function liftovaCycleHasPro(){return liftovaCycleSafe(()=>typeof canAccessFeature==='function'&&canAccessFeature('advanced_analytics'),false)===true}
function liftovaCycleHistory(){return liftovaCycleSafe(()=>JSON.parse(localStorage.getItem('workoutHistoryV52')||'[]'),[]).filter(Boolean)}
function liftovaCycleLatest(){return [...liftovaCycleHistory()].sort((a,b)=>Number(b?.ts||b?.date||0)-Number(a?.ts||a?.date||0))[0]||null}
function liftovaCycleActive(){return liftovaCycleSafe(()=>typeof prismAskActiveSession==='function'?prismAskActiveSession():null,null)}
function liftovaCycleContext(){
  const coach=liftovaCycleSafe(()=>typeof prismCoachAnalyze==='function'?prismCoachAnalyze():null,null);
  const adaptive=liftovaCycleSafe(()=>typeof prismAdaptiveNextSession==='function'?prismAdaptiveNextSession():null,null);
  const athlete=liftovaCycleSafe(()=>typeof prismAthleteCoachContext==='function'?prismAthleteCoachContext():null,null);
  const active=liftovaCycleActive();
  const latest=liftovaCycleLatest();
  const weekly=liftovaCycleSafe(()=>typeof prismAskWeeklyState==='function'?prismAskWeeklyState({coach,adaptive,athlete,active,latest}):null,null);
  return{coach,adaptive,athlete,active,latest,weekly,signal:coach?.snapshot?.checkinSignal||null,prescriptions:adaptive?.prescriptions||coach?.adaptivePrescriptions||[]};
}
function liftovaCyclePhase(c){
  if(c.active?.key)return'during';
  const latestTs=Number(c.latest?.ts||c.latest?.date||0);
  if(latestTs&&Date.now()-latestTs<1000*60*60*8)return'after';
  if(c.weekly?.needsCheckin)return'weekly';
  return'before';
}
function liftovaCyclePriority(c){
  const ps=c.prescriptions||[];
  return ps.find(p=>p.status==='plateau_hold')||ps.find(p=>p.status==='increase')||ps[0]||null;
}
function liftovaCycleGuidance(){
  if(!liftovaCycleHasPro())return null;
  const c=liftovaCycleContext(),phase=liftovaCyclePhase(c),p=liftovaCyclePriority(c),signal=c.signal;
  let title='Coach plan',message='Your current plan is ready.',reason='Coach is using your saved LIFTOVA training context.';
  if(phase==='during'){
    const done=Number(c.active?.completedSets)||0,left=Number(c.active?.remainingSets)||0;
    title='Live workout coaching';
    message=`${done} working set${done===1?'':'s'} complete · ${left} remaining. ${signal?.load==='conservative'?'Keep reps clean and do not force progression today.':'Follow the current Adaptive targets while performance stays strong.'}`;
    reason='This uses live set completion plus the current recovery signal. Completed work and Adaptive targets are not rewritten.';
  }else if(phase==='after'){
    const name=c.latest?.title||c.latest?.workout||'workout';
    title='Workout review';
    message=`${name} is logged. ${p?`Next priority: ${p.name}${p.status?` — ${String(p.status).replaceAll('_',' ')}`:''}.`:'Adaptive Programming will use this result when enough exercise data is available.'}`;
    reason='Workout history records what happened; Adaptive Programming remains responsible for the next progression decision.';
  }else if(phase==='weekly'){
    title='Weekly Coach check-in';
    message='Your training week needs an updated recovery and availability check-in before Coach finalizes the next-week emphasis.';
    reason='Weekly availability and recovery can change scheduling guidance without changing your underlying progression history.';
  }else{
    title='Next workout plan';
    if(p)message=`Start with your current Adaptive priority: ${p.name}${Number(p.targetWeight)>0?` at ${p.targetWeight} lb`:''}${p.repMin?` for ${p.workingSets||4} × ${p.repMin}–${p.repMax||p.repMin}`:''}.`;
    if(signal?.load==='conservative')message+=' Recovery is currently conservative, so quality takes priority over forcing increases.';
    reason='This combines the authoritative Adaptive prescription with current recovery and weekly context.';
  }
  return{version:LIFTOVA_COACH_CYCLE_VERSION,phase,title,message,reason,createdAt:new Date().toISOString(),context:c};
}
function liftovaCycleFingerprint(g){if(!g)return'';return[g.phase,g.title,g.message].join('|')}
function liftovaCycleShouldSurface(g){
  if(!g)return false;
  const s=liftovaCycleState(),fp=liftovaCycleFingerprint(g);
  if(s.lastFingerprint!==fp)return true;
  const age=Date.now()-Number(s.lastShownAt||0);
  return age>1000*60*60*12;
}
function liftovaCycleAcknowledge(g){if(g)liftovaCycleSave({lastFingerprint:liftovaCycleFingerprint(g),lastShownAt:Date.now(),lastPhase:g.phase})}
function liftovaCycleRender(){
  const host=document.getElementById('liftovaCoachCycle');if(!host)return;
  if(!liftovaCycleHasPro()){host.innerHTML='';return}
  const g=liftovaCycleGuidance();if(!g){host.innerHTML='';return}
  host.innerHTML=`<div class="card prism-coach-decision"><span class="journey-eyebrow">LIFTOVA PRO · COACH CYCLE</span><h3>${escapeHTML(g.title)}</h3><p><strong>${escapeHTML(g.message)}</strong></p><p class="small">Why: ${escapeHTML(g.reason)}</p><button type="button" onclick="liftovaCycleAcknowledge(liftovaCycleGuidance());this.closest('.prism-coach-decision').style.display='none'">Got it</button></div>`;
}
function liftovaCycleMount(){
  const screen=document.getElementById('overallProgressScreen');if(!screen)return;
  let host=document.getElementById('liftovaCoachCycle');
  if(!host){host=document.createElement('div');host.id='liftovaCoachCycle';const ask=document.getElementById('prismAsk');ask?ask.insertAdjacentElement('beforebegin',host):screen.appendChild(host)}
  const g=liftovaCycleGuidance();
  if(g&&liftovaCycleShouldSurface(g))liftovaCycleRender();else host.innerHTML='';
}
function liftovaCycleEvent(type,detail={}){
  const g=liftovaCycleGuidance();liftovaCycleSave({lastEvent:type,lastEventAt:Date.now(),lastEventDetail:detail});
  if(g&&liftovaCycleShouldSurface(g))liftovaCycleRender();
  return g;
}
window.liftovaCycleGuidance=liftovaCycleGuidance;
window.liftovaCycleMount=liftovaCycleMount;
window.liftovaCycleEvent=liftovaCycleEvent;
window.liftovaCycleAcknowledge=liftovaCycleAcknowledge;

if(typeof showOverallProgress==='function'&&!showOverallProgress.__liftovaCycle){const original=showOverallProgress;showOverallProgress=function(){original();liftovaCycleMount()};showOverallProgress.__liftovaCycle=true}
