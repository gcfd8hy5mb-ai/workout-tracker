/* Complete, non-destructive migration preview from original custom workout dates.
 * Retains weekly rules and one-time exceptions (not just a seven-day sample).
 * No network, no original writes, no automatic production cloud save.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./original-custom-schedule.js'):root.MLCOriginalCustomSchedule);
 if(node)module.exports=api;else root.MLCV2RecurringSchedule=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(legacy){
'use strict';
function day(s){
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Invalid schedule date');
 try{return legacy.dayKey(s)}catch{throw Error('Invalid schedule date')}
}
function dateStamp(s){return Date.parse(day(s)+'T00:00:00Z')}
function clone(x){return JSON.parse(JSON.stringify(x))}
function migrate({original,weekly,validExerciseIds=[]}){
 if(!original||!Array.isArray(original.plans)||typeof original.find!=='function')throw Error('Original account schedule must be verified');
 if(!weekly||!Array.isArray(weekly.plans)||!Array.isArray(weekly.assigned)||weekly.assigned.length!==7)throw Error('Editable weekly schedule required');
 const allowed=new Set(validExerciseIds);
 const plans=weekly.plans.map(p=>({...p,ids:p.ids.slice()}));
 const used=new Set(plans.map(p=>p.id)),mapping=new Map();
 for(const p of original.plans){
  if(!p?.ids?.length||p.ids.some(id=>!allowed.has(id)))throw Error('Unavailable original workout exercises');
  const id='custom-import-'+p.id.replace(/[^a-zA-Z0-9-]/g,'');
  if(used.has(id))throw Error('Imported workout already exists; review before overwriting');
  used.add(id);mapping.set(p.id,id);
  plans.push({id,title:p.title,kind:'Custom',description:'Imported original workout',ids:p.ids.slice()});
 }
 const lookup=entry=>{
  const match=original.find(entry);
  if(!match||!mapping.has(match.id))throw Error('Original assignment no longer matches a custom workout');
  return mapping.get(match.id);
 };
 const overrides={};
 for(const [key,value] of Object.entries(original.once||{})){
  const date=day(key);overrides[date]=lookup(value);
 }
 const recurring=[];
 for(const rule of original.recurring||[]){
  if(!rule||typeof rule!=='object')throw Error('Invalid original weekly repeat');
  const start=day(rule.start),end=rule.end==null?null:day(rule.end);
  if(end!==null&&dateStamp(end)<dateStamp(start))throw Error('Weekly repeat ends before start date');
  if(rule.weeks!=null&&(!Number.isInteger(rule.weeks)||rule.weeks<1||rule.weeks>520))throw Error('Unsupported repeat duration');
  recurring.push({start,end,workoutId:lookup(rule),...(rule.weeks==null?{}:{weeks:rule.weeks})});
 }
 // Existing weekly assignments remain as the fallback; exact dates and
 // original start/end/repeat rules override them at resolution time.
 const document={version:1,plans,assigned:weekly.assigned.slice(),overrides,recurring};
 validate(document);
 return Object.freeze({document,summary:{workouts:original.plans.length,oneTime:Object.keys(overrides).length,recurring:recurring.length},readyForCloudWrite:false});
}
function validate(doc){
 if(!doc||doc.version!==1||!Array.isArray(doc.plans)||!Array.isArray(doc.assigned)||doc.assigned.length!==7)throw Error('Invalid weekly document');
 const ids=new Set();
 for(const p of doc.plans){
  if(!p||typeof p.id!=='string'||!p.id||ids.has(p.id)||!Array.isArray(p.ids)||!p.ids.length)throw Error('Invalid or duplicated workout');
  ids.add(p.id);
 }
 if(doc.assigned.some(id=>id!==null&&!ids.has(id)))throw Error('Unknown default workout');
 if(!doc.overrides||Array.isArray(doc.overrides)||typeof doc.overrides!=='object')throw Error('Invalid dated overrides');
 if(!Array.isArray(doc.recurring))throw Error('Invalid recurring rules');
 for(const [d,id] of Object.entries(doc.overrides))if(day(d)!==d||!ids.has(id))throw Error('Unmatched dated workout');
 for(const rule of doc.recurring){
  if(!rule||!ids.has(rule.workoutId))throw Error('Unmatched recurring workout');
  if(day(rule.start)!==rule.start)throw Error('Invalid start');
  if(rule.end!==null&&rule.end!==undefined&&(day(rule.end)!==rule.end||dateStamp(rule.end)<dateStamp(rule.start)))throw Error('Invalid repeat end');
  if(rule.weeks!==undefined&&(!Number.isInteger(rule.weeks)||rule.weeks<1||rule.weeks>520))throw Error('Invalid repeat weeks');
 }
 return true;
}
function resolve(doc,when){
 validate(doc);
 const date=typeof when==='string'?day(when):legacy.dayKey(when);
 let workoutId=null,source='weekly';
 if(Object.prototype.hasOwnProperty.call(doc.overrides,date)){
  workoutId=doc.overrides[date];source='one-time';
 }else{
  const stamp=dateStamp(date);
  const matches=doc.recurring.filter(r=>{
   const start=dateStamp(r.start),end=r.end==null?Infinity:dateStamp(r.end);
   return stamp>=start&&stamp<=end&&(stamp-start)%604800000===0;
  }).sort((a,b)=>b.start.localeCompare(a.start));
  if(matches.length){workoutId=matches[0].workoutId;source='recurring'}
  else{const d=new Date(date+'T12:00:00Z');workoutId=doc.assigned[(d.getUTCDay()+6)%7]}
 }
 const plan=workoutId===null?null:doc.plans.find(p=>p.id===workoutId);
 if(workoutId!==null&&!plan)throw Error('Assigned workout missing');
 return {date,plan,source};
}
return Object.freeze({migrate,validate,resolve});
});
