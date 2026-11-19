/* Read-only preparation for exactly the workout resolved by Home/Start.
 * No plan edits, no automatic load assignments, no fabricated coaching results.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./session-coach.js'):root.MLCSessionCoach);
 if(node)module.exports=api;else root.MLCTodayCoach=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(coach){
 'use strict';
 function preview({plan=null,catalog=[],localSessions=[],legacySessions=[],legacyVerified=false,personalTargets={}}={}){
  const ids=Array.isArray(plan?.ids)?plan.ids:[];
  const exercises=new Map((Array.isArray(catalog)?catalog:[])
   .filter(ex=>ex&&typeof ex.id==='string'&&typeof ex.name==='string')
   .map(ex=>[ex.id,ex]));
  if(!plan||!Array.isArray(plan.ids)||!ids.length)
   return Object.freeze({status:'rest',title:null,items:Object.freeze([]),ready:0});
  const rows=ids.map((id,index)=>{
   const ex=exercises.get(id);
   if(!ex)return Object.freeze({id,index,status:'unavailable',name:'Exercise unavailable',action:null,weight:null,source:null,reason:'This exercise is not in the current catalog.'});
   const local=coach.localProgression(localSessions,id,ex.name);
   const legacy=legacyVerified?coach.coach(legacySessions,id,ex.name):{status:'insufficient'};
   const chosen=local.status==='ready'?local:legacy.status==='ready'?legacy:local;
   const ready=chosen.status==='ready';
   const manual=Object.prototype.hasOwnProperty.call(personalTargets||{},id)?personalTargets[id]:null;
   const target=typeof manual==='number'&&Number.isFinite(manual)&&manual>0&&manual<=1000?manual:null;
   return Object.freeze({id,index,name:ex.name,status:ready?'ready':'insufficient',personalTarget:target,
    action:ready?chosen.action:null,weight:ready?chosen.weight:null,
    source:ready?(chosen===local?'2.0 history':'Verified original history'):null,
    reason:ready?chosen.reason:'At least two qualifying completed sessions are required.'});
  });
  return Object.freeze({status:'scheduled',title:String(plan.title||'Scheduled workout'),
   items:Object.freeze(rows),ready:rows.filter(x=>x.status==='ready').length});
 }
 return Object.freeze({preview});
});
