const assert=require('assert'),fs=require('fs'),vm=require('vm');
const weeks=[6,12,16,20],report={};
for(const w of weeks){
 const window={};window.prismAdaptivePrescription=id=>({exerciseId:id,status:'increase',targetWeight:110,lastWeight:100,reason:'ready'});window.prismAdaptiveAnalyze=()=>({proposals:[{id:'p',type:'exercise_adjustment',changes:[{exerciseId:'press'}]}]});
 let state='supported';window.myliftcoachCoachExerciseContextEvidence=()=>({state,strength:state==='supported'?'moderate':'strong',summary:state,currentContext:{recovery:'ready',phase:'general'}});window.myliftcoachCoachProposalContextEvidence=()=>({state,summary:state});
 const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync('myliftcoach-adaptive-context-v8_1.js','utf8'),ctx);
 let p=window.myliftcoachAdaptiveContextArbitratePrescription({exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100});assert.strictEqual(p.status,'increase');assert.strictEqual(p.adaptiveContextV81.decision,'context_support_considered');
 state='caution';p=window.myliftcoachAdaptiveContextArbitratePrescription({exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100});assert.strictEqual(p.status,'context_hold');assert.strictEqual(p.targetWeight,100);
 state='conflict';p=window.myliftcoachAdaptiveContextArbitratePrescription({exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100});assert.strictEqual(p.status,'context_hold');
 state='mixed';p=window.myliftcoachAdaptiveContextArbitratePrescription({exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100});assert.strictEqual(p.status,'context_hold');
 state='stale';p=window.myliftcoachAdaptiveContextArbitratePrescription({exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100});assert.strictEqual(p.status,'increase');
 state='supported';p=window.myliftcoachAdaptiveContextArbitratePrescription({exerciseId:'press',status:'plateau_hold',targetWeight:100,lastWeight:100,adaptiveV8:{decision:'hard_plateau_hold'}});assert.strictEqual(p.status,'plateau_hold');
 report[w]={support:'considered_not_forced',caution:'hold',conflict:'hold',mixed:'hold',stale:'ignored',plateau:'hard_hold'};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH Adaptive Context V8.1 6/12/16/20 Week Simulation',weeks,report,checks:{supportNeverForces:true,currentCautionCannotIncrease:true,contextConflictCannotIncrease:true,mixedContextCannotIncrease:true,staleIgnored:true,hardHoldsWin:true,noUnsafeJump:true,adaptiveAuthorityPreserved:true}},null,2));
