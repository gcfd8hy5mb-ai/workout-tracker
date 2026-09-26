const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.cwd();
function source(file){return fs.readFileSync(`${root}/${file}`,'utf8')}
function syntax(file){new vm.Script(source(file),{filename:file})}
function test(name,fn){try{fn();console.log(`✓ ${name}`);return true}catch(e){console.error(`✗ ${name}\n  ${e.message}`);return false}}
let pass=0,fail=0;function run(name,fn){test(name,fn)?pass++:fail++}
const required=['index.html','adaptive-set-coach.js','coach-intervention-memory.js','workout-coach-targets.js','prism-test-mode.js','workout-experience.js','timer-alerts.js','post-workout-summary.js'];
run('Required PRISM production files exist',()=>required.forEach(f=>assert.ok(fs.existsSync(`${root}/${f}`),`${f} missing`)));
for(const f of required.filter(x=>x.endsWith('.js')))run(`${f} parses as JavaScript`,()=>syntax(f));
run('Free/Pro entitlement system remains centralized',()=>{const s=source('index.html');assert.match(s,/canAccessFeature/);assert.match(s,/advanced_analytics/);assert.match(s,/PRISM_ACCESS/)});
run('Coach target uses established Pro entitlement',()=>assert.match(source('workout-coach-targets.js'),/canAccessFeature\('advanced_analytics'\)/));
run('Adaptive Coach supports automatic load progression',()=>{const s=source('adaptive-set-coach.js');assert.match(s,/increase_weight/);assert.match(s,/increase_reps/);assert.match(s,/prove_top_range/);assert.match(s,/recovery_hold/)});
run('Synthetic decisions cannot write Coach memory',()=>{const s=source('adaptive-set-coach.js');assert.match(s,/decision\.synthetic/);assert.match(s,/d\.synthetic/)});
run('Test mode uses session storage, not workout history storage',()=>{const s=source('prism-test-mode.js');assert.match(s,/sessionStorage/);assert.doesNotMatch(s,/localStorage\.setItem/)});
run('Test scenarios cover progression, plateau, fatigue and learning',()=>{const s=source('prism-test-mode.js');for(const x of ['progression','plateau','fatigue','learning'])assert.match(s,new RegExp(x))});
run('Planned workout sets require confirmation',()=>{const s=source('workout-experience.js');assert.match(s,/prismPlanned/);assert.match(s,/prismConfirmed/);assert.match(s,/confirmPlan/)});
run('Coach planned values are visual-only before confirmation',()=>{const s=source('workout-experience.js');assert.match(s,/applyVisualPlan/);assert.match(s,/restoreVisualPlan/);assert.match(s,/not logged until you confirm/i)});
run('Editing a Coach target prevents immediate reseeding',()=>{const s=source('workout-experience.js');assert.match(s,/prismPlanDismissed/);assert.match(s,/dismissPlan/)});
run('Coach confirmation starts the workout rest timer',()=>assert.match(source('workout-experience.js'),/typeof startWorkoutRest==='function'\)startWorkoutRest\(\)/));
run('Coach confirmation emits a learning event',()=>assert.match(source('workout-experience.js'),/prism:coach-set-confirmed/));
run('Workout polish retains repeat-set shortcut for Free and manual logging',()=>assert.match(source('workout-experience.js'),/Repeat last set/));
run('Workout stack loads polished workout experience',()=>assert.match(source('workout-coach-targets.js'),/workout-experience\.js\?v=1\.3/));
run('Timer alerts expose all four user modes',()=>{const s=source('timer-alerts.js');for(const x of ['haptic_sound','haptic','sound','off'])assert.match(s,new RegExp(x))});
run('Timer alerts integrate with generic and workout rest completion',()=>{const s=source('timer-alerts.js');assert.match(s,/data-timer-display/);assert.match(s,/workoutRestStatus/);assert.match(s,/rest complete/i)});
run('Timer alert mode can suppress existing vibration hooks',()=>{const s=source('timer-alerts.js');assert.match(s,/navigator\.vibrate=pattern/);assert.match(s,/mode\(\)\.includes\('haptic'\)/)});
run('Timer alert module is loaded by the workout stack',()=>assert.match(source('workout-coach-targets.js'),/timer-alerts\.js\?v=1\.2/));
run('Post-workout summary provides Free performance recap',()=>{const s=source('post-workout-summary.js');assert.match(s,/Performance/);assert.match(s,/sets/);assert.match(s,/exercises/);assert.match(s,/volume/)});
run('Post-workout summary gates adaptive Coach review behind Pro',()=>{const s=source('post-workout-summary.js');assert.match(s,/advanced_analytics/);assert.match(s,/PRISM PRO · COACH REVIEW/);assert.match(s,/Next target/)});
run('Post-workout Coach review uses adaptive progression decision',()=>assert.match(source('post-workout-summary.js'),/prismAdaptiveSetDecision/));
run('Workout stack loads post-workout summary',()=>assert.match(source('workout-coach-targets.js'),/post-workout-summary\.js\?v=1\.0/));
run('Production index does not directly expose test-mode script',()=>{const html=source('index.html');assert.ok(!/<script[^>]+prism-test-mode\.js/i.test(html),'Developer test mode must not be directly exposed by index.html')});
console.log(`\nPRISM TEST SUITE: ${pass} passed · ${fail} failed`);if(fail)process.exit(1);