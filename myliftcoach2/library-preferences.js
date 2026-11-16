/* Local exercise library preferences; no schedule or production writes.
 * Account scoped and fail-closed, preserving existing bytes on read failure. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCLibraryPrefs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const prefix='mlc2-library-prefs-v1:';
 const key=owner=>prefix+(typeof owner==='string'&&owner?owner:'guest');
 const cleanId=id=>typeof id==='string'&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(id);
 const blank=()=>({version:1,favorites:[],recent:[]});
 function validate(doc,allowed){
  if(!doc||doc.version!==1||!Array.isArray(doc.favorites)||!Array.isArray(doc.recent)||doc.favorites.length>200||doc.recent.length>20)throw Error('Invalid library preferences');
  const permissible=new Set((Array.isArray(allowed)?allowed:[]).filter(cleanId));
  for(const k of ['favorites','recent']){
   if(new Set(doc[k]).size!==doc[k].length||doc[k].some(id=>!cleanId(id)||!permissible.has(id)))throw Error('Invalid library movement');
  }
  return doc;
 }
 function read(store,owner,allowed){
  let raw;
  try{raw=store.getItem(key(owner))}catch{throw Error('Cannot read local library preferences')}
  if(raw===null)return blank();
  try{return validate(JSON.parse(raw),allowed)}catch{throw Error('Local library preferences could not be read; saved data preserved')}
 }
 function write(store,owner,data,allowed){
  const body=JSON.stringify(validate(data,allowed)),id=key(owner);
  store.setItem(id,body);
  if(store.getItem(id)!==body)throw Error('Library favorites save could not be confirmed');
  return data;
 }
 function toggle(store,owner,exerciseId,allowed){
  if(!cleanId(exerciseId)||!allowed.includes(exerciseId))throw Error('Unknown exercise');
  const data=read(store,owner,allowed),favorites=data.favorites.includes(exerciseId)?
   data.favorites.filter(id=>id!==exerciseId):[exerciseId,...data.favorites].slice(0,200);
  return write(store,owner,{...data,favorites},allowed);
 }
 function viewed(store,owner,exerciseId,allowed){
  if(!cleanId(exerciseId)||!allowed.includes(exerciseId))throw Error('Unknown exercise');
  const data=read(store,owner,allowed);
  return write(store,owner,{...data,recent:[exerciseId,...data.recent.filter(id=>id!==exerciseId)].slice(0,12)},allowed);
 }
 return Object.freeze({key,blank,validate,read,toggle,viewed});
});
