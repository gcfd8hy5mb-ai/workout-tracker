/* MYLIFTCOACH 2.0 local post-workout recap.
   Only real saved practice sets, comparisons restricted to same exact plan ID.
   Never writes to browser or cloud data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2PostWorkout=api;
})(globalThis,function(){
'use strict';
const valid=s=>s&&typeof s.exerciseId==='string'&&Number.isFinite(Number(s.weight))&&
 Number(s.weight)>0&&Number(s.weight)<=1500&&Number.isInteger(Number(s.reps))&&Number(s.reps)>=1&&Number(s.reps)<=100;
function stats(session){
 if(!session||!Array.isArray(session.sets))return {sets:0,volume:0,movements:0,bestWeights:{}};
 const good=session.sets.filter(valid),bestWeights=Object.create(null);
 for(const set of good){const id=set.exerciseId,w=Number(set.weight);bestWeights[id]=Math.max(bestWeights[id]||0,w)}
 return {sets:good.length,volume:good.reduce((n,s)=>n+Number(s.weight)*Number(s.reps),0),
  movements:Object.keys(bestWeights).length,bestWeights};
}
function summarize(sessions){
 const history=Array.isArray(sessions)?sessions.filter(s=>s&&Array.isArray(s.sets)).slice():[];
 history.sort((a,b)=>Date.parse(b.created||'')-Date.parse(a.created||''));
 if(!history.length)return {hasHistory:false};
 const latest=history[0],previous=history.slice(1).find(s=>s.planId&&s.planId===latest.planId);
 const current=stats(latest),before=previous?stats(previous):null;
 const improvements=before?Object.entries(current.bestWeights).filter(([id,w])=>
   Object.prototype.hasOwnProperty.call(before.bestWeights,id)&&w>before.bestWeights[id]).length:0;
 return {hasHistory:true,title:String(latest.title||'Workout').slice(0,110),date:String(latest.created||''),
  planId:latest.planId||null,current,previous:before,deltaVolume:before?current.volume-before.volume:null,
  improvedExercises:improvements,referenceSessionId:previous?.id||null};
}
function render(root,sessions){
 if(!root)return;
 root.replaceChildren();
 const v=summarize(sessions),create=(tag,text)=>{
  const e=document.createElement(tag);e.textContent=text;root.append(e);return e;
 };
 if(!v.hasHistory){create('p','Complete a 2.0 workout to see a post-workout recap. No training history is invented.');return}
 create('h4',v.title+' · latest saved session');
 create('p',v.current.sets+' logged working sets · '+v.current.movements+' exercises · '+Math.round(v.current.volume).toLocaleString()+' lb training volume');
 if(v.previous){
  const sign=v.deltaVolume>0?'+':'';
  create('p',sign+Math.round(v.deltaVolume).toLocaleString()+' lb volume versus the previous saved session of this same workout.');
  create('p',v.improvedExercises+' exercises had a higher top logged weight than in that previous session.');
 }else create('p','No previous saved session of this same workout exists for comparison.');
 const note=create('p','These are descriptive training records, not performance or medical advice. No weights or plans change automatically.');
 note.className='coach-trend-footnote';
}
return Object.freeze({stats,summarize,render});
});