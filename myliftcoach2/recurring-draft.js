/* Validated account-scoped local-only recurring workout document.
 * No Supabase access. Atomic single-document save avoids schedule split brain.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./weekly-schedule.js'):root.MLCWeeklySchedule,node?require('./v2-recurring-schedule.js'):root.MLCV2RecurringSchedule);
 if(node)module.exports=api;else root.MLCRecurringDraft=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(weekly,recurring){
 'use strict';
 function guard(doc,validIds){
  recurring.validate(doc);
  if(!Array.isArray(validIds))throw Error('Available exercises required');
  const allowed=new Set(validIds);
  for(const p of doc.plans){
   if(!p.ids.length||p.ids.length>40||p.ids.some(id=>!allowed.has(id)))throw Error('Recurring document contains unavailable exercises');
  }
  return doc;
 }
 function read(storage,base,owner,validIds){
  const key=weekly.ownerKey(base,owner);
  const data=storage.getItem(key);
  if(data===null)return null;
  let parsed;
  try{parsed=JSON.parse(data)}catch{throw Error('Saved recurring schedule is unreadable; keep original record')}
  if(!parsed||parsed.version!==1||!Object.hasOwn(parsed,'overrides')||!Array.isArray(parsed.recurring))throw Error('Incomplete recurring schedule; do not replace with presets');
  return guard(parsed,validIds);
 }
 function commit(storage,base,owner,doc,validIds){
  guard(doc,validIds);
  const key=weekly.ownerKey(base,owner),serialized=JSON.stringify(doc);
  storage.setItem(key,serialized);
  if(storage.getItem(key)!==serialized)throw Error('Recurring schedule did not save');
  return doc;
 }
 function edited(document,candidate,validIds){
  if(!document)throw Error('Active recurring schedule required');
  const next={...document,plans:candidate.plans.map(p=>({...p,ids:p.ids.slice()})),assigned:candidate.assigned.slice()};
  return guard(next,validIds);
 }
 function restoreDate(doc,date,validIds){
  guard(doc,validIds);
  if(typeof date!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||
     !Object.prototype.hasOwnProperty.call(doc.overrides,date))
   throw Error('Dated workout exception not found');
  const overrides={...doc.overrides};
  delete overrides[date];
  return guard({...doc,overrides},validIds);
 }
 return Object.freeze({read,commit,edited,restoreDate,guard});
});
