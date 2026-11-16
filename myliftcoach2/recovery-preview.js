/* MYLIFTCOACH 2.0 — read-only training recency / recorded session readiness. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCRecoveryPreview=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function summarize(history,exerciseCatalog,now=Date.now()){
 const groups=new Map(),checkins={Great:0,Normal:0,Tired:0},validSessions=[];
 const names=new Map((Array.isArray(exerciseCatalog)?exerciseCatalog:[]).filter(e=>e&&e.id).map(e=>[String(e.id),String(e.muscle||e.group||'')]));
 for(const session of Array.isArray(history)?history:[]){
  const at=Date.parse(session?.date||'');
  if(!Number.isFinite(at)||at>now||!Array.isArray(session.exercises))continue;
  validSessions.push(session);
  if(Object.prototype.hasOwnProperty.call(checkins,session.readiness))checkins[session.readiness]++;
  for(const exercise of session.exercises){
   if(!exercise||!Array.isArray(exercise.sets)||!exercise.sets.some(s=>Number(s?.weight)>0&&Number(s?.reps)>0))continue;
   const muscle=names.get(String(exercise.id||''));
   if(!muscle)continue;
   if(!groups.has(muscle)||groups.get(muscle)<at)groups.set(muscle,at);
  }
 }
 return {sessionCount:validSessions.length,recordedCheckins:checkins,
  muscles:[...groups].map(([name,lastTrained])=>({name,lastTrained,hoursAgo:Math.max(0,(now-lastTrained)/3600000),within72Hours:now-lastTrained<72*3600000})).sort((a,b)=>b.lastTrained-a.lastTrained||a.name.localeCompare(b.name))};
}
return Object.freeze({summarize});
});
