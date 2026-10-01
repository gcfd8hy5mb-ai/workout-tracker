/* MYLIFTCOACH Context-Aware Prediction Calibration V9.2
   Learns where prediction errors occur without changing training policy.
   Contextual reliability can only reduce forecast trust. Adaptive Programming remains final authority. */
(()=>{
 'use strict';
 const VERSION='9.2',KEY='prismPredictiveEvaluationsV1',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_CONTEXTUAL_CALIBRATION_UNAVAILABLE='shared_core_missing';return;}
 const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
 const storage=()=>window.PRISMDeviceStore?.storage||window.localStorage;
 const ready=()=>{const a=core.account();return Boolean(a?.valid||a?.testUnbound);};
 const rows=()=>{if(!ready())return [];try{const v=JSON.parse(storage()?.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return [];}};
 const save=list=>{if(!ready())return false;try{storage()?.setItem(KEY,JSON.stringify((list||[]).slice(0,240)));return true}catch{return false;}};
 const feature=(prediction,key,f=.5)=>{const x=prediction?.readiness?.features?.[key];return x?.value==null?f:clamp(x.value);};
 const band=(v,lo=.4,hi=.7,names=['low','moderate','high'])=>v<lo?names[0]:v>hi?names[2]:names[1];
 function contextFromPrediction(prediction,hint={}){
  const fatigue=Math.max(feature(prediction,'fatiguePressure'),feature(prediction,'fatigueTrend'));
  const recovery=feature(prediction,'recoveryReadiness');
  const progression=feature(prediction,'progressionTolerance');
  return {
   exerciseId:String(prediction?.exerciseId||hint.exerciseId||''),
   movementType:String(hint.movementType||prediction?.context?.movementType||'unknown'),
   fatigueState:String(hint.fatigueState||prediction?.context?.fatigueState||band(fatigue,.35,.65,['low','moderate','high'])),
   recoveryTiming:String(hint.recoveryTiming||prediction?.context?.recoveryTiming||band(recovery,.45,.75,['short','normal','extended'])),
   progressionTempo:String(hint.progressionTempo||prediction?.context?.progressionTempo||band(progression,.4,.7,['patient','standard','responsive'])),
   trainingPhase:String(hint.trainingPhase||prediction?.context?.trainingPhase||'unknown')
  };
 }
 function brier(row){if(!row?.outcome?.value)return null;const y={better:0,same:0,worse:0};y[row.outcome.value]=1;const p=row.probabilities||{};return ((clamp(p.better)-y.better)**2+(clamp(p.same)-y.same)**2+(clamp(p.worse)-y.worse)**2)/3;}
 function summarize(list){const complete=list.filter(r=>r?.outcome?.value),errors=complete.map(brier).filter(Number.isFinite),mean=errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null,correct=complete.filter(r=>Object.entries(r.probabilities||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]===r.outcome.value).length,accuracy=complete.length?correct/complete.length:null;return {count:complete.length,meanBrier:mean==null?null:Number(mean.toFixed(3)),accuracy:accuracy==null?null:Number(accuracy.toFixed(3))};}
 function reliability(summary){if(summary.count<4||summary.meanBrier==null)return {state:'learning',factor:1};if(summary.meanBrier<=.11)return {state:'well_calibrated',factor:1};if(summary.meanBrier<=.18)return {state:'watch',factor:.92};if(summary.meanBrier<=.26)return {state:'overconfident',factor:.8};return {state:'unreliable',factor:.65};}
 function distribution(list){const out={better:0,same:0,worse:0},done=list.filter(r=>r?.outcome?.value);done.forEach(r=>out[r.outcome.value]++);if(!done.length)return out;Object.keys(out).forEach(k=>out[k]/=done.length);return out;}
 function drift(list){const done=list.filter(r=>r?.outcome?.value);if(done.length<12)return {state:'insufficient',detected:false,factor:1,samples:done.length};const recent=done.slice(0,6),prior=done.slice(6,12),a=distribution(recent),b=distribution(prior),tv=.5*(Math.abs(a.better-b.better)+Math.abs(a.same-b.same)+Math.abs(a.worse-b.worse)),ra=summarize(recent),rb=summarize(prior),errorDelta=ra.meanBrier==null||rb.meanBrier==null?0:ra.meanBrier-rb.meanBrier,detected=tv>=.35||errorDelta>=.1;return {state:detected?'detected':'stable',detected,factor:detected?.8:1,samples:12,totalVariation:Number(tv.toFixed(3)),errorDelta:Number(errorDelta.toFixed(3))};}
 function matches(row,action,exerciseId,ctx,keys){if(!row?.outcome?.value)return false;if(action&&row.action!==action)return false;if(exerciseId&&String(row.exerciseId)!==String(exerciseId))return false;const rc=row.context||{};return keys.every(k=>String(rc[k]||'unknown')===String(ctx[k]||'unknown'));}
 function profile(action=null,exerciseId=null,context={}){
  if(!ready())return {version:VERSION,state:'unavailable',reason:'account_unverified',trustFactor:0,historicalReliability:0,mayChangeTraining:false,authority:'adaptive_programming'};
  const ctx={movementType:String(context.movementType||'unknown'),fatigueState:String(context.fatigueState||'unknown'),recoveryTiming:String(context.recoveryTiming||'unknown'),progressionTempo:String(context.progressionTempo||'unknown'),trainingPhase:String(context.trainingPhase||'unknown')};
  const all=rows();
  const levels=[
   ['movementType','fatigueState','recoveryTiming','progressionTempo','trainingPhase'],
   ['fatigueState','recoveryTiming','progressionTempo','trainingPhase'],
   ['fatigueState','recoveryTiming','progressionTempo'],
   ['fatigueState','recoveryTiming'],
   ['fatigueState'],
   []
  ];
  let selected=[],keys=[];
  for(const level of levels){const candidate=all.filter(r=>matches(r,action,exerciseId,ctx,level)).slice(0,60);if(candidate.length>=4||level.length===0){selected=candidate;keys=level;break;}}
  const summary=summarize(selected),rel=reliability(summary),dr=drift(selected),trust=Math.min(1,rel.factor*dr.factor);
  return {version:VERSION,state:rel.state,count:summary.count,meanBrier:summary.meanBrier,accuracy:summary.accuracy,modelConfidenceSeparated:true,historicalReliability:Number(rel.factor.toFixed(3)),trustFactor:Number(trust.toFixed(3)),context:ctx,contextKeys:keys,contextSpecific:Boolean(keys.length),drift:dr,mayIncreaseTrust:false,mayIncreaseTraining:false,mayChangeTraining:false,mayOverrideAdaptive:false,authority:'adaptive_programming'};
 }
 function diagnostics(){if(!ready())return {version:VERSION,state:'unavailable',reason:'account_unverified',actions:[]};const actions=['increase','hold','reduce'].map(action=>{const s=summarize(rows().filter(r=>r.action===action));return {action,...s};}).sort((a,b)=>(b.meanBrier??-1)-(a.meanBrier??-1));return {version:VERSION,state:'ready',weakestPredictionType:actions.find(x=>x.count>=4)?.action||null,actions,mayChangeTraining:false,authority:'adaptive_programming'};}
 const baseRemember=window.myliftcoachRememberPrediction;
 if(typeof baseRemember==='function')window.myliftcoachRememberPrediction=function(prediction,meta={}){if(!ready())return null;const row=baseRemember(prediction);if(!row)return row;const list=rows(),stored=list.find(r=>r.id===row.id);if(stored){stored.context=contextFromPrediction(prediction,meta);save(list);return stored;}return row;};
 const previousAudit=window.myliftcoachPredictionSelfEvaluationAudit;
 function audit(){const prior=typeof previousAudit==='function'?previousAudit():null;return {version:VERSION,previous:prior,guardrails:{selfEvaluationAdvisoryOnly:true,contextualTrustIsLocal:true,repeatedMistakesOnlyLowerAffectedContext:true,driftMayOnlyReducePredictiveTrust:true,modelConfidenceSeparatedFromHistoricalReliability:true,selfEvaluationMayOnlyReducePredictiveTrust:true,selfEvaluationCannotIncreaseTraining:true,selfEvaluationCannotChangeTraining:true,selfEvaluationCannotOverrideAdaptive:true,noAutomaticPolicyEscalation:true,adaptiveProgrammingFinalAuthority:true,mayOverrideAdaptive:false}};}
 window.myliftcoachPredictionContext=contextFromPrediction;window.myliftcoachPredictionCalibrationProfile=profile;window.myliftcoachPredictionDiagnostics=diagnostics;window.myliftcoachPredictionSelfEvaluationAudit=audit;window.MYLIFTCOACH_CONTEXTUAL_CALIBRATION_VERSION=VERSION;
})();