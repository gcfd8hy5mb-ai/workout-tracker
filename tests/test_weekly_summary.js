const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../weekly-summary.js'),'utf8');

const exercises={
  chest:{id:'chest',name:'Chest Press',muscle:'Chest'},
  row:{id:'row',name:'Seated Row',muscle:'Back'},
  leg:{id:'leg',name:'Leg Extension',muscle:'Quads'}
};
const area={innerHTML:''};
const context={
  console,
  Date,
  Map,
  Number,
  Math,
  String,
  workoutHistory:[],
  workoutGoals:{days:4,skipped:false},
  getExercise:id=>exercises[id]||null,
  sessionDay:s=>s.date,
  weekStart:()=> '2026-09-21',
  escapeHTML:value=>String(value),
  canAccessFeature:()=>true,
  showProPreview:()=>{},
  showOverallProgress:()=>{},
  document:{getElementById:id=>id==='weeklySummaryProgress'?area:null},
  renderWeeklySummary:function(){},
  prismProWeeklyExample:function(){}
};
vm.createContext(context);
vm.runInContext(source,context);

function session(date,exerciseSets){
  return {date,exercises:Object.entries(exerciseSets).map(([id,sets])=>({id,sets:sets.map(([weight,reps])=>({weight,reps}))}))};
}

// Brand-new user: no invented results and a useful learning state.
context.workoutHistory=[];
let data=context.prismWeeklyBuildData();
assert.equal(data.currentSessions.length,0);
assert.equal(data.currentSets.length,0);
assert.equal(data.currentVolume,0);
context.prismWeeklyRenderFull(area,'weeklySummaryProgress');
assert.match(area.innerHTML,/learning from your workouts/i);

// One week only: real totals, but no fake week-over-week comparison.
context.workoutHistory=[session('2026-09-22',{chest:[[100,10],[100,10]],row:[[90,10]]})];
data=context.prismWeeklyBuildData();
assert.equal(data.currentSessions.length,1);
assert.equal(data.currentSets.length,3);
assert.equal(data.currentVolume,2900);
assert.equal(data.hasPreviousWeek,false);
context.prismWeeklyRenderFull(area,'weeklySummaryProgress');
assert.match(area.innerHTML,/learning your baseline/i);

// Two weeks: detect improvement, decline, muscle balance and a PR from real history.
context.workoutHistory=[
  session('2026-09-15',{chest:[[100,10]],row:[[100,10]],leg:[[80,10]]}),
  session('2026-09-22',{chest:[[105,10]],row:[[90,10]],leg:[[80,10],[80,10]]})
];
data=context.prismWeeklyBuildData();
assert.equal(data.hasPreviousWeek,true);
assert.equal(data.improved[0].id,'chest');
assert.equal(data.declined[0].id,'row');
assert.equal(data.prCount,1);
assert.equal(data.mostTrained.muscle,'Quads');
assert.equal(data.mostTrained.sets,2);
assert.equal(context.prismWeeklyExerciseChange(data.improved[0]),'+5 lb');
context.prismWeeklyRenderFull(area,'weeklySummaryProgress');
assert.match(area.innerHTML,/Compared with last week/);
assert.match(area.innerHTML,/Chest Press/);
assert.match(area.innerHTML,/\+5 lb/);
assert.match(area.innerHTML,/Seated Row/);
assert.match(area.innerHTML,/Training Balance/);

// Free mode: source data stays intact and only the Pro preview is rendered.
const snapshot=JSON.stringify(context.workoutHistory);
context.canAccessFeature=()=>false;
context.prismWeeklyRenderFull(area,'weeklySummaryProgress');
assert.match(area.innerHTML,/PRISM PRO/);
assert.match(area.innerHTML,/Preview Weekly Summary/);
assert.equal(JSON.stringify(context.workoutHistory),snapshot,'weekly summary must never mutate workout history');

console.log('Weekly PRISM Summary empty, baseline, comparison, PR, balance, Free/Pro, and data-safety cases: OK');
