const assert=require('assert'),fs=require('fs'),vm=require('vm');
const window={};
const sandbox={window,console,setTimeout,clearTimeout,Object,JSON,Number,String,Boolean,Math,Date,Array,RegExp};
vm.createContext(sandbox);
const run=file=>vm.runInContext(fs.readFileSync(file,'utf8'),sandbox);
const same=(a,b,msg)=>assert.equal(JSON.stringify(a),JSON.stringify(b),msg);

run('myliftcoach-intelligence-core.js');
assert.equal(window.myliftcoachIntelligenceCore.version,'1.3');
assert.equal(typeof window.myliftcoachIntelligenceCore.installWrapper,'function');
assert.equal(typeof window.myliftcoachIntelligenceCore.auditSummary,'function');

window.prismAdaptivePrescription=input=>({...input,reason:input.reason||'base'});
window.prismAdaptiveAnalyze=()=>({proposals:[{id:'p1',type:'exercise_adjustment',changes:[{exerciseId:'press'}]}]});
window.myliftcoachProgramOutcomeValidationPolicy=()=>({state:'learning',mayBlockProposal:false,maySupportProposal:false});
window.myliftcoachCoachEvidenceExplain=()=>({classification:{state:'learning'}});
window.prismAdaptiveFatigueSignals=()=>({repeated:[]});
window.prismCoachAnalyzeBase=()=>({snapshot:{checkinSignal:{load:'normal'},plateaus:[]}});
window.myliftcoachCoachExerciseContextEvidence=()=>({state:'supported',strength:'moderate',summary:'supported',currentContext:{recovery:'ready'}});
window.myliftcoachCoachProposalContextEvidence=()=>({state:'supported',summary:'supported'});
window.myliftcoachCoachDoseExplain=()=>({state:'supported',bestDose:{dose:{volume:'moderate',pressure:'normal'}},worstDose:{dose:{volume:'high',pressure:'progressive'}},separation:.2});
window.myliftcoachCoachRecoveryExplain=()=>({state:'supported',timing:'on_time'});
window.myliftcoachCoachProgressionExplain=()=>({state:'supported',tempo:'responsive'});

const input={exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100,workingSets:3,recoveryHours:72};

let before=window.prismAdaptivePrescription;
run('myliftcoach-adaptive-arbitration-v8.js');
same(window.prismAdaptivePrescription(input),window.myliftcoachAdaptiveArbitratePrescription(before(input)),'V8 wrapper must equal direct arbitration');
assert.strictEqual(window.prismAdaptivePrescription.__myliftcoachAdaptiveV8Base,before);

before=window.prismAdaptivePrescription;
run('myliftcoach-adaptive-context-v8_1.js');
same(window.prismAdaptivePrescription(input),window.myliftcoachAdaptiveContextArbitratePrescription(before(input)),'context wrapper must equal direct arbitration');
assert.strictEqual(window.prismAdaptivePrescription.__myliftcoachAdaptiveContextV81Base,before);

before=window.prismAdaptivePrescription;
run('myliftcoach-adaptive-dose-v8_2.js');
same(window.prismAdaptivePrescription(input),window.myliftcoachAdaptiveDoseArbitrate(before(input)),'dose wrapper must equal direct arbitration');
assert.strictEqual(window.prismAdaptivePrescription.__myliftcoachDoseV82Base,before);

before=window.prismAdaptivePrescription;
run('myliftcoach-adaptive-recovery-v8_3.js');
same(window.prismAdaptivePrescription(input),window.myliftcoachAdaptiveRecoveryArbitrate(before(input)),'recovery wrapper must equal direct arbitration');
assert.strictEqual(window.prismAdaptivePrescription.__myliftcoachRecoveryV83Base,before);

before=window.prismAdaptivePrescription;
run('myliftcoach-adaptive-progression-v8_4.js');
same(window.prismAdaptivePrescription(input),window.myliftcoachAdaptiveProgressionArbitrate(before(input)),'progression wrapper must equal direct arbitration');
assert.strictEqual(window.prismAdaptivePrescription.__myliftcoachProgressionV84Base,before);

const final=window.prismAdaptivePrescription(input);
assert.equal(final.status,'increase');
assert.equal(final.targetWeight,110);
assert.equal(final.adaptiveV8.authority,'adaptive_programming');
assert.equal(final.adaptiveContextV81.authority,'adaptive_programming');
assert.equal(final.adaptiveDoseV82.authority,'adaptive_programming');
assert.equal(final.adaptiveRecoveryV83.authority,'adaptive_programming');
assert.equal(final.adaptiveProgressionV84.authority,'adaptive_programming');
assert.equal(final.adaptiveDoseV82.neverIncreaseLoadFromDoseEvidence,true);
assert.equal(final.adaptiveRecoveryV83.mayIncreaseLoad,false);
assert.equal(final.adaptiveProgressionV84.neverAccelerateFromLearning,true);

const once=window.prismAdaptivePrescription;
run('myliftcoach-adaptive-progression-v8_4.js');
assert.strictEqual(window.prismAdaptivePrescription,once,'shared installer must keep wrappers idempotent');

console.log(JSON.stringify({suite:'MYLIFTCOACH intelligence wrapper equivalence',checks:{sharedInstaller:true,v8Equivalent:true,contextEquivalent:true,doseEquivalent:true,recoveryEquivalent:true,progressionEquivalent:true,idempotent:true,adaptiveAuthorityPreserved:true}},null,2));