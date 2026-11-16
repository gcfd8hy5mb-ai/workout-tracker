const test=require('node:test');
const assert=require('node:assert/strict');
const guard=require('../myliftcoach2/v2-write-guard.js');
const owner='11111111-1111-4111-8111-111111111111',exercises=['press','row'];
const session={access_token:'test-token',user:{id:owner}};
const doc=()=>({version:1,plans:[{id:'custom-press',title:'My Routine',ids:['press','row']}],assigned:['custom-press',null,null,null,null,null,null],overrides:{'2026-11-16':null},recurring:[]});
const args=()=>({owner,session,baselineRevision:3,remoteRevision:3,document:doc(),validExerciseIds:exercises});
test('prepares immutable read-only snapshot with the exact expected revision',()=>{
 const input=args(),prior=JSON.stringify(input.document),prepared=guard.prepare(input);
 assert.equal(prepared.mayWrite,false);
 assert.equal(prepared.expectedRevision,3);
 assert.equal(prepared.owner,owner);
 assert.deepEqual(prepared.document,input.document);
 assert.equal(JSON.stringify(input.document),prior);
 const verified=guard.recheck(prepared,{owner,session,localDocument:input.document,validExerciseIds:exercises,remoteRevision:3});
 assert.equal(verified.safeToAttemptAtomicWrite,true);
 assert.equal(verified.mayWrite,false);
});
test('rejects stale baseline and cross-account credentials without touching local data',()=>{
 const input=args(),prior=JSON.stringify(input.document);
 assert.throws(()=>guard.prepare({...input,remoteRevision:4}),/Cloud schedule changed/);
 assert.throws(()=>guard.prepare({...input,session:{...session,user:{id:'another'}}}),/Authenticated account/);
 assert.throws(()=>guard.prepare({...input,baselineRevision:null}),/baseline revision/);
 assert.equal(JSON.stringify(input.document),prior);
});
test('rejects changed local schedule or cloud revision between preflight and proposed save',()=>{
 const input=args(),prepared=guard.prepare(input);
 input.document.plans[0].title='Different Routine';
 assert.throws(()=>guard.recheck(prepared,{owner,session,localDocument:input.document,validExerciseIds:exercises,remoteRevision:3}),/Local schedule changed/);
 assert.throws(()=>guard.recheck(prepared,{owner,session,localDocument:prepared.document,validExerciseIds:exercises,remoteRevision:4}),/Cloud schedule changed/);
 assert.throws(()=>guard.recheck(prepared,{owner:'other',session,localDocument:prepared.document,validExerciseIds:exercises,remoteRevision:3}),/Account changed/);
 assert.equal(prepared.document.plans[0].title,'My Routine');
});
test('refuses unavailable movements and empty cloud-replacement schedules',()=>{
 const input=args();
 input.document.plans[0].ids=['unknown'];
 assert.throws(()=>guard.prepare(input),/unavailable exercises/);
 const empty={...doc(),plans:[],assigned:Array(7).fill(null),overrides:{}};
 assert.throws(()=>guard.prepare({...args(),document:empty}),/Empty schedule/);
});
