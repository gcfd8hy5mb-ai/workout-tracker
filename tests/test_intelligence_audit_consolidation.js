const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const window={
 myliftcoachCoachContextAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachDoseAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachRecoveryAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachProgressionAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noAccelerationFromLearning:true}}),
 myliftcoachAdaptiveArbitrationV8Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveContextV81Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noAutomaticProgramReplacement:true}}),
 myliftcoachAdaptiveDoseV82Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,neverIncreaseLoadFromDoseEvidence:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveRecoveryV83Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,learnedRecoveryCannotIncreaseLoad:true,learnedRecoveryCannotReschedule:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveProgressionAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,responsiveEvidenceCannotAccelerate:true,neverExceedBaseTarget:true,noProgramReplacement:true}})
};
vm.runInNewContext(fs.readFileSync('myliftcoach-intelligence-core.js','utf8'),{window,JSON,Object,Number,String,Boolean,Math,Date,Array,RegExp,setTimeout});
const core=window.myliftcoachIntelligenceCore;
assert.equal(core.version,'1.3');
assert.deepEqual(Object.keys(core.auditSources),['coachContext','coachDose','coachRecovery','coachProgression','adaptive','adaptiveContext','adaptiveDose','adaptiveRecovery','adaptiveProgression']);
let summary=core.auditSummary();
assert.equal(summary.healthy,true);
assert.equal(summary.checks.adaptiveFinalAuthority,true);
assert.equal(summary.checks.learnedEvidenceCannotIncreaseLoad,true);
assert.equal(summary.checks.learnedRecoveryCannotReschedule,true);
assert.equal(summary.checks.progressionLearningCannotAccelerate,true);
window.myliftcoachAdaptiveProgressionAudit=()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,responsiveEvidenceCannotAccelerate:false,neverExceedBaseTarget:false,noProgramReplacement:true}});
summary=core.auditSummary();
assert.equal(summary.healthy,false);
assert.equal(summary.checks.progressionLearningCannotAccelerate,false);
console.log('Consolidated intelligence audit registry including V8.4 progression and fail-closed guardrail health checks pass.');