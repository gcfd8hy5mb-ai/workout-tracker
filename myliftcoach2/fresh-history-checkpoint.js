/* MYLIFTCOACH 2.0 read-only fresh history checkpoint.
 * Read only exact original history source rows, never writes. Never use
 * normalized display/import records as revision-bearing cloud checkpoints.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCFreshHistoryCheckpoint=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TABLES=Object.freeze(['sources','sessions','session_exercises','sets']);
 const SOURCE='workoutHistoryV52';
 function valid(session,owner,expectedToken){
  if(!session?.access_token||session?.user?.id!==owner||
     !Number.isFinite(session.expires_at)||session.expires_at<=Math.floor(Date.now()/1000)+60||
     (expectedToken&&session.access_token!==expectedToken))
   throw Error('Account session changed or expired; no cloud snapshot is trusted');
  return session;
 }
 async function read({endpoint,publishableKey,owner,getSession,verifyUser,fetcher,maxPages=100}={}){
  if(typeof endpoint!=='string'||!/^https:\/\//.test(endpoint)||!publishableKey||!owner||
     typeof getSession!=='function'||typeof verifyUser!=='function'||typeof fetcher!=='function'||
     !Number.isInteger(maxPages)||maxPages<1||maxPages>100)
   throw Error('Verified owner, HTTPS, fetcher and bounded cloud reader required');
  const initial=valid(await getSession(),owner),token=initial.access_token;
  const confirmed=await verifyUser(token);
  if(confirmed?.id!==owner)throw Error('Authenticated cloud identity differs from expected account');
  valid(await getSession(),owner,token);
  const rows=[],identities=new Set();
  for(const table of TABLES){
   let complete=false;
   for(let page=0;page<maxPages;page++){
    valid(await getSession(),owner,token);
    const url=new URL('/rest/v1/prism_account_'+table,endpoint);
    url.searchParams.set('user_id','eq.'+owner);
    url.searchParams.set('source_key','eq.'+SOURCE);
    url.searchParams.set('select','*');
    url.searchParams.set('order','id');
    url.searchParams.set('limit','500');
    url.searchParams.set('offset',String(page*500));
    // The supplied fetcher must enforce its own timeout/abort policy.
    const response=await fetcher(url.toString(),{method:'GET',cache:'no-store',
     headers:{apikey:publishableKey,Authorization:'Bearer '+token,Accept:'application/json'}});
    valid(await getSession(),owner,token);
    if(!response?.ok)throw Error('Fresh history read failed ('+response?.status+'); no rows can be trusted');
    const group=await response.json();
    valid(await getSession(),owner,token);
    if(!Array.isArray(group)||group.length>500)throw Error('Invalid or truncated cloud history page');
    for(const item of group){
     if(item?.user_id!==owner||item?.source_key!==SOURCE||typeof item.id!=='string'||
      !item.id||!Number.isSafeInteger(item.revision)||item.revision<1)
      throw Error('Untrusted cloud history row ownership or revision');
     const key=table+':'+item.id;
     if(identities.has(key))throw Error('Duplicate cloud history row; no checkpoint is trusted');
     identities.add(key);
     rows.push({...item,table});
    }
    if(group.length<500){complete=true;break}
   }
   if(!complete)throw Error('Cloud history pagination exceeded safe limit; partial checkpoint rejected');
  }
  valid(await getSession(),owner,token);
  if(!rows.some(r=>r.table==='sources'))throw Error('Original workout history source missing from cloud; no baseline can be assumed');
  return Object.freeze({owner,sourceKey:SOURCE,rows:Object.freeze(rows),
   readOnly:true,readyForProduction:false,
   message:'Fresh raw cloud snapshot only. No writes, reconciliation or local replacement.'});
 }
 function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
 }
 function fingerprint(rows){
  return canonical(rows.map(row=>({table:row.table,id:row.id,revision:row.revision,
   source_key:row.source_key,position:row.position??null,parent_id:row.parent_id??null,
   slot:row.slot??null,payload:row.payload})).sort((a,b)=>a.table.localeCompare(b.table)||a.id.localeCompare(b.id)));
 }
 async function readStable(input){
  const first=await read(input);
  const second=await read(input);
  if(first.owner!==second.owner||fingerprint(first.rows)!==fingerprint(second.rows))
   throw Error('Original workout history changed during checkpoint reads; reload before reviewing');
  return Object.freeze({...second,stableAcrossTwoReads:true,
   message:'Two authenticated read-only history scans matched. This is not an atomic database snapshot or permission to write.'});
 }
 return Object.freeze({read,readStable,TABLES,SOURCE});
});
