/* Account-specific local fallback. Never renames, clears or overwrites legacy keys. */
(function(root,factory){const model=typeof module==='object'?require('./storage-model.js'):root.PRISMStorageModel;const api=factory(model);if(typeof module==='object')module.exports=api;else root.PRISMScopedStorage=api;})(globalThis,function(model){
'use strict';
const PREFIX='prismAccountLocalV1:';
const DELETIONS='prismAccountDeletionsV1:';
const DATA_KEYS=new Set([...Object.keys(model.RULES),'prismEntitlementV1','prismRestEndsAtV1']);
function create(backing){
 let owner=null,stale=false;
 let onWrite=null;
 function qualified(key){return owner&&DATA_KEYS.has(key)?PREFIX+owner+':'+key:key;}
 function visibleKeys(){return [...DATA_KEYS].filter(key=>backing.getItem(qualified(key))!==null);}
 function flushCommittedSets(key,value){
  if(key!=='setHistoryV5'||!owner||typeof globalThis.PRISMAccountLiveFlush!=='function')return;
  try{
   const sets=JSON.parse(value);
   if(!sets||typeof sets!=='object'||!Object.values(sets).some(set=>set&&set.done===true))return;
   // Complete Set is a user commit point. Start the verified cloud round-trip now;
   // do not depend solely on a timer that iOS may suspend on a tab/app switch.
   Promise.resolve().then(()=>globalThis.PRISMAccountLiveFlush()).catch(()=>{});
  }catch{}
 }
 const storage={
  getItem(key){return backing.getItem(qualified(String(key)));},
  setItem(key,value){key=String(key);value=String(value);if(stale&&owner&&DATA_KEYS.has(key))throw Error('Account data changed in another tab. Refresh PRISM before saving.');backing.setItem(qualified(key),value);if(owner&&DATA_KEYS.has(key)){onWrite?.(key);flushCommittedSets(key,value);}},
  removeItem(key){key=String(key);if(stale&&owner&&DATA_KEYS.has(key))throw Error('Account data changed in another tab. Refresh PRISM before saving.');if(owner&&Object.hasOwn(model.RULES,key))recordDeletion(key);backing.removeItem(qualified(key));if(owner&&DATA_KEYS.has(key))onWrite?.(key);},
  key(index){return visibleKeys()[index]??null;},
  get length(){return visibleKeys().length;}
 };
 function select(userId){
  if(userId!==null&&(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId)))throw Error('Verified account ID required');
  owner=userId;
  stale=false;
  return storage;
 }
 function snapshot(){return model.capture(storage);}
 function deletionLedger(){
  if(!owner)return {};
  try{const value=JSON.parse(backing.getItem(DELETIONS+owner)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}
 }
 function recordDeletion(key){
  if(stale&&owner)throw Error('Account data changed in another tab. Refresh PRISM before deleting.');
  if(!owner||!Object.hasOwn(model.RULES,key))return;
  const previous=storage.getItem(key);
  if(previous===null)return;
  const ledger=deletionLedger();
  if(!Object.hasOwn(ledger,key)){
   ledger[key]=previous;backing.setItem(DELETIONS+owner,JSON.stringify(ledger));
  }
  onWrite?.(key);
 }
 function acknowledgeDeletions(sent){
  const ledger=deletionLedger();
  for(const [key,previous] of Object.entries(sent))if(ledger[key]===previous)delete ledger[key];
  if(owner)backing.setItem(DELETIONS+owner,JSON.stringify(ledger));
 }
 function install(values,{replaceStartupDefaults=false}={}){
  if(!owner)throw Error('Account must be selected before restore');
  for(const [key,value] of Object.entries(values)){
   if(!Object.hasOwn(model.RULES,key)||typeof value!=='string')throw Error('Unrecognized cloud data');
   const present=storage.getItem(key);
   if(!replaceStartupDefaults&&present!==null&&present!==value)throw Error('Local account data differs from cloud for '+key);
  }
  for(const [key,value] of Object.entries(values))storage.setItem(key,value);
 }
 function claimGuest({replaceStartupDefaults=false}={}){
  if(!owner)throw Error('Select a signed-in account first');
  const legacy=model.capture(backing);
  install(legacy,{replaceStartupDefaults});
  return Object.keys(legacy).length;
 }
 return Object.freeze({storage,select,snapshot,install,claimGuest,recordDeletion,deletionLedger,acknowledgeDeletions,setOnWrite(callback){onWrite=callback;},invalidate(){stale=true;onWrite=null;},get stale(){return stale;},get owner(){return owner;}});
}
return Object.freeze({create,DATA_KEYS,PREFIX});
});