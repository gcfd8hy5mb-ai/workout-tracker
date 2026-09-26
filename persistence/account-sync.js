/* Staging integration seam. Call explicitly after verified auth/ownership; no auto-start. */
(function(root,factory){const node=typeof module==='object';const api=factory(node?require('./storage-model.js'):root.PRISMStorageModel,node?require('./reconcile.js'):root.PRISMReconcile);if(node)module.exports=api;else root.PRISMAccountSync=api;})(globalThis,function(model,reconcile){
'use strict';
function createTransport({url,publishableKey,getSession,fetcher=globalThis.fetch}){
 const base=new URL(url);if(base.protocol!=='https:')throw Error('HTTPS required');
 async function request(path,userId,options={}){
  const session=await getSession();if(!session?.access_token||session?.user?.id!==userId)throw Error('Verified signed-in session required');
  const response=await fetcher(new URL('/rest/v1/'+path,base),{...options,cache:'no-store',headers:{apikey:publishableKey,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',...options.headers}});
  if(!response.ok){const error=new Error('Account synchronization failed ('+response.status+'); local data is unchanged');error.status=response.status;throw error;}
  return response.json();
 }
 return {
  async read(userId){
   if((await getSession())?.user?.id!==userId)throw Error('Account changed');
   const rows=[];
   for(const table of model.TABLES){
    let offset=0;for(;;){
     if((await getSession())?.user?.id!==userId)throw Error('Account changed');
     const page=await request('prism_account_'+table+'?user_id=eq.'+encodeURIComponent(userId)+'&select=*&order=id&limit=500&offset='+offset,userId);
     if(!Array.isArray(page))throw Error('Invalid account response');
     for(const row of page){if(row.user_id!==userId)throw Error('Unexpected account owner');rows.push({...row,table});}
     if(page.length<500)break;offset+=page.length;
    }
   }return rows;
  },
  async write(userId,changes){
   if((await getSession())?.user?.id!==userId)throw Error('Account changed');
   const result=await request('rpc/prism_apply_account_batch',userId,{method:'POST',body:JSON.stringify({changes})});
   if(!Array.isArray(result)||result.some(r=>r.user_id!==userId))throw Error('Unexpected write owner');
   return result;
  }
 };
}
async function migrate({snapshot,owner,userId,transport,checkpoint=[],isCurrent=()=>true}){
 reconcile.assertOwner(owner,userId);
 if(!isCurrent())throw Error('Account changed');
 const local=await model.normalize(snapshot),cloud=await transport.read(userId);
 const plan=reconcile.plan(local,cloud,checkpoint);
 if(!plan.ready)return {status:'conflict',conflicts:plan.conflicts,writes:0};
 if(!isCurrent())throw Error('Account changed');
 // Parent records precede children. Each bounded batch is atomic and verified.
 // An interrupted migration keeps both local fallback and already-verified remote rows; reruns are idempotent.
 for(let offset=0;offset<plan.writes.length;offset+=500){
  if(!isCurrent())throw Error('Account changed');
  const chunk=plan.writes.slice(offset,offset+500),saved=await transport.write(userId,chunk);reconcile.verify(chunk,saved);
 }
 if(!isCurrent())throw Error('Account changed');
 const verified=await transport.read(userId);
 for(const row of plan.writes){const stored=verified.find(r=>r.table===row.table&&r.id===row.id);if(!stored||reconcile.content(stored)!==reconcile.content(row))throw Error('Read-back verification failed; keep local fallback');}
 // Return a restore candidate only. Caller must reconcile live edits and hydrate before app bootstrap.
 // No localStorage/IndexedDB writes and no automatic reloads occur here.
 return {status:'verified',writes:plan.writes.length,checkpoint:verified,restoreCandidate:model.restoreSnapshot(verified)};
}
return Object.freeze({createTransport,migrate});
});
