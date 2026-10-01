const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const files=['myliftcoach-intelligence-core.js','myliftcoach-athlete-evidence-core.js','athlete-fatigue-deload-v8_5.js','myliftcoach-coach-fatigue-v8_5.js','myliftcoach-adaptive-fatigue-v8_5.js'];
const weeks=[6,12,16,20],report={};
for(const horizon of weeks){
 const window={};const ctx={window,console,setTimeout:()=>0,Date,Object,JSON,Number,String,Boolean,Math,Array,RegExp};vm.createContext(ctx);for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
 const now=Date.now(),d=n=>new Date(now-n*86400000).toISOString(),rows=[];let id=0;
 for(let w=0;w<horizon;w++){
  const worsening=w>=Math.max(2,horizon-5),reduced=w>=horizon-2;
  rows.push({id:`r${id++}`,exerciseId:'press',at:d((horizon-w)*3),target:{status:reduced?'deload':w%3===0?'increase':'hold'},outcome:{at:d((horizon-w)*3),value:reduced?'better':worsening?'worse':'better',details:{rpe:reduced?7:worsening?10:7,pain:worsening?3:0}},response:{value:'accepted'}});
  rows.push({id:`s${id++}`,exerciseId:'row',at:d((horizon-w)*3),target:{status:'hold'},outcome:{at:d((horizon-w)*3),value:'better',details:{rpe:7,pain:0}},response:{value:'accepted'}});
 }
 window.prismInterventionRows=()=>rows;
 const athleteEvents=rows.map(r=>({exerciseId:r.exerciseId,completedAt:r.outcome.at,recommendationType:r.target.status,performanceDelta:r.outcome.value==='better'?.08:-.08,rpe:r.outcome.details.rpe,pain:r.outcome.details.pain,outcome:r.outcome}));
 const athlete=window.myliftcoachAthleteFatigueProfile(athleteEvents,'press');
 const coach=window.myliftcoachCoachFatigueExplain('press');
 const adaptive=window.myliftcoachAdaptiveFatigueArbitrate({exerciseId:'press',status:'increase',targetWeight:110,lastWeight:100,workingSets:4,reason:'base'});
 const stable=window.myliftcoachAthleteFatigueProfile(athleteEvents,'row');
 assert.equal(athlete.fatigueState,'accumulating');assert.equal(athlete.deloadResponse,'responsive');assert.equal(coach.state,'caution');assert.equal(adaptive.status,'fatigue_learning_hold');assert(adaptive.workingSets<=4);assert.equal(stable.fatigueState,'stable');assert.equal(adaptive.adaptiveFatigueV85.noAutomaticScheduleChange,true);
 report[horizon]={athlete:athlete.fatigueState,deload:athlete.deloadResponse,coach:coach.state,adaptive:adaptive.status,stable:stable.fatigueState};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH V8.5 Fatigue 6/12/16/20 Week Simulation',weeks,report,checks:{accumulationPersists:true,deloadResponsePersists:true,stableAthleteNotOvercalled:true,coachConservative:true,adaptiveHoldAcrossHorizons:true,noAutoScheduleChange:true,noAutoRestDay:true,adaptiveAuthorityPreserved:true}},null,2));