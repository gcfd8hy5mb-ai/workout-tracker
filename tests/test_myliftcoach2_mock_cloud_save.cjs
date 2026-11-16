/* Simulated cloud only. Never connects to Supabase or contains live credentials.
   node --test tests/test_myliftcoach2_mock_cloud_save.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js');
const reconcile=require('../persistence/reconcile.js');
const sync=require('../persistence/account-sync.js');
const preflight=require('../myliftcoach2/save-preflight.js');
const owner='00000000-0000-4000-8000-000000000001';
const original={id:'legacy-1',date:'2026-11-15T12:00:00.000Z',workoutKey:'preset-upper',workoutTitle:'Existing Workout',exercises:[{id:'machine-chest-press',name:'Machine Chest Press',sets:[{set:1,weight:80,reps:10}]}]};
const preview={title:'Upper Body A',planId:'upper-a',sets:[{exerciseId:'machine-chest-press',weight:90,reps:10},{exerciseId:'machine-chest-press',weight:95,reps:8}]};
const catalog=[{id:'machine-chest-press',name:'Machine Chest Press'}];
const preflightInput={owner,verifiedOwner:owner,baseline:[original],latestHistory:[original],previewWorkout:preview,catalog,proposedId:'mlc2-integration-1',now:'2026-11-16T14:00:00.000Z'};
function fakeCloud(initial){
 const records=new Map(initial.map(r=>[r.table+':'+r.id,{...r,revision:1,user_id:owner}]));
 let writes=0,failNext=false;
 return {
  async read(id){assert.equal(id,owner);return [...records.values()].map(x=>({...x}));},
  async write(id,changes){
   assert.equal(id,owner);if(failNext){failNext=false;throw Error('Simulated offline failure');}
   for(const row of changes){
    const old=records.get(row.table+':'+row.id),expected=old?.revision||0;
    if(row.expected_revision!==expected)throw Error('Revision conflict');
   }
   writes++;
   return changes.map(row=>{
    const key=row.table+':'+row.id,prior=records.get(key);
    const next={...row,user_id:id,revision:(prior?.revision||0)+1};
    records.set(key,next);return next;
   });
  },
  counts(){return {writes,rows:records.size};},
  failOnce(){failNext=true;}
 };
}
test('simulated original session save and read-back restore preserve previous workout',async()=>{
 const seed=await model.normalize({workoutHistoryV52:JSON.stringify([original])});
 const transport=fakeCloud(seed),checkpoint=await transport.read(owner);
 const proposal=preflight.validate(preflightInput);
 assert.equal(proposal.readyForProduction,false);
 await preflight.roundTrip(proposal.candidate);
 const result=await sync.migrate({snapshot:{workoutHistoryV52:JSON.stringify(proposal.candidate)},owner,userId:owner,transport,checkpoint});
 assert.equal(result.status,'verified');
 const restored=JSON.parse(result.restoreCandidate.workoutHistoryV52);
 assert.equal(restored.length,2);
 assert.equal(restored[0].id,'mlc2-integration-1');
 assert.equal(restored[1].id,'legacy-1');
 assert.equal(restored[0].exercises[0].sets.length,2);
});
test('simulated replay from fresh checkpoint produces no duplicate cloud writes',async()=>{
 const seed=await model.normalize({workoutHistoryV52:JSON.stringify([original])});
 const transport=fakeCloud(seed),checkpoint=await transport.read(owner);
 const proposal=preflight.validate(preflightInput);
 const snapshot={workoutHistoryV52:JSON.stringify(proposal.candidate)};
 const first=await sync.migrate({snapshot,owner,userId:owner,transport,checkpoint});
 const after=await transport.read(owner);
 const second=await sync.migrate({snapshot,owner,userId:owner,transport,checkpoint:after});
 assert.equal(second.status,'verified');
 assert.equal(transport.counts().writes,first.writes>0?1:0);
});
test('simulated stale second device is flagged before overwriting changed session records',async()=>{
 const seed=await model.normalize({workoutHistoryV52:JSON.stringify([original])});
 const transport=fakeCloud(seed),checkpoint=await transport.read(owner);
 const a=preflight.validate(preflightInput);
 const other={...preflightInput,proposedId:'second-device',previewWorkout:{...preview,title:'Another Session'},now:'2026-11-16T15:00:00.000Z'};
 await sync.migrate({snapshot:{workoutHistoryV52:JSON.stringify(a.candidate)},owner,userId:owner,transport,checkpoint});
 const second=await sync.migrate({snapshot:{workoutHistoryV52:JSON.stringify(preflight.validate(other).candidate)},owner,userId:owner,transport,checkpoint});
 assert.equal(second.status,'conflict');
 const remote=await transport.read(owner);
 const restored=JSON.parse(model.restoreSnapshot(remote).workoutHistoryV52);
 assert.equal(restored.some(s=>s.id==='mlc2-integration-1'),true);
 assert.equal(restored.some(s=>s.id==='second-device'),false);
});
test('simulated offline write leaves original cloud rows intact and rejects wrong owner',async()=>{
 const seed=await model.normalize({workoutHistoryV52:JSON.stringify([original])});
 const transport=fakeCloud(seed),before=await transport.read(owner);
 transport.failOnce();
 const proposal=preflight.validate(preflightInput);
 await assert.rejects(sync.migrate({snapshot:{workoutHistoryV52:JSON.stringify(proposal.candidate)},owner,userId:owner,transport,checkpoint:before}),/offline/);
 assert.deepEqual(await transport.read(owner),before);
 await assert.rejects(sync.migrate({snapshot:{},owner,userId:'different-user',transport,checkpoint:before}),/Account changed/);
});
