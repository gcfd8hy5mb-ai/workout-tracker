/* MYLIFTCOACH Predictive Athlete Model V9.0
   Deterministic, explainable forecast layer over V8.8 predictive readiness.
   Forecasts are advisory only and cannot change training. Adaptive Programming remains final authority. */
(()=>{
 'use strict';
 const VERSION='9.0',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_PREDICTIVE_MODEL_UNAVAILABLE='shared_core_missing';return;}
 const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
 const safe=core.safe;
 function unavailable(reason='predictive_state_unavailable'){return {version:VERSION,state:'unavailable',reason,actions:{},recommendedAction:null,confidence:0,uncertainty:1,advisoryOnly:true,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};}
 function normalize(a,b,c){const t=Math.max(.0001,a+b+c);return {better:Number((a/t).toFixed(3)),same:Number((b/t).toFixed(3)),worse:Number((c/t).toFixed(3))};}
 function feature(s,k,f=.5){const x=s?.features?.[k];return x?.value==null?f:clamp(x.value);}
 function forecast(exerciseId){
  const state=safe(()=>window.myliftcoachPredictiveAthleteState?.(String(exerciseId??'')),null);if(!state)return unavailable();if(state.state!=='ready')return {...unavailable('predictive_readiness_'+state.state),readiness:state};
  const perf=feature(state,'performanceTrend'),adh=feature(state,'adherence'),fat=feature(state,'fatiguePressure'),fatTrend=feature(state,'fatigueTrend'),rec=feature(state,'recoveryReadiness'),dose=feature(state,'doseTolerance'),prog=feature(state,'progressionTolerance'),ctx=feature(state,'contextReadiness'),prior=feature(state,'priorAdaptationResponse');
  const readiness=clamp(perf*.18+adh*.08+(1-fat)*.14+(1-fatTrend)*.08+rec*.16+dose*.10+prog*.14+ctx*.07+prior*.05);
  const risk=clamp(fat*.28+fatTrend*.18+(1-rec)*.24+(1-ctx)*.12+(1-perf)*.10+(1-adh)*.08);
  const increase=normalize(clamp(.12+readiness*.78-risk*.35),clamp(.22+(1-Math.abs(readiness-.62))*.25),clamp(.10+risk*.72+(1-prog)*.12));
  const hold=normalize(clamp(.18+readiness*.45-risk*.12),clamp(.38+(1-risk)*.25),clamp(.08+risk*.42));
  const reduce=normalize(clamp(.18+risk*.48+(1-rec)*.12),clamp(.32+(1-risk)*.18),clamp(.12+(1-risk)*.18+readiness*.08));
  const actions={increase,hold,reduce};
  const utility=p=>p.better-p.worse*.9;const ranked=Object.entries(actions).map(([action,p])=>({action,utility:utility(p),probabilities:p})).sort((a,b)=>b.utility-a.utility);
  const top=ranked[0],second=ranked[1],separation=Math.max(0,top.utility-second.utility),baseConfidence=clamp(state.confidence*.62+state.coverage*.23+separation*.35-state.uncertainty*.18),cal=safe(()=>window.myliftcoachPredictionCalibrationProfile?.(top.action,String(exerciseId??'')),null),trust=cal?.trustFactor==null?1:clamp(cal.trustFactor),confidence=clamp(baseConfidence*trust);
  const predictionState=confidence>=.68?'supported':confidence>=.5?'cautious':'low_confidence';
  return {version:VERSION,state:predictionState,exerciseId:String(exerciseId??''),readinessScore:Number(readiness.toFixed(3)),riskScore:Number(risk.toFixed(3)),actions,recommendedAction:top.action,ranking:ranked,baseConfidence:Number(baseConfidence.toFixed(3)),confidence:Number(confidence.toFixed(3)),uncertainty:Number(clamp(1-confidence).toFixed(3)),calibration:cal||{state:'learning',trustFactor:1},readiness:state,advisoryOnly:true,mayChangeTraining:false,mayIncreaseLoad:false,mayIncreaseSets:false,mayChangeSchedule:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function audit(){return {version:VERSION,guardrails:{predictionAdvisoryOnly:true,predictionCannotChangeTraining:true,predictionCannotIncreaseLoad:true,predictionCannotIncreaseSets:true,predictionCannotChangeSchedule:true,predictionCannotOverrideAdaptive:true,lowConfidenceCannotAct:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}};}
 window.myliftcoachPredictAthleteResponse=forecast;window.myliftcoachPredictiveModelAudit=audit;window.MYLIFTCOACH_PREDICTIVE_MODEL_VERSION=VERSION;
})();