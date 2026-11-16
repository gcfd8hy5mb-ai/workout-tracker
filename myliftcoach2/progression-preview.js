/* Read-only reconstruction of original MYLIFTCOACH progressionSuggestion. No storage or plan mutation. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MLCProgressionPreview=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function suggest(history,exerciseId,options={}){
  const range=options.range||{min:8,max:10};
  const increment=options.increment===2.5?2.5:5;
  if(!exerciseId||!Number.isInteger(range.min)||!Number.isInteger(range.max)||range.min<1||range.max<range.min)return {status:'insufficient'};
  const now=options.now===undefined?Date.now():Number(options.now);
  if(!Number.isFinite(now))return {status:'insufficient'};
  const recent=(Array.isArray(history)?history:[])
   .filter(session=>session&&Number.isFinite(Date.parse(session.date||''))&&Date.parse(session.date)<=now&&Array.isArray(session.exercises))
   .slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).map(session=>{
   const entry=session.exercises.find(x=>x?.id===exerciseId&&Array.isArray(x.sets));
   const logged=(entry?.sets||[]).filter(set=>set&&Number.isFinite(Number(set.weight))&&Number(set.weight)>0&&Number.isFinite(Number(set.reps))&&Number(set.reps)>0&&set.completed!==false);
   if(logged.length<2)return null;
   const weight=Math.max(...logged.map(set=>Number(set.weight)));
   const working=logged.filter(set=>Number(set.weight)===weight);
   return working.length>=2?{weight,reps:working.map(set=>Number(set.reps))}:null;
  }).filter(Boolean).slice(0,3);
  if(!recent.length)return {status:'insufficient'};
  const last=recent[0],base={status:'insufficient',lastWeight:last.weight,lastReps:last.reps,range};
  if(recent.length<2)return base;
  const latestTop=last.reps.every(reps=>reps>=range.max);
  const sameWeightFailures=recent.slice(0,2).every(s=>s.weight===last.weight&&s.reps.filter(reps=>reps<range.min).length>s.reps.length/2);
  let weight=last.weight,action,reason;
  if(latestTop){weight=last.weight+increment;action='increase';reason='Reached the top of the target rep range on all working sets.';}
  else if(sameWeightFailures){weight=Math.max(increment,last.weight-increment);action='reduce';reason='Most working sets were below the minimum reps in two recent sessions at this weight.';}
  else{action='hold';reason='Keep the weight and work toward the top of the rep range on all working sets.';}
  return {...base,status:'ready',weight:Number(weight.toFixed(2)),action,reason};
 }
 return Object.freeze({suggest});
});
