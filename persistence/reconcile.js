/* Pure three-way planner. No storage writes, deletes, credentials or tier checks. */
(function(root,factory){const api=factory(typeof module==='object'?require('./storage-model.js'):root.PRISMStorageModel);if(typeof module==='object')module.exports=api;else root.PRISMReconcile=api;})(globalThis,function(model){
'use strict';
const key=r=>r.table+':'+r.id;
function content(r){return model.canonical({source_key:r.source_key,payload:r.payload,parent_id:r.parent_id??null,slot:r.slot??null,position:r.position??null});}
function plan(local,remote,base=[]){
 const cloud=new Map(remote.map(r=>[key(r),r])),previous=new Map(base.map(r=>[key(r),r]));
 const writes=[],conflicts=[],merged=new Map(remote.map(r=>[key(r),r]));
 for(const row of local){
  const id=key(row),server=cloud.get(id),old=previous.get(id);
  if(!server){
   if(old){conflicts.push({id,reason:'Cloud record disappeared; do not resurrect automatically'});continue;}
   writes.push({...row,expected_revision:0});merged.set(id,row);continue;
  }
  if(content(row)===content(server))continue;
  if(!old){conflicts.push({id,reason:'Different existing cloud value with no shared checkpoint'});continue;}
  const localChanged=content(row)!==content(old),cloudChanged=content(server)!==content(old);
  if(!localChanged)continue;
  if(cloudChanged){conflicts.push({id,reason:'Both devices changed this record'});continue;}
  if(!Number.isSafeInteger(server.revision)||server.revision<1)throw Error('Invalid server revision');
  writes.push({...row,expected_revision:server.revision});merged.set(id,row);
 }
 // Remote-only records are retained. Missing/capped local arrays never delete cloud rows.
 return {writes,conflicts,merged:[...merged.values()],ready:conflicts.length===0};
}
function verify(writes,returned){
 const actual=new Map(returned.map(r=>[key(r),r]));
 for(const sent of writes){const row=actual.get(key(sent));if(!row||content(row)!==content(sent)||!Number.isSafeInteger(row.revision)||row.revision<sent.expected_revision+1)throw Error('Cloud write verification failed');}
 return true;
}
function assertOwner(boundOwner,authenticatedUser){if(!authenticatedUser)throw Error('Sign in required');if(!boundOwner)throw Error('Local data must be explicitly claimed before upload');if(boundOwner!==authenticatedUser)throw Error('Account changed; local data belongs to another user');}
return Object.freeze({plan,verify,assertOwner,content});
});
