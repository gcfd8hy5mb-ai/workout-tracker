/* Read-only next-session prescription, sourced from current custom plan.
 * All recommended weights are optional and require manual application.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./session-coach.js'):root.MLCSessionCoach);
 if(node)module.exports=api;else root.MLCCoachNextSession=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(coach){
 'use strict';
 const range=Object.freeze({min:8,max:10});
 function prescribe({today=null,adaptive=null,decisions=[]}={}){
  if(today?.status!=='scheduled'||adaptive?.status!=='scheduled'||!Array.isArray(today.items)||
   !Array.isArray(adaptive.items)||today.items.length!==adaptive.items.length)
   return Object.freeze({status:'rest',items:Object.freeze([]),message:'No eligible scheduled workout. No replacement generated.'});
  const seen=new Set(),items=[];
  for(let i=0;i<today.items.length;i++){
   const source=today.items[i],proposal=adaptive.items[i];
   if(!source||!proposal||source.id!==proposal.exerciseId||seen.has(source.id))
    return Object.freeze({status:'invalid',items:Object.freeze([]),message:'Scheduled exercises changed. Refresh Coach before reviewing prescriptions.'});
   seen.add(source.id);
   const status=proposal.status,allowed=['increase','reduce','hold'].includes(status)&&
    Number.isFinite(proposal.weight)&&proposal.weight>0&&proposal.weight<=1500;
   const manual=Number.isFinite(source.personalTarget)&&source.personalTarget>0?source.personalTarget:null;
   const weight=allowed?proposal.weight:null;
   const signature=allowed?JSON.stringify([source.id,status,weight,proposal.source||null]):null;
   const decided=signature?(Array.isArray(decisions)?decisions:[]).find(row=>row?.signature===signature)?.choice:null;
   const warning=decided==='dismissed'?'You dismissed this exact suggestion.':
    status==='review-increase'?'A suggested increase is paused pending review.':
    status==='verify-exercise'?'This exercise ID needs review.':
    !allowed?'No verified weight suggestion available.':'';
   items.push(Object.freeze({
    exerciseId:source.id,name:source.name||source.id,status,weight,
    reps:range,source:allowed?proposal.source||null:null,reason:String(proposal.reason||''),
    warmups:allowed?Object.freeze(coach.warmups(weight).map(x=>Object.freeze(x))):Object.freeze([]),
    personalTarget:manual,decision:decided||null,warning,requiresManualUse:true
   }));
  }
  return Object.freeze({status:'scheduled',title:String(today.title||'Scheduled workout'),
   items:Object.freeze(items),message:'Uses today’s exact custom workout. Suggested weights and warm-ups are optional; nothing is applied.'});
 }
 return Object.freeze({prescribe});
});
