/* Pure reference model for an isolated v2 schedule row.
 * NOT a database implementation. No network or Supabase writes.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCV2ScheduleCAS=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function canonical(x){return JSON.stringify(x);}
function validate(d){
 if(!d||d.version!==1||!Array.isArray(d.plans)||!Array.isArray(d.assigned)||d.assigned.length!==7)throw Error('Invalid v2 schedule');
 if(new Set(d.plans.map(p=>p.id)).size!==d.plans.length)throw Error('Duplicate workout');
 const names=new Set(d.plans.map(p=>p.id));
 for(const p of d.plans)if(!p||typeof p.id!=='string'||!p.id||typeof p.title!=='string'||!p.title.trim()||!Array.isArray(p.ids)||!p.ids.length)throw Error('Invalid workout');
 for(const id of d.assigned)if(id!==null&&!names.has(id))throw Error('Unknown assigned workout');
 return true;
}
function create(){
 const rows=new Map(),queue=new Map();
 function read(user){if(!user)throw Error('Authenticated user required');const r=rows.get(user);return r?structuredClone(r):null}
 async function save({authenticatedUser,requestedOwner,expectedRevision,document}){
  if(!authenticatedUser||requestedOwner!==authenticatedUser)throw Error('Account mismatch');
  validate(document);
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('Expected revision required');
  const before=queue.get(authenticatedUser)||Promise.resolve();
  const work=before.catch(()=>{}).then(()=>{
   const current=rows.get(authenticatedUser),rev=current?.revision||0;
   if(rev!==expectedRevision)throw Error('Schedule changed; reload before saving');
   const row={user_id:authenticatedUser,revision:rev+1,document:structuredClone(document)};
   rows.set(authenticatedUser,row);return structuredClone(row);
  });
  queue.set(authenticatedUser,work.catch(()=>{}));
  return work;
 }
 return Object.freeze({read,save});
}
return Object.freeze({create,validate});
});
