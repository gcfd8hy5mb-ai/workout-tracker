/* Verify and stage a complete replacement for the 341-exercise original library.
 * Never fabricate entries or erase active schedules. Explicit local preview only.
 * A full source must contain all 341 unique movements and include the known base.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCFullExerciseImport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EXPECTED=341,KEY='mlc2-verified-original-catalog-v1';
 const slug=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90);
 const label=s=>String(s||'').trim().replace(/\s+/g,' ');
 const array=x=>Array.isArray(x)?x.filter(y=>typeof y==='string'&&y.trim()).map(label).slice(0,20):[];
 function unwrap(raw){
  if(Array.isArray(raw))return raw;
  if(raw&&typeof raw==='object'){
   for(const k of ['exercises','exerciseLibrary','catalog','items'])if(Array.isArray(raw[k]))return raw[k];
  }
  throw Error('Original library export must contain an exercise array');
 }
 function prepare(raw,base=[]){
  const rows=unwrap(raw),known=new Map((Array.isArray(base)?base:[]).map(e=>[label(e.name).toLowerCase(),e]));
  if(rows.length!==EXPECTED)throw Error('Expected 341 original exercise records; received '+rows.length+'. Nothing imported.');
  const ids=new Set(),names=new Set(),out=[];
  rows.forEach((item,index)=>{
   if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Invalid exercise record #'+(index+1));
   const name=label(item.name),match=known.get(name.toLowerCase());
   if(name.length<2||name.length>120)throw Error('Invalid name in exercise #'+(index+1));
   const id=match?.id||(typeof item.id==='string'&&/^[a-z0-9][a-z0-9-]{0,99}$/.test(item.id)?item.id:slug(name));
   if(!id||ids.has(id)||names.has(name.toLowerCase()))throw Error('Duplicate/invalid movement at #'+(index+1)+': '+name);
   const muscle=label(item.muscle||item.group||match?.muscle||match?.group);
   if(!muscle||muscle.length>90)throw Error('Missing/invalid muscle group for '+name);
   const photo=typeof item.image==='string'&&/^images\/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp|svg)$/.test(item.image)?item.image:match?.image;
   const how=label(item.how||item.instructions||match?.how||match?.cue||'');
   const equipment=label(item.equipment||match?.equipment||'');
   const candidate={...match,...item,id,name,muscle,group:muscle,
    equipment:equipment||undefined,image:photo||undefined,
    how, cue:how,tips:Array.isArray(item.tips)?array(item.tips):array(match?.tips),
    mistakes:Array.isArray(item.mistakes)?array(item.mistakes):array(match?.mistakes),
    sets:Number.isInteger(item.sets)&&item.sets>0&&item.sets<=12?item.sets:(match?.sets||3),
    reps:typeof item.reps==='string'&&item.reps.length<=40?item.reps:(match?.reps||'8–12')};
   ids.add(id);names.add(name.toLowerCase());out.push(candidate);
  });
  const missing=(Array.isArray(base)?base:[]).filter(e=>!names.has(label(e.name).toLowerCase())&&!ids.has(e.id)).map(e=>e.name);
  if(missing.length)throw Error('The 341 records omit '+missing.length+' known original exercises. First missing: '+missing.slice(0,5).join(', ')+'. Nothing imported.');
  return out;
 }
 function save(storage,catalog,base=[]){
  const verified=prepare(catalog,base),serialized=JSON.stringify({version:1,exercises:verified});
  storage.setItem(KEY,serialized);
  if(storage.getItem(KEY)!==serialized)throw Error('Full catalog could not be verified after local save');
  return verified;
 }
 function load(storage,base=[]){
  const value=storage.getItem(KEY);if(value===null)return null;
  let data;try{data=JSON.parse(value)}catch{throw Error('Saved full catalog is corrupted; original bytes preserved');}
  if(data?.version!==1)throw Error('Unsupported full catalog format; original bytes preserved');
  try{return prepare(data.exercises,base)}catch(error){throw Error('Saved full catalog rejected: '+error.message);}
 }
 return Object.freeze({EXPECTED,KEY,unwrap,prepare,save,load});
});
