const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js'),planner=require('../myliftcoach2/ordered-append-planner.js'),reconcile=require('../persistence/reconcile.js');
const owner='user-owner';
const workout=(id,date)=>({id,date,workoutTitle:id,workoutKey:'upper',exercises:[{id:'machine-chest-press',name:'Machine Chest Press',sets:[{set:1,weight:90,reps:10}]}]});
const old=[workout('old-2','2026-11-15T12:00:00Z'),workout('old-1','2026-11-14T12:00:00Z')];
const newest=workout('new-3','2026-11-16T12:00:00Z');
async function fixture(){const rows=await model.normalize({workoutHistoryV52:JSON.stringify(old)});return rows.map(x=>({...x,revision:1,user_id:owner}));}
test('planner explicitly shifts positions of old sessions when prepending newest',async()=>{
 const cloudRows=await fixture();
 const proposed=await planner.plan({owner,verifiedOwner:owner,baseline:old,latestHistory:old,cloudRows,session:newest});
 assert.equal(proposed.readyForProduction,false);
 const sessions=proposed.changes.filter(x=>x.table==='sessions');
 assert.equal(sessions.filter(x=>x.expected_revision===0).length,1);
 assert.equal(sessions.filter(x=>x.expected_revision===1).length,2);
 const byId=new Map(sessions.map(x=>[x.id,x.position]));
 assert.deepEqual([...byId.values()].sort((a,b)=>a-b),[0,1,2]);
});
test('full candidate roundtrip restores newest first with legacy serialization',async()=>{
 const proposed=await planner.plan({owner,verifiedOwner:owner,baseline:old,latestHistory:old,cloudRows:await fixture(),session:newest});
 const normalized=await model.normalize({workoutHistoryV52:JSON.stringify(proposed.candidate)});
 assert.deepEqual(JSON.parse(model.restoreSnapshot(normalized).workoutHistoryV52).map(x=>x.id),['new-3','old-2','old-1']);
});
test('rejects stale or other-owner checkpoint without writes',async()=>{
 const cloudRows=await fixture(),args={owner,verifiedOwner:owner,baseline:old,latestHistory:old,cloudRows,session:newest};
 await assert.rejects(planner.plan({...args,verifiedOwner:'other'}),/owner/);
 await assert.rejects(planner.plan({...args,latestHistory:[]}),/History changed/);
 const altered=cloudRows.map(x=>x.table==='sessions'?{...x,position:99}:x);
 await assert.rejects(planner.plan({...args,cloudRows:altered}),/checkpoint/);
});
test('planner must never mark an unverified save ready for production',async()=>{
 const p=await planner.plan({owner,verifiedOwner:owner,baseline:old,latestHistory:old,cloudRows:await fixture(),session:newest});
 assert.equal(p.readyForProduction,false);
 assert.equal(Object.hasOwn(p,'write'),false);
});
