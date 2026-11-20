/* Explicit, single-phone schedule backup delivery coordinator.
 * Never invoked from the production app. Caller supplies an authenticated,
 * approved transport and explicit approval. All cloud writes remain gated.
 * Preserves pending and attempted operations after ambiguous outcomes.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./schedule-backup-queue.js'):root.MLCScheduleBackupQueue,
  node?require('./v2-schedule-sync-coordinator.js'):root.MLCV2ScheduleSyncCoordinator);
 if(node)module.exports=api;else root.MLCScheduleBackupDelivery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(queue,sync){
 'use strict';
 function fingerprint(value){
  if(Array.isArray(value))return '['+value.map(fingerprint).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+fingerprint(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 async function deliver({storage,owner,validIds,checkpoint,transport,operationId,explicitApproval=false}={}){
  if(explicitApproval!==true)throw Error('Explicit permission required for cloud workout backup');
  if(!storage||typeof transport?.read!=='function'||typeof transport?.save!=='function')
   throw Error('Approved cloud transport and local backup storage required');
  const pending=queue.read(storage,owner,validIds);
  if(!pending) return Object.freeze({status:'nothing-pending',writeCount:0});
  if(pending.status==='attempted')
   throw Error('Previous backup upload outcome uncertain; inspect cloud record before any retry');
  sync.validCheckpoint(checkpoint);
  // Verify the cloud has not changed BEFORE creating an attempted record.
  const fresh=await transport.read(owner);
  sync.validCheckpoint(fresh);
  if(fresh.revision!==checkpoint.revision||fingerprint(fresh.document)!==fingerprint(checkpoint.document))
   throw Error('Cloud backup differs from the verified checkpoint; local workout preserved');
  const current=queue.read(storage,owner,validIds);
  if(!current||current.status!=='pending'||current.fingerprint!==pending.fingerprint)
   throw Error('Workout edited while checking cloud; do not upload stale backup');
  if(fingerprint(fresh.document)===pending.fingerprint)
   return Object.freeze({status:'already-saved',revision:fresh.revision,writeCount:0,
    message:'Backup already matches the cloud; local pending record retained for explicit reconciliation.'});
  queue.beginAttempt(storage,owner,validIds,fresh.revision,operationId);
  try{
   const verified=await sync.synchronize({owner,localDocument:pending.document,checkpoint:fresh,
    transport,operationId,explicitApproval:true});
   if(verified.status!=='verified'||verified.readBackMatches!==true)
    throw Error('Cloud upload not independently verified; original operation retained');
   // Final independent confirmation before clearing the one-phone outbox.
   const latest=await transport.read(owner);
   if(latest.revision!==verified.revision||fingerprint(latest.document)!==pending.fingerprint)
    throw Error('Cloud changed after upload verification; pending backup preserved');
   queue.finishVerified(storage,owner,validIds,operationId,latest.document);
   return Object.freeze({status:'verified',writeCount:1,revision:verified.revision});
  }catch(error){
   // Never revert attempted to pending: the cloud may have committed already.
   throw Error('Backup may have been written; retain operation and review before retry: '+
    String(error.message||error));
  }
 }
 async function reconcileAttempt({storage,owner,validIds,transport}={}){
  if(!storage||typeof transport?.read!=='function')
   throw Error('Read-only verified cloud transport required');
  const item=queue.read(storage,owner,validIds);
  if(!item||item.status!=='attempted')
   return Object.freeze({status:'nothing-to-reconcile',writeCount:0});
  const fresh=await transport.read(owner);
  sync.validCheckpoint(fresh);
  if(fresh.revision===item.expectedRevision+1&&
     fingerprint(fresh.document)===item.fingerprint){
   queue.finishVerified(storage,owner,validIds,item.operationId,fresh.document);
   return Object.freeze({status:'verified-after-interruption',revision:fresh.revision,
    writeCount:0,message:'Original phone upload confirmed without repeating the write.'});
  }
  // A missing record may mean the original request failed, but absence is not
  // approval to create a new operation ID or overwrite newer cloud state.
  return Object.freeze({status:'manual-review',revision:fresh.revision,writeCount:0,
   message:'Could not confirm original upload; preserve operation ID and both versions.'});
 }
 return Object.freeze({deliver,reconcileAttempt});
});
