/* MYLIFTCOACH 2.0 read-only schedule comparison.
 * No writes, merges, or selection of a winning device.
 * Detects divergent local/remote plans, assignments and repeat rules.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./v2-recurring-schedule.js'):root.MLCV2RecurringSchedule);
 if(node)module.exports=api;else root.MLCV2ScheduleDiff=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(schedule){
 'use strict';
 function canonical(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 }
 function compare({local,cloud}={}){
  schedule.validate(local);
  if(cloud===null){
   return Object.freeze({state:'cloud-empty',same:false,localPlans:local.plans.length,cloudPlans:0,
    localOnly:local.plans.length,cloudOnly:0,changedPlans:0,changedDays:0,
    changedOverrides:Object.keys(local.overrides).length,recurringChanged:local.recurring.length>0,
    blocked:true,message:'No 2.0 cloud schedule exists yet. Keep the local schedule until an explicit first-save workflow is approved.'});
  }
  schedule.validate(cloud);
  const original=canonical(local),remote=canonical(cloud),same=original===remote;
  const localPlans=new Map(local.plans.map(p=>[p.id,p]));
  const cloudPlans=new Map(cloud.plans.map(p=>[p.id,p]));
  let localOnly=0,cloudOnly=0,changedPlans=0,changedDays=0,changedOverrides=0;
  for(const [id,p] of localPlans){if(!cloudPlans.has(id))localOnly++;else if(canonical(p)!==canonical(cloudPlans.get(id)))changedPlans++}
  for(const id of cloudPlans.keys())if(!localPlans.has(id))cloudOnly++;
  for(let i=0;i<7;i++)if(local.assigned[i]!==cloud.assigned[i])changedDays++;
  const a=local.overrides,b=cloud.overrides;
  for(const day of new Set([...Object.keys(a),...Object.keys(b)])){
   if(!Object.hasOwn(a,day)||!Object.hasOwn(b,day)||a[day]!==b[day])changedOverrides++;
  }
  const recurringChanged=canonical(local.recurring)!==canonical(cloud.recurring);
  return Object.freeze({state:same?'same':'different',same,localPlans:local.plans.length,cloudPlans:cloud.plans.length,
   localOnly,cloudOnly,changedPlans,changedDays,changedOverrides,recurringChanged,
   blocked:!same,message:same?'Local and cloud schedules match. This is read-only verification, not authorization to save.':
    'Device and cloud schedules differ. Preserve both and review before any cloud write.'});
 }
 return Object.freeze({compare});
});
