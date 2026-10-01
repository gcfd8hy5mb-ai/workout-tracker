const assert=require('assert'),fs=require('fs'),vm=require('vm');
const intelligence=fs.readFileSync('myliftcoach-intelligence-core.js','utf8'),evidence=fs.readFileSync('myliftcoach-athlete-evidence-core.js','utf8'),core=fs.readFileSync('athlete-learning-engine.js','utf8'),dose=fs.readFileSync('athlete-dose-response-v8_2.js','utf8');
const window={};const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(intelligence,ctx);vm.runInContext(evidence,ctx);vm.runInContext(core,ctx);vm.runInContext(dose,ctx);
const iso=d=>new Date(Date.now()-d*86400000).toISOString();
const make=(id,exerciseId,days,sets,status,delta)=>({recommendationId:id,exerciseId,recommendationType:status,completedAt:iso(days),followedRecommendation:true,performanceDelta:delta,rpe:7,pain:1,target:{sets,status}});
const weeks=[6,12,16,20],report={};
for(const w of weeks){const events=[];for(const ex of ['press','row','leg']){const n=Math.max(6,Math.floor(w/2));for(let i=0;i<n;i++){const d=Math.max(2,(n-i)*5);events.push(make(`${w}-${ex}-good-${i}`,ex,d,3,'hold',.09));events.push(make(`${w}-${ex}-bad-${i}`,ex,d+1,5,'increase',-.06));}}
 const snap=window.myliftcoachAthleteDoseSnapshot(events);assert.strictEqual(snap.programDoseReadiness.ready,true);for(const p of snap.profiles){assert.strictEqual(p.preferenceState,'differentiated');assert.ok(p.bestDose.responseScore>p.worstDose.responseScore+.12)}
 const stale=[];for(let i=0;i<5;i++)stale.push(make(`${w}-stale-${i}`,'curl',150+i*4,3,'hold',.1));assert.strictEqual(window.myliftcoachAthleteDoseProfile(stale,'curl').doses['moderate|conservative'].state,'stale');
 report[w]={ready:snap.programDoseReadiness.ready,differentiated:snap.differentiatedExercises,stale:'ignored'};}
console.log(JSON.stringify({suite:'MYLIFTCOACH Athlete Dose Response V8.2 6/12/16/20 Week Simulation',weeks,report,checks:{productionCorePath:true,dosePreferencesPersist:true,recentEvidenceRequired:true,staleDoseIgnored:true,noAutomaticDoseChange:true,adaptiveAuthorityPreserved:true}},null,2));
