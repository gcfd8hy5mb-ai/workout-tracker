const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const importer=require('../myliftcoach2/full-exercise-import.js');
const catalog=require('../myliftcoach2/exercise-catalog-v2.js');
const src=fs.readFileSync(path.join(__dirname,'../myliftcoach2/original-exercise-catalog.js'),'utf8');
const context={window:{}};vm.runInNewContext(src,context);
const base=JSON.parse(JSON.stringify(context.window.MLCOriginalExercises));
const fake=()=>[...base,...Array.from({length:281},(_,i)=>({id:'verification-only-'+(i+1),name:'TEST ONLY exercise '+(i+1),muscle:'Test Muscle',equipment:'Test Equipment'}))];
const store=()=>{const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),map}};
test('strict importer accepts exactly 341 unique entries including all known original exercises',()=>{
 const source=fake(),prepared=importer.prepare(source,base);
 assert.equal(prepared.length,341);
 assert.equal(new Set(prepared.map(e=>e.id)).size,341);
 assert.equal(catalog.merge(prepared,[{id:'starter-extra',name:'Starter extra',group:'Test'}]).length,342);
 assert.equal(prepared[60].name,'TEST ONLY exercise 1');
 assert.equal(prepared[60].how,''); // no made-up instructions
});
test('rejected incomplete source does not replace 63-entry catalog',()=>{
 assert.throws(()=>importer.prepare(base,base),/Expected 341/);
 assert.throws(()=>importer.prepare(fake().slice(1),base),/Expected 341/);
 const source=fake();source[61]={...source[60]};
 assert.throws(()=>importer.prepare(source,base),/Duplicate/);
 const missing=fake();missing[0]={id:'another-test',name:'Other Exercise',muscle:'Test'};
 assert.throws(()=>importer.prepare(missing,base),/omit 1 known original/);
});
test('saved 341 catalog is validated upon reload without changing original source array',()=>{
 const storage=store(),source=fake(),before=JSON.stringify(base);
 importer.save(storage,source,base);
 const loaded=importer.load(storage,base);
 assert.equal(loaded.length,341);
 assert.equal(JSON.stringify(base),before);
 assert.match(storage.getItem(importer.KEY),/TEST ONLY exercise 281/);
});
test('corrupt saved original catalog fails closed and preserves all bytes',()=>{
 const storage=store();storage.setItem(importer.KEY,'{not a file');
 assert.throws(()=>importer.load(storage,base),/corrupted/);
 assert.equal(storage.getItem(importer.KEY),'{not a file');
});
test('missing id maps the established original exercise rather than creating a duplicate',()=>{
 const source=fake().map(x=>({...x}));delete source[0].id;
 const records=importer.prepare(source,base);
 assert.equal(records[0].id,base[0].id);
});
