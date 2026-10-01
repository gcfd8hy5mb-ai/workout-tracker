/* MYLIFTCOACH Intelligence Core v1.4
   Shared primitives for the Athlete -> Coach -> Adaptive intelligence pipeline.
   Owns fail-closed account state, safe invocation, wrapper installation, authority metadata,
   and consolidated intelligence audit/guardrail plumbing. */
(()=>{
 'use strict';
 const VERSION='1.4';
 const AUTHORITY='adaptive_programming';
 const AUDIT_SOURCES=Object.freeze({
  coachContext:'myliftcoachCoachContextAudit',
  coachDose:'myliftcoachCoachDoseAudit',
  coachRecovery:'myliftcoachCoachRecoveryAudit',
  coachProgression:'myliftcoachCoachProgressionAudit',
  coachFatigue:'myliftcoachCoachFatigueAudit',
  adaptive:'myliftcoachAdaptiveArbitrationV8Audit',
  adaptiveContext:'myliftcoachAdaptiveContextV81Audit',
  adaptiveDose:'myliftcoachAdaptiveDoseV82Audit',
  adaptiveRecovery:'myliftcoachAdaptiveRecoveryV83Audit',
  adaptiveProgression:'myliftcoachAdaptiveProgressionAudit',
  adaptiveFatigue:'myliftcoachAdaptiveFatigueAudit'
 });
 const safe=(fn,fallback=null)=>{try{const value=fn();return value==null?fallback:value}catch{return fallback}};
 const call=(name,args=[],fallback=null)=>typeof window[name]==='function'?safe(()=>window[name](...args),fallback):fallback;
 function account(){
  const boundary=window.myliftcoachIntelligenceAccountBoundary;
  if(boundary?.current)return boundary.current();
  const store=window.PRISMDeviceStore;
  if(store)return {valid:false,owner:store.owner||null,verified:null,stale:Boolean(store.stale),reason:'account_boundary_loading'};
  return {valid:true,owner:null,verified:null,stale:false,testUnbound:true};
 }
 function unavailable(reason='account_unverified'){
  return {state:'unavailable',reason,accountBound:true,authority:AUTHORITY,mayOverrideAdaptive:false};
 }
 function accountHold(reason='Personalized programming is paused until this account is verified.'){
  return {status:'account_hold',targetWeight:null,workingSets:null,reason,authority:AUTHORITY,accountBoundary:unavailable()};
 }
 function guardMetadata(extra={}){
  return Object.freeze({authority:AUTHORITY,mayOverrideAdaptive:false,preserveProgramSource:true,requiresApproval:true,...extra});
 }
 function installWrapper(name,marker,factory,options={}){
  const attempt=Number(options.attempt||0),maxAttempts=Number.isFinite(Number(options.maxAttempts))?Number(options.maxAttempts):100,delayMs=Number.isFinite(Number(options.delayMs))?Number(options.delayMs):100;
  const base=window[name],ready=typeof options.ready==='function'?safe(()=>Boolean(options.ready()),false):true;
  if(typeof base!=='function'||!ready){
   if(attempt<maxAttempts&&typeof setTimeout==='function')setTimeout(()=>installWrapper(name,marker,factory,{...options,attempt:attempt+1}),delayMs);
   return false;
  }
  if(base[marker])return true;
  const wrapped=safe(()=>factory(base),null);
  if(typeof wrapped!=='function')return false;
  wrapped[marker]=true;
  wrapped[`${marker}Base`]=base;
  window[name]=wrapped;
  return true;
 }
 function collectAudits(){return Object.fromEntries(Object.entries(AUDIT_SOURCES).map(([key,name])=>[key,call(name,[],null)]));}
 function guardrailChecks(audits=collectAudits(),accountState=account()){
  const serialized=JSON.stringify(audits);
  return {
   coreLoaded:true,
   adaptiveFinalAuthority:/adaptiveProgrammingFinalAuthority[^:]*:\s*true/.test(serialized),
   noAutomaticProgramReplacement:!/noProgramReplacement[^:]*:\s*false/.test(serialized),
   learnedEvidenceCannotIncreaseLoad:!/mayIncreaseLoad[^:]*:\s*true|learnedDoseCanIncreaseLoad[^:]*:\s*true|learnedRecoveryCannotIncreaseLoad[^:]*:\s*false|neverIncreaseLoad[^:]*:\s*false/.test(serialized),
   learnedRecoveryCannotReschedule:!/mayReschedule[^:]*:\s*true|learnedRecoveryCannotReschedule[^:]*:\s*false/.test(serialized),
   progressionLearningCannotAccelerate:!/responsiveEvidenceCannotAccelerate[^:]*:\s*false|neverExceedBaseTarget[^:]*:\s*false|noAccelerationFromLearning[^:]*:\s*false/.test(serialized),
   fatigueLearningCannotAutoProgram:!/noAutomaticDeload[^:]*:\s*false|noAutomaticRestDay[^:]*:\s*false|noAutomaticScheduleChange[^:]*:\s*false|neverIncreaseSets[^:]*:\s*false/.test(serialized),
   accountBound:accountState.valid||Boolean(accountState.testUnbound)
  };
 }
 function auditSummary(){const audits=collectAudits(),accountState=account(),checks=guardrailChecks(audits,accountState);return {coreVersion:VERSION,auditSources:AUDIT_SOURCES,audits,account:accountState,checks,healthy:Object.values(checks).every(Boolean),authority:AUTHORITY};}
 const api=Object.freeze({version:VERSION,authority:AUTHORITY,safe,call,account,unavailable,accountHold,guardMetadata,installWrapper,auditSources:AUDIT_SOURCES,collectAudits,guardrailChecks,auditSummary});
 window.myliftcoachIntelligenceCore=api;
 window.MYLIFTCOACH_INTELLIGENCE_CORE_VERSION=VERSION;
})();
