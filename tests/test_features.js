// Exercise the adaptive target with completed workout history, without a browser.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const match=source.match(/const SMART_REP_RANGE=[\s\S]*?\n\}\nfunction overloadGoal/);
assert(match,'progression algorithm exists');
const context={workoutHistory:[],getExercise:()=>({id:'press',muscle:'Chest'}),smartExerciseMetadata:()=>({equipment:'Machine',type:'Compound'})};
vm.createContext(context);
vm.runInContext(match[0].replace(/\nfunction overloadGoal$/,''),context);
const session=(weight,reps)=>({exercises:[{id:'press',sets:reps.map(rep=>({weight,reps:rep}))}]});
assert.equal(context.progressionSuggestion('press').status,'insufficient');
context.workoutHistory=[session(180,[10,10,10])];
assert.equal(context.progressionSuggestion('press').status,'insufficient','one session shows history but no target');
context.workoutHistory=[session(180,[10,10,10]),session(175,[9,10,9])];
assert.equal(context.progressionSuggestion('press').weight,185);
context.workoutHistory=[session(185,[8,9,8]),session(180,[10,10,10])];
assert.equal(context.progressionSuggestion('press').weight,185);
context.workoutHistory=[session(185,[6,7,6]),session(185,[6,6,7])];
assert.equal(context.progressionSuggestion('press').weight,180);
context.workoutHistory=[session(185,[7,8,8]),session(185,[6,7,6])];
assert.equal(context.progressionSuggestion('press').weight,185,'a mixed session must not force a deload');
context.workoutHistory=[{exercises:[{id:'press',sets:[{weight:'',reps:10}]}]},session(180,[10,10]),session(175,[9,9])];
assert.equal(context.progressionSuggestion('press').weight,185,'skip incomplete sessions');
context.workoutHistory=[session(180,[10,10,9]),session(175,[10,10,10])];
assert.equal(context.progressionSuggestion('press').action,'hold','top rep range must be reached on every set');
context.workoutHistory=[session(180,[10]),session(175,[10,10])];
assert.equal(context.progressionSuggestion('press').status,'insufficient','single-set workouts need more history');

const storage=new Map(),saved=[];
const finishContext={
activeWorkoutKey:'preset-day1',activeWorkoutTitle:'Chest day',activeWorkoutExerciseIds:['press'],
tracking:{readiness:{},substitutions:{}},workoutHistory:[],previousHistory:{},
setHistory:{'preset-day1-press-set1':{weight:180,reps:10}},overloadTargets:{},completedExercises:[],
getExercise:()=>({name:'Chest press'}),localDay:()=> '2026-09-24',
progressionSuggestion:()=>({weight:185}),overloadKey:id=>`preset-day1-${id}`,
activeWorkoutCompletionIds:()=>['preset-day1-press'],saveTracking:()=>{},skipWorkoutRest:()=>{},
updateProgress:()=>{},showWorkoutSummary:s=>saved.push(s),alert:msg=>{throw Error(msg)},
readPrismActiveWorkout:()=>null,
localStorage:{setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}
};
vm.createContext(finishContext);
const finishStart=source.indexOf('function finishWorkout(){');
const finishEnd=source.indexOf('function showLastWorkoutSummary()',finishStart);
assert(finishStart>0&&finishEnd>finishStart);
vm.runInContext(source.slice(finishStart,finishEnd),finishContext);
finishContext.finishWorkout();
assert.equal(finishContext.workoutHistory.length,1);
assert.equal(finishContext.completedExercises[0],'preset-day1-press');
assert.equal(finishContext.overloadTargets['preset-day1-press'],undefined,'finishing must not apply a recommendation automatically');
assert.equal(saved.length,1,'show the saved workout summary');
assert.equal(saved[0].recordIds[0],'press');
assert.equal(finishContext.setHistory['preset-day1-press-set1'],undefined);
assert.equal(JSON.parse(storage.get('workoutHistoryV52')).length,1);

const partial={...finishContext,setHistory:{'preset-day1-press-set1':{weight:180,reps:''}},workoutHistory:[],alerts:[],safeId:id=>id,document:{getElementById:()=>null}};
partial.alert=msg=>partial.alerts.push(msg);
vm.createContext(partial);vm.runInContext(source.slice(finishStart,finishEnd),partial);
partial.finishWorkout();
assert.equal(partial.workoutHistory.length,0,'reject incomplete set before saving');
assert.equal(partial.alerts.length,1);
const weeklyStart=source.indexOf('function renderWeeklySummary(id){');
const weeklyEnd=source.indexOf('/* OVERALL PROGRESS */',weeklyStart);
const weeklyArea={innerHTML:''};
const weekContext={
document:{getElementById:()=>weeklyArea},workoutHistory:[{date:new Date().toISOString(),exercises:[{id:'press',sets:[{weight:185,reps:8}]}]}],
workoutGoals:{days:4},tracking:{food:[]},weightEntriesNewestFirst:()=>[],dailyCalorieTarget:()=>2000,canAccessFeature:()=>false,proFeatureCard:()=>'<div>PRO</div>',
sessionDay:s=>s.date.slice(0,10),weekStart:date=>{const day=new Date(date);day.setDate(day.getDate()-(day.getDay()+6)%7);return day.toISOString().slice(0,10)}
};
vm.createContext(weekContext);vm.runInContext(source.slice(weeklyStart,weeklyEnd),weekContext);
weekContext.renderWeeklySummary('weeklySummaryHome');
assert.match(weeklyArea.innerHTML,/Weekly workout goal/);
assert.match(weeklyArea.innerHTML,/1\/4/);
assert.match(weeklyArea.innerHTML,/See all progress/);
assert.doesNotMatch(weeklyArea.innerHTML,/Weight change|Calories:|PRs/,'Free summary stays basic');
weekContext.canAccessFeature=()=>true;weekContext.renderWeeklySummary('weeklySummary');
assert.match(weeklyArea.innerHTML,/Weekly PRISM Summary|PRs/,'Pro includes detailed weekly insights');
const pickerStart=source.indexOf('function confirmPicker(){'),pickerEnd=source.indexOf('function refreshComparison(key){',pickerStart);
let chosen=null,closed=0;
const direct={value:'185',focus:()=>{}};
const pickerContext={pickerKey:'press-set1',pickerType:'weight',pickerValues:[2.5,5],pickerSelectedIndex:0,
document:{getElementById:id=>id==='pickerDirectValue'?direct:{textContent:''}},
safeId:id=>id,saveSet:(_,__,value)=>{chosen=value},refreshComparison:()=>{},closePicker:()=>{closed++}};
vm.createContext(pickerContext);vm.runInContext(source.slice(pickerStart,pickerEnd),pickerContext);
pickerContext.confirmPicker();assert.equal(chosen,185);assert.equal(closed,1);
direct.value='0';chosen=null;pickerContext.confirmPicker();assert.equal(chosen,null,'zero weight is not a valid logged set');
const restoreStart=source.indexOf('function readPrismActiveWorkout(){'),restoreEnd=source.indexOf('function resumePrismWorkout(){',restoreStart);
assert(restoreStart>0&&restoreEnd>restoreStart);
let activeValue=JSON.stringify({key:'preset-day1',title:'Chest day',ids:['press'],index:1});
const restoreContext={localStorage:{getItem:()=>activeValue},getExercise:id=>id==='press'?{id}:null};
vm.createContext(restoreContext);vm.runInContext(source.slice(restoreStart,restoreEnd),restoreContext);
assert.equal(restoreContext.readPrismActiveWorkout().index,1);
activeValue=JSON.stringify({key:'preset-day1',ids:['unknown']});
assert.equal(restoreContext.readPrismActiveWorkout(),null,'invalid saved exercises should not reopen a broken workout');
assert.match(source,/localStorage\.setItem\("prismRestEndsAtV1"/);
console.log('Smart progression: increase, repeat, and deload passed');
console.log('Workout completion: saved summary, targets, and incomplete-set guard passed');
console.log('Weekly dashboard: current-week tally and progress link passed');
console.log('Direct set entry: accepts valid weight and rejects zero passed');
console.log('Active workout and rest timer persistence passed');
