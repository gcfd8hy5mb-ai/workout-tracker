/* MYLIFTCOACH 2.0 owner-scoped factual Coach Memory.
 * All outcomes are self-reported; never imply causal improvement or
 * autonomously adjust weight, sets, scheduling, or exercises.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachMemory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function review(outcomes,exerciseId=null){
  const rows=(Array.isArray(outcomes)?outcomes:[])
   .filter(row=>row&&['better','same','worse'].includes(row.rating)&&
    (exerciseId===null||row.exerciseId===exerciseId)&&Number.isFinite(Date.parse(row.at||'')))
   .slice().sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,12);
  const count=rows.length,better=rows.filter(r=>r.rating==='better').length,
   same=rows.filter(r=>r.rating==='same').length,worse=rows.filter(r=>r.rating==='worse').length;
  let signal='learning',message='More user-rated outcomes are needed before Coach identifies a consistent pattern.';
  if(count>=4){
   if(worse>=3&&worse>better){signal='review';message='Several recent user-rated outcomes were worse; review this exercise before applying another load increase.'}
   else if(better>=3&&better>worse){signal='positive';message='More outcomes were rated better, but this does not prove the Coach recommendation caused the change.'}
   else {signal='mixed';message='Rated outcomes are mixed; keep reviewing performance rather than assuming a trend.'}
  }
  return Object.freeze({exerciseId,count,better,same,worse,signal,message,
   confidence:'Self-reported exercise outcomes only; no clinical or causal inference.'});
 }
 function guard(action,memory){
  if(!action||!memory||memory.signal!=='review'||action.kind!=='progress'||action.exerciseId!==memory.exerciseId)
   return action;
  return Object.freeze({...action,kind:'review-outcomes',title:'Review repeated weaker outcomes',
   description:'Do not apply an additional Coach weight increase for this exercise until you review the logged results.',
   why:memory.message+' This does not alter your stored plan or manually entered targets.',
   requiresExplicitAction:true});
 }
 return Object.freeze({review,guard});
});
