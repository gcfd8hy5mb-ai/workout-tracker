const assert=require('assert'),fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('athlete-recovery-lag-v8_3.js','utf8'),window={},ctx={window,console};vm.createContext(ctx);vm.runInContext(src,ctx);
const iso=d=>new Date(Date.now()-d*86400000).toISOString();
const weeks=[6,12,16,20],report={};
for(const w of weeks){
 const events=[];for(const id of ['press','row','leg']){const n=Math.max(6,Math.floor(w/2));for(let i=0;i<n;i++){const d=Math.max(2,(n-1-i)*6);events.push({exerciseId:id,recommendationId:`${w}-${id}-good-${i}`,recoveryHours:56,completedAt:iso(d),performanceDelta:.08});events.push({exerciseId:id,recommendationId:`${w}-${id}-soon-${i}`,recoveryHours:24,completedAt:iso(Math.max(1,d-1)),performanceDelta:-.03});}}
 const snap=window.myliftcoachAthleteRecoverySnapshot(events);assert.strictEqual(snap.programRecoveryReadiness.ready,true);assert.strictEqual(snap.dominantWindow,'medium');
 for(const p of snap.profiles){assert.strictEqual(p.bestWindow.bucket,'medium');assert.ok(p.separation>=.12);assert.strictEqual(p.mayOverrideAdaptive,false);}
 report[w]={ready:snap.programRecoveryReadiness.ready,dominantWindow:snap.dominantWindow,usableExercises:snap.usableExercises};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH Athlete Recovery Lag V8.3 6/12/16/20 Week Simulation',weeks,report,checks:{stableWindowLearning:true,tooSoonPenalty:true,longHorizonConsistency:true,noAutomaticScheduleChange:true,adaptiveAuthorityPreserved:true}},null,2));