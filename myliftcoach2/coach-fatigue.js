/* Factual repeated-performance decline evidence; never a recovery diagnosis.
 * Compares 2+ working sets at comparable loads in at least three distinct
 * sessions. Used only to hold a proposed increase for manual review.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachFatigue=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function review(sessions,exerciseId,now=Date.now()){
  if(typeof exerciseId!=='string'||!exerciseId||!Number.isFinite(now))
   return Object.freeze({status:'insufficient',sessions:0});
  const seen=new Set(),rows=[];
  const ordered=(Array.isArray(sessions)?sessions:[]).filter(s=>{
   const t=Date.parse(s?.created||'');return Number.isFinite(t)&&t<=now&&Array.isArray(s.sets);
  }).slice().sort((a,b)=>Date.parse(b.created)-Date.parse(a.created));
  for(const [index,session] of ordered.entries()){
   const key=typeof session.id==='string'&&session.id?'id:'+session.id:'date:'+session.created;
   if(seen.has(key))continue;seen.add(key);
   const sets=session.sets.filter(x=>x?.exerciseId===exerciseId&&x.completed!==false&&
    Number.isFinite(Number(x.weight))&&Number(x.weight)>0&&
    Number.isFinite(Number(x.reps))&&Number(x.reps)>0);
   if(sets.length<2)continue;
   const maxWeight=Math.max(...sets.map(x=>Number(x.weight)));
   const relevant=sets.filter(x=>Math.abs(Number(x.weight)-maxWeight)<=maxWeight*.05);
   if(relevant.length<2)continue;
   rows.push({weight:maxWeight,reps:relevant.reduce((n,x)=>n+Number(x.reps),0)/relevant.length});
   if(rows.length===3)break;
  }
  if(rows.length<3)return Object.freeze({status:'insufficient',sessions:rows.length});
  const [latest,middle,oldest]=rows;
  const comparable=[latest,middle,oldest].every(x=>Math.abs(x.weight-oldest.weight)<=oldest.weight*.05);
  const repeated=comparable&&oldest.reps-middle.reps>=1&&middle.reps-latest.reps>=1;
  return Object.freeze({status:repeated?'review-decline':'no-repeated-decline',sessions:rows.length,
   reason:repeated?'Working-set repetitions declined in three comparable-load sessions; review technique, training context and the proposed increase.':
   'Three comparable records do not show a repeated working-set repetition decline.',
   noAutomaticAdjustment:true});
 }
 return Object.freeze({review});
});
