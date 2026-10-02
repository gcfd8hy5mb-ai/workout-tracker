const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const coach=fs.readFileSync('coach-engine.js','utf8');
const recovery=fs.readFileSync('coach-recovery-deload.js','utf8');
const names={chest:'Machine Chest Press',row:'Seated Row',legs:'Leg Press',shoulders:'Shoulder Press'};
const history=[];
let week=0;
const weeklySignals=[
  {load:'normal',days:4,reason:'Normal recovery and energy.'},
  {load:'progressive',days:4,reason:'Recovery and energy are strong.'},
  {load:'conservative',days:3,reason:'Fatigue is elevated and schedule is tighter.'},
  {load:'conservative',days:4,reason:'Accumulated fatigue is still elevated.'}
];
const program={
  1:{chest:[100,10],row:[120,10],legs:[220,10],shoulders:[70,10]},
  2:{chest:[105,10],row:[125,10],legs:[230,10],shoulders:[75,10]},
  3:{chest:[105,9],row:[125,9],legs:[235,10],shoulders:[75,9]},
  4:{chest:[105,9],row:[125,9],legs:[240,10],shoulders:[75,8]}
};
function addWeek(w){const p=program[w];const dates=[1,2,4,5].map(d=>`2026-09-${String((w-1)*7+d).padStart(2,'0')}`);const ids=['chest','row','legs','shoulders'];ids.forEach((id,i)=>history.push({date:dates[i],exercises:[{id,name:names[id],sets:[{weight:p[id][0],reps:p[id][1]},{weight:p[id][0],reps:Math.max(1,p[id][1]-1)},{weight:p[id][0],reps:Math.max(1,p[id][1]-1)}]}]}));}
function exerciseSessions(id){return history.filter(s=>s.exercises?.some(e=>e.id===id)).map(s=>s.exercises.find(e=>e.id===id));}
function progressionSuggestion(id){const rows=exerciseSessions(id);if(!rows.length)return null;const last=rows.at(-1),best=last.sets.reduce((a,b)=>a.reps>b.reps?a:b);const lastWeight=Number(best.weight);if(rows.length<2)return {status:'learning',lastWeight,range:{min:8,max:10}};if(best.reps>=10)return {status:'ready',weight:lastWeight+5,lastWeight,range:{min:8,max:10},action:'increase_weight'};return {status:'hold',lastWeight,range:{min:8,max:10}};}
function plateauAnalyze(){const out=[];for(const id of Object.keys(names)){const rows=exerciseSessions(id);if(rows.length<4)continue;const last4=rows.slice(-4).map(e=>{const s=e.sets.reduce((a,b)=>a.reps>b.reps?a:b);return {weight:Number(s.weight),reps:Number(s.reps)}});const first=last4[0],last=last4[3];const score=x=>x.weight*(1+x.reps/30);const gain=(score(last)-score(first))/score(first);if(gain<.02)out.push({id,name:names[id],reason:'Four comparable exposures without at least 2% estimated performance improvement.'});}return out;}
const ctx={console,Math,Number,String,Date,Map,JSON,window:{workoutHistory:history,workoutGoals:{days:4},PRISM_GOAL_NAMES:{maintain:'Maintain'}},workoutHistory:history,getExercise:id=>({name:names[id]||id}),progressionSuggestion,prismPlateauAnalyze:plateauAnalyze,prismActivePhase:()=>({id:'phase-1',type:'maintain',startDate:'2026-09-01'}),prismMeasurementRead:()=>[],prismWeeklySummaryData:()=>({workouts:4,sets:12}),prismCheckinCurrent:()=>weeklySignals[week-1],prismCheckinCoachSignal:x=>x,prismAthleteCoachContext:()=>({goal:'hypertrophy',priority:'time',equipment:'mostly_machines',days:4,sessionMinutes:45,summary:'Hypertrophy, 4 days, mostly machines, 45 minutes'}),canAccessFeature:()=>true,escapeHTML:v=>String(v),escapeAttribute:v=>String(v),document:{getElementById:()=>null,createElement:()=>({})},showOverallProgress:function(){},localStorage:{getItem:()=>null,setItem:()=>{}}};
vm.createContext(ctx);vm.runInContext(coach,ctx);
const report=[];
for(week=1;week<=4;week++){
  addWeek(week);
  const before=JSON.stringify(history);const r=ctx.prismCoachAnalyze();assert.equal(JSON.stringify(history),before,'Coach must not mutate simulated history');
  report.push({week,top:r.decisions[0]?.title||null,decisions:r.decisions.map(d=>({source:d.source,title:d.title,action:d.action,target:d.meta?.targetWeight||null}))});
}
assert.ok(report[0].decisions.some(d=>d.source==='smart_progression'),'Week 1 should begin producing performance-based guidance.');
assert.ok(report[1].decisions.some(d=>d.source==='smart_progression'&&/Progress/.test(d.title)),'Week 2 should progress exercises that reached the threshold.');
assert.equal(report[2].top,'Prioritize recovery this week','Week 3 elevated fatigue should outrank load progression.');
assert.ok(report[2].decisions.some(d=>d.title.includes('Plan around 3 training days')),'Week 3 should adapt to reduced schedule availability.');
assert.ok(report[3].decisions.some(d=>d.source==='plateau_detection'),'Week 4 should surface plateau detection after repeated flat exposures.');
assert.ok(report[3].decisions.some(d=>d.source==='coach_checkin'),'Week 4 should still account for recovery context.');

const store={prismSessionFatigueV1:JSON.stringify([{fatigue:'high'},{fatigue:'recovery'},{fatigue:'moderate'},{fatigue:'moderate'}])};
const rc={console,Math,Number,String,Date,JSON,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},window:{prismCoachProgramReview:()=>({plateau:2,items:[1,2,3,4]}),dispatchEvent:()=>{}},CustomEvent:function(){}};rc.window.window=rc.window;vm.createContext(rc);vm.runInContext(recovery,rc);const recoveryResult=rc.window.prismCoachRecoveryAnalyze();assert.equal(recoveryResult.state,'deload_candidate');assert.equal(recoveryResult.recommendation.loadReductionPct,10);assert.equal(recoveryResult.recommendation.volumeReductionPct,25);assert.equal(recoveryResult.requiresApproval,true);
console.log('\n=== LIFTOVA COACH: 4-WEEK SYNTHETIC TRAINING SIMULATION ===');
for(const w of report){console.log(`\nWeek ${w.week} — top priority: ${w.top}`);w.decisions.forEach((d,i)=>console.log(`${i+1}. [${d.source}] ${d.title} -> ${d.action}${d.target?` (target ${d.target} lb)`:''}`));}
console.log(`\nRecovery engine after accumulated fatigue + 2 plateaus: ${recoveryResult.state}`);console.log(`Recommendation: ${recoveryResult.recommendation.title}; load -${recoveryResult.recommendation.loadReductionPct}%, volume -${recoveryResult.recommendation.volumeReductionPct}%; user approval required.`);console.log('\nMONTH SIMULATION: PASS');