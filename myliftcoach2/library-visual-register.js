/* Visual coverage register for the 341 original exercise source IDs.
 * Every exercise has an independently identifiable photo requirement and
 * source-derived muscle region, but missing photos remain explicitly missing.
 * Never introduce generic placeholder photos or pretend to have verified pose.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./exercise-visual-audit.js'):root.MLCExerciseVisualAudit);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCLibraryVisualRegister=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(audit){
 'use strict';
 function register(exercises){
  const items=(Array.isArray(exercises)?exercises:[]).map(ex=>{
   const muscle=audit.resolve(ex),photo=audit.photo(ex);
   return Object.freeze({id:ex.id,name:ex.name,sourceGroup:muscle.group,
    primaryRegions:muscle.primary,secondaryRegions:muscle.secondary,
    highlightReview:muscle.reviewStatus,photoStatus:photo.type,
    photoPath:photo.path,photoTodo:photo.path?null:'New exercise-specific photo needed',
    originalInstructions:Boolean(typeof ex.how==='string'&&ex.how.trim().length>=8)
   });
  });
  return Object.freeze(items);
 }
 function stats(exercises){
  const rows=register(exercises);
  const out={
   total:rows.length,
   hasOriginalPhoto:rows.filter(x=>x.photoStatus==='original-photo').length,
   photoNeeded:rows.filter(x=>x.photoStatus==='anatomy-only').length,
   sourceMuscleGroup:rows.filter(x=>x.sourceGroup).length,
   highlightsForExpertReview:rows.length,
   missingInstructions:rows.filter(x=>!x.originalInstructions).length,
   unresolvedAnatomy:rows.filter(x=>x.primaryRegions.length===0).length
  };
  return Object.freeze(out);
 }
 return Object.freeze({register,stats});
});
