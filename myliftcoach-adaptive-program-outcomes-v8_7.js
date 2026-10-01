/* MYLIFTCOACH Adaptive Program Outcome Review V8.7
   Final-authority review of prior program-adaptation outcomes. Can reject harmful repeats; never enlarges a proposal. */
(()=>{
 'use strict';
 const VERSION='8.7',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_ADAPTIVE_PROGRAM_OUTCOMES_UNAVAILABLE='shared_core_missing';return;}
 function apply(review){
  if(!review||!Array.isArray(review.approved))return review;
  const approved=[],rejected=[...(review.rejected||[])];
  for(const proposal of review.approved){
   const trust=core.safe(()=>window.myliftcoachProgramAdaptationTrust?.(proposal),null);
   if(trust?.mayBlockRepeat){rejected.push({...proposal,adaptiveOutcomeReview:{version:VERSION,state:'rejected',reason:'harmful_program_outcome_history',authority:'adaptive_programming',autoApply:false}});continue;}
   approved.push({...proposal,adaptiveOutcomeReview:{version:VERSION,state:trust?.maySupportRepeat?'historically_supported_same_bounds':'no_history_escalation',reason:trust?.maySupportRepeat?'Prior followed outcomes support repeating this exact bounded adaptation; limits are unchanged.':'Outcome history does not justify changing the V8.6 bounds.',authority:'adaptive_programming',requiresApproval:true,autoApply:false,mayIncreaseMagnitude:false,mayExtendDuration:false,mayRaiseConfidence:false}});
  }
  return {...review,version:VERSION,state:approved.length?'review_ready':rejected.length?'rejected':'no_change',approved,rejected,programOutcomeLearningApplied:true,guardrails:{...(review.guardrails||{}),harmfulHistoryMayBlockRepeat:true,helpfulHistoryCannotIncreaseMagnitude:true,helpfulHistoryCannotExtendDuration:true,helpfulHistoryCannotRaiseConfidence:true,adaptiveProgrammingFinalAuthority:true}};
 }
 core.installWrapper('myliftcoachAdaptiveProgramPlanReview','__myliftcoachProgramOutcomeV87',base=>function(){return apply(base.apply(this,arguments));},{maxAttempts:100,delayMs:100});
 function audit(){return {version:VERSION,guardrails:{adaptiveProgrammingFinalAuthority:true,harmfulHistoryMayBlockRepeat:true,helpfulHistoryCannotIncreaseMagnitude:true,helpfulHistoryCannotExtendDuration:true,helpfulHistoryCannotRaiseConfidence:true,plannerCannotAutoApply:true,noAutomaticProgramReplacement:true,noAutomaticScheduleChange:true,noAutomaticTrainingDayChange:true,noAutomaticSplitChange:true,noLoadIncreaseFromPlanner:true,noSetIncreaseFromPlanner:true,requiresApproval:true}};}
 window.myliftcoachAdaptiveProgramOutcomeApply=apply;window.myliftcoachAdaptiveProgramOutcomeAudit=audit;window.MYLIFTCOACH_ADAPTIVE_PROGRAM_OUTCOME_VERSION=VERSION;
})();