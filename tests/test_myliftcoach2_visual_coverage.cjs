const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const audit=require('../myliftcoach2/exercise-visual-audit.js');
const register=require('../myliftcoach2/library-visual-register.js');
const ctx={window:{}};
function script(name){vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../myliftcoach2/',name),'utf8'),ctx);}
script('original-exercise-catalog.js');script('complete-original-exercise-catalog.js');
const originals=JSON.parse(JSON.stringify(ctx.window.MLCCompleteOriginalExercises));
test('all 341 have real source muscle group and photo checklist, no fake photos',()=>{
 const rows=register.register(originals),stats=register.stats(originals);
 assert.equal(rows.length,341);assert.equal(stats.sourceMuscleGroup,341);
 assert.equal(stats.hasOriginalPhoto,14);assert.equal(stats.photoNeeded,327);
 assert.equal(rows.filter(x=>x.photoPath).length,14);
 assert.ok(rows.every(x=>x.id&&x.name&&x.sourceGroup));
 assert.equal(new Set(rows.map(x=>x.id)).size,341);
});
test('muscle anatomy regions are recognized, disjoint, and review status is explicit',()=>{
 const allowed=new Set(['chest','upperChest','lowerChest','frontDelts','lateralDelts','rearDelts','biceps','brachialis','triceps','forearms','abs','obliques','traps','rhomboids','lats','erectors','glutes','quads','adductors','hamstrings','calves','tibialis']);
 for(const ex of originals){
  const result=audit.resolve(ex);
  assert.ok(result.reviewStatus.includes('review')||result.basis==='unresolved');
  assert.ok(result.primary.every(x=>allowed.has(x)));
  assert.ok(result.secondary.every(x=>allowed.has(x)));
  assert.equal(result.secondary.filter(x=>result.primary.includes(x)).length,0);
 }
});
test('real screenshot examples map to plausible principal muscles, not just generic group',()=>{
 const find=name=>audit.resolve(originals.find(x=>x.name===name));
 assert.ok(find('Landmine Squat').primary.includes('quads'));
 assert.ok(find('Wide-Grip Lat Pulldown').primary.includes('lats'));
 assert.ok(find('Medicine Ball Slams').primary.includes('abs'));
 assert.ok(find('EZ-Bar Curl').primary.includes('biceps'));
 assert.equal(audit.resolve({id:'unspecified',name:'Uncategorized Drill',muscle:'Cardio'}).primary.length,0);
});
test('a photo is only emitted for a correctly formatted original image reference',()=>{
 assert.deepEqual(audit.photo({id:'not-pictured',name:'No photo'}),{type:'anatomy-only',path:null});
 assert.deepEqual(audit.photo({image:'https://example.com/other-exercise.jpg'}),{type:'anatomy-only',path:null});
 assert.deepEqual(audit.photo({image:'images/machine-chest-press.png'}),{type:'original-photo',path:'../images/machine-chest-press.png'});
});
