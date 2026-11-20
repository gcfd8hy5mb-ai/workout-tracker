/* Draft-only reconciliation: legacy single photos != approved multi-frame demos.
 * Pure data transform. Never changes stored workouts or overwrites images.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./exercise-demonstrations.js'):root.MLCExerciseDemonstrations,
 typeof module==='object'&&module.exports?require('./exercise-visual-audit.js'):root.MLCExerciseVisualAudit);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCExerciseMediaReconciliation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(demos,legacy){
 'use strict';
 function reconcile(catalog,manifest){
  const summary=demos.audit(catalog,manifest),accepted=new Map(summary.approved.map(item=>[item.exerciseId,item]));
  const rows=catalog.map(ex=>{
   const asset=accepted.get(ex.id),prior=legacy.photo(ex);
   return Object.freeze({
    exerciseId:ex.id,name:ex.name,muscle:ex.muscle||ex.group||null,
    demoStatus:asset?'approved-multiframe':prior.path?'legacy-single-image':'anatomy-only',
    approvedFrames:asset?asset.frames:[],
    approvedLicense:asset?asset.license:null,
    originalPhoto:prior.path,
    needsDemonstration:!asset,
    displayMode:asset?'multiframe':prior.path?'original-photo':'anatomy'
   });
  });
  const counts=Object.freeze({
   catalog:rows.length,
   approvedMultiframe:rows.filter(row=>row.demoStatus==='approved-multiframe').length,
   legacyPhotoFallback:rows.filter(row=>row.demoStatus==='legacy-single-image').length,
   anatomyFallback:rows.filter(row=>row.demoStatus==='anatomy-only').length,
   awaitingApprovedDemo:rows.filter(row=>row.needsDemonstration).length,
   rejectedManifestRows:summary.rejected.length
  });
  return Object.freeze({counts,rows:Object.freeze(rows),rejections:summary.rejected,
   ready:summary.ready,missingIds:summary.missingIds});
 }
 function lookup(result,id){
  if(!result||!Array.isArray(result.rows)||typeof id!=='string')return null;
  return result.rows.find(row=>row.exerciseId===id)||null;
 }
 return Object.freeze({reconcile,lookup});
});
