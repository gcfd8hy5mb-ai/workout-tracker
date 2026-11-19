/* MYLIFTCOACH 2.0 read-only cloud acceptance preflight.
 * Does not save, import, alter cloud records, or activate v2 cloud sync.
 * A PostgREST RPC POST below calls ONLY prism_v2_schedule_read() (a SELECT).
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./v2-recurring-schedule.js'):root.MLCV2RecurringSchedule,
  node?require('./v2-schedule-diff.js'):root.MLCV2ScheduleDiff);
 if(node)module.exports=api;else root.MLCV2ReadOnlyPreflight=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(recurring,diff){
 'use strict';
 const ERROR='Acceptance checks incomplete; no records were changed';
 function validSession(session,owner){
  if(!owner||!session?.access_token||session.user?.id!==owner||
   !Number.isFinite(session.expires_at)||session.expires_at<=Math.floor(Date.now()/1000)+60)
   throw Error('Sign in again before running the read-only check');
  return session;
 }
 function inspectLocal(document,validExerciseIds){
  if(!document)throw Error('Activate a complete local repeating schedule before checking cloud readiness');
  recurring.validate(document);
  const allowed=new Set(validExerciseIds||[]);
  if(document.plans.some(p=>!Array.isArray(p.ids)||p.ids.some(id=>!allowed.has(id))))
   throw Error('Local schedule contains an exercise no longer in the approved library');
  return Object.freeze({
   workouts:document.plans.length,
   datedOverrides:Object.keys(document.overrides).length,
   recurringRules:document.recurring.length,
   assignedDays:document.assigned.filter(x=>x!==null).length
  });
 }
 function readResponse(status,data){
  // The RPC may not yet be installed. Its absence is an expected release blocker.
  if(status===401||status===403)throw Error('V2 cloud read is not authorized for this account');
  if(status===404||status===405||status===501||
   data?.code==='PGRST202'||data?.code==='PGRST205')
   return Object.freeze({available:false,reason:'V2 cloud read function is not deployed'});
  if(status<200||status>=300)throw Error('V2 cloud read failed; cloud configuration needs review');
  if(data===null)return Object.freeze({available:true,revision:0,existing:false});
  if(!data||!Number.isSafeInteger(data.revision)||data.revision<1||!recurring.validate(data.document))
   throw Error('V2 cloud response does not contain a verified schedule');
  return Object.freeze({available:true,revision:data.revision,existing:true});
 }
 async function check({owner,session,getSession,verifyUser,readCloud,localDocument,validExerciseIds}){
  const summary=inspectLocal(localDocument,validExerciseIds);
  const original=validSession(session,owner);
  const live=validSession(await getSession(),owner);
  if(live.access_token!==original.access_token)throw Error('Session changed during acceptance check');
  const identity=await verifyUser(original.access_token);
  if(identity?.id!==owner)throw Error('Verified user does not match schedule owner');
  const still=validSession(await getSession(),owner);
  if(still.access_token!==original.access_token)throw Error('Session changed before cloud read');
  const raw=await readCloud(original.access_token);
  const after=validSession(await getSession(),owner);
  if(after.access_token!==original.access_token)throw Error('Account changed while reading cloud schedule');
  const status=readResponse(raw.status,raw.data);
  const comparison=status.available?
   diff.compare({local:localDocument,cloud:status.existing?raw.data.document:null}):null;
  return Object.freeze({owner,summary,...status,comparison,canWrite:false,readOnly:true});
 }
 return Object.freeze({check,inspectLocal,readResponse,ERROR});
});
