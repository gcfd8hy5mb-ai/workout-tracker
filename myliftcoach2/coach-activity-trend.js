/* Coach activity comparison: local completed workouts only, no writes or recovery guesses. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.MLCCoachActivityTrend=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const DAY=86400000;
 function validSet(s){
  return s&&typeof s.exerciseId==='string'&&s.exerciseId.length>0&&s.completed!==false&&
   Number.isFinite(Number(s.weight))&&Number(s.weight)>0&&Number.isFinite(Number(s.reps))&&Number(s.reps)>0;
 }
 function summary(sessions,from,to){
  const ids=new Set(),days=new Set(),movements=new Set();let sets=0,volume=0;
  for(const session of Array.isArray(sessions)?sessions:[]){
   const date=Date.parse(session?.created||'');
   if(!Number.isFinite(date)||date<from||date>=to||!Array.isArray(session.sets))continue;
   // One completed session ID is counted only once.
   if(typeof session.id==='string'&&ids.has(session.id))continue;
   if(typeof session.id==='string')ids.add(session.id);
   const valid=session.sets.filter(validSet);
   if(!valid.length)continue;
   days.add(new Date(date).toISOString().slice(0,10));
   for(const set of valid){sets++;volume+=Number(set.weight)*Number(set.reps);movements.add(set.exerciseId);}
  }
  return Object.freeze({sessions:days.size?Array.isArray(sessions)?countSessions(sessions,from,to):0:0,days:days.size,sets,volume:Number(volume.toFixed(2)),movements:movements.size});
 }
 function countSessions(sessions,from,to){
  const unique=new Set();let count=0;
  for(let i=0;i<sessions.length;i++){
   const session=sessions[i],time=Date.parse(session?.created||'');
   if(!Number.isFinite(time)||time<from||time>=to||!Array.isArray(session.sets)||!session.sets.some(validSet))continue;
   const key=typeof session.id==='string'&&session.id?'id:'+session.id:'index:'+i;
   if(unique.has(key))continue;
   unique.add(key);count++;
  }
  return count;
 }
 function compare(sessions,now=Date.now()){
  if(!Number.isFinite(now)||now<0)throw new TypeError('Invalid comparison time');
  const end=now+1,start=now-7*DAY,prevStart=start-7*DAY;
  const current=summary(sessions,start,end),previous=summary(sessions,prevStart,start);
  const delta=Object.freeze({sessions:current.sessions-previous.sessions,days:current.days-previous.days,sets:current.sets-previous.sets,volume:Number((current.volume-previous.volume).toFixed(2))});
  return Object.freeze({current,previous,delta,notes:'Recorded training totals only; not a recovery, readiness, or progress score.'});
 }
 return Object.freeze({compare,validSet});
});
