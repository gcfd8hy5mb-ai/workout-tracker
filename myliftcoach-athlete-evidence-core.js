/* MYLIFTCOACH Athlete Evidence Core v1.0
   Shared mechanics for Athlete context, dose-response, and recovery evidence.
   Model-specific thresholds and confidence formulas remain in their owning modules. */
(()=>{
 'use strict';
 const VERSION='1.0';
 const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,Number(n)||0));
 const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
 function parseAgeDays(row={},fields=['completedAt','date']){
  let raw='';
  for(const key of fields){const v=row?.[key];if(v){raw=v;break}}
  const t=Date.parse(raw||'');
  return Number.isFinite(t)?Math.max(0,(Date.now()-t)/86400000):0;
 }
 function createToolkit(config={}){
  const halfLifeDays=Number(config.halfLifeDays||42),recentDays=Number(config.recentDays||45),staleDays=Number(config.staleDays||120),dateFields=config.dateFields||['completedAt','date'];
  const ageDays=row=>parseAgeDays(row,dateFields);
  const freshness=row=>Math.pow(.5,ageDays(row)/halfLifeDays);
  const classify=row=>{const age=ageDays(row);return {ageDays:age,recent:age<=recentDays,stale:age>staleDays,freshness:freshness(row)}};
  const usable=rows=>(rows||[]).filter(x=>!x.stale);
  const recent=rows=>usable(rows).filter(x=>x.recent);
  const effectiveWeight=(rows,field='freshnessWeight')=>usable(rows).reduce((s,x)=>s+Number(x?.[field]||0),0);
  const weightedMean=(rows,value,weight)=>{const list=usable(rows),w=list.reduce((s,x)=>s+Number(weight(x)||0),0);return w?list.reduce((s,x)=>s+Number(value(x)||0)*Number(weight(x)||0),0)/w:0};
  const consistency=(rows,value,center,empty=1)=>{const list=usable(rows);if(!list.length)return empty;const variance=list.reduce((s,x)=>s+Math.pow(Number(value(x)||0)-center,2),0)/list.length;return clamp(1-Math.sqrt(variance));};
  const forExercise=(rows,exerciseId)=>(rows||[]).filter(x=>String(x?.exerciseId)===String(exerciseId));
  return Object.freeze({halfLifeDays,recentDays,staleDays,dateFields,ageDays,freshness,classify,usable,recent,effectiveWeight,weightedMean,consistency,forExercise});
 }
 window.myliftcoachAthleteEvidenceCore=Object.freeze({version:VERSION,clamp,mean,parseAgeDays,createToolkit});
 window.MYLIFTCOACH_ATHLETE_EVIDENCE_CORE_VERSION=VERSION;
})();
