/* MYLIFTCOACH 2.0 Coach training review: evidence only.
 * Original weekly dashboard / set comparison adapted to local practice entries.
 * No invented recovery scores or automatic modification of custom workouts.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCCoachReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function day(iso){const n=Date.parse(iso||'');return Number.isFinite(n)?new Date(n).toISOString().slice(0,10):null}
function week(history,now=Date.now()){
 if(!Number.isFinite(now))return null;
 const end=new Date(now);end.setUTCHours(23,59,59,999);
 const start=new Date(end);start.setUTCDate(end.getUTCDate()-6);start.setUTCHours(0,0,0,0);
 const sessions=(Array.isArray(history)?history:[]).filter(s=>{const t=Date.parse(s?.created||'');return Number.isFinite(t)&&t>=start.getTime()&&t<=end.getTime()&&Array.isArray(s.sets)});
 const days=new Set(),movements=new Set();let sets=0,volume=0,readiness={Great:0,Normal:0,Tired:0};
 for(const s of sessions){days.add(day(s.created));if(Object.hasOwn(readiness,s.readiness))readiness[s.readiness]++;
  for(const row of s.sets){const w=Number(row?.weight),reps=Number(row?.reps);
   if(!row?.exerciseId||!Number.isFinite(w)||w<=0||!Number.isFinite(reps)||reps<=0)continue;
   movements.add(row.exerciseId);sets++;volume+=w*reps;
  }
 }
 return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10),sessions:sessions.length,trainingDays:days.size,sets,volume,movements:movements.size,readiness};
}
function priorSet(history,exerciseId,excludeId=null){
 const ordered=(Array.isArray(history)?history:[]).filter(s=>s?.id!==excludeId&&Number.isFinite(Date.parse(s?.created||''))).slice()
  .sort((a,b)=>Date.parse(b.created)-Date.parse(a.created));
 for(const session of ordered){const rows=(Array.isArray(session.sets)?session.sets:[]).filter(x=>x?.exerciseId===exerciseId&&Number(x.weight)>0&&Number(x.reps)>0);
  if(rows.length)return {weight:Number(rows[rows.length-1].weight),reps:Number(rows[rows.length-1].reps),date:session.created};
 }
 return null;
}
function compare(current,previous){
 const weight=Number(current?.weight),reps=Number(current?.reps);
 if(!Number.isFinite(weight)||weight<=0||!Number.isFinite(reps)||reps<=0)return null;
 if(!previous)return {label:'First recorded set',direction:'new'};
 const pw=Number(previous.weight),pr=Number(previous.reps);
 if(weight===pw&&reps===pr)return {label:'Matched previous',direction:'same'};
 if((weight>pw&&reps>=pr)||(weight===pw&&reps>pr)||(weight*reps>pw*pr&&weight>=pw*.9))
  return {label:'Improved from previous',direction:'up'};
 if((weight<pw&&reps<=pr)||(weight===pw&&reps<pr)||(weight*reps<pw*pr&&reps<=pr))
  return {label:'Below previous',direction:'down'};
 return {label:'Different load and rep trade-off',direction:'mixed'};
}
return Object.freeze({week,priorSet,compare});
});
