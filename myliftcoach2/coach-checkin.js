/* Owner-isolated weekly Coach check-in, adapted from original Coach v1.
 * User-entered context only. Never infers medical recovery or edits schedules.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachCheckin=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PREFIX='mlc2-coach-checkin-v1:';
 const ownerValid=x=>typeof x==='string'&&x.length>0&&x.length<=160;
 function key(owner){if(!ownerValid(owner))throw Error('Invalid check-in owner');return PREFIX+owner;}
 function week(value=Date.now()){
  const date=new Date(value);if(!Number.isFinite(date.getTime()))throw Error('Invalid check-in date');
  const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);
 }
 function valid(row){
  return row&&/^\d{4}-\d{2}-\d{2}$/.test(row.week||'')&&
   ['poor','good','great'].includes(row.recovery)&&
   ['low','normal','high'].includes(row.energy)&&
   ['easy','right','hard'].includes(row.difficulty)&&
   Number.isInteger(row.days)&&row.days>=1&&row.days<=7&&
   typeof row.limitations==='string'&&row.limitations.length<=300&&
   Number.isFinite(Date.parse(row.updatedAt||''));
 }
 function read(store,owner){
  if(!store||typeof store.getItem!=='function')throw Error('Check-in storage unavailable');
  const raw=store.getItem(key(owner));if(raw===null)return Object.freeze([]);
  let parsed;try{parsed=JSON.parse(raw)}catch{throw Error('Check-in history needs recovery; nothing overwritten')}
  if(!parsed||parsed.version!==1||parsed.owner!==owner||!Array.isArray(parsed.rows)||
   parsed.rows.length>26||!parsed.rows.every(valid)||new Set(parsed.rows.map(x=>x.week)).size!==parsed.rows.length)
   throw Error('Saved check-in history needs recovery; nothing overwritten');
  return Object.freeze(parsed.rows.map(x=>Object.freeze({...x})));
 }
 function current(store,owner,now=Date.now()){
  const w=week(now);return read(store,owner).find(x=>x.week===w)||null;
 }
 function save(store,owner,values,now=Date.now()){
  const row={week:week(now),recovery:values?.recovery,energy:values?.energy,difficulty:values?.difficulty,
   days:Number(values?.days),limitations:String(values?.limitations||'').trim().slice(0,300),
   updatedAt:new Date(now).toISOString()};
  if(!valid(row))throw Error('Complete the Coach check-in choices and choose 1–7 days');
  const old=read(store,owner),rows=[row,...old.filter(x=>x.week!==row.week)].slice(0,26);
  const payload=JSON.stringify({version:1,owner,rows});
  store.setItem(key(owner),payload);
  if(store.getItem(key(owner))!==payload)throw Error('Check-in save verification failed');
  return Object.freeze(row);
 }
 function signal(row){
  if(!valid(row))return Object.freeze({status:'missing',load:'unknown',reason:'No weekly check-in recorded'});
  let load='normal',reason='Your weekly check-in does not indicate a need for conservative progression.';
  if(row.recovery==='poor'||row.energy==='low'||row.difficulty==='hard'){
   load='conservative';reason='Your recorded recovery, energy or training difficulty favors a cautious approach.';
  }else if(row.recovery==='great'&&row.energy==='high'&&row.difficulty==='easy'){
   load='progressive';reason='Your check-in reports high energy and easy training; progression still requires workout evidence.';
  }
  return Object.freeze({status:'recorded',load,reason,days:row.days,week:row.week,limitations:row.limitations});
 }
 return Object.freeze({key,week,read,current,save,signal});
});
