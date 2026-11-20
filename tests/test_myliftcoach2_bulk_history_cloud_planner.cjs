const test=require('node:test'),assert=require('node:assert/strict');
const planner=require('../myliftcoach2/bulk-history-cloud-planner.js');
const model=require('../persistence/storage-model.js');
const bridge=require('../myliftcoach2/local-session-cloud-preview.js');
const owner='account-1',other='account-2';
const catalog=[{id:'leg-press',name:'Leg Press'},{id:'seated-row',name:'Seated Row'}];
const local=(id,weight)=>({id:'demo-'+id,created:'2026-11-20T12:00:00Z',
 startedAt:Date.parse('2026-11-20T11:30:00Z'),title:'My Custom Routine',planId:'custom-legs',
 readiness:'Great',sets:[{exerciseId:'leg-press',weight,reps:10},{exerciseId:'seated-row',weight:70,reps:9}]});
const a=local('100',150),b=local('200',170);
const old={id:'original-1',date:'2026-11-10T12:00:00Z',workoutKey:'leg',
 workoutTitle:'Original',exercises:[{id:'leg-press',name:'Leg Press',sets:[{set:1,weight:120,reps:8}]}]};
async function checkpoint(history=[old]){
 const rows=await model.normalize({workoutHistoryV52:JSON.stringify(history)});
 return rows.map(row=>({...row,user_id:owner,revision:2}));
}
const args=(cloudRows,options={})=>({owner,verifiedOwner:owner,baseline:[old],cloudRows,
 localWorkouts:[a,b],catalog,...options});
test('plans two custom sessions from the fresh owner checkpoint, no network or writes',async()=>{
 const rows=await checkpoint(),saved=JSON.stringify(rows);
 const p=await planner.plan(args(rows));
 assert.equal(p.baselineCount,1);assert.equal(p.newCount,2);assert.equal(p.candidateCount,3);
 assert.ok(p.proposedRows>0);assert.equal(p.readyForProduction,false);
 assert.equal(JSON.stringify(rows),saved);
});
test('second pass recognizes identical previously saved session as no-op',async()=>{
 const previously=bridge.prepare({owner,verifiedOwner:owner,history:[],localWorkout:a,catalog}).session;
 const history=[previously,old],rows=await checkpoint(history);
 const p=await planner.plan(args(rows,{baseline:history,localWorkouts:[a]}));
 assert.equal(p.newCount,0);assert.equal(p.alreadySavedCount,1);
 assert.equal(p.proposedRows,0);
});
test('stale baseline and omitted cloud child row block proposed writes',async()=>{
 const rows=await checkpoint();
 await assert.rejects(planner.plan(args(rows,{baseline:[]})),/changed/);
 const missing=rows.filter(x=>x.table!=='sets');
 await assert.rejects(planner.plan(args(missing)),/checkpoint|content|changed/);
});
test('wrong owner, unverified revision or duplicate row identity block planning',async()=>{
 const rows=await checkpoint();
 await assert.rejects(planner.plan(args(rows,{verifiedOwner:other})),/owner/);
 await assert.rejects(planner.plan(args(rows.map(x=>({...x,user_id:other})))),/owner-verified/);
 await assert.rejects(planner.plan(args(rows.map(x=>({...x,revision:0})))),/owner-verified/);
 await assert.rejects(planner.plan(args([...rows,rows[0]])),/Duplicate/);
});
test('a same-ID remote edit is a conflict, never automatically overwritten',async()=>{
 const altered=bridge.prepare({owner,verifiedOwner:owner,history:[],localWorkout:{...a,sets:[{exerciseId:'leg-press',weight:400,reps:10}]},catalog}).session;
 const history=[altered,old];
 await assert.rejects(planner.plan(args(await checkpoint(history),{baseline:history,localWorkouts:[a]})),/differs/);
});
test('an empty local set is an explicit no-op retaining the original history',async()=>{
 const p=await planner.plan(args(await checkpoint(),{localWorkouts:[]}));
 assert.equal(p.proposedRows,0);assert.equal(p.newCount,0);assert.equal(p.candidateCount,1);
});
