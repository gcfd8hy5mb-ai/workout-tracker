/* MYLIFTCOACH 2.0 active-session field continuity.
 * Restore a user's own valid entries after exercise cards are re-rendered.
 * This module never saves workouts, chooses new weights or changes a plan.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCSessionInputContinuity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function weight(v){
  if(typeof v!=='string'||v.trim()==='')return null;
  const n=Number(v);
  return Number.isFinite(n)&&n>=0&&n<=1500?String(n):null;
 }
 function reps(v){
  if(typeof v!=='string'||v.trim()==='')return null;
  const n=Number(v);
  return Number.isInteger(n)&&n>=1&&n<=100?String(n):null;
 }
 function capture(root,ids){
  if(!root||typeof root.querySelectorAll!=='function')return Object.freeze({});
  const validIds=new Set(Array.isArray(ids)?ids:[]);
  const snapshot=Object.create(null);
  for(const card of root.querySelectorAll('[data-exercise-card]')){
   const id=card?.dataset?.exerciseCard;
   if(!validIds.has(id)||own(snapshot,id)||typeof card.querySelector!=='function')continue;
   const w=card.querySelector('[data-weight]'),r=card.querySelector('[data-reps]');
   const nextW=weight(w?.value),nextR=reps(r?.value);
   if(nextW!==null||nextR!==null)snapshot[id]={weight:nextW,reps:nextR};
  }
  return snapshot;
 }
 function restore(root,snapshot,ids){
  if(!root||typeof root.querySelectorAll!=='function'||!snapshot||typeof snapshot!=='object')return 0;
  const validIds=new Set(Array.isArray(ids)?ids:[]);let count=0;
  for(const card of root.querySelectorAll('[data-exercise-card]')){
   const id=card?.dataset?.exerciseCard;
   if(!validIds.has(id)||!own(snapshot,id)||typeof card.querySelector!=='function')continue;
   const saved=snapshot[id],w=card.querySelector('[data-weight]'),r=card.querySelector('[data-reps]');
   const nextW=weight(saved?.weight),nextR=reps(saved?.reps);
   if(w&&nextW!==null){w.value=nextW;count++;}
   if(r&&nextR!==null){r.value=nextR;count++;}
  }
  return count;
 }
 return Object.freeze({capture,restore,weight,reps});
});
