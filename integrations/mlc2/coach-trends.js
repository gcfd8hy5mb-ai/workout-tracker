/* MYLIFTCOACH 2.0 Coach training consistency: local, deterministic, read-only.
   Metrics are based on actual completed 2.0 sessions, never generated estimates. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLC2CoachTrends=api;
})(globalThis,function(){
'use strict';
function dayString(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function monday(date){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return d}
function validSessionDate(s){const stamp=String(s?.created||s?.date||'');if(!/^\d{4}-\d{2}-\d{2}T/.test(stamp)||!Number.isFinite(Date.parse(stamp)))return null;return stamp.slice(0,10)}
function weekRange(mondayDate){const end=new Date(mondayDate);end.setDate(end.getDate()+6);return {start:dayString(mondayDate),end:dayString(end)}}
function summarizeWeek(sessions,first,last){
 const sessionsInWeek=(Array.isArray(sessions)?sessions:[]).filter(s=>{const day=validSessionDate(s);return day&&day>=first&&day<=last});
 let sets=0,volume=0;const activeDays=new Set(),exerciseIds=new Set(),plans=new Set();
 for(const session of sessionsInWeek){
  activeDays.add(validSessionDate(session));if(typeof session.planId==='string')plans.add(session.planId);
  for(const set of Array.isArray(session.sets)?session.sets:[]){
   const weight=Number(set?.weight),reps=Number(set?.reps);
   if(!Number.isFinite(weight)||weight<=0||weight>1500||!Number.isInteger(reps)||reps<1||reps>100)continue;
   sets++;volume+=weight*reps;
   if(typeof set.exerciseId==='string'&&set.exerciseId)exerciseIds.add(set.exerciseId);
  }
 }
 return {start:first,end:last,sessions:sessionsInWeek.length,activeDays:activeDays.size,sets,volume,exercises:exerciseIds.size,workoutPlans:plans.size};
}
function report(sessions,now=new Date(),target=4){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('Valid date required');
 const goal=Number.isInteger(target)&&target>=1&&target<=7?target:4;
 const start=monday(now),current=weekRange(start);
 const prevStart=new Date(start);prevStart.setDate(start.getDate()-7);
 const previous=weekRange(prevStart);
 const thisWeek=summarizeWeek(sessions,current.start,current.end);
 const lastWeek=summarizeWeek(sessions,previous.start,previous.end);
 const goalProgress=Math.min(100,Math.round(thisWeek.sessions/goal*100));
 const goalMet=thisWeek.sessions>=goal;
 const changes={sessions:thisWeek.sessions-lastWeek.sessions,sets:thisWeek.sets-lastWeek.sets,
  volume:thisWeek.volume-lastWeek.volume,activeDays:thisWeek.activeDays-lastWeek.activeDays};
 return {thisWeek,lastWeek,goal,goalProgress,goalMet,changes,hasHistory:thisWeek.sessions+lastWeek.sessions>0};
}
function render(root,sessions,target=4){
 if(!root)return;
 const data=report(sessions,new Date(),target);
 root.replaceChildren();
 const heading=document.createElement('p');
 heading.textContent='This week: '+data.thisWeek.sessions+' sessions · '+data.thisWeek.activeDays+' active days · '+data.thisWeek.sets+' weighted sets.';
 root.appendChild(heading);
 const previous=document.createElement('p');
 previous.textContent='Previous week: '+data.lastWeek.sessions+' sessions · '+data.lastWeek.activeDays+' active days · '+data.lastWeek.sets+' weighted sets.';
 root.appendChild(previous);
 const volume=document.createElement('p');
 volume.textContent='Training volume: '+Math.round(data.thisWeek.volume).toLocaleString()+' lb this week versus '+Math.round(data.lastWeek.volume).toLocaleString()+' lb last week.';
 root.appendChild(volume);
 const status=document.createElement('p');
 status.className='coach-trend-footnote';
 status.textContent=!data.hasHistory?'Finish a 2.0 workout to see a real training trend.':data.goalMet?
 'You have met your '+data.goal+'-workout weekly target.':
 'You have '+Math.max(0,data.goal-data.thisWeek.sessions)+' workout'+(data.goal-data.thisWeek.sessions===1?'':'s')+' remaining toward this week’s selected target.';
 root.appendChild(status);
 const disclaimer=document.createElement('p');
 disclaimer.className='coach-trend-footnote';
 disclaimer.textContent='Previous-week comparisons are descriptive, not a recovery or health diagnosis. No workout changes automatically.';
 root.appendChild(disclaimer);
}
return Object.freeze({monday,dayString,weekRange,summarizeWeek,report,render});
});