/* Exercise visual reference audit for the 341-source catalog.
 * Muscle group is source-provided; detailed highlights are conservative
 * category/movement mappings and explicitly NOT individually expert verified.
 * Never invent an exercise photograph or assign generic images to unrelated poses.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCExerciseVisualAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const core={
  chest:['chest'],back:['lats'],shoulders:['frontDelts','lateralDelts'],
  biceps:['biceps'],triceps:['triceps'],forearms:['forearms'],
  quads:['quads'],glutes:['glutes'],hamstrings:['hamstrings'],
  calves:['calves'],core:['abs'],legs:['quads','glutes'],cardio:[]
 };
 const allowed=new Set(['chest','upperChest','lowerChest','frontDelts','lateralDelts','rearDelts',
 'biceps','brachialis','triceps','forearms','abs','obliques','traps','rhomboids','lats',
 'erectors','glutes','quads','adductors','hamstrings','calves','tibialis']);
 function resolve(ex){
  const group=String(ex?.muscle||ex?.group||'').trim();
  const name=String(ex?.name||'').toLowerCase();
  const cat=group.toLowerCase(),base=core[cat];
  let primary=base?.slice()||[],secondary=[],basis='group';
  if(cat==='cardio'){
   // General conditioning is NOT a muscle-specific isolation exercise.
   // Do not color whole-body anatomy as a definitive primary muscle.
   if(/treadmill|walk|run|sprint|stepper|stair|cycling|bike|elliptical/.test(name)){
    primary=['quads','calves'];secondary=['glutes','hamstrings'];basis='movement';
   }else if(/rowing|rower/.test(name)){primary=['quads','lats'];secondary=['hamstrings','biceps'];basis='movement'}
   else if(/medicine.ball.slam|ball.slam/.test(name)){primary=['lats','abs'];secondary=['frontDelts','triceps'];basis='movement'}
   else basis='unresolved';
  }else if(cat==='chest'){
   if(/incline|low.to.high/.test(name))primary=['upperChest'];
   if(/decline|high.to.low/.test(name))primary=['lowerChest'];
   secondary=/fly|deck|crossover/.test(name)?['frontDelts']:['triceps','frontDelts'];basis='movement';
  }else if(cat==='back'){
   if(/shrug/.test(name)){primary=['traps'];secondary=['forearms'];basis='movement'}
   else if(/deadlift|good.morning|back.extension|hyperextension/.test(name)){primary=['erectors'];secondary=['glutes','hamstrings'];basis='movement'}
   else if(/face.pull|rear.delt/.test(name)){primary=['rearDelts'];secondary=['rhomboids','traps'];basis='movement'}
   else if(/row/.test(name)){primary=['lats','rhomboids'];secondary=['biceps','rearDelts'];basis='movement'}
   else if(/pull.up|pulldown|pull.down/.test(name)){primary=['lats'];secondary=['biceps','rhomboids'];basis='movement'}
  }else if(cat==='shoulders'){
   if(/rear|reverse|face.pull/.test(name)){primary=['rearDelts'];secondary=['rhomboids'];basis='movement'}
   else if(/lateral|side.raise|upright.row/.test(name)){primary=['lateralDelts'];secondary=['traps'];basis='movement'}
   else if(/front.raise/.test(name)){primary=['frontDelts'];basis='movement'}
   else if(/press/.test(name)){primary=['frontDelts','lateralDelts'];secondary=['triceps'];basis='movement'}
  }else if(cat==='quads'){
   if(/squat|lunge|split.squat|step.up/.test(name)){secondary=['glutes'];basis='movement'}
  }else if(cat==='hamstrings'){
   if(/curl|nordic/.test(name)){basis='movement'}
   else if(/romanian|deadlift|good.morning|hip.hinge/.test(name)){secondary=['glutes','erectors'];basis='movement'}
  }else if(cat==='glutes'){
   if(/adduct/.test(name)){primary=['adductors'];secondary=['glutes'];basis='movement'}
   else if(/abduct/.test(name)){primary=['glutes'];basis='movement'}
   else if(/thrust|bridge|kickback/.test(name)){primary=['glutes'];secondary=['hamstrings'];basis='movement'}
  }else if(cat==='calves'&&/tibialis|dorsi.flex/.test(name)){primary=['tibialis'];basis='movement'}
  else if(cat==='core'){
   if(/woodchop|twist|rotation|side.plank|pallof/.test(name)){primary=['obliques','abs'];basis='movement'}
   else if(/plank|rollout|dead.bug/.test(name)){primary=['abs'];secondary=['obliques'];basis='movement'}
  }else if(cat==='biceps'){secondary=['brachialis','forearms'];basis='movement'}
  else if(cat==='triceps'&&/dip|close.grip.press/.test(name)){secondary=['chest','frontDelts'];basis='movement'}
  const uniq=x=>[...new Set(x.filter(y=>allowed.has(y)))];
  primary=uniq(primary);secondary=uniq(secondary).filter(y=>!primary.includes(y));
  return Object.freeze({id:ex?.id||'',group,primary,secondary,basis,
   reviewStatus:basis==='movement'?'movement-derived; professional review pending':
    basis==='group'?'source group only; movement review pending':'unresolved; no muscle highlight'});
 }
 function photo(ex){
  if(typeof ex?.image==='string'&&/^images\/[a-zA-Z0-9_.-]+\.(webp|png|jpeg|jpg|svg)$/.test(ex.image)){
   return {type:'original-photo',path:'../'+ex.image};
  }
  return {type:'anatomy-only',path:null};
 }
 function summary(exercises){
  const list=exercises.map(ex=>({ex,...resolve(ex),photo:photo(ex)}));
  const count=(fn)=>list.filter(fn).length;
  return Object.freeze({
   total:list.length,photos:count(x=>x.photo.type==='original-photo'),
   anatomyOnly:count(x=>x.photo.type==='anatomy-only'),
   movementDerived:count(x=>x.basis==='movement'),
   groupOnly:count(x=>x.basis==='group'),
   unresolved:count(x=>x.basis==='unresolved'),
   needsReview:list.filter(x=>x.basis!=='movement').map(x=>({id:x.id,name:x.ex.name,group:x.group,basis:x.basis}))
  });
 }
 return Object.freeze({resolve,photo,summary});
});
