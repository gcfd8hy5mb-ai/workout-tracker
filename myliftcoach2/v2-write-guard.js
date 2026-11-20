/* MYLIFTCOACH 2.0 — pure cloud-write conflict preflight.
 * Does not perform network requests, write data, or enable cloud syncing.
 * Future transport MUST enforce atomic compare-and-swap on server as well.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./recurring-draft.js'):root.MLCRecurringDraft);
 if(node)module.exports=api;else root.MLCV2WriteGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(draft){
 'use strict';
 function signature(doc){return JSON.stringify(doc)}
 function prepare({owner,session,baselineRevision,remoteRevision,document,validExerciseIds}){
  if(typeof owner!=='string'||!owner||session?.user?.id!==owner||!session?.access_token)
   throw Error('Authenticated account does not match schedule owner');
  if(!Number.isSafeInteger(baselineRevision)||baselineRevision<0)
   throw Error('Cloud baseline revision is required');
  if(!Number.isSafeInteger(remoteRevision)||remoteRevision<0)
   throw Error('Cloud revision is invalid');
  if(remoteRevision!==baselineRevision)
   throw Error('Cloud schedule changed; reload and reconcile without overwriting');
  draft.guard(document,validExerciseIds);
  if(document.plans.length===0)throw Error('Empty schedule cannot replace a saved cloud plan');
  const snapshot=JSON.parse(signature(document));
  const fingerprint=signature(snapshot);
  return Object.freeze({owner,expectedRevision:baselineRevision,document:snapshot,fingerprint,mayWrite:false});
 }
 function recheck(prepared,{owner,session,localDocument,validExerciseIds,remoteRevision}){
  if(!prepared||prepared.owner!==owner||session?.user?.id!==owner||!session?.access_token)
   throw Error('Account changed before proposed cloud save');
  if(remoteRevision!==prepared.expectedRevision)throw Error('Cloud schedule changed before proposed save');
  draft.guard(localDocument,validExerciseIds);
  if(signature(localDocument)!==prepared.fingerprint)
   throw Error('Local schedule changed during cloud validation');
  return Object.freeze({safeToAttemptAtomicWrite:true,expectedRevision:prepared.expectedRevision,mayWrite:false});
 }
 return Object.freeze({prepare,recheck});
});
