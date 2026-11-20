/* Append-only backup for completed workouts in the isolated 2.0 account store. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCSessionHistorySync=api;
})(globalThis,function(){
 'use strict';
 const prefix='mlc2-history-';
 function payload(entry){
  if(!entry||typeof entry.id!=='string'||!/^[\w-]{1,140}$/.test(entry.id)||
    typeof entry.title!=='string'||!entry.title.trim()||!Number.isFinite(Date.parse(entry.created))||
    !Array.isArray(entry.sets)||!entry.sets.length||
    !entry.sets.every(s=>s&&typeof s.exerciseId==='string'&&s.exerciseId&&
      Number.isFinite(s.weight)&&s.weight>=0&&Number.isSafeInteger(s.reps)&&s.reps>0))
   throw Error('A completed workout has invalid data');
  const copy=JSON.parse(JSON.stringify(entry));
  if(JSON.stringify(copy).length>90000)throw Error('A completed workout exceeds the cloud size limit');
  return copy;
 }
 function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  return JSON.stringify(value);
 }
 function same(a,b){return canonical(a)===canonical(b)}
 async function operationId(cryptoAPI,owner,id){
  const input=new TextEncoder().encode('mlc2-history-v1:'+JSON.stringify([owner,id]));
  const bytes=new Uint8Array(await cryptoAPI.subtle.digest('SHA-256',input)).slice(0,16);
  bytes[6]=(bytes[6]&15)|128;
  bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
 }
 function matches(row,owner,entry){
  return row?.owner===owner&&row.type==='session'&&row.id===prefix+entry.id&&row.revision===1&&
   row.deleted===false&&row.payload?.format==='mlc2-completed-workout-v1'&&same(row.payload.workout,entry);
 }
 async function sync({owner,entries,inventory,transport,cryptoAPI,assertCurrent}){
  const remote=new Map(),workouts=[];
  for(const row of inventory){
   assertCurrent();
   if(row.owner!==owner)throw Error('Unexpected cloud record owner');
   if(!row.id.startsWith(prefix))continue;
   if(remote.has(row.id))throw Error('Repeated cloud workout ID');
   remote.set(row.id,row);
   if(row.deleted)continue;
   const entry=payload(row.payload?.workout);
   if(!matches(row,owner,entry))throw Error('Unexpected cloud workout format or revision');
   workouts.push(entry);
  }
  const pending=[];
  for(const item of entries){
   const entry=payload(item),recordId=prefix+entry.id;
   if(!remote.has(recordId))pending.push({entry,recordId});
   else if(!matches(remote.get(recordId),owner,entry))throw Error('Cloud workout conflicts with local history. Both copies were preserved.');
  }
  // Stable record and operation IDs make an interrupted upload replayable across devices.
  for(const {entry,recordId} of pending){
   const opId=await operationId(cryptoAPI,owner,recordId);
   assertCurrent();
   try{
    await transport.commit(owner,{opId,recordId,baseRevision:0,
     payload:{format:'mlc2-completed-workout-v1',workout:entry}});
   }catch(error){
    // A transport failure can arrive after the server commits, or after another device wins.
    assertCurrent();
    if(!matches(await transport.read(owner,recordId),owner,entry))throw error;
    continue;
   }
   assertCurrent();
   if(!matches(await transport.read(owner,recordId),owner,entry))
    throw Error('Cloud workout could not be verified. Local history was preserved.');
  }
  assertCurrent();
  return {uploaded:pending.length,workouts};
 }
 function merge(current,recovered){
  const byId=new Map(current.map(item=>[item.id,item]));
  for(const entry of recovered){
   if(byId.has(entry.id)&&!same(byId.get(entry.id),entry))
    throw Error('Recovered workout conflicts with current local history');
   byId.set(entry.id,byId.get(entry.id)||entry);
  }
  return [...byId.values()].sort((a,b)=>Date.parse(b.created)-Date.parse(a.created));
 }
 return Object.freeze({sync,merge});
});
