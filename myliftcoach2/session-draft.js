/* MYLIFTCOACH 2.0 — account-isolated, local-only in-progress workout drafts.
 * Never alters production PRISM keys, cloud records, or the weekly plan.
 * A different workout may not silently replace an unfinished one.
 */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory();if(node)module.exports=api;else root.MLCSessionDraft=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='mlc2-unfinished-session-v1:';
 const key=owner=>PREFIX+(typeof owner==='string'&&owner?owner:'guest');
 function valid(value,owner){
  if(!value||value.version!==1||value.owner!==owner||typeof value.planId!=='string'||!value.planId||
    !value.plan||value.plan.id!==value.planId||!Array.isArray(value.plan.ids)||!value.plan.ids.length||
    new Set(value.plan.ids).size!==value.plan.ids.length||value.plan.ids.length>60||
    !value.plan.ids.every(id=>typeof id==='string'&&id.length>0&&id.length<=128)||
    !['Great','Normal','Tired'].includes(value.readiness)||!Array.isArray(value.sets)||
    value.sets.length>600||!Number.isFinite(Date.parse(value.savedAt))||
    !value.sets.every(set=>value.plan.ids.includes(set?.exerciseId)&&
      Number.isFinite(set.weight)&&set.weight>=0&&set.weight<=1500&&
      Number.isInteger(set.reps)&&set.reps>=1&&set.reps<=100))
   throw Error('Unfinished workout draft is invalid; do not overwrite it');
  return value;
 }
 function read(storage,owner){
  const raw=storage.getItem(key(owner));
  if(raw===null)return null;
  let value;
  try{value=JSON.parse(raw)}catch{throw Error('Unfinished workout draft cannot be read; do not overwrite it')}
  return valid(value,owner||'guest');
 }
 function save(storage,owner,plan,session){
  const actualOwner=owner||'guest',value={version:1,owner:actualOwner,planId:plan?.id,
   plan:plan?{id:plan.id,title:String(plan.title||'Workout'),kind:String(plan.kind||'Custom'),
     description:String(plan.description||''),ids:plan.ids?.slice()}:null,
   readiness:session?.readiness,sets:session?.sets?.map(x=>({...x})),savedAt:new Date().toISOString()};
  valid(value,actualOwner);
  const serialized=JSON.stringify(value),k=key(actualOwner);
  storage.setItem(k,serialized);
  if(storage.getItem(k)!==serialized)throw Error('Unfinished workout did not persist');
  return value;
 }
 function clear(storage,owner){storage.removeItem(key(owner))}
 return Object.freeze({key,valid,read,save,clear});
});
