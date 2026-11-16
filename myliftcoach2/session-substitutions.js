/* Original MYLIFTCOACH manual exercise substitution: same primary muscle,
 * no duplicated movement, preserve already logged sets. Session-only changes.
 * No backend writes and no hidden rewrite of the saved weekly workout.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCSessionSubstitutions=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function muscle(ex){return String(ex?.muscle||ex?.group||'').trim().toLowerCase();}
 function alternatives(oldId,currentIds,library){
  const list=Array.isArray(library)?library:[];
  const original=list.find(x=>x?.id===oldId),taken=new Set(currentIds||[]);
  if(!original||!muscle(original))return [];
  return list.filter(ex=>ex?.id&&ex.id!==oldId&&!taken.has(ex.id)&&muscle(ex)===muscle(original))
   .map(ex=>({id:String(ex.id),name:String(ex.name||ex.id),muscle:String(ex.muscle||ex.group||'')}))
   .sort((a,b)=>a.name.localeCompare(b.name));
 }
 function replace(plan,loggedSets,oldId,newId,library){
  if(!plan||!Array.isArray(plan.ids)||!plan.ids.includes(oldId))
   throw Error('Exercise is not part of this workout');
  if(!alternatives(oldId,plan.ids,library).some(x=>x.id===newId))
   throw Error('Replacement must target the same muscle and not duplicate an exercise');
  const hasSets=Array.isArray(loggedSets)&&loggedSets.some(set=>set?.exerciseId===oldId);
  const index=plan.ids.indexOf(oldId),ids=plan.ids.slice();
  if(hasSets)ids.splice(index+1,0,newId);
  else ids[index]=newId;
  return {plan:{...plan,ids},retainedSets:Array.isArray(loggedSets)?loggedSets.slice():[],retainedOriginal:hasSets};
 }
 return Object.freeze({alternatives,replace});
});
