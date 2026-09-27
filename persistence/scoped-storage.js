/* Account-specific local fallback. Never renames, clears or overwrites legacy keys. */
(function(root,factory){const model=typeof module==='object'?require('./storage-model.js'):root.PRISMStorageModel;const api=factory(model);if(typeof module==='object')module.exports=api;else root.PRISMScopedStorage=api;})(globalThis,function(model){
'use strict';
const PREFIX='prismAccountLocalV1:';
const DATA_KEYS=new Set([...Object.keys(model.RULES),'prismEntitlementV1','prismRestEndsAtV1']);
function create(backing){
 let owner=null;
 function qualified(key){return owner&&DATA_KEYS.has(key)?PREFIX+owner+':'+key:key;}
 function visibleKeys(){return [...DATA_KEYS].filter(key=>backing.getItem(qualified(key))!==null);}
 const storage={
  getItem(key){return backing.getItem(qualified(String(key)));},
  setItem(key,value){backing.setItem(qualified(String(key)),String(value));},
  removeItem(key){backing.removeItem(qualified(String(key)));},
  key(index){return visibleKeys()[index]??null;},
  get length(){return visibleKeys().length;}
 };
 function select(userId){
  if(userId!==null&&(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId)))throw Error('Verified account ID required');
  owner=userId;
  return storage;
 }
 function snapshot(){return model.capture(storage);}
 function install(values){
  if(!owner)throw Error('Account must be selected before restore');
  for(const [key,value] of Object.entries(values)){
   if(!Object.hasOwn(model.RULES,key)||typeof value!=='string')throw Error('Unrecognized cloud data');
   const present=storage.getItem(key);
   if(present!==null&&present!==value)throw Error('Local account data differs from cloud for '+key);
  }
  for(const [key,value] of Object.entries(values))storage.setItem(key,value);
 }
 function claimGuest(){
  if(!owner)throw Error('Select a signed-in account first');
  const legacy=model.capture(backing);
  install(legacy); // Conflicts stop before any write; legacy keys are never removed.
  return Object.keys(legacy).length;
 }
 return Object.freeze({storage,select,snapshot,install,claimGuest,get owner(){return owner;}});
}
return Object.freeze({create,DATA_KEYS,PREFIX});
});
