/* Read-only authenticated inspection of the already deployed MLC2 v1
 * session RPC. Never writes, imports, deletes, or replaces local history.
 * Public RPC response fields are treated as untrusted until owner validated.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCExistingCloudSessions=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function validSession(session,owner,token){
  if(!session?.access_token||!session?.user?.id||session.user.id!==owner||
   !Number.isFinite(session.expires_at)||session.expires_at<=Math.floor(Date.now()/1000)+60||
   (token&&session.access_token!==token))
   throw Error('Sign in again: account session changed during cloud read');
  return session;
 }
 async function inspect({endpoint,publishableKey,owner,getSession,verifyUser,fetcher,maxPages=100}={}){
  if(!/^https:\/\//.test(endpoint||'')||!publishableKey||!owner||
   typeof getSession!=='function'||typeof verifyUser!=='function'||
   typeof fetcher!=='function'||!Number.isInteger(maxPages)||maxPages<1||maxPages>100)
   throw Error('Authenticated, bounded read-only cloud inspection required');
  const session=validSession(await getSession(),owner),token=session.access_token;
  const user=await verifyUser(token);
  if(user?.id!==owner)throw Error('Cloud identity verification failed');
  validSession(await getSession(),owner,token);
  const records=[],seen=new Set();let after='',complete=false,deleted=0;
  for(let page=0;page<maxPages;page++){
   validSession(await getSession(),owner,token);
   const url=new URL('/rest/v1/rpc/mlc2_v1_list_sessions',endpoint);
   const response=await fetcher(url.toString(),{
    method:'POST',cache:'no-store',
    headers:{apikey:publishableKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({p_after_id:after,p_limit:100})
   });
   validSession(await getSession(),owner,token);
   if(!response?.ok)throw Error('Existing 2.0 cloud session read failed ('+response?.status+'); no data changed');
   const rows=await response.json();
   validSession(await getSession(),owner,token);
   if(!Array.isArray(rows)||rows.length>100)throw Error('Unexpected cloud sessions page');
   for(const row of rows){
    if(!row||row.owner!==owner||row.type!=='session'||typeof row.id!=='string'||
      !row.id||row.id.length>160||row.id<=after||seen.has(row.id)||
      !Number.isSafeInteger(row.revision)||row.revision<1||
      typeof row.deleted!=='boolean'||!row.payload||
      typeof row.payload!=='object'||Array.isArray(row.payload))
     throw Error('Untrusted cloud session ownership, revision or identity');
    if(records.length&&row.id<=records[records.length-1].id)
     throw Error('Cloud session list is out of order');
    seen.add(row.id);records.push(Object.freeze({...row}));
    if(row.deleted)deleted++;
   }
   if(rows.length<100){complete=true;break}
   const last=rows.at(-1).id;
   if(last<=after)throw Error('Cloud session cursor did not advance');
   after=last;
  }
  validSession(await getSession(),owner,token);
  if(!complete)throw Error('Cloud session pagination limit reached; incomplete inventory rejected');
  return Object.freeze({owner,readOnly:true,complete:true,total:records.length,
   active:records.length-deleted,deleted,records:Object.freeze(records),
   canWrite:false,message:'Existing MLC2 cloud sessions inspected read-only. No local records were replaced.'});
 }
 return Object.freeze({inspect});
});
