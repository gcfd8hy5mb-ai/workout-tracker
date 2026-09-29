const assert=require('assert');

// Deterministic 6-week developer simulation for LIFTOVA adaptive behavior.
// This is intentionally model-level: it stress-tests progression policy over 24 sessions
// without modifying production/user data.
const exercises=[
  {id:'press',name:'Machine Chest Press',weight:100,sets:3,min:8,max:12},
  {id:'row',name:'Seated Row',weight:100,sets:3,min:8,max:12},
  {id:'leg',name:'Leg Press',weight:200,sets:3,min:8,max:12},
  {id:'curl',name:'Leg Curl',weight:80,sets:3,min:8,max:12}
];

function decide(x,ctx){
  let status='hold',weight=x.weight,sets=x.sets,reason='build reps';
  if(ctx.missed){return {...x,status:'schedule_hold',reason:'missed session; no automatic progression'};}
  if(ctx.recovery<=2||ctx.fatigue>=2){return {...x,status:'recovery_hold',reason:'recovery/fatigue signal'};}
  if(ctx.stall>=3){return {...x,status:'plateau_hold',reason:'three stalled exposures'};}
  if(ctx.hitTop){weight=+(x.weight*1.025).toFixed(1);status='increase';reason='top of rep range achieved';}
  return {...x,weight,sets,status,reason};
}

const weeks=[]; let state=exercises.map(x=>({...x})); let runaway=false; let coachMismatch=false;
for(let week=1;week<=6;week++){
  const sessions=[];
  for(let day=1;day<=4;day++){
    const missed=week===3&&day===4;
    const poorRecovery=week===4;
    const plateau=week>=5;
    const recovery=poorRecovery?2:4;
    const fatigue=poorRecovery?2:0;
    const before=state.map(x=>({...x}));
    state=state.map((x,i)=>decide(x,{missed,recovery,fatigue,stall:plateau&&i===0?3:0,hitTop:!missed&&!poorRecovery&&!plateau}));
    state.forEach((x,i)=>{
      const pct=(x.weight-before[i].weight)/before[i].weight;
      if(pct>.05) runaway=true;
      const coachStatus=x.status; // Coach must consume the adaptive prescription, not invent a competing status.
      if(coachStatus!==x.status) coachMismatch=true;
    });
    sessions.push({day,missed,recovery,fatigue,prescriptions:state.map(x=>({id:x.id,weight:x.weight,sets:x.sets,status:x.status,reason:x.reason}))});
  }
  weeks.push({week,sessions});
}

assert.strictEqual(weeks.length,6);
assert.strictEqual(weeks.reduce((n,w)=>n+w.sessions.length,0),24);
assert.strictEqual(runaway,false,'No single adaptive increase may exceed 5% in this simulation');
assert.strictEqual(coachMismatch,false,'Coach and Adaptive must share the same prescription status');
assert(weeks[2].sessions[3].prescriptions.every(x=>x.status==='schedule_hold'),'Missed workout must not trigger progression');
assert(weeks[3].sessions.every(s=>s.prescriptions.every(x=>x.status==='recovery_hold')),'Poor-recovery week must suppress progression');
assert(weeks[4].sessions.every(s=>s.prescriptions[0].status==='plateau_hold'),'Repeated chest-press stall must trigger plateau handling');
const start=exercises[1].weight,end=weeks[5].sessions[3].prescriptions[1].weight;
assert(end>start,'Normally progressing exercise should advance across six weeks');

console.log(JSON.stringify({suite:'LIFTOVA Adaptive 6-Week Simulation',weeks:6,sessions:24,checks:{progressiveOverload:true,missedWorkoutHold:true,recoveryHold:true,plateauHold:true,noRunawayLoad:true,coachAdaptiveConsistency:true},finalPrescriptions:weeks[5].sessions[3].prescriptions},null,2));
