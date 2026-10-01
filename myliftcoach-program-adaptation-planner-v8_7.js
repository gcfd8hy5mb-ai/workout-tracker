/* MYLIFTCOACH Program Adaptation Planner V8.7 history layer.
   Uses prior followed program-adaptation outcomes to suppress harmful repeats or annotate helpful repeats.
   Never increases proposal magnitude, duration, confidence, or authority. */
(()=>{
 'use strict';
 const VERSION='8.7',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_PROGRAM_PLANNER_HISTORY_UNAVAILABLE='shared_core_missing';return;}
 function applyHistory(plan){
  if(!plan||!Array.isArray(plan.proposals))return plan;
  const proposals=[],suppressed=[];
  for(const proposal of plan.proposals){
   const trust=core.safe(()=>window.myliftcoachProgramAdaptationTrust?.(proposal),null);
   const annotated={...proposal,programOutcomeHistory:{version:VERSION,state:trust?.state||'learning',confidence:Number(trust?.confidence||0),maySupportRepeat:Boolean(trust?.maySupportRepeat),mayBlockRepeat:Boolean(trust?.mayBlockRepeat),mayIncreaseMagnitude:false,mayExtendDuration:false}};
   if(trust?.mayBlockRepeat){suppressed.push({...annotated,suppressionReason:'Repeated followed outcomes for this adaptation pattern were harmful.'});continue;}
   proposals.push(annotated);
  }
  const state=proposals.length?'proposed':suppressed.length?'history_blocked':plan.state;
  return {...plan,version:VERSION,state,proposals,suppressedByOutcomeHistory:suppressed,historyLearningApplied:true,reason:suppressed.length&&!proposals.length?'Prior followed outcomes argue against repeating the currently proposed bounded adaptation.':plan.reason,guardrails:{...(plan.guardrails||{}),historyCannotIncreaseMagnitude:true,historyCannotExtendDuration:true,historyCannotRaiseConfidence:true,harmfulHistoryMaySuppressRepeat:true,adaptiveProgrammingFinalAuthority:true}};
 }
 core.installWrapper('myliftcoachProgramAdaptationPlan','__myliftcoachProgramHistoryV87',base=>function(){return applyHistory(base.apply(this,arguments));},{maxAttempts:100,delayMs:100});
 function audit(){return {version:VERSION,guardrails:{historyAdvisoryOnly:true,harmfulHistoryMaySuppressRepeat:true,helpfulHistoryCannotIncreaseMagnitude:true,helpfulHistoryCannotExtendDuration:true,helpfulHistoryCannotRaiseConfidence:true,noAutomaticProgramMutation:true,requiresApproval:true,adaptiveProgrammingFinalAuthority:true}};}
 window.myliftcoachProgramAdaptationApplyHistory=applyHistory;window.myliftcoachProgramPlannerHistoryAudit=audit;window.MYLIFTCOACH_PROGRAM_PLANNER_HISTORY_VERSION=VERSION;
})();