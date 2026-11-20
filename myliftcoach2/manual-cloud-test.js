/* Explicitly confirmed, one-way MYLIFTCOACH 2.0 test-workout upload.
 * Existing isolated mlc2_private.records only; never touches legacy PRISM.
 * A journal survives uncertain response and NEVER triggers an automatic retry.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCManualCloudTest=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const prefix='mlc2-confirmed-test-v1:';
 const canon=value=>value&&typeof value==='object'?
  Array.isArray(value)?'['+value.map(canon).join(',')+']':
  '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canon(value[k])).join(',')+'}':JSON.stringify(value);
 function validateOwner(owner){if(!/^[a-f0-9-]{36}$/i.test(owner||''))throw Error('Verified account required')}
 function validSession(session,owner,token){
  if(!session?.access_token||session.user?.id!==owner||
     !Number.isFinite(session.expires_at)||session.expires_at<=Math.floor(Date.now()/1000)+60||
     token&&session.access_token!==token)throw Error('Account session changed; cloud test stopped');
  return session;
 }
 function journalKey(owner){validateOwner(owner);return prefix+owner+':pending'}
 function lastKey(owner){validateOwner(owner);return prefix+owner+':last'}
 function getPending(storage,owner){
  const raw=storage.getItem(journalKey(owner));if(!raw)return null;
  let data;try{data=JSON.parse(raw)}catch{throw Error('Unclear previous cloud test operation; preserve local storage')}
  if(data.owner!==owner||!/^mlc2-test-[0-9a-f-]+$/i.test(data.recordId)||
     !/^[0-9a-f-]{36}$/i.test(data.opId)||!data.payload||typeof data.payload!=='object')
   throw Error('Invalid pending cloud test journal; no write allowed');
  return data;
 }
 function remoteMatches(row,owner,recordId,payload){
  if(!row||row.owner!==owner||row.type!=='session'||row.id!==recordId||
    row.deleted!==false||row.revision!==1||canon(row.payload)!==canon(payload))
   throw Error('Cloud test record differs from saved local evidence; stop and review');
 }
 async function run({owner,session,verifyUser,fetcher,storage,endpoint,publishableKey,
  workout,cryptoAPI,confirmWrite=false}={}){
  validateOwner(owner);
  if(typeof verifyUser!=='function'||typeof fetcher!=='function'||!storage||
     typeof cryptoAPI?.randomUUID!=='function'||!/^https:\/\//.test(endpoint||'')||!publishableKey)
   throw Error('Secure account-scoped test transport required');
  const initial=validSession(await session(),owner),token=initial.access_token;
  const user=await verifyUser(token);
  if(user?.id!==owner)throw Error('Cloud account identity could not be verified');
  validSession(await session(),owner,token);
  async function rpc(name,params){
   validSession(await session(),owner,token);
   const response=await fetcher(new URL('/rest/v1/rpc/'+name,endpoint).toString(),{
    method:'POST',cache:'no-store',
    headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify(params)
   });
   validSession(await session(),owner,token);
   if(!response?.ok)throw Error('Cloud '+name+' failed ('+response?.status+'); no automatic retry');
   const result=await response.json();
   validSession(await session(),owner,token);
   return result;
  }
  const previous=getPending(storage,owner);
  if(previous){
   // No commit here. An ambiguous prior upload is resolved by reading only.
   const remote=await rpc('mlc2_v1_read',{p_type:'session',p_record_id:previous.recordId});
   if(remote===null)throw Error('Previous test upload has uncertain outcome. No new write or retry was sent.');
   remoteMatches(remote,owner,previous.recordId,previous.payload);
   storage.setItem(lastKey(owner),previous.recordId);
   storage.removeItem(journalKey(owner));
   return Object.freeze({status:'verified-pending',recordId:previous.recordId,revision:1});
  }
  if(!confirmWrite)throw Error('Explicit confirmation required before cloud test upload');
  if(!workout||typeof workout.id!=='string'||!Array.isArray(workout.sets)||!workout.sets.length||
     !workout.sets.every(x=>x&&typeof x.exerciseId==='string'&&Number.isFinite(Number(x.reps))&&Number.isFinite(Number(x.weight))))
   throw Error('Complete a local workout with recorded sets before testing cloud upload');
  // Submit only an isolated test copy; never write under an original workout ID.
  const recordId='mlc2-test-'+cryptoAPI.randomUUID(),opId=cryptoAPI.randomUUID();
  const payload={...workout,id:recordId,sourceLocalId:workout.id,cloudTest:true};
  if(JSON.stringify(payload).length>90000)throw Error('Test workout is too large to upload');
  const exists=await rpc('mlc2_v1_read',{p_type:'session',p_record_id:recordId});
  if(exists!==null)throw Error('Test record ID already exists: no overwrite was attempted');
  const pending={owner,recordId,opId,payload};
  storage.setItem(journalKey(owner),JSON.stringify(pending));
  if(storage.getItem(journalKey(owner))!==JSON.stringify(pending))
   throw Error('Cannot protect pending upload operation: no cloud write was sent');
  // No automatic retries regardless of network outcome.
  const receipt=await rpc('mlc2_v1_commit',{p_op_id:opId,p_type:'session',
    p_record_id:recordId,p_base_revision:0,p_deleted:false,p_payload:payload});
  if(!receipt||receipt.owner!==owner||receipt.opId!==opId||receipt.revision!==1||
    typeof receipt.replayed!=='boolean')throw Error('Cloud receipt uncertain; use read-only pending verification');
  const remote=await rpc('mlc2_v1_read',{p_type:'session',p_record_id:recordId});
  remoteMatches(remote,owner,recordId,payload);
  storage.setItem(lastKey(owner),recordId);
  storage.removeItem(journalKey(owner));
  return Object.freeze({status:'uploaded-verified',recordId,revision:1,sets:workout.sets.length});
 }
 return Object.freeze({run,getPending,journalKey,lastKey});
});
