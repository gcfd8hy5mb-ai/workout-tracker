/* Explicitly-invoked isolated v2 schedule synchronization coordinator.
 * NOT loaded by app.js and not permission to activate production cloud writes.
 * Uses an approved transport, an owner-verified checkpoint, fresh read,
 * revision-aware save, and independent read-back without automatic retries.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./v2-recurring-schedule.js'):root.MLCV2RecurringSchedule,
  node?require('./v2-cloud-save-verification.js'):root.MLCV2SaveVerification);
 if(node)module.exports=api;else root.MLCV2ScheduleSyncCoordinator=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(schedule,saveVerification){
 'use strict';
 function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 function validCheckpoint(value){
  if(!value||!Number.isSafeInteger(value.revision)||value.revision<0)
   throw Error('Verified cloud revision checkpoint required');
  if(value.revision===0&&value.document===null)return true;
  if(value.revision<1||!value.document)throw Error('Invalid existing cloud checkpoint');
  schedule.validate(value.document);
  return true;
 }
 async function inspect({owner,localDocument,checkpoint,transport}={}){
  if(typeof owner!=='string'||!owner||typeof transport?.read!=='function')
   throw Error('Authenticated owner and read-only schedule transport required');
  schedule.validate(localDocument);
  validCheckpoint(checkpoint);
  const localSnapshot=canonical(localDocument);
  // Fresh cloud read is deliberately the only network operation here.
  const fresh=await transport.read(owner);
  validCheckpoint(fresh);
  if(canonical(localDocument)!==localSnapshot)
   throw Error('Local schedule changed during comparison; compare again');
  const checkpointSnapshot=canonical(checkpoint.document);
  const remoteSnapshot=canonical(fresh.document);
  const remoteChanged=fresh.revision!==checkpoint.revision||remoteSnapshot!==checkpointSnapshot;
  const localChanged=localSnapshot!==checkpointSnapshot;
  const status=!remoteChanged&&!localChanged?'in-sync':
   remoteChanged&&localChanged?'conflict':remoteChanged?'cloud-newer':'local-only';
  return Object.freeze({status,owner,revision:fresh.revision,writeCount:0,
   safeToOfferSave:status==='local-only',
   // The remote document is returned for review, never applied to local state.
   remoteDocument:fresh.document===null?null:JSON.parse(JSON.stringify(fresh.document)),
   message:status==='conflict'?'Both local and cloud schedules changed; preserve both for review.':
    status==='cloud-newer'?'Cloud schedule changed; do not overwrite local draft.':
    status==='local-only'?'Local changes found; a new explicit save requires fresh approval.':
    'Local and cloud schedules match the verified checkpoint.'});
 }
 async function synchronize({owner,localDocument,checkpoint,transport,operationId,explicitApproval=false}={}){
  if(explicitApproval!==true)throw Error('Explicit user approval required for isolated cloud save');
  if(typeof owner!=='string'||!owner||typeof transport?.read!=='function'||typeof transport?.save!=='function')
   throw Error('Authenticated owner and approved transport required');
  schedule.validate(localDocument);
  validCheckpoint(checkpoint);
  const localBefore=canonical(localDocument);
  const fresh=await transport.read(owner);
  validCheckpoint(fresh);
  if(fresh.revision!==checkpoint.revision||canonical(fresh.document)!==canonical(checkpoint.document))
   throw Error('Cloud schedule changed since checkpoint; preserve local draft and review before saving');
  if(canonical(fresh.document)===localBefore){
   return Object.freeze({status:'already-saved',revision:fresh.revision,writeCount:0,
    message:'Schedule already matches cloud. No duplicate write was issued.'});
  }
  if(canonical(localDocument)!==localBefore)throw Error('Local workout schedule changed while verifying cloud checkpoint');
  const result=await saveVerification.verify({owner,expectedRevision:fresh.revision,
   document:localDocument,transport,operationId});
  if(canonical(localDocument)!==localBefore)throw Error('Local workout schedule changed during cloud save; preserve both versions');
  return Object.freeze({status:'verified',revision:result.revision,writeCount:1,
   readBackMatches:result.readBackMatches,
   message:'An explicit save and independent read-back matched. Local schedule was not modified.'});
 }
 return Object.freeze({inspect,synchronize,validCheckpoint});
});
