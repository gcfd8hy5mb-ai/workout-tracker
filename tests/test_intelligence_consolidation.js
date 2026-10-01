const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const coreCode=fs.readFileSync('myliftcoach-intelligence-core.js','utf8');
const contractCode=fs.readFileSync('myliftcoach-intelligence-contract-v1.js','utf8');
const window={
 myliftcoachAthleteExerciseContexts:()=>({state:'usable'}),
 myliftcoachAthleteDoseProfile:()=>({preferenceState:'differentiated'}),
 myliftcoachAthleteRecoveryProfile:()=>({preferenceState:'differentiated'}),
 myliftcoachAthleteProgressionProfile:()=>({progressionTempo:'standard'}),
 liftovaLearnProgramFoundation:()=>({programReadiness:{ready:true}}),
 myliftcoachCoachExerciseContextEvidence:()=>({state:'supported'}),
 myliftcoachCoachDoseExplain:()=>({state:'supported'}),
 myliftcoachCoachRecoveryExplain:()=>({state:'supported',timing:'on_time'}),
 myliftcoachCoachProgressionExplain:()=>({state:'supported',tempo:'standard'}),
 myliftcoachCoachProposalContextEvidence:()=>({state:'supported'}),
 myliftcoachCoachDoseProposalSummary:()=>({state:'supported'}),
 myliftcoachCoachRecoveryProposalEvidence:()=>({state:'supported'}),
 myliftcoachCoachProgressionProposalSummary:()=>({state:'supported'}),
 prismAdaptivePrescription:(x)=>({...x,status:x.status||'hold',authority:'adaptive_programming'}),
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
const sandbox={window,Object,JSON,Number,String,Boolean,Math,Date,Array,RegExp,setTimeout};
vm.runInNewContext(coreCode,sandbox);
vm.runInNewContext(contractCode,sandbox);
assert(window.myliftcoachIntelligenceCore,'shared intelligence core should install');
assert.equal(window.myliftcoachIntelligenceCore.version,'1.3');
assert.equal(typeof window.myliftcoachIntelligenceCore.installWrapper,'function');
assert.equal(typeof window.myliftcoachIntelligenceCore.auditSummary,'function');
assert(window.myliftcoachIntelligence,'contract should install');
assert.equal(window.myliftcoachIntelligence.version,'1.5');
assert.equal(window.myliftcoachIntelligence.coreVersion,'1.3');
const snap=window.myliftcoachIntelligence.snapshot({exerciseId:'bench',plannedRecoveryHours:72,events:[]});
assert.equal(snap.athlete.context.state,'usable');
assert.equal(snap.athlete.progression.progressionTempo,'standard');
assert.equal(snap.coach.recovery.timing,'on_time');
assert.equal(snap.coach.progression.tempo,'standard');
assert.equal(snap.authority,'adaptive_programming');
assert.equal(snap.guardrails.healthy,true);
assert.equal(snap.guardrails.coreVersion,'1.3');
assert.equal(snap.guardrails.auditSources.adaptiveProgression,'myliftcoachAdaptiveProgressionAudit');
const rx=window.myliftcoachIntelligence.prescribe({exerciseId:'bench',status:'increase'});
assert.equal(rx.authority,'adaptive_programming');
const proposal=window.myliftcoachIntelligence.proposal({changes:[{exerciseId:'bench'}]});
assert.equal(proposal.context.state,'supported');
assert.equal(proposal.dose.state,'supported');
assert.equal(proposal.recovery.state,'supported');
assert.equal(proposal.progression.state,'supported');
const config=fs.readFileSync('supabase-config.js','utf8');
assert(config.includes("myliftcoach-intelligence-core.js?v=1.3"),'shared intelligence core 1.3 must load in runtime');
assert(config.includes("myliftcoach-intelligence-contract-v1.js?v=1.5"),'contract 1.5 must load in runtime');
assert(config.includes("myliftcoach-intelligence-account-boundary.js?v=1.2"),'account boundary 1.2 must load in runtime');
const core=config.indexOf('myliftcoach-intelligence-core.js?v=1.3');
const athlete=config.indexOf('athlete-context-learning-v8.js?v=8.0');
const adaptive=config.indexOf('myliftcoach-adaptive-progression-v8_4.js?v=8.4');
const contract=config.indexOf('myliftcoach-intelligence-contract-v1.js?v=1.5');
const boundary=config.indexOf('myliftcoach-intelligence-account-boundary.js?v=1.2');
assert(core<athlete,'shared core must load before Athlete/Coach/Adaptive implementation layers');
assert(contract>adaptive,'contract must load after implementation layers');
assert(boundary>contract,'account boundary must load after the consolidated contract and wrapped implementations');
console.log('V8.4 intelligence consolidation contract regression passed');
