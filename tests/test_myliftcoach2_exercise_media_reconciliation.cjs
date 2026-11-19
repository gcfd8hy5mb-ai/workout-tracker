const test=require('node:test'),assert=require('node:assert/strict');
const {reconcile,lookup}=require('../myliftcoach2/exercise-media-reconciliation.js');
const catalog=[
 {id:'a',name:'Exercise A',muscle:'Chest',image:'images/a.jpg'},
 {id:'b',name:'Exercise B',muscle:'Back'},
 {id:'c',name:'Exercise C',muscle:'Quads'}
];
const demo={exerciseId:'b',approval:'approved',license:'cc0',frames:[
 {path:'assets/b-start.png',phase:'Start'},{path:'assets/b-finish.png',phase:'Finish'}]};
test('preserves original-photo and anatomy fallback without promoting either to a demo',()=>{
 const result=reconcile(catalog,[]);
 assert.deepEqual(result.counts,{catalog:3,approvedMultiframe:0,legacyPhotoFallback:1,anatomyFallback:2,awaitingApprovedDemo:3,rejectedManifestRows:0});
 assert.equal(lookup(result,'a').originalPhoto,'../images/a.jpg');
 assert.equal(lookup(result,'a').displayMode,'original-photo');
 assert.equal(lookup(result,'c').displayMode,'anatomy');
});
test('approved demonstrations override only their exact ID in derived display choices',()=>{
 const result=reconcile(catalog,[demo]);
 assert.equal(result.counts.approvedMultiframe,1);
 assert.equal(result.counts.awaitingApprovedDemo,2);
 assert.equal(lookup(result,'b').displayMode,'multiframe');
 assert.equal(lookup(result,'a').displayMode,'original-photo');
 assert.equal(lookup(result,'c').displayMode,'anatomy');
 assert.equal(result.ready,false);
});
test('duplicate manifest entries cannot displace a previous legacy photo',()=>{
 const duplicate={...demo,exerciseId:'a'};
 const result=reconcile(catalog,[duplicate,duplicate]);
 assert.equal(result.counts.approvedMultiframe,0);
 assert.equal(result.counts.rejectedManifestRows,2);
 assert.equal(lookup(result,'a').displayMode,'original-photo');
});
test('unknown/unlicensed media is rejected while catalog IDs remain unchanged',()=>{
 const before=JSON.stringify(catalog);
 const result=reconcile(catalog,[{...demo,exerciseId:'c',license:'unknown'}]);
 assert.equal(result.counts.approvedMultiframe,0);
 assert.equal(lookup(result,'c').needsDemonstration,true);
 assert.equal(JSON.stringify(catalog),before);
 assert.equal(lookup(result,'missing'),null);
});
