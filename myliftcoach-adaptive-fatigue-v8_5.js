/* MYLIFTCOACH Adaptive Fatigue Arbitration V8.5 — final authority over fatigue/deload-response evidence. */
(()=>{
 'use strict';
 const VERSION='8.5',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_ADAPTIVE_FATIGUE_UNAVAILABLE='shared_core_missing';return;}
 const safe=core.safe;
 function arbitrate(base){if(!base)return base;const evidence=safe(()=>window.myliftcoachCoachFatigueExplain?.(base.exerciseId),null);if(!evidence||!['supported','caution'].includes(evidence.state))return {...base,adaptiveFatigueV85:{version:VERSION,decision:evidence?.state==='stale'?'stale_ignored':'no_action',authority:'adaptive_programming'}};
  let status=base.status,targetWeight=base.targetWeight,workingSets=base.workingSets,reason=base.reason,decision='evidence_considered';const lastWeight=Number(base.lastWeight||base.targetWeight||0),baseSets=Number(base.workingSets||0),hardHold=/recovery_hold|plateau_hold|fatigue_hold|account_hold|recovery_timing_hold/.test(String(base.status||''));
  if(evidence.state==='caution'&&!hardHold){if(status==='increase'){status='fatigue_learning_hold';targetWeight=lastWeight||targetWeight;decision='accumulation_progression_hold';reason='Adaptive Programming is holding this increase because repeated multi-exposure fatigue is accumulating.';}
   if(evidence.deloadResponse==='responsive'&&baseSets>=3){workingSets=Math.max(2,baseSets-1);decision=decision==='accumulation_progression_hold'?'hold_and_reduce_one_set':'reduce_one_set_from_fatigue_evidence';reason='Adaptive Programming is reducing this exposure by one working set because repeated fatigue accumulation improved after reduced-pressure exposures.';}}
  return {...base,status,targetWeight,workingSets,reason,adaptiveFatigueV85:{version:VERSION,decision,authority:'adaptive_programming',coachFatigueState:evidence.state,fatigueState:evidence.fatigueState||'learning',deloadResponse:evidence.deloadResponse||'learning',neverIncreaseLoad:true,neverIncreaseSets:true,noAutomaticDeload:true,noAutomaticRestDay:true,noAutomaticScheduleChange:true,hardHoldPreserved:hardHold}};
 }
 function install(){return core.installWrapper('prismAdaptivePrescription','__myliftcoachFatigueV85',base=>function(){return arbitrate(base.apply(this,arguments));},{maxAttempts:100,delayMs:100});}
 function audit(){return {version:VERSION,authority:'adaptive_programming',guardrails:{coachFatigueAdvisoryOnly:true,accumulationMayHoldIncrease:true,reducedPressureEvidenceMayReduceOneSet:true,neverIncreaseLoad:true,neverIncreaseSets:true,noAutomaticDeload:true,noAutomaticRestDay:true,noAutomaticScheduleChange:true,noProgramReplacement:true,recoveryFatiguePlateauLayersPreserved:true,adaptiveProgrammingFinalAuthority:true}};}
 window.myliftcoachAdaptiveFatigueArbitrate=arbitrate;window.myliftcoachAdaptiveFatigueAudit=audit;window.MYLIFTCOACH_ADAPTIVE_FATIGUE_VERSION=VERSION;install();
})();
