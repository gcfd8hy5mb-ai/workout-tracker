/* Weekly Coach planning evidence. Mirrors original availability concept without
 * taking authority over a user's schedule or creating replacement workouts.
 */
(function(root,factory){const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachWeeklyPlan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=86400000;
 function summarize({sessions=[],checkin=null,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Invalid week timestamp');
  const d=new Date(now),weekday=(d.getUTCDay()+6)%7;
  const start=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-weekday*DAY;
  const end=start+7*DAY;
  const days=new Set(),unique=new Set();let workouts=0,sets=0;
  for(const [index,s] of (Array.isArray(sessions)?sessions:[]).entries()){
   const time=Date.parse(s?.created||'');if(!Number.isFinite(time)||time>now||time<start||time>=end||!Array.isArray(s.sets))continue;
   const rows=s.sets.filter(x=>x?.exerciseId&&x.completed!==false&&Number.isFinite(Number(x.weight))&&Number(x.weight)>0&&Number.isFinite(Number(x.reps))&&Number(x.reps)>0);
   if(!rows.length)continue;
   const key=typeof s.id==='string'&&s.id?'id:'+s.id:'entry:'+index;
   if(unique.has(key))continue;unique.add(key);
   days.add(new Date(time).toISOString().slice(0,10));workouts++;sets+=rows.length;
  }
  const daysAvailable=Number.isInteger(checkin?.days)&&checkin.days>=1&&checkin.days<=7?checkin.days:null;
  const remaining=daysAvailable===null?null:Math.max(0,daysAvailable-days.size);
  const load=checkin?.load==='conservative'?'conservative':checkin?.load==='progressive'?'progressive':checkin?.load==='normal'?'normal':'unknown';
  let note='No weekly training availability recorded. Coach will not invent a training-day goal.';
  if(daysAvailable!==null)note=remaining===0?'Your recorded training days meet this week\'s availability target.':
   'You have '+remaining+' available training day'+(remaining===1?'':'s')+' remaining this week based on your own check-in.';
  if(load==='conservative')note+=' Your self-reported check-in favors caution rather than compressing missed sessions.';
  return Object.freeze({weekStart:new Date(start).toISOString().slice(0,10),
   weekEnd:new Date(end-DAY).toISOString().slice(0,10),workouts,trainingDays:days.size,sets,
   daysAvailable,remaining,load,note,
   noAutomaticScheduleChanges:true});
 }
 return Object.freeze({summarize});
});
