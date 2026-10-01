/* MYLIFTCOACH Predictive Athlete Model V9.0
   Level 6 advisory prediction over the V8.8 state vector. Never changes training directly. */
(()=>{
 'use strict';
 const VERSION='9.0',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_PREDICTIVE_MODEL_UNAVAILABLE='shared_core_missing';return;}
 const clamp=n=>Math.max(0,Math.min(1,Number(n)||0)),round=n=>Number(clamp(n).toFixed(3));
 function readiness(exerciseId){return core.safe(()=>window.myliftcoachPredictiveAthleteState?.(String(exerciseId??'')),null);}
 function calibration(exerciseId,action){return core.safe(()=>window.myliftcoachPredictionCalibration?.(String(exerciseId??''),action),null);}
 function predict(exerciseId,action='hold'){
  const a=String(action||'hold');if(!['increase','hold','reduce'].includes(a))return {version:VERSION,state:'unavailable',reason:'unsupported_action',action:a,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
  const s=readiness(exerciseId);if(!s||s.state==='unavailable')return {version:VERSION,state:'unavailable',reason:s?.reason||'predictive_state_unavailable',action:a,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
  const f=s.features||{},v=k=>Number.isFinite(Number(f[k]?.value))?Number(f[k].value):.5;
  const perf=v('performanceTrend'),adh=v('adherence'),fat=v('fatiguePressure'),fatTrend=v('fatigueTrend'),rec=v('recoveryReadiness'),dose=v('doseTolerance'),prog=v('progressionTolerance'),ctx=v('contextReadiness'),prior=v('priorAdaptationResponse');
  let better=.34,same=.4,worse=.26;
  if(a==='increase'){better=.12+.18*perf+.13*adh+.12*rec+.1*prog+.08*ctx+.05*prior-.15*fat-.08*fatTrend;same=.32+.08*(1-Math.abs(.55-prog))+.06*ctx;}
  if(a==='hold'){better=.24+.12*rec+.08*adh+.06*prior-.05*fat;same=.46+.1*ctx+.06*(1-Math.abs(.5-perf));}
  if(a==='reduce'){better=.2+.18*fat+.12*fatTrend+.1*(1-rec)+.06*(1-perf)+.05*(1-dose);same=.4+.05*ctx;}
  better=clamp(better);same=clamp(same);worse=clamp(1-better-same);const total=better+same+worse||1;better/=total;same/=total;worse/=total;
  const baseConfidence=clamp((Number(s.confidence)||0)*(1-(Number(s.uncertainty)||0)*.45));const cal=calibration(exerciseId,a),trust=cal?.state==='poor'?Math.min(.55,Number(cal.trust)||.55):cal?.state==='calibrated'?Math.max(.75,Number(cal.trust)||.75):.7;const confidence=round(baseConfidence*trust),uncertainty=round(1-confidence);const ranked=[['better',better],['same',same],['worse',worse]].sort((x,y)=>y[1]-x[1]);
  const ready=s.state==='ready'&&s.coverage>=.78&&s.confidence>=.58;
  return {version:VERSION,model:'bounded-heuristic-v1',exerciseId:String(exerciseId??''),action:a,state:ready?'predicted':'insufficient',prediction:ready?ranked[0][0]:null,probabilities:{better:round(better),same:round(same),worse:round(worse)},confidence,uncertainty,inputState:{schema:s.schema,state:s.state,coverage:s.coverage,confidence:s.confidence,uncertainty:s.uncertainty},calibration:cal?{state:cal.state,trust:cal.trust,samples:cal.samples}:null,advisoryOnly:true,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function compare(exerciseId){return {increase:predict(exerciseId,'increase'),hold:predict(exerciseId,'hold'),reduce:predict(exerciseId,'reduce'),advisoryOnly:true,mayChangeTraining:false,authority:'adaptive_programming'};}
 function audit(){return {version:VERSION,guardrails:{predictionAdvisoryOnly:true,noTrainingMutation:true,noAutomaticActionSelection:true,noLoadIncreaseFromPrediction:true,noSetIncreaseFromPrediction:true,noScheduleChange:true,noSplitChange:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}};}
 window.myliftcoachPredictAthleteResponse=predict;window.myliftcoachComparePredictedResponses=compare;window.myliftcoachPredictiveModelAudit=audit;window.MYLIFTCOACH_PREDICTIVE_MODEL_VERSION=VERSION;
})();