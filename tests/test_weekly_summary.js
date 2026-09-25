const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../weekly-summary.js'),'utf8');
const exercises={chest:{id:'chest',name:'Chest Press',muscle:'Chest'},row:{id:'row',name:'Seated Row',muscle:'Back'},leg:{id:'leg',name:'Leg Extension',muscle:'Quads'}};
const area={innerHTML:''};
const context={console,Date,Map,Number,Math,String,workoutHistory:[],workoutGoals:{days:4,skipped:false},getExercise:id=>exercises[id]||null,sessionDay:s=>s.date,weekStart:()=> '2026-09-21',escapeHTML:value=>String(value),canAccessFeature:()=>true,showProPreview:()=>{},showOverallProgress:()=>{},document:{getElementById:id=>id==='weeklySummaryProgress'?area:null},renderWeeklySummary:function(){},prismProWeeklyExample:function(){}};
vm.createContext(context);vm.runInContext(source,context);
function session(date,exerciseSets){return {date,exercises:Object.entries(exerciseSets).map(([id,sets])=>({id,sets:sets.map(([weight,reps])=>({weight,reps}))}))};}
context.workoutHistory=[];let data=context.prismWeeklyBuildData();assert.equal(data.currentSessions.length,0);assert.equal(data.currentSets.length,0);assert.equal(data.currentVolume,0);context.prismWeeklyRenderFull(area,'weeklySummaryProgress');assert.match(area.innerHTML,/learning from your workouts/i);
context.workoutHistory=[session('2026-09-22',{chest:[[100,10],[100,10]],row:[[90,10]]})];data=context.prismWeeklyBuildData();assert.equal(data.currentSessions.length,1);assert.equal(data.currentSets.length,3);assert.equal(data.currentVolume,2900);assert.equal(data.hasPreviousWeek,false);context.prismWeeklyRenderFull(area,'weeklySummaryProgress');assert.match(area.innerHTML,/learning your baseline/i);
context.workoutHistory=[session('2026-09-15',{chest:[[100,10]],row:[[100,10]],leg:[[80,10]]}),session('2026-09-22',{chest:[[105,10]],row:[[90,10]],leg:[[80,10],[80,10]]})];data=context.prismWeeklyBuildData();assert.equal(data.improved[0].id,'chest');assert.equal(data.declined[0].id,'row');assert.equal(data.prCount,1);assert.equal(data.mostTrained.muscle,'Quads');assert.equal(context.prismWeeklyExerciseChange(data.improved[0]),'+5 lb');
// One extra rep is real progression at the same load.
context.workoutHistory=[session('2026-09-15',{chest:[[100,10]]}),session('2026-09-22',{chest:[[100,11]]})];data=context.prismWeeklyBuildData();assert.equal(data.improved.length,1);assert.equal(data.prCount,1);assert.equal(context.prismWeeklyExerciseChange(data.improved[0]),'+1 rep');
// A heavier load with a large rep loss should not be celebrated as progress.
context.workoutHistory=[session('2026-09-15',{chest:[[100,10]]}),session('2026-09-22',{chest:[[105,6]]})];data=context.prismWeeklyBuildData();assert.equal(data.improved.length,0);assert.equal(data.prCount,0);
// A single-rep fluctuation downward is treated as normal noise, not a decline.
context.workoutHistory=[session('2026-09-15',{chest:[[100,10]]}),session('2026-09-22',{chest:[[100,9]]})];data=context.prismWeeklyBuildData();assert.equal(data.declined.length,0);
// Two lost reps at the same load is meaningful enough to surface.
context.workoutHistory=[session('2026-09-15',{chest:[[100,10]]}),session('2026-09-22',{chest:[[100,8]]})];data=context.prismWeeklyBuildData();assert.equal(data.declined.length,1);
context.workoutHistory=[session('2026-09-15',{chest:[[100,10]]}),session('2026-09-22',{chest:[[105,10]]})];const snapshot=JSON.stringify(context.workoutHistory);context.canAccessFeature=()=>false;context.prismWeeklyRenderFull(area,'weeklySummaryProgress');assert.match(area.innerHTML,/PRISM PRO/);assert.match(area.innerHTML,/Preview Weekly Summary/);assert.equal(JSON.stringify(context.workoutHistory),snapshot);
console.log('Weekly PRISM Summary thresholds, PRs, comparisons, balance, Free/Pro, and data safety: OK');