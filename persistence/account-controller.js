/* Opt-in account coordinator; no implicit guest claim or production bootstrap. */
(function(root,factory){const node=typeof module==='object';const api=factory(node?require('./storage-model.js'):root.PRISMStorageModel,node?require('./account-sync.js'):root.PRISMAccountSync);if(node)module.exports=api;else root.PRISMAccountController=api;})(globalThis,function(model,sync){
'use strict';
function create({manager,cloud,url,publishableKey,backing,clock=()=>Date.now(),onStatus=()=>{},createTransport=sync.createTransport,initialSnapshot=null}){
 let userId=null,transport=null,busy=false,dirty=0,timer=null,closed=false,cloudEmpty=false;
 const CHECKPOINT='prismAccountCheckpointV1:',ARCHIVE='prismAccountRecoveryV1:';
 const status=(kind,message)=>onStatus({kind,message});
 function checkpoint(){try{const value=JSON.parse(backing.getItem(CHECKPOINT+userId)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
 function saveCheckpoint(rows){backing.setItem(CHECKPOINT+userId,JSON.stringify(rows))}
 function persistVerified(candidate,captured){
  if(!candidate||manager.owner!==userId||JSON.stringify(manager.snapshot())!==JSON.stringify(captured))return false;
  if(manager.storage.getItem('prismActiveWorkoutV1')){status('pending','Cloud changes will appear after your active workout.');return false;}
  const changed=Object.entries(candidate).filter(([key,value])=>{
   const local=manager.storage.getItem(key);
   if(local===null)return true;
   try{return model.canonical(JSON.parse(local))!==model.canonical(JSON.parse(value))}catch{return local!==value}
  });
  if(!changed.length)return false;
  // Preserve the previous account-local snapshot before changing the active mirror.
  backing.setItem(ARCHIVE+userId+':'+clock(),JSON.stringify(captured));
  for(const [key,value] of changed)manager.storage.setItem(key,value);
  status('restored','Your account data is ready. Reload PRISM to view the updates.');
  return true;
 }
 async function connect(){
  const user=await cloud.currentUser();
  if(!user?.id){status('guest','Sign in to enable cloud sync.');return {status:'guest'};}
  if(manager.owner!==user.id)throw Error('The account changed while PRISM was loading. Reload before viewing data.');
  userId=user.id;
  transport=createTransport({url,publishableKey,getSession:async()=>{
   const session=await cloud.getSession();
   return session?.user?.id===userId?session:null;
  }});
  // The onboarding script may create a default profile before async auth completes.
  // Distinguish it from real account data captured before the app started.
  const cloudRows=await transport.read(userId),local=manager.snapshot(),hasLocal=Object.keys(initialSnapshot||local).length>0;
  if(!hasLocal&&cloudRows.length){
   if(!persistVerified(model.restoreSnapshot(cloudRows),local))throw Error('Account changed during restoration');
   saveCheckpoint(cloudRows);
   status('restored','Your account was restored. Reload PRISM to view your data.');
   return {status:'restored'};
  }
  if(!hasLocal&&!cloudRows.length){
   cloudEmpty=true;
   status('claim','This account is empty. Your device data can be moved to it only if you choose to.');
   return {status:'claim'};
  }
  status('syncing','Checking your account data…');
  return flush();
 }
 async function flush(){
  if(closed||!userId||!transport)return {status:'guest'};
  if(busy){dirty++;return {status:'queued'};}
  busy=true;
  try{
   const captured=manager.snapshot(),deletions=manager.deletionLedger(),revision=dirty;
   const result=await sync.migrate({snapshot:captured,owner:manager.owner,userId,transport,checkpoint:checkpoint(),deletions,isCurrent:()=>!closed&&manager.owner===userId});
   if(result.status==='conflict'){
    status('conflict','This device and your cloud account have different changes. Nothing was overwritten.');
    return result;
   }
   saveCheckpoint(result.checkpoint);
   if(result.checkpoint.length)cloudEmpty=false;
   manager.acknowledgeDeletions(deletions);
   persistVerified(result.restoreCandidate,captured);
  status('synced','Saved to your PRISM account.');
   if(dirty!==revision)queue();
   return result;
  }catch(error){status('offline','Cloud sync is unavailable. Your device data is still here.');throw error;}
  finally{busy=false;}
 }
 function queue(){if(!userId||closed)return;dirty++;clearTimeout(timer);timer=setTimeout(()=>flush().catch(()=>{}),1200)}
 function claimGuest(){
  if(!userId||!cloudEmpty)throw Error('An empty verified account is required to move guest data');
  const seeded=initialSnapshot&&Object.keys(initialSnapshot).length===0;
  if(seeded)backing.setItem(ARCHIVE+userId+':'+clock(),JSON.stringify(manager.snapshot()));
  const count=manager.claimGuest({replaceStartupDefaults:seeded});
  status('syncing','Moving your existing PRISM data into this account…');
  queue();return count;
 }
 async function importLegacyBackup(backup){
  if(!userId||!cloudEmpty||!initialSnapshot||Object.keys(initialSnapshot).length)
   throw Error('Existing account changes require review before importing an older backup');
  if(backup?.user_id!==userId)throw Error('The older backup belongs to a different account');
  const source=backup?.backup_data?.localStorage;
  if(!source||typeof source!=='object'||Array.isArray(source))throw Error('Invalid older backup');
  const values=model.capture({getItem:key=>Object.hasOwn(source,key)&&typeof source[key]==='string'?source[key]:null});
  if(!Object.keys(values).length)throw Error('The older backup contains no supported PRISM data');
  await model.normalize(values); // Reject malformed/unsafe data before any local writes.
  if((await transport.read(userId)).length)throw Error('Account data changed; review it before importing the older backup');
  backing.setItem(ARCHIVE+userId+':'+clock(),JSON.stringify(manager.snapshot()));
  manager.install(values,{replaceStartupDefaults:true});
  queue();
  status('syncing','Importing the older backup while keeping its original copy…');
  return Object.keys(values).length;
 }
 function stop(){closed=true;clearTimeout(timer);manager.setOnWrite(null);}
 manager.setOnWrite(queue);
 return Object.freeze({connect,flush,queue,claimGuest,importLegacyBackup,stop,get userId(){return userId;}});
}
return Object.freeze({create});
});
