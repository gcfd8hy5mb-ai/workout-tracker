/* Pure, fail-closed exercise demonstration manifest validator.
 * Isolated preview utility: never downloads media or mutates saved workouts.
 * A visual is "approved" only after human review AND exact exercise-ID matching.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCExerciseDemonstrations=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SAFE_PATH=/^(?:\.\/)?(?:images|myliftcoach2\/assets|assets)\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|gif|mp4)$/i;
 const VALID_LICENSES=new Set(['original-owned','public-domain','cc0','cc-by-4.0','cc-by-sa-4.0','licensed-permission']);
 const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 function cleanPath(path){
  if(typeof path!=='string'||!SAFE_PATH.test(path)||path.includes('..')||path.includes('//')||path.includes('\\'))return null;
  return path;
 }
 function audit(catalog,manifest){
  if(!Array.isArray(catalog)||!Array.isArray(manifest))throw TypeError('Catalog and manifest must be arrays');
  const catalogIds=new Set(),duplicateCatalog=[];
  for(const ex of catalog){
   if(!ex||typeof ex.id!=='string'||!ex.id.trim())throw Error('Catalog exercise missing ID');
   if(catalogIds.has(ex.id))duplicateCatalog.push(ex.id);
   catalogIds.add(ex.id);
  }
  if(duplicateCatalog.length)throw Error('Duplicate catalog IDs: '+duplicateCatalog.join(', '));
  const seen=new Set(),accepted=new Map(),rejected=[];
  for(const item of manifest){
   const id=typeof item?.exerciseId==='string'?item.exerciseId:'';
   const errors=[];
   if(!id||!catalogIds.has(id))errors.push('unknown-exercise-id');
   if(seen.has(id))errors.push('duplicate-manifest-id');
   seen.add(id);
   if(item?.approval!=='approved')errors.push('not-approved');
   if(!VALID_LICENSES.has(item?.license))errors.push('unverified-license');
   if(item?.license==='licensed-permission'&&!(typeof item.permissionReference==='string'&&item.permissionReference.trim()))errors.push('missing-permission-reference');
   if(item?.license==='cc-by-4.0'||item?.license==='cc-by-sa-4.0'){
    if(!(typeof item.attribution==='string'&&item.attribution.trim()))errors.push('missing-attribution');
   }
   const frames=item?.frames;
   if(!Array.isArray(frames)||frames.length<2||frames.length>12)errors.push('invalid-frame-count');
   else {
    const paths=new Set();
    for(const frame of frames){
     const file=cleanPath(frame?.path);
     if(!file)errors.push('unsafe-media-path');
     else if(paths.has(file))errors.push('duplicate-frame');
     else paths.add(file);
     if(typeof frame?.phase!=='string'||!frame.phase.trim())errors.push('missing-phase-label');
    }
   }
   if(errors.length)rejected.push(Object.freeze({exerciseId:id||null,reasons:Object.freeze([...new Set(errors)])}));
   else accepted.set(id,Object.freeze({exerciseId:id,license:item.license,frames:Object.freeze(frames.map(f=>Object.freeze({path:f.path,phase:f.phase}))),attribution:item.attribution||null}));
  }
  const missing=[...catalogIds].filter(id=>!accepted.has(id));
  return Object.freeze({catalogSize:catalogIds.size,approvedCount:accepted.size,missingCount:missing.length,
   approved:Object.freeze([...accepted.values()]),missingIds:Object.freeze(missing),
   rejected:Object.freeze(rejected),ready:missing.length===0&&rejected.length===0});
 }
 return Object.freeze({audit,cleanPath});
});
