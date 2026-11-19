/* Factual post-workout Coach debrief. Original flow adapted to completed
 * 2.0 practice sessions; no automatic training decisions, writes or diagnosis.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./session-summary.js'):root.MLCSessionSummary,
  node?require('./session-coach.js'):root.MLCSessionCoach);
 if(node)module.exports=api;else root.MLCPostSessionCoach=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(summary,coach){
 'use strict';
 function review(entry,earlier=[],catalog=[]){
  if(!entry||!Array.isArray(entry.sets)||!Number.isFinite(Date.parse(entry.created||'')))
   return Object.freeze({status:'unavailable',headline:'No verified session',details:[],suggestions:[]});
  const result=summary.summarize(entry,earlier,catalog);
  if(!result.sets)return Object.freeze({status:'unavailable',headline:'No completed working sets',details:[],suggestions:[]});
  const details=[
   result.sets+' working sets · '+Math.round(result.volume).toLocaleString()+' lb-reps recorded',
   result.movements.length+' exercises trained',
   result.recordCount+' new local practice weight records'
  ];
  if(result.durationMinutes)details.push(result.durationMinutes+' minutes recorded');
  if(['Great','Normal','Tired'].includes(entry.readiness))details.push('Your check-in: '+entry.readiness);
  const suggestions=result.movements.map(ex=>{
   const outcome=coach.localProgression([entry,...(Array.isArray(earlier)?earlier:[])],ex.id,ex.name);
   return Object.freeze({exerciseId:ex.id,name:ex.name,
    status:outcome.status==='ready'?'evidence':'learning',
    message:outcome.status==='ready'?outcome.action.toUpperCase()+' next exposure: '+outcome.reason:
     'Keep recording qualifying working sets before Coach proposes a change.',
    weight:outcome.status==='ready'?outcome.weight:null});
  });
  return Object.freeze({status:'ready',headline:result.recordCount?
   'Workout recorded · new personal training markers':'Workout recorded · progress tracked',
   details:Object.freeze(details),suggestions:Object.freeze(suggestions),
   note:'Future set weights are suggestions only and never change your scheduled plan.'});
 }
 return Object.freeze({review});
});
