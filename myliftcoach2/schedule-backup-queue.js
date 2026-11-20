/* MYLIFTCOACH 2.0 — device-local queue for future custom workout cloud backups.
 * This module performs NO network requests and never grants permission to write
 * into production. The weekly/recurring source stays authoritative on the phone.
 * Queue entries are per-account; guest schedules never enter a cloud queue.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./weekly-schedule.js'):root.MLCWeeklySchedule,
   node?require('./recurring-draft.js'):root.MLCRecurringDraft);
 if(node)module.exports=api;else root.MLCScheduleBackupQueue=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(weekly,recurring){
 'use strict';
 const BASE='mlc2-schedule-backup-pending-v1';
 function key(owner){
  if(owner==null)throw Error('Sign in before preparing cloud backup');
  return weekly.ownerKey(BASE,owner);
 }
 function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 function asDocument(schedule,validIds){
  if(!schedule||!Array.isArray(schedule.plans)||!Array.isArray(schedule.assigned))
   throw Error('Complete workout schedule required before backup');
  const doc={version:1,plans:schedule.plans.map(p=>({...p,ids:p.ids.slice()})),
   assigned:schedule.assigned.slice(),
   overrides:schedule.overrides?{...schedule.overrides}:{},
   recurring:Array.isArray(schedule.recurring)?schedule.recurring.map(r=>({...r})) :[]};
  return recurring.guard(doc,validIds);
 }
 function read(storage,owner,validIds){
  const text=storage.getItem(key(owner));
  if(text===null)return null;
  let data;
  try{data=JSON.parse(text)}catch{throw Error('Pending cloud workout backup is unreadable; original queue preserved');}
  if(!data||data.version!==1||data.owner!==owner||
    !['pending','attempted'].includes(data.status)||
    typeof data.updatedAt!=='string'||!Number.isFinite(Date.parse(data.updatedAt))||
    typeof data.fingerprint!=='string')
   throw Error('Pending cloud backup is incomplete; original queue preserved');
  if(data.status==='pending'&&(data.operationId!==null||data.expectedRevision!==null)||
     data.status==='attempted'&&
     (typeof data.operationId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.operationId)||
      !Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0))
   throw Error('Pending backup operation requires manual recovery; original queue preserved');
  const doc=asDocument(data.document,validIds);
  if(data.fingerprint!==canonical(doc))throw Error('Pending cloud backup changed unexpectedly; queue preserved');
  return Object.freeze({...data,document:doc});
 }
 function stage(storage,owner,schedule,validIds){
  const document=asDocument(schedule,validIds);
  // Match the existing deployed backend payload limit before allocating an
  // outbox entry that a later cloud write could never successfully upload.
  if(canonical(document).length>90000)
   throw Error('Custom workout backup too large for cloud upload; local workout remains saved');
  const prior=read(storage,owner,validIds);
  if(prior?.status==='attempted')
   throw Error('Previous cloud write outcome needs verification; attempted backup preserved');
  const entry={version:1,owner,status:'pending',
   updatedAt:new Date().toISOString(),operationId:null,expectedRevision:null,
   fingerprint:canonical(document),document};
  // A more recent device-local edit supersedes a prior UNATTEMPTED backup.
  // No cloud operation UUID is allocated here and no network action occurs.
  const encoded=JSON.stringify(entry),location=key(owner);
  storage.setItem(location,encoded);
  if(storage.getItem(location)!==encoded)
   throw Error('Pending backup was not stored; local workout schedule remains saved');
  return Object.freeze({queued:true,updatedAt:entry.updatedAt,changed:!prior||prior.fingerprint!==entry.fingerprint});
 }
 function beginAttempt(storage,owner,validIds,expectedRevision,operationId){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
     typeof operationId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId))
   throw Error('Verified cloud revision and unique operation UUID required');
  const existing=read(storage,owner,validIds);
  if(!existing||existing.status!=='pending')
   throw Error('Only an unattempted pending backup can begin uploading');
  const location=key(owner);
  const serialized=JSON.stringify({...existing,status:'attempted',expectedRevision,operationId});
  // The identity must be persisted before any network write is attempted.
  storage.setItem(location,serialized);
  if(storage.getItem(location)!==serialized)
   throw Error('Cloud operation metadata did not persist; network write blocked');
  return read(storage,owner,validIds);
 }
 function finishVerified(storage,owner,validIds,operationId,verifiedDocument){
  const item=read(storage,owner,validIds);
  const location=key(owner);
  if(!item||item.status!=='attempted'||item.operationId!==operationId||
     canonical(item.document)!==canonical(asDocument(verifiedDocument,validIds)))
   throw Error('Cloud backup verification does not match pending operation; preserve local queue');
  const serialized=storage.getItem(location);
  if(!serialized||JSON.parse(serialized).operationId!==operationId||
     JSON.parse(serialized).fingerprint!==item.fingerprint)
   throw Error('Cloud backup queue changed; do not remove pending record');
  storage.removeItem(location);
  if(storage.getItem(location)!==null)
   throw Error('Verified cloud backup could not be cleared from device');
  return Object.freeze({verified:true,cleared:true});
 }
 return Object.freeze({BASE,key,asDocument,read,stage,beginAttempt,finishVerified});
});
