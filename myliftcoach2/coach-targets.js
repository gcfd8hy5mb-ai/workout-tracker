/* Restored original manual overload targets, isolated from live PRISM storage.
 * No server calls, workout-plan mutations or silently applied weight changes.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachTargets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='mlc2-coach-manual-targets-v1:';
 const idOk=id=>typeof id==='string'&&id.length>=1&&id.length<=128&&!/[\u0000-\u001f]/.test(id);
 const ownerOk=owner=>typeof owner==='string'&&owner.length>=1&&owner.length<=160&&!/[\u0000-\u001f]/.test(owner);
 const weightOk=w=>typeof w==='number'&&Number.isFinite(w)&&w>0&&w<=1000&&Math.round(w*4)===w*4;
 function key(owner){if(!ownerOk(owner))throw Error('Invalid Coach target owner');return PREFIX+owner;}
 function parse(raw,owner){
  if(raw===null)return {version:1,owner,targets:Object.create(null)};
  let data;try{data=JSON.parse(raw)}catch{throw Error('Saved Coach targets cannot be read; nothing overwritten')}
  if(!data||data.version!==1||data.owner!==owner||!data.targets||
   typeof data.targets!=='object'||Array.isArray(data.targets))throw Error('Saved Coach targets need recovery');
  const targets=Object.create(null),items=Object.entries(data.targets);
  if(items.length>500)throw Error('Too many saved Coach targets');
  for(const [id,w] of items){
   if(!idOk(id)||!weightOk(w))throw Error('Invalid saved Coach target; nothing overwritten');
   targets[id]=w;
  }
  return {version:1,owner,targets};
 }
 function read(store,owner){
  if(!store||typeof store.getItem!=='function')throw Error('Coach target storage unavailable');
  const data=parse(store.getItem(key(owner)),owner);
  return Object.freeze({...data,targets:Object.freeze(data.targets)});
 }
 function save(store,owner,id,weight){
  if(!idOk(id)||!weightOk(weight))throw Error('Use a valid weight from 0.25 to 1000 lb, in 0.25 lb increments');
  if(!store||typeof store.setItem!=='function')throw Error('Coach target storage unavailable');
  const before=read(store,owner);
  const next={version:1,owner,targets:{...before.targets,[id]:weight}};
  store.setItem(key(owner),JSON.stringify(next));
  if(store.getItem(key(owner))!==JSON.stringify(next))throw Error('Coach target save could not be verified');
  return weight;
 }
 function clear(store,owner,id){
  if(!idOk(id))throw Error('Invalid exercise ID');
  if(!store||typeof store.setItem!=='function')throw Error('Coach target storage unavailable');
  const before=read(store,owner);
  const targets={...before.targets};delete targets[id];
  const next={version:1,owner,targets};
  store.setItem(key(owner),JSON.stringify(next));
  if(store.getItem(key(owner))!==JSON.stringify(next))throw Error('Coach target clear could not be verified');
  return true;
 }
 function get(store,owner,id){return idOk(id)?read(store,owner).targets[id]??null:null}
 return Object.freeze({read,get,save,clear,key});
});
