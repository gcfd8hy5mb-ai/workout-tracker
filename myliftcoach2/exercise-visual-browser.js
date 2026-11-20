/* Fast, auditable display of large exercise-photo backlog.
   Does not change workouts, identities or source exercise records. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCExerciseVisualBrowser=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PAGE=36;
 function browse(items,{status='all',review='all',offset=0}={},audit){
  if(!Array.isArray(items))throw Error('Missing exercise catalog');
  if(!audit||typeof audit.resolve!=='function'||typeof audit.photo!=='function')throw Error('Missing visual audit');
  const rows=items.filter(ex=>{
   const photo=audit.photo(ex),map=audit.resolve(ex);
   const hasPhoto=photo.type==='original-photo';
   const picture=status==='all'||(status==='photo'&&hasPhoto)||(status==='missing'&&!hasPhoto);
   const reviewMatch=review==='all'||(review==='unresolved'&&map.basis==='unresolved')||
    (review==='group'&&map.basis==='group')||(review==='movement'&&map.basis==='movement');
   return picture&&reviewMatch;
  });
  const start=Number.isInteger(offset)&&offset>=0?offset:0;
  const visible=rows.slice(0,start+PAGE);
  return Object.freeze({total:rows.length,shown:visible.length,entries:visible,
   nextOffset:visible.length<rows.length?visible.length:null,hasMore:visible.length<rows.length});
 }
 return Object.freeze({PAGE,browse});
});
