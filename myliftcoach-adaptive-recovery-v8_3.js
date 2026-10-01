/* MYLIFTCOACH Adaptive Recovery Timing V8.3
   Final-authority arbitration over Athlete/Coach recovery timing evidence. */
(()=>{
 const VERSION='8.3';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 function plannedHours(base){for(const v of [base?.recoveryHours,base?.hoursSincePrior,base?.restHours,base?.intervalHours]){const n=Number(v);if(Number.isFinite(n)&&n>=0)return n}return null;}
 function arbitrate(base){
  if(!base)return base;
  const h=plannedHours(base),coach=safe(()=>window.myliftcoachCoachRecoveryExplain?.(base.exerciseId,h),null);
  let status=base.status,targetWeight=base.targetWeight,reason=base.reason,decision='existing_adaptive';
  if(coach?.state==='supported'&&coach?.timing==='early'&&status==='increase'){
   status='recovery_timing_hold';
   targetWeight=Number(base.lastWeight||base.targetWeight||0)||base.targetWeight;
   reason='This exposure is earlier than the athlete’s strongest repeated recovery window, so Adaptive Programming is holding progression until another controlled exposure confirms readiness.';
   decision='early_repeat_progression_hold';
  }else if(coach?.state==='stale')decision='stale_recovery_evidence_ignored';
  else if(coach?.state==='supported'&&coach?.timing==='on_time')decision='recovery_timing_support_considered';
  return {...base,status,targetWeight,reason,adaptiveRecoveryV83:{version:VERSION,decision,plannedRecoveryHours:h,coachState:coach?.state||'unavailable',coachTiming:coach?.timing||'unknown',authority:'adaptive_programming',mayReschedule:false,mayAddRestDay:false,mayIncreaseLoad:false,mayOverrideAdaptive:false}};
 }
 function install(attempt=0){if(typeof window.prismAdaptivePrescription!=='function'){if(attempt<100)setTimeout(()=>install(attempt+1),100);return false}if(window.prismAdaptivePrescription.__myliftcoachRecoveryV83)return true;const base=window.prismAdaptivePrescription,wrapped=function(){return arbitrate(base.apply(this,arguments))};wrapped.__myliftcoachRecoveryV83=true;wrapped.__myliftcoachRecoveryV83Base=base;window.prismAdaptivePrescription=wrapped;return true;}
 function audit(){return {version:VERSION,authority:'adaptive_programming',guardrails:{learnedRecoveryCanHoldIncrease:true,learnedRecoveryCannotIncreaseLoad:true,learnedRecoveryCannotReschedule:true,learnedRecoveryCannotAddRestDays:true,staleEvidenceIgnored:true,existingHardHoldsRemainUpstream:true,noProgramReplacement:true,preserveCustomProgramAuthority:true,adaptiveProgrammingFinalAuthority:true}}}
 window.myliftcoachAdaptiveRecoveryArbitrate=arbitrate;
 window.myliftcoachAdaptiveRecoveryV83Audit=audit;
 window.MYLIFTCOACH_ADAPTIVE_RECOVERY_VERSION=VERSION;
 install();
})();