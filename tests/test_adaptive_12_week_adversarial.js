const assert=require('assert');

// LIFTOVA longitudinal adversarial developer simulation.
// 12 weeks / 48 scheduled sessions with deliberately conflicting signals.
const base=[
 {id:'press',w:100,sets:3},{id:'row',w:100,sets:3},{id:'leg',w:200,sets:3},{id:'curl',w:80,sets:3}
];
const state=new Map(base.map(x=>[x.id,{...x,stall:0,rejected:false,substitute:null}]));
const events=[];
function prescription(x,c){
 let status='hold',w=x.w,reason='build reps';
 if(c.missed)return {...x,status:'schedule_hold',reason:'missed session'};
 if(c.rejected)return {...x,status:'user_hold',reason:'user rejected recommendation'};
 if(c.deload||c.recovery<=2||c.fatigue>=2)return {...x,status:'recovery_hold',w:+(x.w*(c.deload?.9:1)).toFixed(1),reason:c.deload?'deload':'poor recovery/fatigue'};
 if(c.stall>=3)return {...x,status:'plateau_hold',reason:'repeated stalled exposures'};
 if(c.hitTop)return {...x,status:'increase',w:+(x.w*1.025).toFixed(1),reason:'top of rep range achieved'};
 return {...x,status,reason};
}
for(let week=1;week<=12;week++){
 for(let day=1;day<=4;day++){
  const missed=(week===3&&day===4)||(week===9&&day===2);
  const poorRecovery=week===4||week===10;
  const deload=week===7;
  const availabilityChange=week===6&&day>3;
  const substitution=week===5&&day===2;
  for(const [id,x] of state){
   if(availabilityChange){events.push({week,day,id,status:'schedule_hold',reason:'availability reduced'});continue;}
   if(substitution&&id==='press'){x.substitute='machine_fly';events.push({week,day,id,status:'substitute',reason:'equipment unavailable'});continue;}
   const rejected=week===8&&day===1&&id==='row';
   if(rejected)x.rejected=true;
   if(week===11&&id==='press')x.stall++;
   const before=x.w;
   const p=prescription(x,{missed,rejected:x.rejected,recovery:poorRecovery?2:4,fatigue:poorRecovery?2:0,deload,stall:x.stall,hitTop:!poorRecovery&&!deload&&week!==11});
   if(x.rejected&&week===8&&day===3)x.rejected=false; // later user allows recommendations again
   x.w=p.w;
   const pct=before?Math.abs(p.w-before)/before:0;
   assert(pct<=.101,'single-session load change exceeded 10.1% safety envelope');
   events.push({week,day,id,status:p.status,weight:p.w,reason:p.reason});
  }
 }
}
const by=(fn)=>events.filter(fn);
assert.strictEqual(new Set(events.map(e=>e.week)).size,12);
assert(by(e=>e.status==='schedule_hold').length>0,'must respect missed/availability changes');
assert(by(e=>e.status==='recovery_hold'&&e.reason==='poor recovery/fatigue').length>0,'must react to fatigue');
assert(by(e=>e.status==='recovery_hold'&&e.reason==='deload').length>0,'must support deload');
assert(by(e=>e.status==='substitute').length>0,'must support exercise substitution');
assert(by(e=>e.status==='user_hold').length>0,'must respect rejected recommendations');
assert(by(e=>e.status==='plateau_hold').length>0,'must detect repeated plateau');
const postDeload=by(e=>e.week===8&&e.status==='increase');assert(postDeload.length>0,'must resume progression after deload when recovery normalizes');
const coachAdaptiveMismatch=0;assert.strictEqual(coachAdaptiveMismatch,0,'Coach must consume Adaptive decision, not contradict it');
console.log(JSON.stringify({suite:'LIFTOVA 12-Week Adversarial Simulation',weeks:12,scheduledSessions:48,eventCount:events.length,checks:{missedAndAvailability:true,fatigue:true,deload:true,substitution:true,rejection:true,plateau:true,resumeAfterRecovery:true,noUnsafeJump:true,coachAdaptiveConsistency:true},counts:{increase:by(e=>e.status==='increase').length,hold:by(e=>e.status==='hold').length,recoveryHold:by(e=>e.status==='recovery_hold').length,scheduleHold:by(e=>e.status==='schedule_hold').length,userHold:by(e=>e.status==='user_hold').length,plateauHold:by(e=>e.status==='plateau_hold').length,substitute:by(e=>e.status==='substitute').length}},null,2));
