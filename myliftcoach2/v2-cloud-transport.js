/* MYLIFTCOACH 2.0 v2 cloud transport — explicitly GATED/OFF.
 * No production writes. Enable only after approved deployment, independent
 * privilege audit, authenticated Supabase tests, and release acceptance.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./v2-schedule-cas.js'):root.MLCV2ScheduleCAS);
 if(node)module.exports=api;else root.MLCV2CloudTransport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(cas){
'use strict';
const ENABLED=false; // SECURITY RELEASE GATE — do not flip as part of ordinary UI work.
function create({endpoint,publishableKey,getSession,fetcher,enabled=false}){
 if(enabled!==true||ENABLED!==true)throw Error('Live custom workout sync is disabled pending release approval');
 if(typeof getSession!=='function'||typeof fetcher!=='function'||!publishableKey)throw Error('Session and network transport required');
 const url=new URL(endpoint);
 if(url.protocol!=='https:')throw Error('HTTPS endpoint required');
 function currentOwner(session,expected){
  if(!session?.access_token||!session?.user?.id||session.user.id!==expected)throw Error('Authenticated account changed; keep local workout draft');
  return session;
 }
 async function rpc(name,owner,payload){
  const before=currentOwner(await getSession(),owner);
  const response=await fetcher(new URL('/rest/v1/rpc/'+name,url).toString(),{
   method:'POST',cache:'no-store',
   headers:{'apikey':publishableKey,'Authorization':'Bearer '+before.access_token,'Content-Type':'application/json'},
   body:JSON.stringify(payload)
  });
  currentOwner(await getSession(),owner);
  if(!response.ok){
   if(response.status===409||response.status===412)throw Error('Schedule changed on another device; keep local draft and reload');
   throw Error('Workout cloud request failed ('+response.status+'); local draft unchanged');
  }
  const result=await response.json();
  currentOwner(await getSession(),owner);
  return result;
 }
 return Object.freeze({
  async read(owner){
   const result=await rpc('prism_v2_schedule_read',owner,{});
   if(result===null)return Object.freeze({revision:0,document:null});
   if(!result||!Number.isSafeInteger(result.revision)||result.revision<1||!cas.validate(result.document))throw Error('Invalid cloud schedule response');
   return Object.freeze({revision:result.revision,document:result.document});
  },
  async save(owner,expectedRevision,document){
   if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Verified cloud revision required');
   cas.validate(document);
   const result=await rpc('prism_v2_schedule_save',owner,{expected_revision:expectedRevision,new_document:document});
   if(!result||result.revision!==expectedRevision+1||!cas.validate(result.document)||JSON.stringify(result.document)!==JSON.stringify(document))
    throw Error('Cloud save could not be verified; keep local draft');
   return Object.freeze({revision:result.revision,document:result.document});
  }
 });
}
return Object.freeze({ENABLED,create});
});
