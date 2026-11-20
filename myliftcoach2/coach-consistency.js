/* Evidence-only workout consistency review for today's selected exercise IDs.
 * A repeated training load is not a diagnosis of a plateau. No plan writes.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachConsistency=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function review(sessions,exerciseId,now=Date.now()){
  if(typeof exerciseId!=='string'||!exerciseId||!Number.isFinite(now))return Object.freeze({status:'insufficient',sessions:0});
  const ordered=(Array.isArray(sessions)?sessions:[])
   .filter(s=>{const t=Date.parse(s?.created||'');return Number.isFinite(t)&&t<=now&&Array.isArray(s.sets)})
   .slice().sort((a,b)=>Date.parse(b.created)-Date.parse(a.created));
  const unique=new Set(),records=[];
  for(let index=0;index<ordered.length&&records.length<4;index++){
   const session=ordered[index];
   const key=typeof session.id==='string'&&session.id?'id:'+session.id:'created:'+session.created;
   if(unique.has(key))continue;
   unique.add(key);
   const valid=session.sets.filter(s=>s?.exerciseId===exerciseId&&s.completed!==false&&
    Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&
    Number.isFinite(Number(s.reps))&&Number(s.reps)>0);
   const byWeight=new Map();
   for(const set of valid){const weight=Number(set.weight);if(!byWeight.has(weight))byWeight.set(weight,[]);byWeight.get(weight).push(Number(set.reps))}
   const working=[...byWeight.entries()].filter(x=>x[1].length>=2).sort((a,b)=>b[0]-a[0])[0];
   if(working)records.push({date:session.created,weight:working[0],meanReps:working[1].reduce((a,b)=>a+b,0)/working[1].length,sets:working[1].length});
  }
  if(records.length<3)return Object.freeze({status:'insufficient',sessions:records.length});
  const allSame=records.every(r=>r.weight===records[0].weight);
  const latest=records[0],oldest=records[records.length-1];
  const repChange=Number((latest.meanReps-oldest.meanReps).toFixed(2));
  let status='variable';
  if(allSame&&Math.abs(repChange)<0.5)status='steady-load';
  else if(latest.weight>oldest.weight)status='load-increase';
  else if(latest.weight<oldest.weight)status='load-decrease';
  else if(repChange>=0.5)status='rep-increase';
  else if(repChange<=-0.5)status='rep-decrease';
  return Object.freeze({status,sessions:records.length,latestWeight:latest.weight,
   earliestWeight:oldest.weight,repChange,notes:'Observed recorded sets only; not a plateau diagnosis or automatic training change.'});
 }
 return Object.freeze({review});
});
