/* MYLIFTCOACH 2.0 — pure legacy custom workout cloud-save preflight.
 * NEVER writes Supabase. Protects original dailyTrackingV1 unrelated fields.
 * Requires a fresh verified cloud snapshot; no automatic live save is enabled.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('../persistence/storage-model.js'):root.PRISMStorageModel,
   node?require('../persistence/reconcile.js'):root.PRISMReconcile,
   node?require('./custom-schedule-copy.js'):root.MLCCustomScheduleCopy);
 if(node)module.exports=api;else root.MLCCustomCloudPreflight=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model,reconcile,copy){
 'use strict';
 const SOURCES=['customWorkoutsV5','dailyTrackingV1'];
 function parseSource(snapshot,key,kind){
  if(!snapshot||typeof snapshot[key]!=='string')throw Error('Original '+key+' must be fully loaded');
  let value;try{value=JSON.parse(snapshot[key])}catch{throw Error('Original '+key+' is not valid JSON')}
  if(kind==='array'?!Array.isArray(value):!value||Array.isArray(value)||typeof value!=='object')throw Error('Invalid original '+key+' format');
  return value;
 }
 function build({owner,verifiedOwner,baseline,latest,originalRows,draft,weekStart,validExerciseIds,selectedDays,token}){
  if(!owner||owner!==verifiedOwner)throw Error('Verified account owner required');
  if(!baseline||!latest)throw Error('Fresh cloud snapshot required');
  for(const key of SOURCES){
   if(typeof baseline[key]!=='string'||baseline[key]!==latest[key])throw Error('Original '+key+' changed on another device; reload');
  }
  const workouts=parseSource(latest,'customWorkoutsV5','array');
  const tracking=parseSource(latest,'dailyTrackingV1','object');
  if(!Array.isArray(draft?.plans)||!Array.isArray(draft?.assigned)||draft.assigned.length!==7)throw Error('Valid edited weekly draft required');
  if(!/^[a-zA-Z0-9_-]{8,120}$/.test(String(token||'')))throw Error('Explicit save operation identifier required');
  const dates=copy.weekDates(weekStart);
  if(dates[0]!==weekStart)throw Error('Week start must be Monday in YYYY-MM-DD format');
  const allowed=new Set(validExerciseIds||[]),used=new Set(workouts.map(w=>String(w.id)));
  const selected=new Set(selectedDays||[]);
  if(selected.size===0||[...selected].some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Explicit selected weekdays required');
  const byId=new Map(draft.plans.map(plan=>[plan.id,plan]));
  if(byId.size!==draft.plans.length)throw Error('Duplicate custom workout draft IDs');
  const appended=new Map();
  const proposed=workouts.map(w=>({...w,exercises:Array.isArray(w.exercises)?w.exercises.slice():w.exercises}));
  const existingOnce=tracking.customSchedule&&typeof tracking.customSchedule==='object'&&!Array.isArray(tracking.customSchedule)?tracking.customSchedule:{};
  const newOnce={...existingOnce};
  const mapping=new Map();
  for(const day of selected){
   const workoutId=draft.assigned[day];
   if(!workoutId)throw Error('Rest day synchronization is unsupported by legacy schedule; no write');
   const plan=byId.get(workoutId);
   if(!plan||typeof plan.title!=='string'||!plan.title.trim()||!Array.isArray(plan.ids)||plan.ids.length<1||plan.ids.length>40||plan.ids.some(id=>!allowed.has(id)))throw Error('Incomplete/invalid selected custom workout');
   if(!plan.id.startsWith('custom-'))throw Error('Only explicit custom workouts can be synced; presets remain untouched');
   const date=dates[day];
   if(Object.hasOwn(existingOnce,date)){
    throw Error('Original date '+date+' is already scheduled; manual conflict review required');
   }
   const signature=model.canonical({title:plan.title,ids:plan.ids});
   if(!mapping.has(signature)){
    const id='mlc2-'+token+'-'+mapping.size;
    if(used.has(id))throw Error('Duplicate original workout identity');
    used.add(id);
    const entry={id,name:plan.title.trim().slice(0,80),exercises:plan.ids.slice()};
    proposed.push(entry);appended.set(id,entry);mapping.set(signature,entry);
   }
   const entry=mapping.get(signature);
   newOnce[date]={name:entry.name,exercises:entry.exercises.slice()};
  }
  // Never modify prior custom workout records, recurrence, or unrelated tracking.
  const outTracking={...tracking,customSchedule:newOnce};
  if(model.canonical(outTracking.customRecurringSchedule)!==model.canonical(tracking.customRecurringSchedule))throw Error('Unexpected recurring schedule change');
  const snapshot={customWorkoutsV5:JSON.stringify(proposed),dailyTrackingV1:JSON.stringify(outTracking)};
  return Object.freeze({owner,sourceKeys:SOURCES.slice(),snapshot,dates,selectedDays:[...selected].sort(),newWorkouts:appended.size,readyForProduction:false});
 }
 async function validateRows({prepared,originalRows}){
  if(!prepared||!Array.isArray(originalRows))throw Error('Cloud preflight rows required');
  const selected=originalRows.filter(r=>prepared.sourceKeys.includes(r.source_key));
  const snap=model.restoreSnapshot(selected);
  if(typeof snap.customWorkoutsV5!=='string'||typeof snap.dailyTrackingV1!=='string')throw Error('Incomplete original cloud sources');
  const fresh=await model.normalize({customWorkoutsV5:snap.customWorkoutsV5,dailyTrackingV1:snap.dailyTrackingV1});
  if(fresh.length!==selected.length)throw Error('Cloud sources were incomplete');
  const known=new Map(selected.map(r=>[r.table+':'+r.id,r]));
  if(known.size!==selected.length)throw Error('Duplicate cloud rows');
  for(const r of fresh){
   const old=known.get(r.table+':'+r.id);
   if(!old||reconcile.content(old)!==reconcile.content(r)||!Number.isSafeInteger(old.revision)||old.revision<1)throw Error('Cloud snapshot drift/corruption; do not save');
  }
  const candidate=await model.normalize(prepared.snapshot);
  const proposed=reconcile.plan(candidate,selected,selected);
  if(!proposed.ready)throw Error('Cloud save conflict');
  if(proposed.writes.length>500)throw Error('Changes exceed one atomic legacy batch');
  const roundtrip=model.restoreSnapshot(candidate);
  for(const key of prepared.sourceKeys)if(model.canonical(JSON.parse(roundtrip[key]))!==model.canonical(JSON.parse(prepared.snapshot[key])))throw Error('Cloud serialization failed');
  return Object.freeze({writes:proposed.writes.length,addedRows:proposed.writes.filter(r=>r.expected_revision===0).length,
    changedRows:proposed.writes.filter(r=>r.expected_revision>0).length,readyForProduction:false});
 }
 return Object.freeze({build,validateRows});
});
