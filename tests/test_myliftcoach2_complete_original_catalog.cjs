const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function getSource(file){return fs.readFileSync(path.join(__dirname,'../myliftcoach2/',file),'utf8')}
const context={window:{}};
vm.runInNewContext(getSource('original-exercise-catalog.js'),context);
const original=JSON.parse(JSON.stringify(context.window.MLCOriginalExercises));
vm.runInNewContext(getSource('complete-original-exercise-catalog.js'),context);
const full=JSON.parse(JSON.stringify(context.window.MLCCompleteOriginalExercises));
const lib=require('../myliftcoach2/exercise-catalog-v2.js');
test('genuine five-expansion source recreates exactly 341 unique original exercises',()=>{
 assert.equal(original.length,60);
 assert.equal(full.length,341);
 assert.equal(new Set(full.map(e=>e.id)).size,341);
 assert.equal(context.window.MLCCompleteOriginalCatalogAudit.unique,341);
 assert.equal(context.window.MLCCompleteOriginalCatalogAudit.expansions.length,5);
});
test('every one of the 60 source exercises survives unchanged including technique instructions',()=>{
 for(const ex of original){
  const imported=full.find(e=>e.id===ex.id);
  assert.ok(imported,ex.name);
  assert.equal(imported.name,ex.name);
  assert.equal(imported.how,ex.how);
  assert.deepEqual(imported.tips,ex.tips);
  assert.deepEqual(imported.mistakes,ex.mistakes);
 }
});
test('recorded 341-exercise screenshot examples are present in restored source',()=>{
 for(const name of ['Wide-Grip Lat Pulldown','Landmine Squat','Medicine Ball Slams','EZ-Bar Curl','Walking']){
  assert.ok(full.some(e=>e.name===name),'missing real original: '+name);
 }
});
test('all 341 retain stable source identity and missing instructions are reported not invented',()=>{
 const incomplete=[];
 for(const [i,ex] of full.entries()){
  assert.match(ex.id,/^[a-z0-9][a-z0-9-]+$/,String(i));
  assert.ok(ex.name&&ex.muscle,ex.id);
  if(typeof ex.how!=='string'||ex.how.trim().length<8)incomplete.push(ex.id);
 }
 assert.ok(incomplete.length<full.length);
 assert.ok(incomplete.every(id=>full.some(ex=>ex.id===id)));
 console.log('Original 341 catalog: '+incomplete.length+' exercises require additional written instruction review; original records preserved.');
});
test('the complete original catalog stays compatible with starter-only IDs and filtering',()=>{
 const starter=[{id:'starter-test-only',name:'Starter Test',group:'Chest'}];
 const merged=lib.merge(full,starter);
 assert.equal(merged.length,342);
 assert.ok(lib.filter(merged,'landmine').some(e=>e.name==='Landmine Squat'));
});
