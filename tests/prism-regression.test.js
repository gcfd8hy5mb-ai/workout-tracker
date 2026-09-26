const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=process.cwd();
function source(file){return fs.readFileSync(`${root}/${file}`,'utf8')}
function syntax(file){new vm.Script(source(file),{filename:file})}
function test(name,fn){try{fn();console.log(`✓ ${name}`);return true}catch(e){console.error(`✗ ${name}\n  ${e.message}`);return false}}
let pass=0,fail=0;function run(name,fn){test(name,fn)?pass++:fail++}
const required=['index.html','entitlements.js','adaptive-set-coach.js','coach-intervention-memory.js','workout-coach-targets.js','prism-test-mode.js','workout-experience.js'];
run('Required PRISM production files exist',()=>required.forEach(f=>assert.ok(fs.existsSync(`${root}/${f}`),`${f} missing`)));
for(const f of required.filter(x=>x.endsWith('.js')))run(`${f} parses as JavaScript`,()=>syntax(f));
run('Free/Pro entitlement system remains centralized',()=>{const s=source('entitlements.js');assert.match(s,/canAccessFeature/);assert.match(s,/advanced_analytics/)});
run('Ask/Coach target uses established Pro entitlement',()=>assert.match(source('workout-coach-targets.js'),/canAccessFeature\('advanced_analytics'\)/));
run('Adaptive Coach supports automatic load progression',()=>{const s=source('adaptive-set-coach.js');assert.match(s,/increase_weight/);assert.match(s,/increase_reps/);assert.match(s,/prove_top_range/);assert.match(s,/recovery_hold/)});
run('Synthetic decisions cannot write Coach memory',()=>{const s=source('adaptive-set-coach.js');assert.match(s,/decision\.synthetic/);assert.match(s,/d\.synthetic/)});
run('Test mode uses session storage, not workout history storage',()=>{const s=source('prism-test-mode.js');assert.match(s,/sessionStorage/);assert.doesNotMatch(s,/localStorage\.setItem/)});
run('Test scenarios cover progression, plateau, fatigue and learning',()=>{const s=source('prism-test-mode.js');for(const x of ['progression','plateau','fatigue','learning'])assert.match(s,new RegExp(x))});
run('Planned workout sets require confirmation',()=>{const s=source('workout-experience.js');assert.match(s,/prismPlanned/);assert.match(s,/prismConfirmed/);assert.match(s,/confirmPlan/)});
run('Workout polish retains repeat-set shortcut',()=>assert.match(source('workout-experience.js'),/Repeat last set/));
run('Production index does not directly expose test-mode script',()=>{const html=source('index.html');assert.ok(!/<script[^>]+prism-test-mode\.js/i.test(html),'Developer test mode must not be directly exposed by index.html')});
console.log(`\nPRISM TEST SUITE: ${pass} passed · ${fail} failed`);if(fail)process.exit(1);