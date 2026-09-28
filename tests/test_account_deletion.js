const assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js');
const sync=require('../persistence/account-sync.js');
const {create}=require('../persistence/scoped-storage.js');
const userId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const raw=new Map();
const backing={getItem:key=>raw.get(key)??null,setItem:(key,value)=>raw.set(key,value),removeItem:key=>raw.delete(key)};
const manager=create(backing);manager.select(userId);
const w1={id:'first',name:'First',exercises:['press']},w2={id:'second',name:'Second',exercises:['row']};
manager.storage.setItem('customWorkoutsV5',JSON.stringify([w1,w2]));
const cloud=[];
const transport={
 read:async()=>cloud.map(row=>({...row})),
 write:async(_,changes)=>changes.map(change=>{
  const i=cloud.findIndex(row=>row.table===change.table&&row.id===change.id);
  const next={...change,user_id:userId,revision:(i<0?0:cloud[i].revision)+1};
  if(i<0)cloud.push(next);else cloud[i]=next;return next;
 })
};
async function run(){
 let result=await sync.migrate({snapshot:manager.snapshot(),owner:userId,userId,transport});
 let base=result.checkpoint;
 manager.recordDeletion('customWorkoutsV5');
 manager.storage.setItem('customWorkoutsV5',JSON.stringify([w2]));
 result=await sync.migrate({snapshot:manager.snapshot(),owner:userId,userId,transport,checkpoint:base,deletions:manager.deletionLedger()});
 assert.equal(result.status,'verified');
 assert.deepEqual(JSON.parse(result.restoreCandidate.customWorkoutsV5),[w2],'deleted workout is not restored');
 assert.equal(cloud.some(row=>row.payload?.__prismDeletedV1===true),true,'server retains explicit tombstone');
 manager.acknowledgeDeletions(manager.deletionLedger());base=result.checkpoint;
 result=await sync.migrate({snapshot:manager.snapshot(),owner:userId,userId,transport,checkpoint:base});
 assert.equal(result.writes,0,'verified deletion is idempotent');
 const w3={id:'third',name:'Third',exercises:['squat']};
 manager.storage.setItem('customWorkoutsV5',JSON.stringify([w2,w3]));
 result=await sync.migrate({snapshot:manager.snapshot(),owner:userId,userId,transport,checkpoint:base});
 base=result.checkpoint;
 manager.storage.setItem('customWorkoutsV5',JSON.stringify([w3,w2]));
 result=await sync.migrate({snapshot:manager.snapshot(),owner:userId,userId,transport,checkpoint:base});
 assert.ok(result.writes>=2,'reordering updates existing row positions');
 assert.deepEqual(JSON.parse(result.restoreCandidate.customWorkoutsV5),[w3,w2]);
 assert.equal(raw.has('customWorkoutsV5'),false,'guest data is not silently touched');
 console.log('Account deletes: explicit tombstone, no reappearance, idempotence, stable ordering, guest safety pass.');
}
run().catch(error=>{console.error(error);process.exitCode=1});
