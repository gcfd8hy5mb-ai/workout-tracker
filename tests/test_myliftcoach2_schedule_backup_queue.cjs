const test=require('node:test'),assert=require('node:assert/strict');
const queue=require('../myliftcoach2/schedule-backup-queue.js');
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const valid=['press','row','squat'];
const weekly=()=>({plans:[{id:'upper-a',title:'Upper',kind:'Preset',ids:['press']}],
 assigned:['upper-a',null,null,null,null,null,null]});
function storage(){
 const map=new Map();
 return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,val)=>map.set(key,val),removeItem:key=>map.delete(key),map};
}
test('account workout schedule is queued locally without any network dependency',()=>{
 const db=storage(),plan=weekly();
 assert.equal(queue.read(db,owner,valid),null);
 assert.equal(queue.stage(db,owner,plan,valid).queued,true);
 const item=queue.read(db,owner,valid);
 assert.equal(item.status,'pending');assert.equal(item.owner,owner);
 assert.equal(item.document.plans[0].title,'Upper');
 assert.deepEqual(item.document.overrides,{});
 assert.deepEqual(item.document.recurring,[]);
 assert.equal(item.operationId,null);
 assert.equal(item.expectedRevision,null);
 assert.equal(queue.read(db,other,valid),null);
 assert.equal(db.map.size,1);
 assert.equal(plan.version,undefined,'source weekly schedule not mutated');
});
test('subsequent phone edit replaces only an unattempted pending snapshot',()=>{
 const db=storage();
 queue.stage(db,owner,weekly(),valid);
 const revised=weekly();revised.plans[0].title='My changed workout';
 assert.equal(queue.stage(db,owner,revised,valid).changed,true);
 const pending=queue.read(db,owner,valid);
 assert.equal(pending.document.plans[0].title,'My changed workout');
 assert.equal(queue.stage(db,owner,revised,valid).changed,false);
});
test('recurring exceptions and schedules are preserved in queued backup',()=>{
 const db=storage(),doc={version:1,...weekly(),overrides:{'2026-11-20':null},
 recurring:[{start:'2026-11-13',end:null,workoutId:'upper-a'}]};
 queue.stage(db,owner,doc,valid);
 assert.deepEqual(queue.read(db,owner,valid).document.overrides,doc.overrides);
 assert.deepEqual(queue.read(db,owner,valid).document.recurring,doc.recurring);
});
test('guest and invalid workout content cannot enter account queue',()=>{
 const db=storage();
 assert.throws(()=>queue.stage(db,null,weekly(),valid),/Sign in/);
 assert.throws(()=>queue.stage(db,owner,{...weekly(),assigned:['missing',null,null,null,null,null,null]},valid),/Unknown default workout/);
 assert.throws(()=>queue.stage(db,owner,{...weekly(),plans:[{...weekly().plans[0],ids:['removed']}]},valid),/unavailable/);
 assert.equal(db.map.size,0);
});
test('unreadable pending backup cannot be silently replaced',()=>{
 const db=storage(),key=queue.key(owner);
 db.setItem(key,'{broken');
 assert.throws(()=>queue.stage(db,owner,weekly(),valid),/unreadable/);
 assert.equal(db.getItem(key),'{broken');
});
test('unknown pending operation state is retained rather than rewritten',()=>{
 const db=storage(),key=queue.key(owner);
 db.setItem(key,JSON.stringify({...{
  version:1,owner,status:'pending',updatedAt:new Date().toISOString(),
  operationId:'d3826f8f-5655-4f8f-aed2-0999c5f761c1',expectedRevision:0,
  fingerprint:'not-a-snapshot',document:weekly()
 }}));
 const original=db.getItem(key);
 assert.throws(()=>queue.stage(db,owner,weekly(),valid),/manual recovery/);
 assert.equal(db.getItem(key),original);
});

test('one-device backup write retains operation ID and blocks edits until independently verified',()=>{
 const db=storage(),key=queue.key(owner),op='d3826f8f-5655-4f8f-aed2-0999c5f761c1';
 queue.stage(db,owner,weekly(),valid);
 const started=queue.beginAttempt(db,owner,valid,0,op);
 assert.equal(started.status,'attempted');
 assert.equal(started.expectedRevision,0);
 assert.equal(started.operationId,op);
 const savedBytes=db.getItem(key);
 assert.throws(()=>queue.stage(db,owner,{...weekly(),plans:[{...weekly().plans[0],title:'Edited during upload'}]},valid),
  /needs verification/);
 assert.throws(()=>queue.beginAttempt(db,owner,valid,0,'07c2bcf0-42fe-4bda-8950-420538cb5f13'),
  /unattempted/);
 assert.equal(db.getItem(key),savedBytes,'ambiguous write cannot be overwritten');
 assert.throws(()=>queue.finishVerified(db,owner,valid,'07c2bcf0-42fe-4bda-8950-420538cb5f13',started.document),
  /does not match/);
 assert.equal(db.getItem(key),savedBytes);
 assert.deepEqual(queue.finishVerified(db,owner,valid,op,started.document),{verified:true,cleared:true});
 assert.equal(db.getItem(key),null);
 queue.stage(db,owner,weekly(),valid);
 assert.ok(queue.read(db,owner,valid));
});
test('attempt metadata must persist before future cloud writes can start',()=>{
 const db=storage(),op='d3826f8f-5655-4f8f-aed2-0999c5f761c1';
 assert.throws(()=>queue.beginAttempt(db,owner,valid,0,op),/unattempted/);
 queue.stage(db,owner,weekly(),valid);
 const before=db.getItem(queue.key(owner));
 assert.throws(()=>queue.beginAttempt(db,owner,valid,0,'bad-id'),/operation UUID/);
 assert.equal(db.getItem(queue.key(owner)),before);
});
