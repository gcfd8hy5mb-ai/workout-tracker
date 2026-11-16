/* Canonical full exercise library: prefer original MYLIFTCOACH metadata
 * over starter presets with overlapping IDs. Preserves existing workout IDs.
 * Static image presence is optional; absent photos fall back to anatomy.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports,api=factory();
 if(node)module.exports=api;else root.MLCV2ExerciseCatalog=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function merge(original=[],starter=[]){
  const ids=new Set(),result=[];
  for(const item of [...original,...starter]){
   if(!item||typeof item.id!=='string'||!item.id||ids.has(item.id))continue;
   ids.add(item.id);
   result.push({
    ...item,group:item.group||item.muscle||'Other',
    sets:Number.isInteger(item.sets)&&item.sets>0?item.sets:3,
    reps:typeof item.reps==='string'&&item.reps?item.reps:'8–12',
    cue:item.cue||item.how||''
   });
  }
  return result;
 }
 function imagePath(ex){
  return typeof ex?.image==='string'&&/^images\/[a-zA-Z0-9_.-]+\.(png|webp|jpg|jpeg|svg)$/.test(ex.image)?
   '../'+ex.image:null;
 }
 function filter(items,query='',group=''){
  const q=String(query).trim().toLowerCase(),selected=String(group).toLowerCase();
  const family=(muscle)=>{
   if(selected==='arms')return ['biceps','triceps','forearms'].includes(muscle);
   if(selected==='legs')return ['quads','hamstrings','calves','glutes','adductors'].includes(muscle);
   if(selected==='shoulders')return ['shoulders','delts'].includes(muscle);
   return !selected||muscle===selected;
  };
  return items.filter(ex=>{
   const muscle=String(ex.muscle||ex.group||'').toLowerCase();
   return family(muscle)&&(String(ex.name||'')+' '+muscle).toLowerCase().includes(q);
  });
 }
 return Object.freeze({merge,imagePath,filter});
});
