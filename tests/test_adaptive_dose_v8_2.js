const assert=require('assert'),fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('myliftcoach-adaptive-dose-v8_2.js','utf8');
const supported={state:'supported',bestDose:{dose:{volume:'moderate',pressure:'conservative'}},worstDose:{dose:{volume:'high',pressure:'progressive'}},separation:.25};
const window={myliftcoachCoachDoseExplain:()=>supported,prismAdaptivePrescription:()=>({exerciseId:'press',workingSets:5,status:'increase',targetWeight:110,lastWeight:100,reason:'progress'})};const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(code,ctx);
const r=window.myliftcoachAdaptiveDoseArbitrate({exerciseId:'press',workingSets:5,status:'increase',targetWeight:110,lastWeight:100,reason:'progress'});
assert.strictEqual(r.workingSets,3);assert.strictEqual(r.status,'evidence_hold');assert.strictEqual(r.targetWeight,110);assert.strictEqual(r.adaptiveDoseV82.neverIncreaseSetsFromDoseEvidence,true);assert.strictEqual(r.adaptiveDoseV82.neverIncreaseLoadFromDoseEvidence,true);
window.myliftcoachCoachDoseExplain=()=>({state:'stale'});const stale=window.myliftcoachAdaptiveDoseArbitrate({exerciseId:'press',workingSets:5,status:'increase',targetWeight:110,lastWeight:100,reason:'progress'});assert.strictEqual(stale.workingSets,5);assert.strictEqual(stale.status,'increase');
console.log(JSON.stringify({suite:'MYLIFTCOACH Adaptive Dose V8.2',checks:{strongDoseCanReduceVolume:true,progressivePressureCanHold:true,staleIgnored:true,noDoseDrivenSetIncrease:true,noDoseDrivenLoadIncrease:true,adaptiveAuthority:true}},null,2));
