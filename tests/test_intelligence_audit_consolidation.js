const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const window={
 myliftcoachCoachContextAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachDoseAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachRecoveryAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachAdaptiveArbitrationV8Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveContextV81Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noAutomaticProgramReplacement:true}}),
 myliftcoachAdaptiveDoseV82Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,neverIncreaseLoadFromDoseEvidence:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveRecoveryV83Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,learnedRecoveryCannotIncreaseLoad:true,learnedRecoveryCannotReschedule:true,noProgramReplacement:true}})
};
vm.runInNewContext(fs.readFileSync('myliftcoach-intelligence-core.js','utf8'),{window,JSON,Object,Number,String,Boolean,Math,Date,Array,RegExp,setTimeout});
const core=window.myliftcoachIntelligenceCore;
assert.equal(core.version,'1.2');
assert.deepEqual(Object.keys(core.auditSources),['coachContext','coachDose','coachRecovery','adaptive','adaptiveContext','adaptiveDose','adaptiveRecovery']);
let summary=core.auditSummary();
assert.equal(summary.healthy,true);
assert.equal(summary.checks.adaptiveFinalAuthority,true);
assert.equal(summary.checks.learnedEvidenceCannotIncreaseLoad,true);
assert.equal(summary.checks.learnedRecoveryCannotReschedule,true);
window.myliftcoachAdaptiveRecoveryV83Audit=()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,learnedRecoveryCannotIncreaseLoad:false,learnedRecoveryCannotReschedule:false,noProgramReplacement:true}});
summary=core.auditSummary();
assert.equal(summary.healthy,false);
assert.equal(summary.checks.learnedEvidenceCannotIncreaseLoad,false);
assert.equal(summary.checks.learnedRecoveryCannotReschedule,false);
console.log('Consolidated intelligence audit registry and fail-closed guardrail health checks pass.');
