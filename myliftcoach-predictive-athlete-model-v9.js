/* MYLIFTCOACH Predictive Athlete Model V9.2
   Deterministic, explainable forecast layer over V8.8 predictive readiness.
   Model confidence is kept separate from historical reliability. Forecasts remain advisory only. */
(()=>{
 'use strict';
 const VERSION='9.2',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_PREDICTIVE_MODEL_UNAVAILABLE='shared_core_missing';return;}
 const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
 const safe=core.safe;
 function unavailable(reason='predictive_state_unavailable'){return {version:VERSION,state:'unavailable',reason,actions:{},recommendedAction:null,modelConfidence:0,historicalReliability:0,confidence:0,uncertainty:1,advisoryOnly:true,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};}
 function normalize(a,b,c){const t=Math.max(.0001,a+b+c);return {better:Number((a/t).toFixed(3)),same:Number((b/t).toFixed(3)),worse:Number((c/t).toFixed(3))};}
 function feature(s,k,f=.5){const x=s?.features?.[k];return x?.value==null?f:clamp(x.value);}
 function context(exerciseId,state,hint={}){const fatigue=Math.max(feature(state,'fatiguePressure'),feature(state,'fatigueTrend')),recovery=feature(state,'recoveryReadiness'),progression=feature(state,'progressionTolerance');const band=(v,lo,hi,a,b,c)=>v<lo?a:v>hi?c:b;return {exerciseId:String(exerciseId??''),movementType:String(hint.movementType||'unknown'),fatigueState:String(hint.fatigueState||band(fatigue,.35,.65,'low','moderate','high')),recoveryTiming:String(hint.recoveryTiming||band(recovery,.45,.75,'short','normal','extended')),progressionTempo:String(hint.progressionTempo||band(progression,.4,.7,'patient','standard','responsive')),trainingPhase:String(hint.trainingPhase||'unknown')};}
 function forecast(exerciseId,contextHint={}){
  const state=safe(()=>window.myliftcoachPredictiveAthleteState?.(String(exerciseId??'')),null);if(!state)return unavailable();if(state.state!=='ready')return {...unavailable('predictive_readiness_'+state.state),readiness:state};
  const perf=feature(state,'performanceTrend'),adh=feature(state,'adherence'),fat=feature(state,'fatiguePressure'),fatTrend=feature(state,'fatigueTrend'),rec=feature(state,'recoveryReadiness'),dose=feature(state,'doseTolerance'),prog=feature(state,'progressionTolerance'),ctx=feature(state,'contextReadiness'),prior=feature(state,'priorAdaptationResponse');
  const readiness=clamp(perf*.18+adh*.08+(1-fat)*.14+(1-fatTrend)*.08+rec*.16+dose*.10+prog*.14+ctx*.07+prior*.05);
  const risk=clamp(fat*.28+fatTrend*.18+(1-rec)*.24+(1-ctx)*.12+(1-perf)*.10+(1-adh)*.08);
  const increase=normalize(clamp(.12+readiness*.78-risk*.35),clamp(.22+(1-Math.abs(readiness-.62))*.25),clamp(.10+risk*.72+(1-prog)*.12));
  const hold=normalize(clamp(.18+readiness*.45-risk*.12),clamp(.38+(1-risk)*.25),clamp(.08+risk*.42));
  const reduce=normalize(clamp(.18+risk*.48+(1-rec)*.12),clamp(.32+(1-risk)*.18),clamp(.12+(1-risk)*.18+readiness*.08));
  const actions={increase,hold,reduce};
  const utility=p=>p.better-p.worse*.9;const ranked=Object.entries(actions).map(([action,p])=>({action,utility:utility(p),probabilities:p})).sort((a,b)=>b.utility-a.utility);
  const top=ranked[0],second=ranked[1],separation=Math.max(0,top.utility-second.utility),modelConfidence=clamp(state.confidence*.62+state.coverage*.23+separation*.35-state.uncertainty*.18),predictionContext=context(exerciseId,state,contextHint),cal=safe(()=>window.myliftcoachPredictionCalibrationProfile?.(top.action,String(exerciseId??''),predictionContext),null),historicalReliability=cal?.trustFactor==null?1:clamp(cal.trustFactor),confidence=clamp(modelConfidence*historicalReliability);
  const predictionState=confidence>=.68?'supported':confidence>=.5?'cautious':'low_confidence';
  return {version:VERSION,state:predictionState,exerciseId:String(exerciseId??''),readinessScore:Number(readiness.toFixed(3)),riskScore:Number(risk.toFixed(3)),actions,recommendedAction:top.action,ranking:ranked,modelConfidence:Number(modelConfidence.toFixed(3)),baseConfidence:Number(modelConfidence.toFixed(3)),historicalReliability:Number(historicalReliability.toFixed(3)),confidence:Number(confidence.toFixed(3)),uncertainty:Number(clamp(1-confidence).toFixed(3)),context:predictionContext,calibration:cal||{state:'learning',trustFactor:1,historicalReliability:1,contextSpecific:false},readiness:state,advisoryOnly:true,mayChangeTraining:false,mayIncreaseLoad:false,mayIncreaseSets:false,mayChangeSchedule:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function audit(){return {version:VERSION,guardrails:{predictionAdvisoryOnly:true,predictionCannotChangeTraining:true,predictionCannotIncreaseLoad:true,predictionCannotIncreaseSets:true,predictionCannotChangeSchedule:true,predictionCannotOverrideAdaptive:true,modelConfidenceSeparatedFromHistoricalReliability:true,contextualReliabilityMayOnlyReduceConfidence:true,driftMayOnlyReduceConfidence:true,lowConfidenceCannotAct:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}};}
 window.myliftcoachPredictAthleteResponse=forecast;window.myliftcoachPredictiveModelAudit=audit;window.MYLIFTCOACH_PREDICTIVE_MODEL_VERSION=VERSION;
})();