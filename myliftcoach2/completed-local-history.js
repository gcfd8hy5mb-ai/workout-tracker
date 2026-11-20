/* MYLIFTCOACH 2.0 completed local workout retention.
 * Never silently truncate previously recorded workouts to an arbitrary count.
 * Each completed workout receives a collision-resistant stable identifier.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCompletedLocalHistory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function validEntries(entries){
  if(!Array.isArray(entries))throw Error('Saved local workout history must be an array');
  const ids=new Set();
  for(const entry of entries){
   if(!entry||typeof entry.id!=='string'||!entry.id||
    !Array.isArray(entry.sets)||ids.has(entry.id))
    throw Error('Saved local history has a missing or duplicate workout identifier');
   ids.add(entry.id);
  }
  return entries;
 }
 function read(storage,key){
  const value=storage.getItem(key);
  if(value===null)return [];
  let rows;try{rows=JSON.parse(value)}catch{throw Error('Stored workout history is corrupted; original data was preserved')}
  return validEntries(rows);
 }
 function append(storage,key,history,entry){
  validEntries(history);
  if(!entry||typeof entry.id!=='string'||!Array.isArray(entry.sets)||!entry.sets.length)
   throw Error('Completed workout with a unique identifier and sets required');
  if(history.some(x=>x.id===entry.id))throw Error('Duplicate completed workout identifier');
  // Refuse to replace data changed in a second tab before this write.
  const latest=read(storage,key);
  if(JSON.stringify(latest)!==JSON.stringify(history))
   throw Error('Local history changed in another tab; reload before saving');
  const candidate=[entry,...history],serialized=JSON.stringify(candidate);
  storage.setItem(key,serialized);
  if(storage.getItem(key)!==serialized)throw Error('Workout storage verification failed; retry only after reviewing history');
  return candidate;
 }
 function newId(cryptoAPI,now=Date.now()){
  if(!Number.isSafeInteger(now)||now<0||typeof cryptoAPI?.randomUUID!=='function')
   throw Error('Secure workout ID generator unavailable; session draft remains protected');
  return 'demo-'+now+'-'+cryptoAPI.randomUUID();
 }
 return Object.freeze({read,append,newId});
});
