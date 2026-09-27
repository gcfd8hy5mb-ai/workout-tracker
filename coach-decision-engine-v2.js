/* PRISM Coach Decision Engine v2 — one fast, explainable decision per exercise. */
(()=>{
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const round5=n=>Math.max(0,Math.round(Number(n||0)/5)*5);
 function decide(id){
  const ex=safe(()=>getExercise(id),null),p=safe(()=>progressionSuggestion(id),{})||{},readiness=safe(()=>typeof prismReadinessAnalyze==='function'?prismReadinessAnalyze():null,null),memory=safe(()=>typeof prismCoachMemoryRecommendation==='function'?prismCoachMemoryRecommendation(id):null,null),fatigue=safe(()=>typeof prismAdaptiveFatigueSignals==='function'?prismAdaptiveFatigueSignals():null,null),plateau=safe(()=>typeof prismDetectPlateaus==='function'?(prismDetectPlateaus()||[]).find(x=>x.id===id):null,null);
  const fatigueRow=fatigue?.repeated?.find(x=>x.id===id),lastWeight=Number(p.lastWeight||0),suggested=Number(p.weight||lastWeight||0),min=Number(p.range?.min||8),max=Number(p.range?.max||12),lastReps=Array.isArray(p.lastReps)?p.lastReps:[];
  let decision='HOLD',weight=lastWeight||suggested,reps={min,max},confidence='LOW',why='Repeat the recent target while Coach gathers more exercise-specific evidence.';
  if(readiness?.mode==='RECOVERY'){decision='RECOVERY';weight=lastWeight?round5(lastWeight*.95):0;reps={min:Math.max(6,min-1),max:Math.max(Math.max(6,min-1),max-2)};confidence='HIGH';why=`Readiness is ${readiness.score}/5, so recovery takes priority over progression.`;}
  else if(fatigueRow){decision='REDUCE';weight=lastWeight?round5(lastWeight*.95):0;confidence='HIGH';why=`Coach sees ${fatigueRow.count} recent fatigue signals on this exercise.`;}
  else if(plateau){decision='REP FOCUS';weight=lastWeight||suggested;confidence='MEDIUM';why='Recent performance shows a plateau signal, so build reps/quality before adding load.';}
  else if(memory?.profile?.samples>=4&&(memory.profile.progression==='cautious'||memory.profile.style==='conservative')){decision='HOLD';weight=lastWeight||suggested;confidence=memory.profile.confidenceLabel||'MEDIUM';why=`Exercise-specific Coach Memory favors a cautious progression. ${memory.text}`;}
  else if(memory?.profile?.samples>=4&&memory.profile.style==='user-adjusted'){decision='REP FOCUS';weight=lastWeight||suggested;confidence=memory.profile.confidenceLabel||'MEDIUM';why=`Your successful history favors adjusting performance at the current load before increasing. ${memory.text}`;}
  else if(p.status==='ready'&&readiness?.mode!=='CONTROL'){decision='INCREASE';weight=suggested>lastWeight?suggested:(lastWeight?round5(lastWeight*1.025):suggested);confidence=memory?.profile?.samples>=4?(memory.profile.confidenceLabel||'MEDIUM'):'MEDIUM';why=memory?.profile?.progression==='supported'?`Performance and exercise-specific Coach Memory support progression. ${memory.text}`:'Recent completed performance supports progression.';}
  else if(lastReps.length&&Math.max(...lastReps)>=max){decision='REP FOCUS';weight=lastWeight||suggested;confidence='MEDIUM';why='You are near the top of the rep range; confirm repeatable reps before increasing load.';}
  if(readiness?.mode==='CONTROL'&&decision==='INCREASE'){decision='HOLD';weight=lastWeight||suggested;why=`Performance supports progression, but today's ${readiness.score}/5 readiness favors holding the load.`;}
  return {id,name:ex?.name||id,decision,weight,reps,confidence,why,readiness:readiness?.mode||null,memorySamples:memory?.profile?.samples||0};
 }
 function workout(ids){ids=ids||((typeof activeWorkoutExerciseIds!=='undefined'&&Array.isArray(activeWorkoutExerciseIds))?activeWorkoutExerciseIds:[]);return ids.filter(Boolean).map(decide);}
 window.prismCoachExerciseDecision=decide;window.prismCoachWorkoutDecisions=workout;
})();