/* Pure simulation of same-owner checkpoint compare + per-owner lock.
 * This is not a real database RPC and cannot establish production readiness.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCCustomGuardSimulation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create(initial={}){
  const stores=new Map(Object.entries(initial).map(([owner,value])=>[owner,{revision:0,value:JSON.parse(JSON.stringify(value))}]));
  const queues=new Map();
  function read(owner){
   if(!owner)throw Error('Authenticated owner required');
   const r=stores.get(owner)||{revision:0,value:null};
   return {owner,revision:r.revision,value:structuredClone(r.value)};
  }
  function save({owner,verifiedOwner,checkpoint,newValue,failAfterValidate=false}){
   if(!owner||owner!==verifiedOwner)return Promise.reject(Error('Authenticated owner mismatch'));
   const prior=queues.get(owner)||Promise.resolve();
   const job=prior.catch(()=>{}).then(()=>{
    const now=read(owner);
    if(now.revision!==checkpoint)throw Error('Revision conflict: reload before saving');
    if(failAfterValidate)throw Error('Simulated transaction rolled back');
    stores.set(owner,{revision:now.revision+1,value:structuredClone(newValue)});
    return read(owner);
   });
   queues.set(owner,job.catch(()=>{}));
   return job;
  }
  return Object.freeze({read,save});
 }
 return Object.freeze({create});
});
