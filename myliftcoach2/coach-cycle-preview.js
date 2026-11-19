/* Coach lifecycle adapted from original LIFTOVA Coach Cycle v4.
 * Uses only explicit draft inputs; does not control the workout plan.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachCycle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const HOUR=3600000;
 function guidance({today=null,checkin=null,activeSession=null,lastSession=null,action=null,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Invalid Coach cycle timestamp');
  const started=Number(activeSession?.startedAt);
  const active=activeSession&&Number.isFinite(started)&&started>0&&started<=now&&
   Array.isArray(activeSession.sets);
  const completedAt=Date.parse(lastSession?.created||'');
  const recent=Number.isFinite(completedAt)&&completedAt<=now&&now-completedAt<=8*HOUR;
  let phase,title,message,why;
  if(active){
   phase='during';title='Coach during your workout';
   const count=activeSession.sets.filter(x=>x?.exerciseId&&x.completed!==false&&
    Number.isFinite(Number(x.weight))&&Number(x.weight)>0&&Number.isFinite(Number(x.reps))&&Number(x.reps)>0).length;
   message=count+' qualifying working sets logged. '+(checkin?.load==='conservative'?
    'Your check-in favors caution; do not force an increase.':'Continue with the exercise order you selected.');
   why='Based on the current local workout draft and your own check-in.';
  }else if(recent){
   phase='after';title='Coach after your workout';
   message=String(lastSession.title||'Your workout')+' was recorded. Review its completed sets and next-exposure guidance in Progress.';
   why='Only a completed, timestamped local session is used for this review.';
  }else if(checkin?.status!=='recorded'){
   phase='weekly';title='Update your weekly Coach check-in';
   message='Record your recovery, energy, difficulty and available training days before interpreting progression.';
   why='No check-in is available for the current week; Coach will not infer your readiness.';
  }else{
   phase='before';title='Coach before your workout';
   const scheduled=today?.status==='scheduled'&&Array.isArray(today.items)&&today.items.length>0;
   message=scheduled?String(today.title||'Today’s workout')+' · '+today.items.length+
    ' planned exercises. '+(action?.description||'Follow your actual schedule.') :
    'Rest or unassigned day. Coach will not select a replacement preset.';
   why='Based on Home’s resolved schedule and your current self-reported check-in.';
  }
  return Object.freeze({phase,title,message,why,requiresAction:false,readOnly:true});
 }
 return Object.freeze({guidance});
});
