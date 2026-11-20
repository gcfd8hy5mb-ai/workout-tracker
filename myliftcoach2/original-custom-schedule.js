/* Read-only original custom workouts and date-specific assignment previews.
 * Distinguishes one-time dates from bounded/unbounded weekly repeats.
 * Never creates, updates or deletes Supabase records.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('../persistence/storage-model.js'):root.PRISMStorageModel);
 if(node)module.exports=api;else root.MLCOriginalCustomSchedule=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(model){
 'use strict';
 const SOURCES=[{key:'customWorkoutsV5',tables:['sources','workouts','workout_exercises']},{key:'dailyTrackingV1',tables:['sources','tracking','tracking_entries','tracking_maps']}];
 function dayKey(date){
  if(typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)){
   if(new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid day');
   return date;
  }
  const d=date instanceof Date?date:new Date(date);
  if(!Number.isFinite(d.getTime()))throw Error('Invalid day');
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 }
 function normalize(custom,tracking,validExerciseIds){
  if(!Array.isArray(custom))throw Error('Unexpected custom workout format');
  if(!tracking||typeof tracking!=='object'||Array.isArray(tracking))throw Error('Unexpected original tracking format');
  const valid=new Set(validExerciseIds);
  const plans=custom.map((w,index)=>{
   if(!w||typeof w.name!=='string'||!Array.isArray(w.exercises))return null;
   const ids=w.exercises.filter(id=>typeof id==='string'&&valid.has(id));
   if(ids.length!==w.exercises.length||ids.length===0||ids.length>40)return null;
   return {id:'original-custom-'+index,title:w.name.trim().slice(0,80),kind:'Imported custom',description:'Read-only original workout',ids:ids.slice(),originalName:w.name,originalIds:w.exercises.slice()};
  }).filter(p=>p&&p.title);
  const find=entry=>plans.find(p=>p.originalName===entry?.name&&JSON.stringify(p.originalIds)===JSON.stringify(entry?.exercises))||null;
  const once=tracking.customSchedule&&typeof tracking.customSchedule==='object'&&!Array.isArray(tracking.customSchedule)?tracking.customSchedule:{};
  const recurring=Array.isArray(tracking.customRecurringSchedule)?tracking.customRecurringSchedule:[];
  return {plans,once,recurring,find};
 }
 function resolve(data,date){
  const day=dayKey(date),entry=data.once[day];
  if(entry){
   const plan=data.find(entry);
   return {day,plan,kind:plan?'one-time':'unmatched',hasSchedule:true};
  }
  const today=Date.parse(day+'T00:00:00Z');
  const matches=data.recurring.filter(r=>{
   if(!r||typeof r.start!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.start)||r.start>day||r.end&&r.end<day)return false;
   const diff=(today-Date.parse(r.start+'T00:00:00Z'))/86400000;
   return Number.isInteger(diff)&&diff>=0&&diff%7===0;
  }).sort((a,b)=>b.start.localeCompare(a.start));
  if(matches.length){
   const plan=data.find(matches[0]);
   return {day,plan,kind:plan?'recurring':'unmatched',hasSchedule:true};
  }
  return {day,plan:null,kind:'none',hasSchedule:false};
 }
 async function load({endpoint,publishableKey,accessToken,userId,fetcher=fetch,maxPages=100,validExerciseIds=[]}){
  if(!model?.restoreSnapshot||!/^https:\/\//.test(endpoint||'')||!publishableKey||!accessToken||!userId)throw Error('Verified account required');
  const result={};
  for(const {key,tables} of SOURCES){
   const rows=[];
   for(const table of tables){
    for(let page=0;page<maxPages;page++){
     const url=new URL('/rest/v1/prism_account_'+table,endpoint);
     for(const [k,v] of [['user_id','eq.'+userId],['source_key','eq.'+key],['select','*'],['order','id'],['limit','500'],['offset',String(page*500)]])url.searchParams.set(k,v);
     const response=await fetcher(url.toString(),{method:'GET',cache:'no-store',headers:{apikey:publishableKey,Authorization:'Bearer '+accessToken,Accept:'application/json'}});
     if(!response.ok)throw Error('Original schedule read failed ('+response.status+')');
     const batch=await response.json();if(!Array.isArray(batch))throw Error('Unexpected original schedule response');
     for(const row of batch){if(row?.user_id!==userId||row?.source_key!==key)throw Error('Original schedule ownership mismatch');rows.push({...row,table});}
     if(batch.length<500)break;
     if(page===maxPages-1)throw Error('Original schedule preview limit reached');
    }
   }
   if(rows.length){
    const raw=model.restoreSnapshot(rows)[key];
    if(typeof raw!=='string')throw Error('Incomplete original schedule snapshot');
    result[key]=JSON.parse(raw);
   }
  }
  return normalize(result.customWorkoutsV5||[],result.dailyTrackingV1||{},validExerciseIds);
 }
 return Object.freeze({normalize,resolve,dayKey,load});
});
