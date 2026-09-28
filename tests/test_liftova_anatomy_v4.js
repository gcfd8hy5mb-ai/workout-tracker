const assert=require('node:assert/strict');
const fs=require('node:fs');
const anatomy=require('../liftova-anatomy.js');
const html=fs.readFileSync('index.html','utf8');
const config=fs.readFileSync('supabase-config.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('liftova-anatomy.css','utf8');
const atlas='images/liftova-anatomy-atlas.webp';
const image=fs.readFileSync(atlas);
assert.equal(image.subarray(0,4).toString(),'RIFF');
assert.equal(image.subarray(8,12).toString(),'WEBP');
assert.ok(image.length>100000,'full resolution illustrated anatomy must be present');
assert.ok(image.length<400000,'atlas should remain fast to load on mobile');
assert.match(html, /<script src="liftova-anatomy\.js\?v=1"><\/script>/);
assert.match(html, /<link rel="stylesheet" href="liftova-anatomy\.css\?v=1">/);
assert.ok(html.indexOf('liftova-anatomy.js?v=1')<html.indexOf('supabase-config.js'));
assert.doesNotMatch(config,/liftova-anatomy-v4/);
for(const item of ['./liftova-anatomy.js?v=1','./liftova-anatomy.css?v=1','./images/liftova-anatomy-atlas.webp'])assert.ok(sw.includes(item),`${item} must be cached`);
assert.match(css,/liftova-muscle--primary/);
assert.match(css,/liftova-muscle--secondary/);
assert.match(css,/#libraryScreen/);
assert.match(css,/\.lv3-exercise-row/);
assert.match(anatomy.render({name:'Chest Press',muscle:'Chest'}),/liftova-anatomy-atlas\.webp/);
const cases=[
 ['Incline Chest Press','Chest','upperChest','triceps'],
 ['Decline Bench Press','Chest','lowerChest','frontDelts'],
 ['Pec Deck','Chest','chest','frontDelts'],
 ['Seated Row','Back','rhomboids','biceps'],
 ['Lat Pulldown','Back','lats','biceps'],
 ['Machine Shrug','Back','traps','forearms'],
 ['Rear Delt Fly','Shoulders','rearDelts','traps'],
 ['Lateral Raise','Shoulders','lateralDelts','traps'],
 ['Hammer Curl','Biceps','biceps','forearms'],
 ['Triceps Pushdown','Triceps','triceps',null],
 ['Hip Abduction','Glutes','glutes','hamstrings'],
 ['Adductor Machine','Glutes','adductors','glutes'],
 ['Barbell Back Squat','Quads','quads','glutes'],
 ['Leg Curl','Hamstrings','hamstrings','calves'],
 ['Tibialis Raise','Calves','tibialis',null],
 ['Cable Woodchop','Core','obliques',null],
 ['Ski Erg','Cardio','lats','abs'],
 ['Rowing Machine','Cardio','quads','lats'],
 ['Treadmill Jog','Cardio','quads','glutes']
];
for(const [name,muscle,primary,secondary] of cases){
 const p=anatomy.profile({name,muscle});
 assert.ok(p.primary.includes(primary),`${name}: expected ${primary} primary`);
 if(secondary)assert.ok([...p.primary,...p.secondary].includes(secondary),`${name}: expected ${secondary}`);
 const output=anatomy.render({name,muscle},{size:'mini'});
 assert.match(output, /role="img"/);
 assert.ok(output.includes(`data-muscle="${primary}"`),`${name}: SVG should highlight primary`);
}
const categories=['Chest','Triceps','Back','Biceps','Quads','Hamstrings','Calves','Shoulders','Glutes','Core','Cardio','Forearms'];
for(const file of ['index.html',...fs.readdirSync('.').filter(n=>/^exercise-library-expansion(?:-v1|-[2-5])?\.js$/.test(n))]){
 const src=fs.readFileSync(file,'utf8');
 const entries=[...src.matchAll(/(?:id|x)\s*[:(]\s*['"]([^'"]+)['"]\s*,\s*(?:name\s*:\s*)?['"]([^'"]+)['"]\s*,\s*(?:muscle\s*:\s*)?['"]([^'"]+)['"]/g)];
 for(const [,id,name,muscle] of entries){
  assert.ok(categories.includes(muscle),`${id}: unexpected exercise group`);
  const p=anatomy.profile({id,name,muscle});
  assert.ok(p.primary.length,`${id}: needs primary anatomy`);
  for(const region of [...p.primary,...p.secondary])assert.ok(anatomy.regions[region]?.length,`${id}: missing ${region} shape`);
 }
}
assert.match(anatomy.renderGroups({}),/liftova-anatomy-atlas\.webp/);
assert.doesNotMatch(anatomy.renderGroups({}),/class="liftova-muscle/);
assert.match(anatomy.renderGroups({Chest:1}),/data-muscle="chest"/);
for(const functionName of ['exerciseMuscleDiagram','libraryPreview','prismExerciseVisual','muscleVisual','renderMuscleRecovery'])assert.match(html,new RegExp(`function ${functionName}\\(`));
assert.doesNotMatch(html,/function muscleFigure\(/);
assert.doesNotMatch(html,/Exercise picture coming soon/);
assert.match(html,/LIFTOVA PRO RECOMMENDS/);
assert.doesNotMatch(html, /<strong>PRISM<\/strong>|class="prism-wordmark">PRISM/);
assert.ok(!fs.existsSync('liftova-anatomy-v4.js'));
console.log('LIFTOVA shared anatomy atlas, catalog mapping and surface integration: OK');
