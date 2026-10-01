const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('myliftcoach-adaptive-arbitration-v8.js','utf8');
let athlete=null,coachState=null,fatigue={repeated:[]},coachBase={snapshot:{checkinSignal:{load:'normal'},plateaus:[]}};
const base=id=>({exerciseId:id,name:'Press',targetWeight:110,lastWeight:100,status:'increase',reason:'ready',workingSets:3,repMin:8,repMax:10});
const window={myliftcoachProgramOutcomeValidationPolicy:()=>athlete,myliftcoachCoachEvidenceExplain:()=>coachState,prismAdaptiveFatigueSignals:()=>fatigue,prismCoachAnalyzeBase:()=>coachBase,prismAdaptivePrescription:base,prismAdaptiveAnalyze:()=>({proposals:[{id:'p1',type:'program_recovery'}]})};
const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(source,ctx);
const report={};
for(const weeks of [6,12,16,20]){
  athlete={state:'validated_helpful',maySupportProposal:true,mayBlockProposal:false};coachState={classification:{state:'supported'}};fatigue={repeated:[]};coachBase={snapshot:{checkinSignal:{load:'normal'},plateaus:[]}};
  let p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'increase');assert.strictEqual(p.adaptiveV8.decision,'fresh_support_considered');
  athlete={state:'stale',maySupportProposal:false,mayBlockProposal:false};coachState={classification:{state:'stale'}};p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'increase');assert.strictEqual(p.adaptiveV8.staleEvidenceIgnored,true);
  athlete={state:'mixed',maySupportProposal:false,mayBlockProposal:false};coachState={classification:{state:'mixed'}};p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'evidence_hold');assert.strictEqual(p.targetWeight,100);
  athlete={state:'rethink',maySupportProposal:false,mayBlockProposal:true};coachState={classification:{state:'caution'}};p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'evidence_hold');
  athlete={state:'validated_helpful',maySupportProposal:true,mayBlockProposal:false};coachState={classification:{state:'supported'}};coachBase={snapshot:{checkinSignal:{load:'conservative',reason:'recovery'},plateaus:[]}};p=window.prismAdaptivePrescription('press');assert.strictEqual(p.status,'recovery_hold');
  report[weeks]={fresh:'increase remains adaptive-owned',stale:'ignored',mixed:'hold',rethink:'hold',recovery:'hard hold'};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH Adaptive V8 6/12/16/20 Week Arbitration Simulation',weeks:[6,12,16,20],report,checks:{supportNeverForcesChange:true,staleIgnored:true,mixedCannotIncrease:true,rethinkCannotIncrease:true,recoveryAlwaysWins:true,noUnsafeJump:true,adaptiveAuthorityPreserved:true}},null,2));
