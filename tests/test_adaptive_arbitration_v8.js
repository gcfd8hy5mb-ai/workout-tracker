const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('myliftcoach-adaptive-arbitration-v8.js','utf8');
let athlete={state:'validated_helpful',maySupportProposal:true,mayBlockProposal:false};
let coachState={classification:{state:'supported'}};
let fatigue={repeated:[]};
let coachBase={snapshot:{checkinSignal:{load:'normal'},plateaus:[]}};
const basePrescription=id=>({exerciseId:id,name:'Press',targetWeight:110,lastWeight:100,status:'increase',reason:'ready',workingSets:3,repMin:8,repMax:10});
const window={
  myliftcoachProgramOutcomeValidationPolicy:()=>athlete,
  myliftcoachCoachEvidenceExplain:()=>coachState,
  prismAdaptiveFatigueSignals:()=>fatigue,
  prismCoachAnalyzeBase:()=>coachBase,
  prismAdaptivePrescription:basePrescription,
  prismAdaptiveAnalyze:()=>({proposals:[{id:'p1',type:'program_recovery',title:'Recovery',priority:90}]})
};
const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(source,ctx);
let p=window.prismAdaptivePrescription('press');
assert.strictEqual(p.status,'increase');assert.strictEqual(p.adaptiveV8.decision,'fresh_support_considered');assert.strictEqual(p.adaptiveV8.authority,'adaptive_programming');
athlete={state:'stale',maySupportProposal:false,mayBlockProposal:false};coachState={classification:{state:'stale'}};
p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'increase');assert.strictEqual(p.adaptiveV8.decision,'stale_evidence_ignored');
athlete={state:'mixed',maySupportProposal:false,mayBlockProposal:false};coachState={classification:{state:'mixed'}};
p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'evidence_hold');assert.strictEqual(p.targetWeight,100);
athlete={state:'rethink',maySupportProposal:false,mayBlockProposal:true};coachState={classification:{state:'caution'}};
p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'evidence_hold');assert.strictEqual(p.targetWeight,100);
athlete={state:'validated_helpful',maySupportProposal:true,mayBlockProposal:false};coachState={classification:{state:'supported'}};coachBase={snapshot:{checkinSignal:{load:'conservative',reason:'poor recovery'},plateaus:[]}};
p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'recovery_hold');assert.strictEqual(p.targetWeight,100);assert.strictEqual(p.adaptiveV8.decision,'hard_recovery_hold');
coachBase={snapshot:{checkinSignal:{load:'normal'},plateaus:[]}};fatigue={repeated:[{id:'press'}]};
p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'recovery_hold');assert.strictEqual(p.adaptiveV8.decision,'hard_fatigue_hold');
fatigue={repeated:[]};coachBase={snapshot:{checkinSignal:{load:'normal'},plateaus:[{id:'press',reason:'stalled'}]}};
p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'plateau_hold');assert.strictEqual(p.adaptiveV8.decision,'hard_plateau_hold');
athlete={state:'rethink',maySupportProposal:false,mayBlockProposal:true};coachState={classification:{state:'caution'}};coachBase={snapshot:{checkinSignal:{load:'normal'},plateaus:[]}};
const analyzed=window.prismAdaptiveAnalyze();assert.strictEqual(analyzed.proposals.length,0,'recent harmful outcomes should block repeating a program proposal');assert.strictEqual(analyzed.adaptiveV8.authority,'adaptive_programming');
const audit=window.myliftcoachAdaptiveV8Audit();assert.strictEqual(audit.guardrails.recoveryOverridesSupport,true);assert.strictEqual(audit.guardrails.mixedEvidenceCannotIncreaseLoad,true);assert.strictEqual(audit.guardrails.recentHarmCannotIncreaseLoad,true);assert.strictEqual(audit.guardrails.adaptiveProgrammingFinalAuthority,true);
console.log(JSON.stringify({suite:'MYLIFTCOACH Adaptive Arbitration V8',checks:{freshSupportConsideredOnly:true,staleEvidenceIgnored:true,mixedEvidenceHold:true,rethinkEvidenceHold:true,recoveryHardHold:true,fatigueHardHold:true,plateauHardHold:true,harmfulProgramRepeatBlocked:true,adaptiveAuthority:true}},null,2));
