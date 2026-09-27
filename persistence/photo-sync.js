/* Opt-in photo transport: private Storage for bytes, owner-scoped metadata for references. */
(function(root,factory){const node=typeof module==='object';const api=factory(node?require('./photo-scope.js'):root.PRISMPhotoScope);if(node)module.exports=api;else root.PRISMPhotoSync=api;})(globalThis,function(scope){
'use strict';
const BUCKET='prism-account-photos';
const DATABASES=['workoutTrackerPhotosV1','prismProgressPhotosDB'];
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
async function digest(value,cryptoAPI=globalThis.crypto){
 if(!cryptoAPI?.subtle)throw Error('Secure context required for photo backup');
 return hex(await cryptoAPI.subtle.digest('SHA-256',value));
}
function photoBlob(record){
 const value=record.blob??record.data;
 if(value&&typeof value.arrayBuffer==='function')return value;
 if(typeof value==='string'&&/^data:image\/(?:jpeg|png|webp);base64,/.test(value)){
  const [header,encoded]=value.split(',');
  const bytes=Uint8Array.from(atob(encoded),character=>character.charCodeAt(0));
  return new Blob([bytes],{type:header.slice(5,-7)});
 }
 throw Error('Unsupported local photo encoding; original photo is unchanged');
}
function indexedStores(indexedDBAPI=globalThis.indexedDB,userId){
 function open(database,owner){return new Promise((resolve,reject)=>{
  if(!indexedDBAPI) {reject(Error('Photo storage is unavailable'));return;}
  const name=scope.databaseName(database,owner),request=indexedDBAPI.open(name,1);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('photos')){
    const store=db.createObjectStore('photos',{keyPath:'id'});
    if(database==='prismProgressPhotosDB')for(const key of ['date','phaseId','view'])store.createIndex(key,key);
   }
  };
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });}
 function access(database,owner){return {
  all:async()=>{const db=await open(database,owner);try{return await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readonly'),r=tx.objectStore('photos').getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}finally{db.close()}},
  put:async record=>{const db=await open(database,owner);try{await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close()}},
  remove:async id=>{const db=await open(database,owner);try{await new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close()}}
 }};
 return {guest:database=>access(database,null),account:database=>access(database,userId)};
}
function create({url,publishableKey,userId,getSession,fetcher=globalThis.fetch,stores=indexedStores(globalThis.indexedDB,userId),cryptoAPI=globalThis.crypto,backing=globalThis.localStorage}){
 const base=new URL(url);if(base.protocol!=='https:')throw Error('HTTPS required');
 const deletionKey='prismAccountPhotoDeletesV1:'+userId;
 function pending(){try{const value=JSON.parse(backing?.getItem(deletionKey)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
 function markDeleted(database,id){
  if(!DATABASES.includes(database))throw Error('Unknown photo database');
  const entries=pending();if(!entries.some(entry=>entry.database===database&&String(entry.id)===String(id))){
   entries.push({database,id:String(id)});backing.setItem(deletionKey,JSON.stringify(entries));
  }
 }
 async function session(){const token=await getSession();if(token?.user?.id!==userId||!token.access_token)throw Error('Verified photo account required');return token;}
 async function request(path,{method='GET',body,headers={}}={}){
  const token=await session();
  const response=await fetcher(new URL(path,base),{method,body,cache:'no-store',headers:{apikey:publishableKey,Authorization:'Bearer '+token.access_token,...headers}});
  if(!response.ok){const error=new Error('Private photo transfer failed ('+response.status+'); local photos were kept');error.status=response.status;throw error}
  return response;
 }
 async function remoteRows(){
  const out=[];
  for(let offset=0;;offset+=500){
   const response=await request('/rest/v1/prism_account_photos?user_id=eq.'+encodeURIComponent(userId)+'&select=*&order=id&limit=500&offset='+offset);
   const rows=await response.json();if(!Array.isArray(rows)||rows.some(row=>row.user_id!==userId))throw Error('Unexpected photo owner');
   out.push(...rows);if(rows.length<500)return out;
  }
 }
 async function identity(database,record){return digest(new TextEncoder().encode(database+':'+record.id),cryptoAPI)}
 async function prepare(database,record){
  if(!record||typeof record.id!=='string'&&typeof record.id!=='number')throw Error('Photo ID is missing');
  const blob=photoBlob(record),mime=blob.type||'image/jpeg';
  if(!['image/jpeg','image/png','image/webp'].includes(mime)||blob.size<1||blob.size>10485760)throw Error('Photo must be JPEG, PNG or WebP under 10 MiB');
  const sha=await digest(await blob.arrayBuffer(),cryptoAPI),id=await identity(database,record);
  const extension=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
  const objectPath=userId+'/'+database+'/'+sha+'.'+extension;
  const metadata={mime};for(const key of ['day','date','weight','view','phaseId','createdAt'])if(record[key]!==undefined)metadata[key]=record[key];
  return {blob,row:{user_id:userId,id,legacy_database:database,legacy_id:String(record.id),metadata,object_path:objectPath,sha256:sha,byte_size:blob.size}};
 }
 async function downloadAndVerify(row){
  const response=await request('/storage/v1/object/authenticated/'+BUCKET+'/'+row.object_path);
  const blob=await response.blob(),hash=await digest(await blob.arrayBuffer(),cryptoAPI);
  if(hash!==row.sha256||blob.size!==Number(row.byte_size))throw Error('Private photo integrity check failed');
  return new Blob([blob],{type:row.metadata?.mime||blob.type||'image/jpeg'});
 }
 async function push(){
  const existing=new Map((await remoteRows()).map(row=>[row.id,row]));let uploaded=0;
  for(const entry of pending()){
   await session();const id=await identity(entry.database,entry),remote=existing.get(id);
   if(remote&&!remote.deleted_at){
    await request('/rest/v1/prism_account_photos?user_id=eq.'+encodeURIComponent(userId)+'&id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({deleted_at:new Date().toISOString()}),headers:{'Content-Type':'application/json',Prefer:'return=representation'}});
    const verified=(await remoteRows()).find(row=>row.id===id);
    if(!verified?.deleted_at)throw Error('Photo deletion was not verified; device copy remains isolated');
    existing.set(id,verified);
   }
  }
  for(const database of DATABASES)for(const record of await stores.account(database).all()){
   await session();
   const {blob,row}=await prepare(database,record),remote=existing.get(row.id);
   if(remote){if(remote.deleted_at)continue;if(remote.sha256!==row.sha256||remote.object_path!==row.object_path)throw Error('Photo changed on another device; nothing was overwritten');continue;}
   try{await request('/storage/v1/object/'+BUCKET+'/'+row.object_path,{method:'POST',body:blob,headers:{'Content-Type':row.metadata.mime,'x-upsert':'false'}})}
   catch(error){if(error.status!==409)throw error;await downloadAndVerify(row)}
   const response=await request('/rest/v1/prism_account_photos?on_conflict=user_id,id',{method:'POST',body:JSON.stringify(row),headers:{'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation'}});
   const inserted=await response.json();
   if(Array.isArray(inserted)&&inserted.length&&inserted.some(item=>item.user_id!==userId||item.sha256!==row.sha256))throw Error('Photo metadata was not verified');
   const verified=(await remoteRows()).find(item=>item.id===row.id);
   if(!verified||verified.sha256!==row.sha256||verified.object_path!==row.object_path)throw Error('Photo metadata read-back failed');
   existing.set(row.id,verified);uploaded++;
  }
  return uploaded;
 }
 async function restore(){
  let restored=0;
  for(const row of await remoteRows()){
   if(row.deleted_at){
    const store=stores.account(row.legacy_database);
    const local=(await store.all()).find(record=>String(record.id)===row.legacy_id);
    if(local)await store.remove(local.id);
    continue;
   }
   if(pending().some(entry=>entry.database===row.legacy_database&&entry.id===row.legacy_id))continue;
   if(!DATABASES.includes(row.legacy_database)||!new RegExp('^'+userId+'/'+row.legacy_database+'/[0-9a-f]{64}\\.(?:jpg|png|webp)$').test(row.object_path))throw Error('Unexpected private photo reference');
   const store=stores.account(row.legacy_database),local=(await store.all()).find(record=>String(record.id)===row.legacy_id);
   if(local){const prepared=await prepare(row.legacy_database,local);if(prepared.row.sha256!==row.sha256)throw Error('Local and cloud photos differ; no photo was overwritten');continue;}
   const blob=await downloadAndVerify(row);await session();
   const record={...row.metadata,id:row.legacy_id};delete record.mime;
   if(row.legacy_database==='workoutTrackerPhotosV1')record.data=blob;else record.blob=blob;
   await store.put(record);restored++;
  }
  return restored;
 }
 async function claimGuest(){
  let copied=0;
  for(const database of DATABASES){
   const account=stores.account(database);
   for(const record of await stores.guest(database).all()){
    await session();
    const local=(await account.all()).find(item=>String(item.id)===String(record.id));
    if(local){
     const a=await prepare(database,local),b=await prepare(database,record);
     if(a.row.sha256!==b.row.sha256)throw Error('Guest and account photos differ; neither was overwritten');
    }else{await account.put(record);copied++;}
   }
  }
  await push();return copied;
 }
 async function guestCount(){let total=0;for(const database of DATABASES)total+=(await stores.guest(database).all()).length;return total;}
 return Object.freeze({push,restore,claimGuest,guestCount,markDeleted,remoteRows});
}
return Object.freeze({create,indexedStores,photoBlob,digest});
});
