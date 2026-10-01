/* MYLIFTCOACH Adaptive Progression Arbitration V8.4 — final authority over progression-response evidence. */
(()=>{
 'use strict';
 const VERSION='8.4',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_ADAPTIVE_PROGRESSION_UNAVAILABLE='shared_core_missing';return;}
 const safe=core.safe;
 function arbitrate(base){if(!base)return base;const evidence=safe(()=>window.myliftcoachCoachProgressionExplain?.(base.exerciseId),null);if(!evidence||!['supported','caution'].includes(evidence.state))return {...base,adaptiveProgressionV84:{version:VERSION,decision:evidence?.state==='stale'?'stale_ignored':'no_action',authority:'adaptive_programming'}};
  let status=base.status,targetWeight=base.targetWeight,reason=base.reason,decision='evidence_considered';const lastWeight=Number(base.lastWeight||base.targetWeight||0),requested=Number(base.targetWeight||0);
  if(evidence.state==='caution'&&status==='increase'){status='progression_hold';targetWeight=lastWeight||targetWeight;reason='Adaptive Programming is holding this increase because repeated athlete-specific progression outcomes show better results when another controlled exposure happens before adding load.';decision='patient_progression_hold';}
  else if(evidence.state==='supported'&&status==='increase'){decision=evidence.tempo==='responsive'?'responsive_evidence_no_acceleration':'standard_progression_supported';}
  if(requested>0&&Number(targetWeight)>requested){targetWeight=requested;decision='acceleration_blocked';}
  return {...base,status,targetWeight,reason,adaptiveProgressionV84:{version:VERSION,decision,authority:'adaptive_programming',coachProgressionState:evidence.state,tempo:evidence.tempo||'learning',neverAccelerateFromLearning:true,neverExceedBaseTarget:true,hardHoldsPreserved:status!=='increase'||base.status==='increase'}};
 }
 function install(){return core.installWrapper('prismAdaptivePrescription','__myliftcoachProgressionV84',base=>function(){return arbitrate(base.apply(this,arguments));},{maxAttempts:100,delayMs:100});}
 function audit(){return {version:VERSION,authority:'adaptive_programming',guardrails:{coachProgressionAdvisoryOnly:true,patientEvidenceMayHoldIncrease:true,responsiveEvidenceCannotAccelerate:true,neverExceedBaseTarget:true,noProgressionDrivenSetIncrease:true,noProgramReplacement:true,recoveryFatiguePlateauLayersPreserved:true,adaptiveProgrammingFinalAuthority:true}};}
 window.myliftcoachAdaptiveProgressionArbitrate=arbitrate;window.myliftcoachAdaptiveProgressionAudit=audit;window.MYLIFTCOACH_ADAPTIVE_PROGRESSION_VERSION=VERSION;install();
})();
