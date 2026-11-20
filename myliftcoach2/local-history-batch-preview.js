/* Non-destructive batch preview of local 2.0 workouts against the verified
 * original workout history. A same-ID mismatch is a conflict, NEVER a merge.
 * No network, localStorage, upload, or automatic application.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./save-preflight.js'):root.MLCSavePreflight,
  node?require('./local-session-cloud-preview.js'):root.MLCLocalSessionCloudPreview);
 if(node)module.exports=api;else root.MLCLocalHistoryBatchPreview=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(preflight,bridge){
 'use strict';
 function canonical(x){
  if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
  if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
  return JSON.stringify(x);
 }
 async function inspect({owner,verifiedOwner,history,localWorkouts,catalog}={}){
  if(!owner||owner!==verifiedOwner)throw Error('Verified account owner required');
  if(!Array.isArray(history)||!Array.isArray(localWorkouts)||!Array.isArray(catalog))
   throw Error('Verified original history, local workouts, and exercise catalog required');
  if(localWorkouts.length>2000)throw Error('More than 2,000 workouts require a separate review; no local history was trimmed');
  const originals=new Map(),seen=new Set(),items=[],toAppend=[];
  for(const original of history){
   if(!original||typeof original.id!=='string'||!original.id||originals.has(original.id))
    throw Error('Original history contains duplicate or invalid session identities');
   originals.set(original.id,original);
  }
  let alreadySaved=0;
  for(const local of localWorkouts){
   if(!local||typeof local.id!=='string'||seen.has(local.id))
    throw Error('Local 2.0 workout has duplicated or missing identity; review required');
   seen.add(local.id);
   // Convert independently of the full original history, allowing an identical
   // already-existing cloud row to be compared rather than treated as a new save.
   const preview=bridge.prepare({owner,verifiedOwner,history:[],localWorkout:local,catalog});
   const existing=originals.get(preview.proposedId);
   const equal=existing?canonical(existing)===canonical(preview.session):false;
   const state=existing?(equal?'already-saved':'conflict'):'new';
   if(state==='conflict')throw Error('Cloud record '+preview.proposedId+' differs from the local workout; preserve both and review');
   if(state==='new')toAppend.push(preview.session);
   else alreadySaved++;
   items.push(Object.freeze({localId:local.id,cloudId:preview.proposedId,status:state,
    exercises:preview.session.exercises.length,sets:preview.session.exercises.reduce((n,e)=>n+e.sets.length,0)}));
  }
  // The local demo history is newest-first. Keep its order, then the exact
  // original cloud history in its existing order; never mutate either array.
  const candidate=[...toAppend,...history];
  const checked=await preflight.roundTrip(candidate);
  if(checked.verified!==true||checked.sessions!==candidate.length)
   throw Error('Legacy history serialization failed; no upload permitted');
  return Object.freeze({owner,sourceKey:'workoutHistoryV52',
   originalCount:history.length,localCount:localWorkouts.length,
   newCount:toAppend.length,alreadySavedCount:alreadySaved,conflictCount:0,
   candidateCount:candidate.length,normalizedRows:checked.rows,
   items:Object.freeze(items),readyForProduction:false,
   message:'Preview only: no workout was uploaded, duplicated, overwritten, or merged.'});
 }
 return Object.freeze({inspect});
});
