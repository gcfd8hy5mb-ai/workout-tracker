/* MYLIFTCOACH 2.0 — pure save compatibility preflight. ZERO network or storage writes.
 * Requires a fresh authenticated account baseline before any future production save.
 */
(function(root,factory){
 const model=typeof module==='object'&&module.exports?require('../persistence/storage-model.js'):root.PRISMStorageModel;
 const api=factory(model);if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCSavePreflight=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
 'use strict';
 function stable(history){return model.canonical(history)}
 function validate({owner,verifiedOwner,baseline,latestHistory,previewWorkout,catalog,proposedId,now}){
  if(!owner||owner!==verifiedOwner)throw Error('Verified account owner required');
  if(!Array.isArray(baseline)||!Array.isArray(latestHistory))throw Error('Fresh original history required');
  if(stable(baseline)!==stable(latestHistory))throw Error('History changed since last verified read; reload before saving');
  if(!proposedId||typeof proposedId!=='string'||proposedId.length>100)throw Error('Unique workout ID required');
  if(latestHistory.some(s=>String(s.id)===proposedId))throw Error('Duplicate session ID');
  if(!previewWorkout||!Array.isArray(previewWorkout.sets)||!previewWorkout.sets.length)throw Error('Completed workout with sets required');
  if(!Number.isFinite(Date.parse(now||'')))throw Error('Valid completion timestamp required');
  const exercises=[];
  const names=new Map((Array.isArray(catalog)?catalog:[]).filter(x=>x&&x.id).map(x=>[x.id,x.name]));
  for(const set of previewWorkout.sets){
   const id=String(set?.exerciseId||''),weight=Number(set?.weight),reps=Number(set?.reps);
   if(!names.has(id))throw Error('Unknown exercise in preview workout');
   if(!Number.isFinite(weight)||weight<=0||weight>1500||!Number.isInteger(reps)||reps<1||reps>100)throw Error('Invalid completed set values');
   let ex=exercises.find(e=>e.id===id);
   if(!ex){ex={id,name:String(names.get(id)),sets:[]};exercises.push(ex)}
   ex.sets.push({set:ex.sets.length+1,weight,reps});
  }
  const start=Number(previewWorkout.startedAt),end=Date.parse(now);
  const durationMinutes=Number.isFinite(start)&&start>0&&end>=start&&end-start<=86400000?
    Math.max(1,Math.round((end-start)/60000)):null;
  const readiness=['Great','Normal','Tired'].includes(previewWorkout.readiness)?previewWorkout.readiness:'Normal';
  const session={id:proposedId,date:now,workoutKey:String(previewWorkout.planId||'myliftcoach2'),
   workoutTitle:String(previewWorkout.title||'Workout').slice(0,120),
   durationMinutes,readiness,exercises};
  const candidate=[session,...latestHistory];
  return Object.freeze({owner,session,candidate,sourceKey:'workoutHistoryV52',readyForProduction:false});
 }
 async function roundTrip(candidate){
  if(!model?.normalize||!model?.restoreSnapshot)throw Error('Original persistence adapter missing');
  const rows=await model.normalize({workoutHistoryV52:JSON.stringify(candidate)});
  const restored=JSON.parse(model.restoreSnapshot(rows).workoutHistoryV52);
  if(stable(restored)!==stable(candidate))throw Error('Original cloud serialization was not lossless');
  return {rows:rows.length,sessions:restored.length,verified:true};
 }
 return Object.freeze({validate,roundTrip});
});
