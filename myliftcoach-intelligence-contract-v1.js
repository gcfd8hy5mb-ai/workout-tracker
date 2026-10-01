/* MYLIFTCOACH Intelligence Contract V1.6
   Stable facade over Athlete Learning, Coach interpretation, and Adaptive Programming.
   Production personalized intelligence is account-bound and fails closed on identity mismatch. */
(()=>{
 const VERSION='1.6';
 const core=window.myliftcoachIntelligenceCore;
 const AUTHORITY='adaptive_programming';
 if(!core||typeof core.safe!=='function'||typeof core.call!=='function'||typeof core.account!=='function'||typeof core.unavailable!=='function'||typeof core.accountHold!=='function'||typeof core.auditSummary!=='function'){
  const unavailable=()=>({state:'unavailable',reason:'intelligence_core_missing',accountBound:true,authority:AUTHORITY,mayOverrideAdaptive:false});
  const account=()=>({valid:false,owner:null,verified:null,stale:true,reason:'intelligence_core_missing'});
  const hold=()=>({status:'account_hold',targetWeight:null,workingSets:null,reason:'Personalized programming is paused because the shared intelligence core is unavailable.',authority:AUTHORITY,accountBoundary:unavailable()});
  const blocked=()=>({context:unavailable(),dose:unavailable(),recovery:unavailable(),progression:unavailable(),fatigue:unavailable(),program:unavailable(),account:account()});
  const guardrails=()=>({version:VERSION,coreVersion:null,audits:{},account:account(),checks:{coreLoaded:false,adaptiveFinalAuthority:false,noAutomaticProgramReplacement:false,learnedEvidenceCannotIncreaseLoad:false,learnedRecoveryCannotReschedule:false,progressionLearningCannotAccelerate:false,fatigueLearningCannotAutoProgram:false,accountBound:false},healthy:false});
  const api=Object.freeze({version:VERSION,coreVersion:null,account,athlete:blocked,coach:blocked,proposal:blocked,prescribe:hold,guardrails,snapshot:()=>({version:VERSION,coreVersion:null,account:account(),athlete:blocked(),coach:blocked(),guardrails:guardrails(),authority:AUTHORITY}),authority:AUTHORITY});
  window.myliftcoachIntelligence=api;window.MYLIFTCOACH_INTELLIGENCE_CONTRACT_VERSION=VERSION;return;
 }
 const {safe,call,account}=core;
 const blocked=()=>core.unavailable();
 function athlete(exerciseId,events=[],exerciseMuscles={}){const a=account();if(!a.valid)return {context:blocked(),dose:blocked(),recovery:blocked(),progression:blocked(),fatigue:blocked(),program:blocked(),account:a};const id=String(exerciseId??'');return {context:call('myliftcoachAthleteExerciseContexts',[events,id],null),dose:call('myliftcoachAthleteDoseProfile',[events,id],null),recovery:call('myliftcoachAthleteRecoveryProfile',[events,id],null),progression:call('myliftcoachAthleteProgressionProfile',[events,id],null),fatigue:call('myliftcoachAthleteFatigueProfile',[events,id],null),program:call('liftovaLearnProgramFoundation',[events,exerciseMuscles],null),account:a};}
 function coach(exerciseId,plannedRecoveryHours=null){const a=account();if(!a.valid)return {context:blocked(),dose:blocked(),recovery:blocked(),progression:blocked(),fatigue:blocked(),account:a};const id=String(exerciseId??'');return {context:call('myliftcoachCoachExerciseContextEvidence',[id],null),dose:call('myliftcoachCoachDoseExplain',[id],null),recovery:call('myliftcoachCoachRecoveryExplain',[id,plannedRecoveryHours],null),progression:call('myliftcoachCoachProgressionExplain',[id],null),fatigue:call('myliftcoachCoachFatigueExplain',[id],null),account:a};}
 function prescribe(){const a=account();if(!a.valid)return core.accountHold();if(typeof window.prismAdaptivePrescription!=='function')return null;return safe(()=>window.prismAdaptivePrescription.apply(window,arguments),null);}
 function proposal(proposal){const a=account();if(!a.valid)return {context:blocked(),dose:blocked(),recovery:blocked(),progression:blocked(),fatigue:blocked(),account:a};const ids=(proposal?.changes||[]).map(x=>x?.exerciseId).filter(Boolean);return {context:call('myliftcoachCoachProposalContextEvidence',[proposal],null),dose:call('myliftcoachCoachDoseProposalSummary',[ids],null),recovery:call('myliftcoachCoachRecoveryProposalEvidence',[proposal],null),progression:call('myliftcoachCoachProgressionProposalSummary',[ids],null),fatigue:call('myliftcoachCoachFatigueProposalSummary',[ids],null),account:a};}
 function guardrails(){const summary=core.auditSummary();return {version:VERSION,coreVersion:core.version,...summary};}
 function snapshot({exerciseId,plannedRecoveryHours=null,events=[],exerciseMuscles={}}={}){const a=account();return {version:VERSION,coreVersion:core.version,exerciseId:String(exerciseId??''),account:a,athlete:athlete(exerciseId,events,exerciseMuscles),coach:coach(exerciseId,plannedRecoveryHours),guardrails:guardrails(),authority:core.authority};}
 const api=Object.freeze({version:VERSION,coreVersion:core.version,account,athlete,coach,proposal,prescribe,guardrails,snapshot,authority:core.authority});
 window.myliftcoachIntelligence=api;window.MYLIFTCOACH_INTELLIGENCE_CONTRACT_VERSION=VERSION;
})();
