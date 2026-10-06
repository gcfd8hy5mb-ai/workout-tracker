const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const anatomy=require('../liftova-anatomy.js');
const js=fs.readFileSync('liftova-workout-tab-v3.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const polish=fs.readFileSync('liftova-polish.js','utf8');
assert.doesNotMatch(fs.readFileSync('phase-insights.js','utf8'),/^const PRISM_GOAL_NAMES=/m,'the insights script must not redeclare onboarding’s global constant');
assert.match(polish,/screenObserver\.observe\(screen,\{subtree:true,childList:true\}\)/);
assert.doesNotMatch(polish,/observe\(document\.(body|documentElement)/);
const events={};const calls=[];
const ctx={console,activeWorkoutKey:null,activeWorkoutTitle:null,activeWorkoutExerciseIds:null,activeCustomIndex:null,lastWorkoutContext:null,requestAnimationFrame(fn){fn()},setTimeout(){throw Error('module should install immediately')},
 document:{readyState:'complete',addEventListener(type,fn,capture){events[type]=fn},getElementById(){return null}},
 getExercise(id){return {id,name:id,muscle:'Chest'}},
 showPrismWorkoutDetail(item){calls.push(['detail',item.ids.length])},
 showWorkouts(){calls.push(['legacy'])},
 startPrismWorkout(){calls.push(['legacy start'])},
 openWorkout(title,ids,restored){calls.push(['live',title,ids.length,restored])},
 goHome(){calls.push(['home'])},
 myliftcoachWeeklySchedule(){return Array.from({length:7},(_,i)=>({workoutKey:`plan-muscle-4-balanced-Beginner-90-day${i+1}`,name:`Day ${i+1} — Scheduled Workout`,ids:['machine-chest-press','pec-deck','triceps-pushdown'],kind:'plan'}))},
 ensureGeneratedProgram(){return {focusLabel:'Hypertrophy',prescription:{sets:4,reps:'8–10',restSeconds:90}}}
};ctx.window=ctx;
vm.runInNewContext(js,ctx);
assert.equal(typeof events.click,'function');
let prevented=0,stopped=0;
events.click({target:{closest(s){return s==='#lv3StartWorkout'?{}:null}},preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
assert.deepEqual(calls.shift(),['legacy start']);
assert.equal(prevented,1);assert.equal(stopped,1);
assert.equal(ctx.activeWorkoutKey,null);
ctx.showWorkouts();assert.deepEqual(calls.shift(),['detail',3]);
ctx.startPrismWorkout({kind:'scheduled',workoutKey:'weekday-0',ids:['machine-chest-press'],title:'Monday Override'});
assert.deepEqual(calls.shift(),['live','Monday Override',1,false]);

const required=['showScreen("home")','showWorkouts()','showLibrary()','showScreen("overallProgressScreen")','showScreen("profileScreen")'];
for(const route of required)assert.ok(html.includes(route),`navigation route missing: ${route}`);
for(const surface of ['function prismExerciseVisual(ex)','function exerciseMuscleDiagram(ex)','function libraryPreview(ex)','function createExerciseCard(ex,','function showExerciseInfo(id,','function renderLibrary()','function muscleVisual(ids,context)','function renderMuscleRecovery()'])assert.ok(html.includes(surface),`${surface} missing`);
assert.match(html,/function exerciseMuscleDiagram\(ex\)\s*\{\s*return window\.LiftovaAnatomy\.render\(ex,/);
const ex={name:'Cable Woodchop',muscle:'Core'};
const output=anatomy.render(ex,{size:'mini'});
assert.ok(output.includes('data-muscle="obliques"'));
assert.ok(!output.includes('data-muscle="chest"'));
const empty=anatomy.render({name:'Unfamiliar custom movement',muscle:'Custom'});
assert.ok(empty.includes('myliftcoach-anatomy-realistic.webp'));
assert.ok(!empty.includes('class="liftova-muscle'));
console.log('MYLIFTCOACH scheduled Start Workout interaction, navigation routes, details and fallback anatomy: OK');
