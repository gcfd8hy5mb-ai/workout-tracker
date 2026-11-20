/* MYLIFTCOACH 2.0 bulk history cloud checkpoint preflight — NEVER WRITES.
 * Plans an append only after verifying the owner-bound normalized cloud
 * checkpoint, legacy history round-trip and idempotent local workout IDs.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(
  node?require('../persistence/storage-model.js'):root.PRISMStorageModel,
  node?require('../persistence/reconcile.js'):root.PRISMReconcile,
  node?require('./local-history-batch-preview.js'):root.MLCLocalHistoryBatchPreview,
  node?require('./local-session-cloud-preview.js'):root.MLCLocalSessionCloudPreview
 );
 if(node)module.exports=api;else root.MLCBulkHistoryCloudPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model,reconcile,batch,bridge){
 'use strict';
 const key=r=>r.table+':'+r.id;
 async function plan({owner,verifiedOwner,baseline,cloudRows,localWorkouts,catalog}={}){
  if(!owner||owner!==verifiedOwner)throw Error('Authenticated owner mismatch; keep local workouts');
  if(!Array.isArray(baseline)||!Array.isArray(cloudRows)||!Array.isArray(localWorkouts))
   throw Error('Verified history, full cloud checkpoint and local workouts required');
  if(!Array.isArray(catalog))throw Error('Verified exercise catalog required');
  // Check all supplied cloud rows, even rows not changed by workout history,
  // to ensure the caller never accidentally mixes users' snapshots.
  if(cloudRows.some(r=>!r||r.user_id!==owner||!Number.isSafeInteger(r.revision)||r.revision<1))
   throw Error('Cloud checkpoint is not fully owner-verified');
  const ids=new Set();
  for(const r of cloudRows){
   if(!r.table||!r.id||ids.has(key(r)))throw Error('Duplicate or invalid cloud checkpoint row');
   ids.add(key(r));
  }
  const relevant=cloudRows.filter(r=>r.source_key==='workoutHistoryV52');
  const source=model.restoreSnapshot(relevant).workoutHistoryV52;
  if(typeof source!=='string')throw Error('Original history source is missing from cloud checkpoint');
  let cloudHistory;try{cloudHistory=JSON.parse(source)}catch{throw Error('Cloud history cannot be decoded')}
  if(!Array.isArray(cloudHistory)||model.canonical(cloudHistory)!==model.canonical(baseline))
   throw Error('Original account history changed since the verified baseline');
  const baselineRows=await model.normalize({workoutHistoryV52:JSON.stringify(baseline)});
  const remote=new Map(relevant.map(r=>[key(r),r]));
  if(remote.size!==baselineRows.length)throw Error('Cloud history checkpoint is incomplete');
  for(const row of baselineRows){
   const stored=remote.get(key(row));
   if(!stored||reconcile.content(stored)!==reconcile.content(row))
    throw Error('Cloud history checkpoint content changed; reload before saving');
  }
  const review=await batch.inspect({owner,verifiedOwner,history:baseline,localWorkouts,catalog});
  const append=[];
  const already=new Set(review.items.filter(x=>x.status==='already-saved').map(x=>x.cloudId));
  for(const local of localWorkouts){
   const converted=bridge.prepare({owner,verifiedOwner,history:[],localWorkout:local,catalog});
   if(!already.has(converted.proposedId))append.push(converted.session);
  }
  // A no-op must not create a cloud write. Missing snapshots and conflicts
  // were already rejected; existing sessions remain in their exact order.
  const candidate=[...append,...baseline];
  const next=await model.normalize({workoutHistoryV52:JSON.stringify(candidate)});
  const restored=model.restoreSnapshot(next).workoutHistoryV52;
  if(typeof restored!=='string'||model.canonical(JSON.parse(restored))!==model.canonical(candidate))
   throw Error('Candidate cloud serialization changed workout order or details');
  const proposal=reconcile.plan(next,relevant,relevant);
  if(!proposal.ready)throw Error('Cloud history conflict; do not upload or auto-merge');
  const writes=proposal.writes;
  return Object.freeze({owner,sourceKey:'workoutHistoryV52',baselineCount:baseline.length,
   localCount:localWorkouts.length,newCount:append.length,alreadySavedCount:review.alreadySavedCount,
   candidateCount:candidate.length,createRows:writes.filter(r=>r.expected_revision===0).length,
   updateRows:writes.filter(r=>r.expected_revision>0).length,
   proposedRows:writes.length,readyForProduction:false,
   message:'Dry-run only. No network, storage, database writes, uploads or retries.'});
 }
 return Object.freeze({plan});
});
