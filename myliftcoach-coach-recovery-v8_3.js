/* MYLIFTCOACH Coach Recovery Timing V8.3
   Interprets Athlete V8.3 recovery-lag evidence. Advisory only. */
(()=>{
 const VERSION='8.3';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function rowsToRecoveryEvents(rows=[]){
  const byExercise={};
  for(const row of (rows||[]).filter(r=>r&&r.exerciseId)){(byExercise[row.exerciseId]||(byExercise[row.exerciseId]=[])).push(row)}
  const out=[];
  for(const [exerciseId,list] of Object.entries(byExercise)){
   list.sort((a,b)=>Date.parse(a.outcome?.at||a.at||0)-Date.parse(b.outcome?.at||b.at||0));
   let prev=null;
   for(const row of list){const at=Date.parse(row.outcome?.at||row.at||'');if(!Number.isFinite(at))continue;let recoveryHours=null;if(prev!=null)recoveryHours=Math.max(0,(at-prev)/3600000);prev=at;if(recoveryHours==null)continue;const outcome=String(row.outcome?.value||'same');const performanceDelta=outcome==='better'?.08:outcome==='worse'?-.06:0;out.push({exerciseId,recommendationId:row.id||`${exerciseId}-${at}`,recoveryHours,completedAt:new Date(at).toISOString(),performanceDelta,outcome});}
  }
  return out;
 }
 function explain(exerciseId,plannedRecoveryHours=null,events=null){const source=events||rowsToRecoveryEvents(safe(()=>window.prismInterventionRows?.(),[])),p=safe(()=>window.myliftcoachAthleteRecoveryProfile?.(source,exerciseId),null);if(!p)return {version:VERSION,exerciseId,state:'unavailable',summary:'Recovery timing evidence is unavailable.',advisoryOnly:true,mayOverrideAdaptive:false};let state='learning',timing='unknown',summary='Coach is still learning this athlete’s recovery timing.';if(p.bestWindow){state='supported';const h=Number(plannedRecoveryHours);if(Number.isFinite(h)){const bucket=h<36?'short':h<72?'medium':'long';timing=bucket===p.bestWindow.bucket?'on_time':(bucket==='short'&&p.bestWindow.bucket!=='short')||(bucket==='medium'&&p.bestWindow.bucket==='long')?'early':'adequate';summary=timing==='early'?`This repeat is earlier than the athlete’s strongest observed recovery window (${p.bestWindow.bucket}, about ${p.bestWindow.meanRecoveryHours} hours).`:`This repeat is consistent with the athlete’s observed recovery timing (${p.bestWindow.bucket}, about ${p.bestWindow.meanRecoveryHours} hours).`;}else summary=`This athlete’s strongest observed recovery window is ${p.bestWindow.bucket} (about ${p.bestWindow.meanRecoveryHours} hours).`;}
  const stale=Object.values(p.buckets||{}).length&&Object.values(p.buckets).every(x=>x.state==='stale');if(stale){state='stale';summary='Past recovery-timing evidence is too old to guide today’s recommendation.';}
  return {version:VERSION,exerciseId,state,timing,plannedRecoveryHours:Number.isFinite(Number(plannedRecoveryHours))?Number(plannedRecoveryHours):null,profile:p,summary,advisoryOnly:true,requiresApproval:true,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function proposalSummary(items=[],events=null){const rows=(items||[]).map(x=>explain(x.exerciseId,x.plannedRecoveryHours,events)),early=rows.filter(x=>x.timing==='early'),supported=rows.filter(x=>x.state==='supported');return {version:VERSION,rows,state:early.length?'caution':supported.length?'supported':'learning',early:early.length,supported:supported.length,summary:early.length?`${early.length} exercise${early.length===1?'':'s'} appear earlier than the athlete’s strongest observed recovery window.`:supported.length?'Observed recovery timing supports the current spacing.':'Coach needs more repeated recovery-timing evidence.',advisoryOnly:true,mayOverrideAdaptive:false};}
 window.myliftcoachCoachRecoveryRowsToEvents=rowsToRecoveryEvents;
 window.myliftcoachCoachRecoveryExplain=explain;
 window.myliftcoachCoachRecoveryProposalSummary=proposalSummary;
 window.MYLIFTCOACH_COACH_RECOVERY_VERSION=VERSION;
})();