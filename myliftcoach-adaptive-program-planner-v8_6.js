/* MYLIFTCOACH Adaptive Program Planner Review V8.6
   Final-authority validation for bounded program-level adaptation proposals. Never auto-applies changes. */
(()=>{
 'use strict';
 const VERSION='8.6',core=window.myliftcoachIntelligenceCore;
 if(!core){window.MYLIFTCOACH_ADAPTIVE_PROGRAM_PLANNER_UNAVAILABLE='shared_core_missing';return;}
 const ALLOWED=new Set(['progression_cadence_hold','temporary_volume_reduction','reduced_pressure_block']);
 function review(plan){
  if(!plan||!Array.isArray(plan.proposals))return {version:VERSION,state:'rejected',reason:'planner_output_missing',approved:[],rejected:[],authority:'adaptive_programming',autoApply:false};
  const approved=[],rejected=[];
  for(const p of plan.proposals){
   const c=p?.changes||{};let reason=null;
   if(!ALLOWED.has(p?.type))reason='unsupported_program_change';
   else if(p.autoApply!==false||p.requiresApproval!==true)reason='approval_boundary_missing';
   else if(Number(c.setDelta||0)>0||Number(c.maxSetReductionPerExercise||0)>1)reason='set_increase_or_excessive_reduction_not_allowed';
   else if(Number(c.durationExposures||0)>2)reason='duration_exceeds_v8_6_limit';
   else if(c.noLoadIncrease===false||Number(c.loadDelta||0)>0)reason='planner_cannot_increase_load';
   else if(c.scheduleChange||c.trainingDayChange||c.splitChange||c.addRestDay||c.removeTrainingDay)reason='schedule_or_split_mutation_not_allowed';
   else if(Number(p.confidence||0)<.68)reason='confidence_below_program_threshold';
   if(reason)rejected.push({...p,adaptiveReview:{version:VERSION,state:'rejected',reason,authority:'adaptive_programming'}});
   else approved.push({...p,adaptiveReview:{version:VERSION,state:'approved_for_user_review',reason:'bounded_reversible_proposal_passed_adaptive_guardrails',authority:'adaptive_programming',requiresApproval:true,autoApply:false}});
  }
  return {version:VERSION,state:approved.length?'review_ready':rejected.length?'rejected':'no_change',approved,rejected,authority:'adaptive_programming',requiresApproval:true,autoApply:false,guardrails:{noAutomaticProgramReplacement:true,noAutomaticScheduleChange:true,noAutomaticTrainingDayChange:true,noAutomaticSplitChange:true,noLoadIncreaseFromPlanner:true,noSetIncreaseFromPlanner:true,maxSetReductionPerExercise:1,maxDurationExposures:2,adaptiveProgrammingFinalAuthority:true}};
 }
 function audit(){return {version:VERSION,guardrails:{adaptiveProgrammingFinalAuthority:true,plannerCannotAutoApply:true,noAutomaticProgramReplacement:true,noAutomaticScheduleChange:true,noAutomaticTrainingDayChange:true,noAutomaticSplitChange:true,noLoadIncreaseFromPlanner:true,noSetIncreaseFromPlanner:true,maxOneSetReduction:true,maxTwoExposureDuration:true,requiresApproval:true}};}
 window.myliftcoachAdaptiveProgramPlanReview=review;
 window.myliftcoachAdaptiveProgramPlannerAudit=audit;
 window.MYLIFTCOACH_ADAPTIVE_PROGRAM_PLANNER_VERSION=VERSION;
})();