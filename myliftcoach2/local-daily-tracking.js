/* MYLIFTCOACH 2.0 local daily tracking — separate from read-only original import.
 * Original-compatible internal water unit is milliliters; ounces are display/input only.
 * Data is isolated by currently signed-in account or guest, never written to Supabase. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCLocalDailyTracking=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const prefix='mlc2-daily-tracking-v1:';
 const key=owner=>prefix+(typeof owner==='string'&&owner?owner:'guest');
 function validDay(day){if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;const at=new Date(day+'T12:00:00Z');return Number.isFinite(at.getTime())&&at.toISOString().slice(0,10)===day;}
 function empty(){return {version:1,water:[],food:[],weight:[]};}
 function checkRow(type,row){
  if(!row||typeof row.id!=='string'||!row.id||!validDay(row.day))throw Error('Invalid tracking entry');
  if(type==='water'&&(!Number.isInteger(row.amount)||row.amount<=0||row.amount>5000))throw Error('Invalid water entry');
  if(type==='weight'&&(!Number.isFinite(row.value)||row.value<=0||row.value>1500))throw Error('Invalid weight entry');
  if(type==='food'&&(!row.name||typeof row.name!=='string'||row.name.length>140||!Number.isInteger(row.calories)||row.calories<0||row.calories>10000||
   !['protein','carbs','fat'].every(k=>row[k]===null||row[k]===undefined||(Number.isFinite(row[k])&&row[k]>=0&&row[k]<=1000))))throw Error('Invalid food entry');
 }
 function check(doc){if(!doc||doc.version!==1||!['water','food','weight'].every(t=>Array.isArray(doc[t])&&doc[t].length<=3000))throw Error('Invalid local tracking record');
  const ids=new Set();for(const t of ['water','food','weight'])for(const row of doc[t]){checkRow(t,row);if(ids.has(row.id))throw Error('Repeated tracking ID');ids.add(row.id)}
  return doc;
 }
 function read(storage,owner){const raw=storage.getItem(key(owner));if(raw===null)return empty();let doc;
  try{doc=JSON.parse(raw)}catch{throw Error('Stored daily tracking is unreadable; existing data preserved')}
  return check(doc);
 }
 function persist(storage,owner,doc){check(doc);const payload=JSON.stringify(doc),k=key(owner);
  storage.setItem(k,payload);if(storage.getItem(k)!==payload)throw Error('Daily tracking save was not confirmed');return doc;
 }
 function add(storage,owner,type,entry){
  if(!['water','food','weight'].includes(type))throw Error('Unsupported daily tracker');
  const doc=read(storage,owner),row={...entry};checkRow(type,row);
  if(['water','food','weight'].some(k=>doc[k].some(x=>x.id===row.id)))throw Error('Duplicate tracking entry');
  return persist(storage,owner,{...doc,[type]:[row,...doc[type]]});
 }
 function remove(storage,owner,type,id){
  if(!['water','food','weight'].includes(type)||typeof id!=='string')throw Error('Unsupported tracking deletion');
  const doc=read(storage,owner);return persist(storage,owner,{...doc,[type]:doc[type].filter(x=>x.id!==id)});
 }
 function waterMl(amount,unit){
  const value=Number(amount);
  if(!Number.isFinite(value)||value<=0)return null;
  const ml=Math.round(value*(unit==='oz'?29.5735:1));
  return Number.isInteger(ml)&&ml>=1&&ml<=5000?ml:null;
 }
 function summarize(doc,day){check(doc);if(!validDay(day))throw Error('Invalid daily tracking date');
  const water=doc.water.filter(x=>x.day===day),food=doc.food.filter(x=>x.day===day),weight=doc.weight.filter(x=>x.day===day);
  const macros={};for(const key of ['protein','carbs','fat']){const entries=food.filter(x=>x[key]!==null&&x[key]!==undefined);macros[key]={knownEntries:entries.length,total:entries.reduce((n,x)=>n+x[key],0)}}
  return {waterMl:water.reduce((n,x)=>n+x.amount,0),waterCount:water.length,
   foodCount:food.length,calories:food.reduce((n,x)=>n+x.calories,0),macros,
   weight:weight[0]?.value??null,weightCount:weight.length};
 }
 return Object.freeze({key,empty,validDay,check,read,add,remove,waterMl,summarize});
});
