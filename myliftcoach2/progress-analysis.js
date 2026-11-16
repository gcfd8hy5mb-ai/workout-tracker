/* Pure, read-only progress analysis from original completed workout sessions. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCOriginalProgress=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function analyze(history){
  const list=Array.isArray(history)?history:[];
  const best=new Map();
  let sets=0,volume=0;
  const dates=new Set();
  for(const session of list){
   const date=Date.parse(session?.date||'');
   if(!Number.isFinite(date)||!Array.isArray(session.exercises))continue;
   dates.add(new Date(date).toISOString().slice(0,10));
   for(const ex of session.exercises){
    if(!ex||!Array.isArray(ex.sets))continue;
    const id=String(ex.id||'');
    if(!id)continue;
    for(const set of ex.sets){
     if(set?.completed===false)continue;
     const weight=Number(set?.weight),reps=Number(set?.reps);
     if(!Number.isFinite(weight)||weight<=0||!Number.isFinite(reps)||reps<=0)continue;
     sets++;volume+=weight*reps;
     let row=best.get(id);
     if(!row){row={id,name:String(ex.name||id),weight:0,reps:0,setVolume:0,estimatedOneRepMax:0};best.set(id,row);}
     row.weight=Math.max(row.weight,weight);
     row.reps=Math.max(row.reps,reps);
     row.setVolume=Math.max(row.setVolume,weight*reps);
     if(reps<=10)row.estimatedOneRepMax=Math.max(row.estimatedOneRepMax,weight*(1+reps/30));
    }
   }
  }
  const records=Array.from(best.values()).sort((a,b)=>a.name.localeCompare(b.name));
  return {sessions:list.length,trainingDays:dates.size,sets,volume,exercises:records.length,records};
 }
 function volumeSeries(history,limit=12){
  if(!Array.isArray(history))return [];
  const count=Number.isInteger(limit)&&limit>0&&limit<=100?limit:12;
  const points=[];
  for(const session of history){
   const date=Date.parse(session?.date||'');
   if(!Number.isFinite(date)||!Array.isArray(session?.exercises))continue;
   let volume=0,validSets=0;
   for(const exercise of session.exercises){
    if(!Array.isArray(exercise?.sets))continue;
    for(const set of exercise.sets){
     if(set?.completed===false)continue;
     const weight=Number(set?.weight),reps=Number(set?.reps);
     if(!(weight>0&&reps>0&&Number.isFinite(weight)&&Number.isFinite(reps)))continue;
     volume+=weight*reps;validSets++;
    }
   }
   if(validSets)points.push({date:new Date(date).toISOString().slice(0,10),timestamp:date,volume,sets:validSets});
  }
  points.sort((a,b)=>a.timestamp-b.timestamp);
  return points.slice(-count).map(({date,volume,sets})=>({date,volume,sets}));
 }
 return Object.freeze({analyze,volumeSeries});
});
