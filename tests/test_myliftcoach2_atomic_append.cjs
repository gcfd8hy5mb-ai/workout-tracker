const test=require('node:test'),assert=require('node:assert/strict');
const {prepare,createFakeAtomicStore}=require('../myliftcoach2/atomic-append-contract.js');
const userId='owner-1',previous={id:'old',workoutTitle:'Saved'},next={id:'next',workoutTitle:'Upper'};
test('atomic simulated append preserves existing history and returns read-back',async()=>{
 const store=createFakeAtomicStore([previous]),proposal=prepare({userId,session:next,baseline:store.read()});
 const result=await store.append({...proposal,authenticatedUser:userId});
 assert.deepEqual(result.history.map(s=>s.id),['next','old']);
});
test('simultaneous writes from same snapshot permit one writer only',async()=>{
 const store=createFakeAtomicStore([previous]);
 const a=prepare({userId,session:{id:'a'},baseline:store.read()});
 const b=prepare({userId,session:{id:'b'},baseline:store.read()});
 const settled=await Promise.allSettled([store.append({...a,authenticatedUser:userId}),store.append({...b,authenticatedUser:userId})]);
 assert.equal(settled.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(settled.filter(x=>x.status==='rejected').length,1);
 assert.equal(store.read().length,2);assert.equal(store.stats().writes,1);
});
test('replay, cross-account and stale snapshots fail without new rows',async()=>{
 const store=createFakeAtomicStore([previous]);
 const p=prepare({userId,session:next,baseline:store.read()});
 await assert.rejects(store.append({...p,authenticatedUser:'other'}),/owner mismatch/);
 await store.append({...p,authenticatedUser:userId});
 await assert.rejects(store.append({...p,authenticatedUser:userId}),/Stale history/);
 assert.equal(store.stats().writes,1);
});
test('baseline requires unique historical identities',()=>{
 assert.throws(()=>prepare({userId,session:next,baseline:[previous,previous]}),/unique/);
});
