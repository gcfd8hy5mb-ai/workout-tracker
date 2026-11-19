/* Preview-only compatibility bridge from a completed 2.0 local workout to
 * the existing PRISM workoutHistoryV52 cloud shape. No network/storage writes.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./save-preflight.js'):root.MLCSavePreflight);
 if(node)module.exports=api;else root.MLCLocalSessionCloudPreview=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(preflight){
 'use strict';
 function prepare({owner,verifiedOwner,history,localWorkout,catalog}={}){
  if(!localWorkout||typeof localWorkout.id!=='string'||!/^[a-zA-Z0-9_-]{4,90}$/.test(localWorkout.id)||
   !localWorkout.id.startsWith('demo-'))throw Error('Completed local 2.0 workout identifier required');
  if(typeof localWorkout.created!=='string'||!Number.isFinite(Date.parse(localWorkout.created)))
   throw Error('Completed local 2.0 workout timestamp required');
  const proposedId='mlc2-'+localWorkout.id;
  const candidate=preflight.validate({
   owner,verifiedOwner,baseline:history,latestHistory:history,
   previewWorkout:localWorkout,catalog,proposedId,now:localWorkout.created
  });
  return Object.freeze({owner,sourceLocalId:localWorkout.id,proposedId,
   session:candidate.session,sourceKey:candidate.sourceKey,
   historyBefore:history.length,historyAfter:candidate.candidate.length,
   readyForProduction:false,
   message:'Preview only. Local workout and original account history remain untouched.'});
 }
 async function validateRoundTrip({owner,verifiedOwner,history,localWorkout,catalog}={}){
  const preview=prepare({owner,verifiedOwner,history,localWorkout,catalog});
  const result=preflight.validate({owner,verifiedOwner,baseline:history,latestHistory:history,
   previewWorkout:localWorkout,catalog,proposedId:preview.proposedId,now:localWorkout.created});
  const verified=await preflight.roundTrip(result.candidate);
  return Object.freeze({...preview,roundTripVerified:verified.verified,
   normalizedRows:verified.rows,readyForProduction:false});
 }
 return Object.freeze({prepare,validateRoundTrip});
});
