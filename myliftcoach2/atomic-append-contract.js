/* Proposed atomic append contract — in-memory simulation only.
 * Never calls production Supabase. The production RPC must independently enforce
 * auth.uid(), owner-wide serialization, compare-and-insert in ONE transaction,
 * duplicate prevention, and complete read-back validation.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCAtomicAppendContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function fingerprint(sessions){
  if(!Array.isArray(sessions))throw Error('Session list required');
  const ids=sessions.map(s=>String(s?.id??''));
  if(ids.some(id=>!id)||new Set(ids).size!==ids.length)throw Error('Session identifiers must be unique');
  return ids.slice().sort().join('\u001f');
 }
 function prepare({userId,session,baseline}){
  if(!userId||!session||!Array.isArray(baseline))throw Error('Authenticated owner, session, baseline required');
  const id=String(session.id||'');
  if(!id||baseline.some(s=>String(s.id)===id))throw Error('Duplicate session identifier');
  return Object.freeze({userId,session,expectedFingerprint:fingerprint(baseline)});
 }
 function createFakeAtomicStore(initial=[]){
  let history=initial.slice(),queue=Promise.resolve(),writes=0;
  function append({userId,authenticatedUser,session,expectedFingerprint}){
   const run=async()=>{
    if(!authenticatedUser||userId!==authenticatedUser)throw Error('Authenticated owner mismatch');
    if(fingerprint(history)!==expectedFingerprint)throw Error('Stale history; do not append');
    if(history.some(s=>String(s.id)===String(session.id)))throw Error('Duplicate session');
    history=[session,...history];writes++;
    return {history:history.slice(),writes};
   };
   // In-memory mutex imitates serial execution, NOT a claim about existing legacy RPC.
   const p=queue.then(run);queue=p.then(()=>{},()=>{});return p;
  }
  return Object.freeze({append,read:()=>history.slice(),stats:()=>({writes})});
 }
 return Object.freeze({fingerprint,prepare,createFakeAtomicStore});
});
