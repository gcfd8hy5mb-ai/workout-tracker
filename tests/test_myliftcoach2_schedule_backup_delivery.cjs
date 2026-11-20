const test=require('node:test'),assert=require('node:assert/strict');
const queue=require('../myliftcoach2/schedule-backup-queue.js');
const {deliver}=require('../myliftcoach2/schedule-backup-delivery.js');
const owner='11111111-1111-4111-8111-111111111111',valid=['press'];
const op='d3826f8f-5655-4f8f-aed2-0999c5f761c1';
const schedule=()=>({plans:[{id:'upper-a',title:'My upper workout',kind:'Preset',ids:['press']}],
 assigned:['upper-a',null,null,null,null,null,null]});
function storage(){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
}
function cloud({onSave}={}){
 let remote={revision:0,document:null},reads=0,writes=0;
 const transport={
  async read(requester){assert.equal(requester,owner);reads++;return structuredClone(remote);},
  async save(requester,base,document,operationId){
   assert.equal(requester,owner);assert.equal(operationId,op);
   if(base!==remote.revision)throw Error('Cloud revision conflict');
   writes++;
   remote={revision:base+1,document:structuredClone(document)};
   if(onSave)await onSave();
   return structuredClone(remote);
  }
 };
 return {transport,counts:()=>({reads,writes}),remote:()=>remote,
  replace:document=>{remote={revision:remote.revision+1,document}}};
}
test('single-phone backup uploads once and clears queue only after verified cloud readback',async()=>{
 const db=storage(),backend=cloud();
 queue.stage(db,owner,schedule(),valid);
 const result=await deliver({storage:db,owner,validIds:valid,
  checkpoint:{revision:0,document:null},transport:backend.transport,operationId:op,explicitApproval:true});
 assert.equal(result.status,'verified');assert.equal(result.writeCount,1);
 assert.equal(result.revision,1);assert.equal(backend.counts().writes,1);
 assert.equal(queue.read(db,owner,valid),null);
 assert.equal(backend.remote().document.plans[0].title,'My upper workout');
});
test('fresh cloud change blocks upload without changing local queue',async()=>{
 const db=storage(),backend=cloud();queue.stage(db,owner,schedule(),valid);
 backend.replace(queue.asDocument(schedule(),valid));
 await assert.rejects(deliver({storage:db,owner,validIds:valid,
  checkpoint:{revision:0,document:null},transport:backend.transport,operationId:op,explicitApproval:true}),
  /differs from the verified checkpoint/);
 assert.equal(queue.read(db,owner,valid).status,'pending');
 assert.equal(backend.counts().writes,0);
});
test('unknown cloud outcome preserves immutable attempted operation and refuses blind retry',async()=>{
 const db=storage(),backend=cloud({onSave:()=>{throw Error('connection lost after commit')}});
 queue.stage(db,owner,schedule(),valid);
 const args={storage:db,owner,validIds:valid,checkpoint:{revision:0,document:null},
  transport:backend.transport,operationId:op,explicitApproval:true};
 await assert.rejects(deliver(args),/may have been written/);
 const pending=queue.read(db,owner,valid);
 assert.equal(pending.status,'attempted');assert.equal(pending.operationId,op);
 assert.equal(pending.expectedRevision,0);assert.equal(backend.counts().writes,1);
 await assert.rejects(deliver(args),/Previous backup upload outcome uncertain/);
 assert.equal(backend.counts().writes,1);
});
test('explicit approval and verified remote snapshot required before upload',async()=>{
 const db=storage(),backend=cloud();queue.stage(db,owner,schedule(),valid);
 await assert.rejects(deliver({storage:db,owner,validIds:valid,checkpoint:{revision:0,document:null},
  transport:backend.transport,operationId:op}),/Explicit permission/);
 assert.equal(backend.counts().reads,0);
 await assert.rejects(deliver({storage:db,owner,validIds:valid,checkpoint:{revision:12,document:null},
  transport:backend.transport,operationId:op,explicitApproval:true}),/Invalid existing cloud checkpoint/);
 assert.equal(queue.read(db,owner,valid).status,'pending');
 assert.equal(backend.counts().writes,0);
});
