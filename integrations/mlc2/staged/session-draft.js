/* 2.0 local unfinished-workout resilience: one isolated device-only draft.
   No legacy storage, network, account synchronization, or automatic cloud upload. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2SessionDraft=api;
})(globalThis,function(){
'use strict';
const KEY='mlc2-active-session-v1',MAX_SETS=500,AGE=7*24*3600*1000;
function validSet(s,ids){return s&&typeof s.exerciseId==='string'&&ids.includes(s.exerciseId)&&
 Number.isFinite(s.weight)&&s.weight>=0&&s.weight<=1500&&Number.isInteger(s.reps)&&s.reps>0&&s.reps<=100}
function read(storage,now=Date.now()){
 try{
  const record=JSON.parse(storage.getItem(KEY)||'null');
  if(!record||record.version!==1||typeof record.planId!=='string'||!Array.isArray(record.ids)||!record.ids.length||
    new Set(record.ids).size!==record.ids.length||!Array.isArray(record.sets)||record.sets.length>MAX_SETS||
    !Number.isFinite(record.savedAt)||record.savedAt>now+60000||now-record.savedAt>AGE||
    !record.sets.every(s=>validSet(s,record.ids)))return null;
  return record;
 }catch{return null}
}
function capture(plan,sets,now=Date.now()){
 if(!plan||typeof plan.id!=='string'||!Array.isArray(plan.ids)||!plan.ids.length||plan.ids.length>40||
 new Set(plan.ids).size!==plan.ids.length||!Array.isArray(sets)||sets.length>MAX_SETS||
 !sets.every(s=>validSet(s,plan.ids)))throw Error('Invalid active workout draft');
 return {version:1,planId:plan.id,ids:[...plan.ids],title:String(plan.title||'Workout').slice(0,100),savedAt:now,sets:sets.map(s=>({exerciseId:s.exerciseId,weight:s.weight,reps:s.reps}))};
}
function save(storage,plan,sets,now=Date.now()){
 const payload=JSON.stringify(capture(plan,sets,now));
 storage.setItem(KEY,payload);
 if(storage.getItem(KEY)!==payload)throw Error('Draft storage could not be verified.');
 return true;
}
function resume(storage,plan,now=Date.now()){
 const saved=read(storage,now);
 if(!saved||saved.planId!==plan?.id||
  JSON.stringify(saved.ids)!==JSON.stringify(plan.ids))return null;
 return saved.sets.map(s=>({...s}));
}
function clear(storage,expectedPlanId){
 const current=read(storage);
 if(current&&expectedPlanId&&current.planId!==expectedPlanId)return false;
 storage.removeItem(KEY);return true;
}
return Object.freeze({KEY,read,capture,save,resume,clear});
});