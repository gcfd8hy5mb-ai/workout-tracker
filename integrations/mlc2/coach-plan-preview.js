/* MYLIFTCOACH 2.0 Coach plan preview.
 * Deterministic read-only plan for the exact workout Home selects.
 * No fabricated weights, no automatic plan edits, no writes or network requests.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2CoachPlan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function prepare(plan,catalog,sessions,{mode='free',readiness='Normal',coach=null}={}){
 if(mode!=='pro')return {status:'restricted',items:[]};
 if(!plan||!Array.isArray(plan.ids)||!Array.isArray(catalog))return {status:'unavailable',items:[]};
 const byId=new Map(catalog.map(e=>[e.id,e]));
 const items=plan.ids.map(id=>{
  const e=byId.get(id);
  if(!e)return {id,name:id,status:'unavailable',message:'This exercise needs a catalog match.'};
  if(e.group==='Cardio')return {id,name:e.name,status:'manual',message:'Track time or distance; no weight recommendation.'};
  const result=coach&&typeof coach.suggestion==='function'?coach.suggestion(id,sessions,catalog):null;
  // A tired check-in never produces a recommendation to INCREASE a load.
  if(readiness==='Tired'&&result?.status==='ready'&&result.action==='increase'){
   return {id,name:e.name,status:'manual',message:'An increase would normally be suggested from prior sets, but you marked yourself tired. Review your effort and choose a comfortable load.'};
  }
  if(result?.status==='ready'&&Number.isFinite(result.weight)&&result.weight>0&&result.weight<=1500){
   return {id,name:e.name,status:'suggested',weight:result.weight,action:result.action||'review',message:result.reason||'Based on saved working sets.'};
  }
  return {id,name:e.name,status:'manual',message:result?.reason||'Log more completed working sets before a weight suggestion is available.'};
 });
 return {status:'ready',planId:plan.id,title:String(plan.title||'Selected workout'),isCustom:String(plan.id||'').startsWith('custom-'),
  readiness:['Great','Normal','Tired'].includes(readiness)?readiness:'Normal',items};
}
function render(node,plan,catalog,sessions,options={}){
 if(!node)return;
 node.replaceChildren();
 const view=prepare(plan,catalog,sessions,options);
 if(view.status!=='ready'){
  const p=document.createElement('p');p.className='empty-note';p.textContent='Select Pro beta mode to view your next-workout plan.';node.append(p);return;
 }
 const heading=document.createElement('p');heading.className='coach-plan-intro';
 heading.textContent=view.title+(view.isCustom?' · Your custom workout takes priority.':' · Your selected workout.')+
  ' Suggestions are optional; no workout is changed automatically.';
 node.append(heading);
 const readiness=document.createElement('p');readiness.className='coach-plan-readiness';
 readiness.textContent='Today’s check-in: '+view.readiness+
  (view.readiness==='Tired'?' · Consider adjusting effort based on how you feel; Coach will not increase your weights automatically.':'');
 node.append(readiness);
 const list=document.createElement('div');list.className='coach-plan-rows';
 for(const item of view.items){
  const row=document.createElement('article');row.className='coach-plan-row';
  const name=document.createElement('strong');name.textContent=item.name;
  const detail=document.createElement('p');
  detail.textContent=item.status==='suggested'?'Suggested review: '+item.weight+' lb · '+item.message:item.message;
  row.append(name,detail);list.append(row);
 }
 node.append(list);
 if(typeof options.onOpenWorkout==='function'){
  const open=document.createElement('button');open.type='button';
  open.className='button-outline coach-plan-open';
  open.textContent='Open selected workout';
  open.addEventListener('click',()=>options.onOpenWorkout(view.planId));
  node.append(open);
 }
 const footer=document.createElement('p');footer.className='coach-plan-foot';
 footer.textContent='This is a review of the workout you selected, not an automatically created replacement. Confirm every weight yourself when logging a set.';
 node.append(footer);
}
return Object.freeze({prepare,render});
});
