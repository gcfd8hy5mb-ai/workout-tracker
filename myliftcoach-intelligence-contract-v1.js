/* MYLIFTCOACH Intelligence Contract V1.1
   Stable facade over Athlete Learning, Coach interpretation, and Adaptive Programming.
   Production personalized intelligence is account-bound and fails closed on identity mismatch. */
(()=>{
 const VERSION='1.1';
 const safe=(fn,f=null)=>{try{const v=fn();return v==null?f:v}catch{return f}};
 const call=(name,args=[],fallback=null)=>typeof window[name]==='function'?safe(()=>window[name](...args),fallback):fallback;
 function account(){
  const boundary=window.myliftcoachIntelligenceAccountBoundary;
  if(boundary?.current)return boundary.current();
  if(window.PRISMDeviceStore)return {valid:false,owner:window.PRISMDeviceStore.owner||null,verified:null,stale:Boolean(window.PRISMDeviceStore.stale),reason:'account_boundary_loading'};
  return {valid:true,owner:null,verified:null,stale:false,testUnbound:true};
 }
 const blocked=()=>({state:'unavailable',reason:'account_unverified',accountBound:true,mayOverrideAdaptive:false});
 function athlete(exerciseId,events=[],exerciseMuscles={}){
  const a=account();if(!a.valid)return {context:blocked(),dose:blocked(),recovery:blocked(),program:blocked(),account:a};
  const id=String(exerciseId??'');
  return {context:call('myliftcoachAthleteExerciseContexts',[events,id],null),dose:call('myliftcoachAthleteDoseProfile',[events,id],null),recovery:call('myliftcoachAthleteRecoveryProfile',[events,id],null),program:call('liftovaLearnProgramFoundation',[events,exerciseMuscles],null),account:a};
 }
 function coach(exerciseId,plannedRecoveryHours=null){
  const a=account();if(!a.valid)return {context:blocked(),dose:blocked(),recovery:blocked(),account:a};
  const id=String(exerciseId??'');
  return {context:call('myliftcoachCoachExerciseContextEvidence',[id],null),dose:call('myliftcoachCoachDoseExplain',[id],null),recovery:call('myliftcoachCoachRecoveryExplain',[id,plannedRecoveryHours],null),account:a};
 }
 function prescribe(){
  const a=account();if(!a.valid)return {status:'account_hold',reason:'Personalized programming is paused until this account is verified.',authority:'adaptive_programming',accountBoundary:a};
  if(typeof window.prismAdaptivePrescription!=='function')return null;
  return safe(()=>window.prismAdaptivePrescription.apply(window,arguments),null);
 }
 function proposal(proposal){
  const a=account();if(!a.valid)return {context:blocked(),dose:blocked(),recovery:blocked(),account:a};
  return {context:call('myliftcoachCoachProposalContextEvidence',[proposal],null),dose:call('myliftcoachCoachDoseProposalSummary',[(proposal?.changes||[]).map(x=>x?.exerciseId).filter(Boolean)],null),recovery:call('myliftcoachCoachRecoveryProposalEvidence',[proposal],null),account:a};
 }
 function guardrails(){
  const audits={coachContext:call('myliftcoachCoachContextAudit',[],null),coachDose:call('myliftcoachCoachDoseAudit',[],null),coachRecovery:call('myliftcoachCoachRecoveryAudit',[],null),adaptive:call('myliftcoachAdaptiveArbitrationV8Audit',[],null),adaptiveContext:call('myliftcoachAdaptiveContextV81Audit',[],null),adaptiveDose:call('myliftcoachAdaptiveDoseV82Audit',[],null),adaptiveRecovery:call('myliftcoachAdaptiveRecoveryV83Audit',[],null)};
  const serialized=JSON.stringify(audits),a=account();
  const checks={adaptiveFinalAuthority:/adaptiveProgrammingFinalAuthority[^:]*:\s*true/.test(serialized),noAutomaticProgramReplacement:!/noProgramReplacement[^:]*:\s*false/.test(serialized),learnedEvidenceCannotIncreaseLoad:!/mayIncreaseLoad[^:]*:\s*true|learnedDoseCanIncreaseLoad[^:]*:\s*true|learnedRecoveryCannotIncreaseLoad[^:]*:\s*false/.test(serialized),learnedRecoveryCannotReschedule:!/mayReschedule[^:]*:\s*true|learnedRecoveryCannotReschedule[^:]*:\s*false/.test(serialized),accountBound:a.valid||Boolean(a.testUnbound)};
  return {version:VERSION,audits,account:a,checks,healthy:Object.values(checks).every(Boolean)};
 }
 function snapshot({exerciseId,plannedRecoveryHours=null,events=[],exerciseMuscles={}}={}){const a=account();return {version:VERSION,exerciseId:String(exerciseId??''),account:a,athlete:athlete(exerciseId,events,exerciseMuscles),coach:coach(exerciseId,plannedRecoveryHours),guardrails:guardrails(),authority:'adaptive_programming'};}
 const api=Object.freeze({version:VERSION,account,athlete,coach,proposal,prescribe,guardrails,snapshot,authority:'adaptive_programming'});
 window.myliftcoachIntelligence=api;window.MYLIFTCOACH_INTELLIGENCE_CONTRACT_VERSION=VERSION;
})();