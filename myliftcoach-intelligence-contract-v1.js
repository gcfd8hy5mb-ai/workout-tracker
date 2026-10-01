/* MYLIFTCOACH Intelligence Contract V1
   Stable facade over Athlete Learning, Coach interpretation, and Adaptive Programming.
   Existing versioned modules remain implementation details while consumers migrate here. */
(()=>{
 const VERSION='1.0';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const call=(name,args=[],fallback=null)=>typeof window[name]==='function'?safe(()=>window[name](...args),fallback):fallback;
 function athlete(exerciseId,events=[],exerciseMuscles={}){
  const id=String(exerciseId??'');
  return {
   context:call('myliftcoachAthleteExerciseContexts',[events,id],null),
   dose:call('myliftcoachAthleteDoseProfile',[events,id],null),
   recovery:call('myliftcoachAthleteRecoveryProfile',[events,id],null),
   program:call('liftovaLearnProgramFoundation',[events,exerciseMuscles],null)
  };
 }
 function coach(exerciseId,plannedRecoveryHours=null){
  const id=String(exerciseId??'');
  return {
   context:call('myliftcoachCoachExerciseContextEvidence',[id],null),
   dose:call('myliftcoachCoachDoseExplain',[id],null),
   recovery:call('myliftcoachCoachRecoveryExplain',[id,plannedRecoveryHours],null)
  };
 }
 function prescribe(){
  if(typeof window.prismAdaptivePrescription!=='function')return null;
  return safe(()=>window.prismAdaptivePrescription.apply(window,arguments),null);
 }
 function proposal(proposal){
  return {
   context:call('myliftcoachCoachProposalContextEvidence',[proposal],null),
   dose:call('myliftcoachCoachDoseProposalSummary',[(proposal?.changes||[]).map(x=>x?.exerciseId).filter(Boolean)],null),
   recovery:call('myliftcoachCoachRecoveryProposalEvidence',[proposal],null)
  };
 }
 function guardrails(){
  const audits={
   coachContext:call('myliftcoachCoachContextAudit',[],null),
   coachDose:call('myliftcoachCoachDoseAudit',[],null),
   coachRecovery:call('myliftcoachCoachRecoveryAudit',[],null),
   adaptive:call('myliftcoachAdaptiveArbitrationV8Audit',[],null),
   adaptiveContext:call('myliftcoachAdaptiveContextV81Audit',[],null),
   adaptiveDose:call('myliftcoachAdaptiveDoseV82Audit',[],null),
   adaptiveRecovery:call('myliftcoachAdaptiveRecoveryV83Audit',[],null)
  };
  const serialized=JSON.stringify(audits);
  const checks={
   adaptiveFinalAuthority:/adaptiveProgrammingFinalAuthority[^:]*:\s*true/.test(serialized),
   noAutomaticProgramReplacement:!/noProgramReplacement[^:]*:\s*false/.test(serialized),
   learnedEvidenceCannotIncreaseLoad:!/mayIncreaseLoad[^:]*:\s*true|learnedDoseCanIncreaseLoad[^:]*:\s*true|learnedRecoveryCannotIncreaseLoad[^:]*:\s*false/.test(serialized),
   learnedRecoveryCannotReschedule:!/mayReschedule[^:]*:\s*true|learnedRecoveryCannotReschedule[^:]*:\s*false/.test(serialized)
  };
  return {version:VERSION,audits,checks,healthy:Object.values(checks).every(Boolean)};
 }
 function snapshot({exerciseId,plannedRecoveryHours=null,events=[],exerciseMuscles={}}={}){
  return {version:VERSION,exerciseId:String(exerciseId??''),athlete:athlete(exerciseId,events,exerciseMuscles),coach:coach(exerciseId,plannedRecoveryHours),guardrails:guardrails(),authority:'adaptive_programming'};
 }
 const api=Object.freeze({version:VERSION,athlete,coach,proposal,prescribe,guardrails,snapshot,authority:'adaptive_programming'});
 window.myliftcoachIntelligence=api;
 window.MYLIFTCOACH_INTELLIGENCE_CONTRACT_VERSION=VERSION;
})();
