/* Pure, explicit copy of existing custom workouts into a local-only editable weekly draft.
 * No network, no legacy mutation, and no claim to migrate all recurring exceptions.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./weekly-schedule.js'):root.MLCWeeklySchedule,node?require('./original-custom-schedule.js'):root.MLCOriginalCustomSchedule);
 if(node)module.exports=api;else root.MLCCustomScheduleCopy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(weeklyAPI,legacyAPI){
 'use strict';
 function weekDates(referenceDate){
  const day=legacyAPI.dayKey(referenceDate);
  const start=new Date(day+'T12:00:00Z'),weekday=(start.getUTCDay()+6)%7;
  start.setUTCDate(start.getUTCDate()-weekday);
  return Array.from({length:7},(_,i)=>{
   const d=new Date(start);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);
  });
 }
 function prepare({original,existing,referenceDate=new Date(),validExerciseIds=[]}){
  if(!original||!Array.isArray(original.plans)||typeof original.find!=='function')throw Error('Verified original custom schedule required');
  if(!existing||!Array.isArray(existing.plans)||!Array.isArray(existing.assigned)||existing.assigned.length!==7)throw Error('Valid editable draft required');
  const ids=new Set(validExerciseIds),plans=existing.plans.map(p=>({...p,ids:p.ids.slice()})),mapping=new Map();
  for(const plan of original.plans){
   if(!plan.ids.length||plan.ids.some(id=>!ids.has(id)))throw Error('Original custom plan has unavailable exercises');
   const newId='custom-import-'+plan.id.replace(/[^a-zA-Z0-9-]/g,'');
   if(plans.some(p=>p.id===newId)){
    // This is a deliberate no-overwrite rule: never quietly replace a previously edited copy.
    throw Error('An imported custom draft already exists; review it instead of overwriting');
   }
   plans.push({id:newId,title:plan.title,kind:'Custom',description:'Copied from original account · local preview',ids:plan.ids.slice()});
   mapping.set(plan.id,newId);
  }
  const dates=weekDates(referenceDate),assigned=existing.assigned.slice(),unmatched=[];
  for(let i=0;i<dates.length;i++){
   const chosen=legacyAPI.resolve(original,dates[i]);
   if(!chosen.hasSchedule)continue;
   if(!chosen.plan){unmatched.push(dates[i]);continue}
   const id=mapping.get(chosen.plan.id);
   if(!id)throw Error('Original assignment not present in copied workouts');
   assigned[i]=id;
  }
  if(unmatched.length)throw Error('Some original dated assignments cannot be matched: '+unmatched.join(', '));
  return Object.freeze({
   draft:{plans,assigned},
   dates,
   copiedCount:original.plans.length,
   currentWeekOnly:true,
   readyForCloudWrite:false
  });
 }
 return Object.freeze({prepare,weekDates});
});
