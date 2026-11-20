/* MYLIFTCOACH 2.0 — existing Supabase backup for custom schedules.
 * Owner-authenticated custom-plan writes are enabled only in the isolated
 * 2.0 development app and only through a verified save coordinator.
 * Never touches original PRISM records, sessions or unrelated custom plans.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./v2-recurring-schedule.js'):root.MLCV2RecurringSchedule,node);
 if(node)module.exports=api;else root.MLCExistingScheduleBackup=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(schedule,node){
'use strict';
const ENABLED=true; // Scoped to the 2.0 development UI; never auto-writes without signed-in owner.
const RECORD_ID='mlc2-recurring-schedule-v1';
function canonical(x){
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function create(args){if(!ENABLED)throw Error('Custom workout backup not enabled');return build(args)}
function createReadOnly(args){
 const transport=build(args);
 // Only the read capability can be reached from the browser. The write gate
 // remains false even when an authenticated user inspects an existing backup.
 return Object.freeze({read:owner=>transport.read(owner)});
}
function build({endpoint,publishableKey,getSession,fetcher}={}){
 if(!/^https:\/\//.test(endpoint||'')||!publishableKey||
    typeof getSession!=='function'||typeof fetcher!=='function')
  throw Error('Authenticated HTTPS schedule transport required');
 function verified(session,expected,token){
  if(typeof expected!=='string'||!expected||!session?.access_token||
     session.user?.id!==expected||!Number.isFinite(session.expires_at)||
     session.expires_at<=Math.floor(Date.now()/1000)+60||
     (token&&token!==session.access_token))
   throw Error('Account changed or expired; local custom workout preserved');
  return session;
 }
 async function rpc(fn,owner,body){
  const session=verified(await getSession(),owner),token=session.access_token;
  const res=await fetcher(new URL('/rest/v1/rpc/'+fn,endpoint).toString(),{
   method:'POST',cache:'no-store',
   headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify(body)
  });
  verified(await getSession(),owner,token);
  if(!res?.ok){
   if(res?.status===409)throw Error('Cloud schedule changed; preserve local version and review before saving');
   throw Error('Schedule backup request failed ('+res?.status+'); original workout unchanged');
  }
  const result=await res.json();
  verified(await getSession(),owner,token);
  return result;
 }
 return Object.freeze({
  async read(owner){
   const row=await rpc('mlc2_v1_read',owner,{p_type:'custom-plan',p_record_id:RECORD_ID});
   if(row===null)return Object.freeze({revision:0,document:null});
   if(row?.owner!==owner||row.type!=='custom-plan'||row.id!==RECORD_ID||
      !Number.isSafeInteger(row.revision)||row.revision<1||typeof row.deleted!=='boolean')
    throw Error('Invalid or cross-account cloud workout backup response');
   if(row.deleted)throw Error('Cloud schedule backup was deleted; manual recovery required');
   const doc=row.payload?.document;
   schedule.validate(doc);
   return Object.freeze({revision:row.revision,document:doc});
  },
  async save(owner,expectedRevision,doc,opId){
   if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||
      typeof opId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opId))
    throw Error('Verified revision and immutable operation UUID required');
   schedule.validate(doc);
   const serialized=canonical(doc);
   if(serialized.length>90000)throw Error('Workout schedule backup exceeds safe size limit');
   const receipt=await rpc('mlc2_v1_commit',owner,{
    p_op_id:opId,p_type:'custom-plan',p_record_id:RECORD_ID,
    p_base_revision:expectedRevision,p_deleted:false,p_payload:{document:doc}
   });
   if(receipt?.owner!==owner||receipt.opId!==opId||
      receipt.revision!==expectedRevision+1||typeof receipt.replayed!=='boolean')
    throw Error('Schedule save receipt invalid; do not automatically retry');
   // An acknowledged write is not complete until independently read back.
   let saved;
   try{saved=await this.read(owner)}catch{
    throw Error('Schedule write outcome uncertain; do not generate a new operation ID or retry automatically');
   }
   if(saved.revision!==receipt.revision||canonical(saved.document)!==serialized)
    throw Error('Cloud schedule read-back differs; retain local draft for recovery');
   return Object.freeze({revision:saved.revision,document:saved.document,replayed:receipt.replayed});
  }
 });
}
return Object.freeze({ENABLED,RECORD_ID,create,createReadOnly,...(node?{createTestTransport:build}:{})});
});
