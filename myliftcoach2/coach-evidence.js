/* Factual, read-only original-workout evidence for a future Coach migration.
   No fatigue, readiness, exercise prescription or adaptive-plan mutation. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCOriginalCoachEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function summarize(history){
  const sessions=(Array.isArray(history)?history:[]).filter(s=>s&&Number.isFinite(Date.parse(s.date))&&Array.isArray(s.exercises)).slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  const exercises=new Map(),days=new Set();
  let sets=0,volume=0;
  for(const session of sessions){
   days.add(new Date(session.date).toISOString().slice(0,10));
   for(const ex of session.exercises){
    if(!ex||!ex.id||!Array.isArray(ex.sets))continue;
    let work=exercises.get(ex.id);
    if(!work){work={id:String(ex.id),name:String(ex.name||ex.id),sessions:0,sets:0,lastDate:null,bestWeight:0};exercises.set(ex.id,work)}
    let counted=false;
    for(const s of ex.sets){
     if(s?.completed===false)continue;
     const weight=Number(s?.weight),reps=Number(s?.reps);
     if(!Number.isFinite(weight)||weight<=0||!Number.isFinite(reps)||reps<=0)continue;
     counted=true;sets++;volume+=weight*reps;work.sets++;work.bestWeight=Math.max(work.bestWeight,weight);
    }
    if(counted){work.sessions++;if(!work.lastDate)work.lastDate=session.date}
  }
  }
  const latest=sessions[0]||null;
  return {completedSessions:sessions.length,trainingDays:days.size,loggedSets:sets,totalVolume:volume,
   latestDate:latest?.date||null,latestTitle:String(latest?.workoutTitle||''),movements:[...exercises.values()].filter(x=>x.sets>0).sort((a,b)=>b.sessions-a.sessions||a.name.localeCompare(b.name))};
 }
 function filterMovements(movements,term){
  const query=String(term||'').trim().toLocaleLowerCase();
  const list=Array.isArray(movements)?movements:[];
  if(!query)return list.slice();
  return list.filter(item=>
   String(item?.name||'').toLocaleLowerCase().includes(query)||
   String(item?.id||'').toLocaleLowerCase().includes(query)
  );
 }
 return Object.freeze({summarize,filterMovements});
});
