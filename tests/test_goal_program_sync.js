const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const scoped=require('../persistence/scoped-storage.js');
const html=fs.readFileSync('index.html','utf8');
const profile=fs.readFileSync('onboarding.js','utf8');
const pick=(source,start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const engine=pick(html,'const shortPlans={','function showGoalsSetup()');
const save=pick(profile,'function savePrismTraining(event){','function initPrismJourney(){');
const users=['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'];
const raw=new Map(),backing={getItem:key=>raw.get(key)??null,setItem:(key,value)=>raw.set(key,String(value)),removeItem:key=>raw.delete(key)};
const manager=scoped.create(backing);
let home=null,refreshes=0;
const inputs={prismEditTraining:'muscle',prismEditDays:'4',prismEditFocus:'balanced',prismEditLevel:'Intermediate',prismEditRest:'90'};
const ctx={localStorage:manager.storage,tracking:{trainingLevel:'Intermediate',restSeconds:90},window:{myliftcoachRefreshHomeSchedule(){refreshes++}},document:{getElementById:id=>({value:inputs[id]})},PRISM_TRAINING_NAMES:{muscle:'Build Muscle',consistency:'General Fitness',strength:'Strength'},renderPrismLocalProfile(){},renderHome(){home=vm.runInContext('({label:ensureGeneratedProgram().focusLabel,days:suggestedWorkouts(workoutGoals).map(d=>d.exercises)})',ctx)},saveTracking(){manager.storage.setItem('dailyTrackingV1',JSON.stringify(ctx.tracking))},console};
vm.createContext(ctx);
vm.runInContext(`const presetWorkouts={push:{title:'Push',exercises:['machine-chest-press','triceps-pushdown','shoulder-press','leg-press']},pull:{title:'Pull',exercises:['lat-pulldown','seated-row','biceps-curl','seated-leg-curl']},legs:{title:'Legs',exercises:['leg-press','seated-leg-curl','calf-raise','ab-crunch']},upper:{title:'Upper',exercises:['incline-chest-press','seated-row','shoulder-press','biceps-curl']}}; let workoutGoals=null; ${engine} ${save}`,ctx);
function select(user){manager.select(user);const goals=JSON.parse(manager.storage.getItem('workoutGoalsV1')||'null');const tracking=JSON.parse(manager.storage.getItem('dailyTrackingV1')||'null');ctx.tracking=tracking||{trainingLevel:'Intermediate',restSeconds:90};vm.runInContext('workoutGoals='+JSON.stringify(goals),ctx)}
function change(goal,days=4,focus='balanced',level='Intermediate',rest=90){Object.assign(inputs,{prismEditTraining:goal,prismEditDays:String(days),prismEditFocus:focus,prismEditLevel:level,prismEditRest:String(rest)});vm.runInContext('savePrismTraining({preventDefault(){}})',ctx);return JSON.parse(manager.storage.getItem('workoutGoalsV1'))}
function reload(){select(manager.owner);assert.deepEqual(vm.runInContext('suggestedWorkouts(workoutGoals)',ctx).map(d=>d.exercises),home.days,'reload restores exactly the displayed plan');return JSON.parse(manager.storage.getItem('workoutGoalsV1'))}
select(users[0]);manager.storage.setItem('workoutHistoryV52',JSON.stringify([{id:71,workoutTitle:'Old Hypertrophy'}]));manager.storage.setItem('customWorkoutsV5',JSON.stringify([{id:1,name:'My Workout',exercises:['biceps-curl']}]));
let a=change('muscle');assert.equal(a.activeProgram.focusLabel,'Hypertrophy');assert.equal(a.activeProgram.prescription.reps,'8–10');assert.equal(a.activeProgram.prescription.sets,4);reload();
const previous=a.activeProgram;
a=change('consistency');assert.equal(home.label,'General Fitness');assert.equal(a.activeProgram.sourceGoal,'consistency');assert.equal(a.activeProgram.prescription.reps,'10–15');assert.equal(a.activeProgram.prescription.sets,2);assert.ok(a.activeProgram.days[0].exercises.length<previous.days[0].exercises.length);reload();
a=change('strength');assert.equal(home.label,'Strength');assert.equal(a.activeProgram.prescription.reps,'3–5');assert.equal(a.activeProgram.prescription.sets,5);reload();
a=change('muscle');assert.equal(home.label,'Hypertrophy');assert.equal(a.activeProgram.prescription.reps,'8–10');reload();
a=change('muscle',3);assert.equal(a.activeProgram.days.length,3);assert.notDeepEqual(a.activeProgram.days,previous.days);reload();
const balanced=a.activeProgram.days;
a=change('muscle',3,'lower');assert.equal(a.activeProgram.sourceFocus,'lower');assert.notDeepEqual(a.activeProgram.days,balanced);reload();
a=change('muscle',3,'lower','Advanced',120);assert.equal(a.activeProgram.prescription.sets,5);assert.equal(a.activeProgram.sourceRestSeconds,120);reload();
const stable=manager.storage.getItem('workoutGoalsV1');vm.runInContext('suggestedWorkouts(workoutGoals);suggestedWorkouts(workoutGoals)',ctx);assert.equal(manager.storage.getItem('workoutGoalsV1'),stable,'unchanged inputs never create another plan');
assert.equal(JSON.parse(manager.storage.getItem('workoutHistoryV52'))[0].id,71);assert.equal(JSON.parse(manager.storage.getItem('customWorkoutsV5'))[0].name,'My Workout');
select(users[1]);assert.equal(manager.storage.getItem('workoutGoalsV1'),null);const b=change('strength',4,'upper');assert.equal(b.activeProgram.sourceGoal,'strength');assert.equal(manager.storage.getItem('workoutHistoryV52'),null);assert.equal(manager.storage.getItem('customWorkoutsV5'),null);reload();
select(users[0]);assert.equal(JSON.parse(manager.storage.getItem('workoutGoalsV1')).activeProgram.sourceGoal,'muscle');assert.equal(manager.storage.getItem('workoutGoalsV1'),stable);assert.equal(JSON.parse(manager.storage.getItem('workoutHistoryV52'))[0].id,71);assert.ok(refreshes>=8);
console.log('PASS goal changes muscle → consistency → strength → muscle, 4 → 3 days, equipment/focus, experience/rest, reload, idempotence, custom/history preservation, A → B → A');
