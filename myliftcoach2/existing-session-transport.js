/* MYLIFTCOACH 2.0 — existing deployed v1 session RPC transport.
 * Deliberately OFF in the browser. No app imports this module yet.
 * This is a testable adapter to the deployed mlc2_v1_* RPC contract, NOT
 * an authorization to send production writes or overwrite original records.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node);
 if(node)module.exports=api;else root.MLCExistingSessionTransport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(node){
 'use strict';
 const ENABLED=false;
 function create(args){if(!ENABLED)throw Error('Production MLC2 completed-session writes are disabled pending explicit release approval');return build(args)}
 function build({endpoint,publishableKey,getSession,fetcher}={}){
  if(!/^https:\/\//.test(endpoint||'')||!publishableKey||typeof getSession!=='function'||typeof fetcher!=='function')
   throw Error('Authenticated HTTPS session transport required');
  function owner(session,expected,token){
   if(!expected||session?.user?.id!==expected||!session?.access_token||
     !Number.isFinite(session.expires_at)||session.expires_at<=Math.floor(Date.now()/1000)+60||
     (token&&session.access_token!==token))
    throw Error('Account changed or expired; local workout must remain unchanged');
   return session;
  }
  async function rpc(fn,id,params){
   const session=owner(await getSession(),id),token=session.access_token;
   const response=await fetcher(new URL('/rest/v1/rpc/'+fn,endpoint).toString(),{
    method:'POST',cache:'no-store',
    headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify(params)
   });
   owner(await getSession(),id,token);
   if(!response?.ok){
    if(response?.status===409)throw Error('Session changed on another device; keep local workout');
    throw Error('Session cloud RPC failed ('+response?.status+'); keep local workout');
   }
   const data=await response.json();
   owner(await getSession(),id,token);
   return data;
  }
  function validRecord(row,id,recordId){
   if(row===null)return null;
   if(!row||row.owner!==id||row.type!=='session'||row.id!==recordId||
     !Number.isSafeInteger(row.revision)||row.revision<1||
     typeof row.deleted!=='boolean'||!row.payload||typeof row.payload!=='object'||Array.isArray(row.payload))
    throw Error('Invalid or cross-owner cloud session response');
   return row;
  }
  return Object.freeze({
   async read(id,recordId){
    if(typeof recordId!=='string'||!recordId||recordId.length>160)throw Error('Valid session ID required');
    return validRecord(await rpc('mlc2_v1_read',id,{p_type:'session',p_record_id:recordId}),id,recordId);
   },
   async commit(id,{opId,recordId,baseRevision,payload}={}){
    if(typeof opId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(opId)||
       typeof recordId!=='string'||!recordId||recordId.length>160||
       !Number.isSafeInteger(baseRevision)||baseRevision<0||!payload||typeof payload!=='object'||Array.isArray(payload))
     throw Error('Valid immutable operation, session identity, expected revision and payload required');
    const receipt=await rpc('mlc2_v1_commit',id,{p_op_id:opId,p_type:'session',p_record_id:recordId,
     p_base_revision:baseRevision,p_deleted:false,p_payload:payload});
    if(!receipt||receipt.owner!==id||receipt.opId!==opId||receipt.revision!==baseRevision+1||
       typeof receipt.replayed!=='boolean')
     throw Error('Cloud session commit response could not be verified; do not automatically retry');
    return Object.freeze(receipt);
   }
  });
 }
 return Object.freeze({ENABLED,create,...(node?{createTestTransport:build}:{})});
});
