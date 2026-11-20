const test=require('node:test'),assert=require('node:assert/strict');
const {audit,cleanPath}=require('../myliftcoach2/exercise-demonstrations.js');
const catalog=[{id:'bench-press'},{id:'squat'}];
const asset=(id='bench-press')=>({exerciseId:id,approval:'approved',license:'cc0',
 frames:[{path:'assets/bench-start.webp',phase:'Start'},{path:'assets/bench-end.webp',phase:'Finish'}]});
test('only accepted exact-ID and two distinct frames count as complete',()=>{
 const result=audit(catalog,[asset()]);
 assert.equal(result.catalogSize,2);assert.equal(result.approvedCount,1);
 assert.deepEqual(result.missingIds,['squat']);assert.equal(result.ready,false);
 assert.equal(result.rejected.length,0);
});
test('wrong IDs, duplicates and unapproved assets fail closed',()=>{
 const result=audit(catalog,[asset('unknown'),asset(),asset()]);
 assert.equal(result.approvedCount,0);
 assert.equal(result.rejected.length,3);
 assert.ok(result.rejected[0].reasons.includes('unknown-exercise-id'));
 assert.ok(result.rejected[2].reasons.includes('duplicate-manifest-id'));
});
test('no remote links, traversals, or unsupported files',()=>{
 for(const value of ['https://example.com/x.webp','../images/a.webp','assets/../../private.jpg','assets/a.svg','assets\\x.png'])assert.equal(cleanPath(value),null);
 assert.equal(cleanPath('assets/approved/exercise-1.webp'),'assets/approved/exercise-1.webp');
});
test('source permission and image attribution are mandatory where applicable',()=>{
 for(const item of [
  {...asset(),license:'licensed-permission'},
  {...asset(),license:'cc-by-4.0'},
  {...asset(),license:'unknown'},
  {...asset(),frames:[{path:'assets/x.png',phase:'Start'},{path:'assets/x.png',phase:'Finish'}]},
  {...asset(),approval:'pending'}
 ]){
  const result=audit(catalog,[item]);assert.equal(result.approvedCount,0);assert.equal(result.rejected.length,1);
 }
});
test('complete, independently valid catalog has no false missing entries',()=>{
 const other={...asset('squat'),frames:[{path:'assets/squat-a.png',phase:'Start'},{path:'assets/squat-b.png',phase:'Finish'}]};
 const result=audit(catalog,[asset(),other]);
 assert.equal(result.ready,true);assert.equal(result.missingCount,0);assert.equal(result.approvedCount,2);
});
test('catalog with repeated IDs is rejected before asset matching',()=>assert.throws(()=>audit([{id:'x'},{id:'x'}],[]),/Duplicate catalog IDs/));
