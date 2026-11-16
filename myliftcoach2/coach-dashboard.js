/* MYLIFTCOACH 2.0 Coach recommendations — derived evidence, not auto-writes.
 * Prefer completed 2.0 practice workouts. Legacy data requires verified owner.
 * A recommendation is informational until the user explicitly applies it in a session.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(
  node?require('./session-coach.js'):root.MLCSessionCoach
 );
 if(node)module.exports=api;else root.MLCCoachDashboard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(coach){
 'use strict';
 function recommendations({localSessions=[],originalSessions=[],legacyVerified=false,catalog=[],limit=30}={}){
  const byId=new Map((Array.isArray(catalog)?catalog:[])
   .filter(x=>x&&typeof x.id==='string'&&x.id&&typeof x.name==='string')
   .map(x=>[x.id,x]));
  const local=Array.isArray(localSessions)?localSessions:[];
  const legacy=legacyVerified&&Array.isArray(originalSessions)?originalSessions:[];
  const attempted=new Set();
  for(const session of local){
   if(!Array.isArray(session?.sets)||!Number.isFinite(Date.parse(session.created||'')))continue;
   for(const set of session.sets||[])if(byId.has(set?.exerciseId))attempted.add(set.exerciseId);
  }
  for(const session of legacy){
   if(!Number.isFinite(Date.parse(session?.date||'')))continue;
   for(const ex of Array.isArray(session.exercises)?session.exercises:[])if(byId.has(ex?.id))attempted.add(ex.id);
  }
  const results=[];
  for(const id of attempted){
   const ex=byId.get(id);
   const localResult=coach.localProgression(local,id,ex.name);
   const legacyResult=legacy.length?coach.coach(legacy,id,ex.name):{status:'insufficient'};
   const useLocal=localResult.status==='ready';
   const picked=useLocal?localResult:legacyResult;
   results.push({
    id,name:ex.name,source:picked.status==='ready'?(useLocal?'2.0 completed workouts':'Verified original history'):null,
    status:picked.status,action:picked.status==='ready'?picked.action:null,
    weight:picked.status==='ready'?picked.weight:null,
    reason:picked.status==='ready'?picked.reason:'At least two qualifying completed sessions with two working sets are required.',
    lastWeight:picked.lastWeight??localResult.lastWeight??null
   });
  }
  results.sort((a,b)=>(a.status==='ready'?-1:1)-(b.status==='ready'?-1:1)||a.name.localeCompare(b.name));
  return Object.freeze(results.slice(0,Math.min(100,Math.max(1,limit)))); 
 }
 return Object.freeze({recommendations});
});
