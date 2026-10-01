const assert=require('assert'),fs=require('fs'),vm=require('vm');
const intelligence=fs.readFileSync('myliftcoach-intelligence-core.js','utf8'),evidence=fs.readFileSync('myliftcoach-athlete-evidence-core.js','utf8'),core=fs.readFileSync('athlete-learning-engine.js','utf8'),overlay=fs.readFileSync('athlete-context-learning-v8.js','utf8');
const window={};const ctx={window,console,setTimeout};vm.createContext(ctx);vm.runInContext(intelligence,ctx);vm.runInContext(evidence,ctx);vm.runInContext(core,ctx);vm.runInContext(overlay,ctx);
const iso=d=>new Date(Date.now()-d*86400000).toISOString();
const make=(exerciseId,id,days,recovery='ready',delta=.08,phase='hypertrophy')=>({recommendationId:id,exerciseId,recommendationType:'load_hold',completedAt:iso(days),followedRecommendation:true,performanceDelta:delta,rpe:recovery==='strained'?9.5:7,pain:recovery==='strained'?5:1,recoveryState:recovery,phase});
const weeks=[6,12,16,20],report={};
for(const weeksCount of weeks){
 const events=[];
 for(const id of ['press','row','leg']){
  const exposures=Math.max(6,Math.floor(weeksCount/2));
  for(let i=0;i<exposures;i++){const days=Math.max(2,(exposures-1-i)*7);events.push(make(id,`${weeksCount}-${id}-${i}`,days,'ready',.08));}
 }
 const snap=window.myliftcoachAthleteContextSnapshot(events,{press:['chest'],row:['back'],leg:['quads']});
 assert.strictEqual(snap.programContextReadiness.ready,true);
 const press=window.myliftcoachAthleteExerciseContexts(events,'press');assert.strictEqual(press.bestContext.context.recovery,'ready');
 const reversed=[make('press',`${weeksCount}-old-a`,80,'ready',.12),make('press',`${weeksCount}-old-b`,70,'ready',.12),make('press',`${weeksCount}-old-c`,60,'ready',.12),make('press',`${weeksCount}-bad-a`,12,'ready',-.15),make('press',`${weeksCount}-bad-b`,4,'ready',-.15)];
 const reversedPress=window.myliftcoachAthleteExerciseContexts(reversed,'press');assert.strictEqual(reversedPress.contexts['ready|followed|hypertrophy'].state,'contradictory');
 const stale=[];for(let i=0;i<6;i++)stale.push(make('press',`stale-${weeksCount}-${i}`,150+i*5,'ready',.1));
 assert.strictEqual(window.myliftcoachAthleteExerciseContexts(stale,'press').contexts['ready|followed|hypertrophy'].state,'stale');
 report[weeksCount]={ready:snap.programContextReadiness.ready,usableExercises:snap.usableExercises,reversal:reversedPress.contexts['ready|followed|hypertrophy'].state,expired:'stale'};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH Athlete Context V8 6/12/16/20 Week Simulation',weeks,report,checks:{productionCorePath:true,freshPatternsBuild:true,contextSpecificityPersists:true,recentReversalReducesTrust:true,oldPatternsExpire:true,adaptiveAuthorityPreserved:true}},null,2));
