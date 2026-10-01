const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const code=fs.readFileSync('myliftcoach-intelligence-contract-v1.js','utf8');
const window={
 myliftcoachAthleteExerciseContexts:()=>({state:'usable'}),
 myliftcoachAthleteDoseProfile:()=>({preferenceState:'differentiated'}),
 myliftcoachAthleteRecoveryProfile:()=>({preferenceState:'differentiated'}),
 liftovaLearnProgramFoundation:()=>({programReadiness:{ready:true}}),
 myliftcoachCoachExerciseContextEvidence:()=>({state:'supported'}),
 myliftcoachCoachDoseExplain:()=>({state:'supported'}),
 myliftcoachCoachRecoveryExplain:()=>({state:'supported',timing:'on_time'}),
 myliftcoachCoachProposalContextEvidence:()=>({state:'supported'}),
 myliftcoachCoachDoseProposalSummary:()=>({state:'supported'}),
 myliftcoachCoachRecoveryProposalEvidence:()=>({state:'supported'}),
 prismAdaptivePrescription:(x)=>({...x,status:x.status||'hold',authority:'adaptive_programming'}),
 myliftcoachCoachContextAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachDoseAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachCoachRecoveryAudit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true}}),
 myliftcoachAdaptiveArbitrationV8Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveContextV81Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,noAutomaticProgramReplacement:true}}),
 myliftcoachAdaptiveDoseV82Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,neverIncreaseLoadFromDoseEvidence:true,noProgramReplacement:true}}),
 myliftcoachAdaptiveRecoveryV83Audit:()=>({guardrails:{adaptiveProgrammingFinalAuthority:true,learnedRecoveryCannotIncreaseLoad:true,learnedRecoveryCannotReschedule:true,noProgramReplacement:true}})
};
vm.runInNewContext(code,{window,Object,JSON,Number,String,Boolean,Math,Date,Array,RegExp});
assert(window.myliftcoachIntelligence,'contract should install');
assert.equal(window.myliftcoachIntelligence.version,'1.0');
const snap=window.myliftcoachIntelligence.snapshot({exerciseId:'bench',plannedRecoveryHours:72,events:[]});
assert.equal(snap.athlete.context.state,'usable');
assert.equal(snap.coach.recovery.timing,'on_time');
assert.equal(snap.authority,'adaptive_programming');
assert.equal(snap.guardrails.healthy,true);
const rx=window.myliftcoachIntelligence.prescribe({exerciseId:'bench',status:'increase'});
assert.equal(rx.authority,'adaptive_programming');
const proposal=window.myliftcoachIntelligence.proposal({changes:[{exerciseId:'bench'}]});
assert.equal(proposal.context.state,'supported');
assert.equal(proposal.dose.state,'supported');
assert.equal(proposal.recovery.state,'supported');
const config=fs.readFileSync('supabase-config.js','utf8');
assert(config.includes("myliftcoach-intelligence-contract-v1.js?v=1"),'contract must load in runtime');
assert(config.indexOf('myliftcoach-intelligence-contract-v1.js?v=1')>config.indexOf('myliftcoach-adaptive-recovery-v8_3.js?v=8.3'),'contract must load after implementation layers');
console.log('intelligence consolidation contract regression passed');
