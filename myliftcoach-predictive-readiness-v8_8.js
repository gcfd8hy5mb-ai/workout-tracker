/* MYLIFTCOACH Predictive Readiness Foundation V8.8
   Builds a stable, explainable athlete state vector for future prediction models.
   This layer does not predict outcomes and cannot change training. Adaptive Programming remains final authority. */
(()=>{
 'use strict';
 const VERSION='8.8',SCHEMA='predictive-athlete-state-v1',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_PREDICTIVE_READINESS_UNAVAILABLE='shared_core_missing';return;}
 const safe=core.safe,clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
 const mean=a=>{const v=(a||[]).filter(Number.isFinite);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null;};
 const num=(v,f=null)=>Number.isFinite(Number(v))?Number(v):f;
 const stateMap=(value,map,f=.5)=>Object.hasOwn(map,String(value??''))?map[String(value??'')]:f;
 function interventions(exerciseId){return safe(()=>window.prismInterventionRows?.(),[]).filter(r=>r?.exerciseId&&(!exerciseId||String(r.exerciseId)===String(exerciseId)));}
 function performance(rows){const done=rows.filter(r=>r?.outcome),recent=done.slice(0,8),scores=recent.map(r=>r.outcome?.value==='better'?1:r.outcome?.value==='worse'?0:.5),followed=recent.filter(r=>r.response?.value==='followed').length;return {value:mean(scores),confidence:clamp(recent.length/6),samples:recent.length,adherence:recent.length?followed/recent.length:null};}
 function build(exerciseId){
  const id=String(exerciseId??''),context=safe(()=>window.myliftcoachCoachExerciseContextEvidence?.(id),null),dose=safe(()=>window.myliftcoachCoachDoseExplain?.(id),null),recovery=safe(()=>window.myliftcoachCoachRecoveryExplain?.(id,null),null),progression=safe(()=>window.myliftcoachCoachProgressionExplain?.(id),null),fatigue=safe(()=>window.myliftcoachCoachFatigueExplain?.(id),null),programOutcome=safe(()=>window.myliftcoachCoachProgramOutcomeExplain?.(null,id),null),perf=performance(interventions(id));
  const fatigueProfile=fatigue?.profile||{},progressionProfile=progression?.profile||{},recoveryProfile=recovery?.profile||{},doseProfile=dose?.profile||{};
  const features={
   performanceTrend:{value:perf.value,confidence:perf.confidence,source:'intervention_outcomes'},
   adherence:{value:perf.adherence,confidence:perf.confidence,source:'intervention_follow_through'},
   fatiguePressure:{value:fatigue?num(fatigueProfile.recentStrain,null):null,confidence:fatigue?num(fatigueProfile.confidence,0):0,source:'athlete_fatigue_v8_5'},
   fatigueTrend:{value:!fatigue||num(fatigueProfile.strainTrend,null)==null?null:clamp(.5+num(fatigueProfile.strainTrend,0)*2),confidence:fatigue?num(fatigueProfile.confidence,0):0,source:'athlete_fatigue_v8_5'},
   recoveryReadiness:{value:recovery?stateMap(recovery.timing,{early:.35,on_time:.7,late:.45,ready:.8},.5):null,confidence:recovery?num(recoveryProfile.confidence,recovery?.state==='supported'?.7:0):0,source:'athlete_recovery_v8_3'},
   doseTolerance:{value:dose?stateMap(dose?.bestDose?.dose?.volume,{low:.35,moderate:.65,high:.85},.5):null,confidence:dose?num(doseProfile.confidence,dose?.state==='supported'?.7:0):0,source:'athlete_dose_v8_2'},
   progressionTolerance:{value:progression?stateMap(progression.tempo,{patient:.3,standard:.6,responsive:.82},.5):null,confidence:progression?num(progressionProfile.confidence,progression?.state==='supported'?.7:progression?.state==='caution'?.65:0):0,source:'athlete_progression_v8_4'},
   contextReadiness:{value:context?stateMap(context.state,{supported:.75,emerging:.6,caution:.35,stale:.5,learning:.5},.5):null,confidence:context?num(context.confidence,context?.state==='supported'?.7:context?.state==='caution'?.65:0):0,source:'athlete_context_v8_1'},
   priorAdaptationResponse:{value:programOutcome?num(programOutcome?.profile?.weightedScore,programOutcome?.weightedScore??null):null,confidence:programOutcome?num(programOutcome?.profile?.confidence,programOutcome?.confidence??0):0,source:'program_outcome_v8_7'}
  };
  const names=Object.keys(features),present=names.filter(k=>features[k].value!=null),weighted=present.map(k=>features[k].confidence),confidence=mean(weighted)??0,coverage=present.length/names.length,uncertainty=clamp(1-(confidence*.65+coverage*.35));
  const state=coverage>=.78&&confidence>=.58?'ready':coverage>=.5?'emerging':'insufficient';
  return {version:VERSION,schema:SCHEMA,exerciseId:id,state,features,vector:names.map(k=>features[k].value==null?.5:clamp(features[k].value)),featureOrder:names,coverage:Number(coverage.toFixed(3)),confidence:Number(confidence.toFixed(3)),uncertainty:Number(uncertainty.toFixed(3)),missing:names.filter(k=>features[k].value==null),samples:{interventions:perf.samples},predictiveUse:'input_only',mayPredict:false,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function program(exerciseIds=[]){const ids=[...new Set((exerciseIds||[]).filter(Boolean).map(String))],rows=ids.map(build),ready=rows.filter(r=>r.state==='ready'),confidence=mean(rows.map(r=>r.confidence))??0,coverage=mean(rows.map(r=>r.coverage))??0;return {version:VERSION,schema:SCHEMA,state:rows.length>=2&&ready.length>=Math.ceil(rows.length*.6)&&confidence>=.58?'ready':rows.length?'emerging':'insufficient',exerciseIds:ids,rows,readyExercises:ready.length,coverage:Number(coverage.toFixed(3)),confidence:Number(confidence.toFixed(3)),uncertainty:Number(clamp(1-(confidence*.65+coverage*.35)).toFixed(3)),predictiveUse:'input_only',mayPredict:false,mayChangeTraining:false,authority:'adaptive_programming'};}
 function audit(){return {version:VERSION,schema:SCHEMA,guardrails:{predictiveFoundationInputOnly:true,noOutcomePredictionYet:true,noTrainingMutation:true,noLoadIncrease:true,noSetIncrease:true,noScheduleChange:true,noSplitChange:true,noAutoApply:true,accountBoundInputsRequired:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}};}
 window.myliftcoachPredictiveAthleteState=build;window.myliftcoachPredictiveProgramState=program;window.myliftcoachPredictiveReadinessAudit=audit;window.MYLIFTCOACH_PREDICTIVE_READINESS_VERSION=VERSION;
})();