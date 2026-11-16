/* Local practice workout completion summary. Derived only from recorded sets.
 * No comparison to unverified original-account records; no writes. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCSessionSummary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function summarize(entry,earlier=[],catalog=[]){
  const sets=Array.isArray(entry?.sets)?entry.sets.filter(s=>s&&typeof s.exerciseId==='string'&&
    Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&
    Number.isFinite(Number(s.reps))&&Number(s.reps)>0):[];
  const names=new Map((Array.isArray(catalog)?catalog:[]).map(e=>[e.id,e.name]));
  const groups=new Map(),oldBest=new Map();
  for(const s of Array.isArray(earlier)?earlier:[]){
   for(const set of Array.isArray(s?.sets)?s.sets:[]){
    if(set?.exerciseId&&!String(s.id||'').startsWith(String(entry?.id||'!!'))&&Number(set.weight)>0&&Number(set.reps)>0){
     oldBest.set(set.exerciseId,Math.max(oldBest.get(set.exerciseId)||0,Number(set.weight)));
    }
   }
  }
  for(const set of sets){
   const id=set.exerciseId,weight=Number(set.weight),reps=Number(set.reps);
   if(!groups.has(id))groups.set(id,{id,name:String(names.get(id)||id),sets:0,volume:0,topWeight:0});
   const g=groups.get(id);
   g.sets++;g.volume+=weight*reps;g.topWeight=Math.max(g.topWeight,weight);
  }
  const movements=[...groups.values()].map(g=>({...g,newPracticeRecord:g.topWeight>(oldBest.get(g.id)||0)}));
  const start=Number(entry?.startedAt),end=Date.parse(entry?.created||'');
  const durationMinutes=Number.isFinite(start)&&start>0&&Number.isFinite(end)&&end>=start?
    Math.max(1,Math.round((end-start)/60000)):null;
  return {sets:sets.length,volume:sets.reduce((sum,s)=>sum+Number(s.weight)*Number(s.reps),0),
   movements,recordCount:movements.filter(x=>x.newPracticeRecord).length,durationMinutes};
 }
 return Object.freeze({summarize});
});
