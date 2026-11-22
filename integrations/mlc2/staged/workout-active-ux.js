/* Active workout UX read-model. No writes, invented numbers, or subscriber access.
   Previous sets are from the current signed-in/local workout history only. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2WorkoutUX=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function validSet(s,id){return s?.exerciseId===id&&Number.isFinite(Number(s.weight))&&
  Number(s.weight)>=0&&Number(s.weight)<=1500&&Number.isInteger(Number(s.reps))&&
  Number(s.reps)>0&&Number(s.reps)<=100}
 function previous(id,sessions,planId){
  if(typeof id!=='string'||!Array.isArray(sessions))return null;
  const valid=sessions.filter(s=>s&&Array.isArray(s.sets)&&(!planId||s.planId===planId)&&
   Number.isFinite(Date.parse(s.created||'')))
   .sort((a,b)=>Date.parse(b.created)-Date.parse(a.created));
  const found=valid.find(s=>s.sets.some(set=>validSet(set,id)));
  if(!found)return null;
  const sets=found.sets.filter(s=>validSet(s,id)).map(s=>({
   weight:Number(s.weight),reps:Number(s.reps)
  }));
  return {date:found.created,sets,count:sets.length};
 }
 function latest(id,sets){
  const own=Array.isArray(sets)?sets.filter(s=>validSet(s,id)):[];
  if(!own.length)return null;
  const s=own[own.length-1];return {weight:Number(s.weight),reps:Number(s.reps)};
 }
 function progress(ids,sets){
  const all=Array.isArray(sets)?sets:[],unique=new Set(all.filter(s=>s&&ids.includes(s.exerciseId)).map(s=>s.exerciseId));
  return {logged:all.length,completedExercises:unique.size,totalExercises:ids.length,
   volume:all.reduce((n,s)=>n+(Number.isFinite(Number(s.weight))&&Number.isInteger(Number(s.reps))?Number(s.weight)*Number(s.reps):0),0)};
 }
 function defaults(id,sets,sessions,planId){
  const last=latest(id,sets);if(last)return {...last,source:'current'};
  const prior=previous(id,sessions,planId);const candidate=prior?.sets[prior.sets.length-1];
  return candidate?{...candidate,source:'previous'}:{weight:'',reps:'',source:'empty'};
 }
 return Object.freeze({validSet,previous,latest,progress,defaults});
});
