const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const lib=require('../myliftcoach2/exercise-catalog-v2.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../myliftcoach2/original-exercise-catalog.js'),'utf8');
const context={window:{}};vm.runInNewContext(source,context);
const original=context.window.MLCOriginalExercises;
test('entire original exercise library preserved with all names ids and technique details',()=>{
 assert.equal(original.length,60);
 assert.equal(new Set(original.map(e=>e.id)).size,60);
 assert.ok(original.every(e=>e.name&&e.muscle&&e.how&&e.tips?.length&&e.mistakes?.length));
});
test('merging original and starter presets retains source metadata and original priority',()=>{
 const starter=[{id:'leg-press',name:'Starter leg press',group:'Legs',cue:'Demo'}, {id:'demo-only',name:'Demo',group:'Chest'}];
 const merged=lib.merge(original,starter);
 assert.equal(merged.length,61);
 assert.equal(merged.find(e=>e.id==='leg-press').name,'Leg Press');
 assert.match(merged.find(e=>e.id==='leg-press').cue,/seat|platform|foot/i);
 assert.equal(merged.find(e=>e.id==='demo-only').name,'Demo');
 assert.equal(new Set(merged.map(e=>e.id)).size,61);
});
test('only the 14 original photos get photo URL and the rest get anatomy fallback',()=>{
 const photographed=original.filter(e=>lib.imagePath(e));
 assert.equal(photographed.length,14);
 assert.equal(lib.imagePath(original.find(e=>e.id==='machine-chest-press')),'../images/machine-chest-press.png');
 assert.equal(lib.imagePath(original.find(e=>e.id==='dead-bug')),null);
});
test('muscle filters cover delts shoulders arms and legs without hiding original exercises',()=>{
 const all=lib.merge(original,[]);
 assert.equal(lib.filter(all).length,60);
 assert.ok(lib.filter(all,'','Shoulders').length>0);
 assert.ok(lib.filter(all,'','Arms').some(e=>e.muscle==='Triceps'));
 assert.ok(lib.filter(all,'','Legs').some(e=>e.muscle==='Quads'));
 assert.ok(lib.filter(all,'chest press','').length>0);
});

test('equipment, image availability and equipment search combine predictably',()=>{
 const gear=e=>e.id==='machine-chest-press'?'Machine':e.id==='pec-deck'?'Machine':'Cable';
 const a=lib.filter(original,'','Chest',{equipment:'Machine',equipmentFor:gear});
 assert.ok(a.length>=2);
 assert.ok(a.every(ex=>gear(ex)==='Machine'));
 const only=lib.filter(original,'','',{photosOnly:true});
 assert.equal(only.length,14);
 assert.ok(only.every(ex=>lib.imagePath(ex)));
 const searched=lib.filter(original,'machine','',{equipmentFor:gear});
 assert.ok(searched.some(ex=>ex.id==='pec-deck'));
});
test('alphabetical exercise ordering remains stable across repeated filtering',()=>{
 const listed=lib.filter(original);
 assert.deepEqual(listed.map(x=>x.name),listed.map(x=>x.name).slice().sort((a,b)=>a.localeCompare(b)));
 assert.deepEqual(lib.filter(original,'','').map(x=>x.id),listed.map(x=>x.id));
});
