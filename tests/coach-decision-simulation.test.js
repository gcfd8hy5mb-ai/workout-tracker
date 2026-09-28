/* PRISM Coach Decision simulation harness v1.
 * Pure deterministic scenarios for stress-testing decision policy without real workout logging.
 */
const assert = require('assert');

function round5(n){ return Math.max(0, Math.round(Number(n||0)/5)*5); }
function simulate(s={}){
  const p=s.progression||{}, readiness=s.readiness||null, memory=s.memory||null;
  const lastWeight=Number(p.lastWeight||0), suggested=Number(p.weight||lastWeight||0);
  const min=Number(p.min||8), max=Number(p.max||12), lastReps=Array.isArray(p.lastReps)?p.lastReps:[];
  let decision='HOLD', weight=lastWeight||suggested, reps={min,max};
  if(readiness?.mode==='RECOVERY') { decision='RECOVERY'; weight=lastWeight?round5(lastWeight*.95):0; reps={min:Math.max(6,min-1),max:Math.max(Math.max(6,min-1),max-2)}; }
  else if(s.fatigueCount>0) { decision='REDUCE'; weight=lastWeight?round5(lastWeight*.95):0; }
  else if(s.plateau) { decision='REP FOCUS'; weight=lastWeight||suggested; }
  else if(memory?.samples>=4&&(memory.progression==='cautious'||memory.style==='conservative')) { decision='HOLD'; weight=lastWeight||suggested; }
  else if(memory?.samples>=4&&memory.style==='user-adjusted') { decision='REP FOCUS'; weight=lastWeight||suggested; }
  else if(p.status==='ready'&&readiness?.mode!=='CONTROL') { decision='INCREASE'; weight=suggested>lastWeight?suggested:(lastWeight?round5(lastWeight*1.025):suggested); }
  else if(lastReps.length&&Math.max(...lastReps)>=max) { decision='REP FOCUS'; weight=lastWeight||suggested; }
  if(readiness?.mode==='CONTROL'&&decision==='INCREASE') { decision='HOLD'; weight=lastWeight||suggested; }
  return {decision,weight,reps};
}

const cases=[
 ['progression', {progression:{status:'ready',lastWeight:200,weight:210,min:8,max:12},readiness:{mode:'BUILD'}}, 'INCREASE',210],
 ['recovery overrides progression', {progression:{status:'ready',lastWeight:200,weight:210,min:8,max:12},readiness:{mode:'RECOVERY'}}, 'RECOVERY',190],
 ['fatigue reduces load', {progression:{status:'ready',lastWeight:200,weight:210,min:8,max:12},readiness:{mode:'BUILD'},fatigueCount:2}, 'REDUCE',190],
 ['plateau prioritizes reps', {progression:{status:'ready',lastWeight:200,weight:210,min:8,max:12},readiness:{mode:'BUILD'},plateau:true}, 'REP FOCUS',200],
 ['cautious memory holds', {progression:{status:'ready',lastWeight:200,weight:210,min:8,max:12},readiness:{mode:'BUILD'},memory:{samples:6,progression:'cautious',style:'conservative'}}, 'HOLD',200],
 ['user adjusted memory rep focus', {progression:{status:'ready',lastWeight:100,weight:105,min:10,max:15},readiness:{mode:'BUILD'},memory:{samples:7,progression:'normal',style:'user-adjusted'}}, 'REP FOCUS',100],
 ['control blocks increase', {progression:{status:'ready',lastWeight:200,weight:210,min:8,max:12},readiness:{mode:'CONTROL'}}, 'HOLD',200],
 ['top reps without ready flag', {progression:{status:'hold',lastWeight:80,weight:80,min:8,max:12,lastReps:[12,11,10]},readiness:{mode:'BUILD'}}, 'REP FOCUS',80],
 ['early evidence holds', {progression:{status:'hold',lastWeight:80,weight:80,min:8,max:12,lastReps:[9,9,8]},readiness:{mode:'BUILD'},memory:{samples:2,progression:'supported',style:'coach-aligned'}}, 'HOLD',80],
];
for(const [name,input,expectedDecision,expectedWeight] of cases){const out=simulate(input);assert.strictEqual(out.decision,expectedDecision,`${name}: decision`);assert.strictEqual(out.weight,expectedWeight,`${name}: weight`);}

// Multi-week synthetic athlete: progression -> plateau -> fatigue -> recovery -> rebuild.
const timeline=[
 {progression:{status:'ready',lastWeight:100,weight:105,min:8,max:12},readiness:{mode:'BUILD'}},
 {progression:{status:'ready',lastWeight:105,weight:110,min:8,max:12},readiness:{mode:'BUILD'}},
 {progression:{status:'ready',lastWeight:110,weight:115,min:8,max:12},readiness:{mode:'BUILD'},plateau:true},
 {progression:{status:'ready',lastWeight:110,weight:115,min:8,max:12},readiness:{mode:'BUILD'},fatigueCount:2},
 {progression:{status:'ready',lastWeight:105,weight:110,min:8,max:12},readiness:{mode:'RECOVERY'}},
 {progression:{status:'hold',lastWeight:100,weight:100,min:8,max:12,lastReps:[9,9,8]},readiness:{mode:'BUILD'}},
 {progression:{status:'ready',lastWeight:100,weight:105,min:8,max:12},readiness:{mode:'BUILD'},memory:{samples:6,progression:'supported',style:'coach-aligned'}},
];
assert.deepStrictEqual(timeline.map(simulate).map(x=>x.decision),['INCREASE','INCREASE','REP FOCUS','REDUCE','RECOVERY','HOLD','INCREASE']);
console.log(`Coach simulation harness passed ${cases.length} policy scenarios + ${timeline.length}-week synthetic timeline.`);
