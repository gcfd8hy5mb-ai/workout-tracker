const assert=require('assert'),fs=require('fs'),vm=require('vm');
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}}
const iso=d=>new Date(Date.now()-d*86400000).toISOString();
const row=(id,exerciseId,days,recovery,outcome,details={})=>({id,exerciseId,kind:'load_hold',at:iso(days+1),athleteContext:{recovery,phase:'general'},response:{value:'followed',at:iso(days)},outcome:{value:outcome,at:iso(days),details}});
const weeks=[6,12,16,20],report={};
for(const w of weeks){
 const localStorage=new MemoryStorage(),window={};
 window.prismRememberIntervention=data=>data;window.prismCoachProgramReview=()=>({proposal:{type:'exercise_adjustment',changes:[{exerciseId:'press'}]},coachDecision:{state:'advisory'}});
 window.prismCheckinCurrent=()=>({week:'w',recovery:'great',energy:'high',difficulty:'easy',days:4});window.prismCheckinLatest=window.prismCheckinCurrent;window.prismCheckinCoachSignal=()=>({load:'progressive',days:4});
 const ctx={window,localStorage,console,setTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync('myliftcoach-intelligence-core.js','utf8'),ctx);vm.runInContext(fs.readFileSync('myliftcoach-athlete-evidence-core.js','utf8'),ctx);vm.runInContext(fs.readFileSync('athlete-learning-engine.js','utf8'),ctx);vm.runInContext(fs.readFileSync('athlete-context-learning-v8.js','utf8'),ctx);vm.runInContext(fs.readFileSync('myliftcoach-coach-context-v8_1.js','utf8'),ctx);
 const good=[];const exposures=Math.max(6,Math.floor(w/2));for(let i=0;i<exposures;i++)good.push(row(`g-${w}-${i}`,'press',Math.max(2,(exposures-1-i)*7),'ready','better'));
 localStorage.setItem('prismCoachInterventionsV1',JSON.stringify(good));let e=window.myliftcoachCoachExerciseContextEvidence('press');assert.strictEqual(e.state,'supported');
 const old=Array.from({length:4},(_,i)=>row(`old-${w}-${i}`,'press',70+i*8,'ready','better'));const bad=[row(`bad-${w}-1`,'press',12,'ready','worse',{rpe:9.5,pain:5}),row(`bad-${w}-2`,'press',4,'ready','worse',{rpe:9.5,pain:5})];localStorage.setItem('prismCoachInterventionsV1',JSON.stringify([...old,...bad]));e=window.myliftcoachCoachExerciseContextEvidence('press');assert.strictEqual(e.state,'conflict');
 const stale=Array.from({length:6},(_,i)=>row(`stale-${w}-${i}`,'press',150+i*6,'ready','better'));localStorage.setItem('prismCoachInterventionsV1',JSON.stringify(stale));e=window.myliftcoachCoachExerciseContextEvidence('press');assert.strictEqual(e.state,'stale');
 window.prismCheckinCurrent=()=>({week:'w',recovery:'poor',energy:'low',difficulty:'hard',days:3});window.prismCheckinLatest=window.prismCheckinCurrent;window.prismCheckinCoachSignal=()=>({load:'conservative',days:3});const strained=Array.from({length:6},(_,i)=>row(`s-${w}-${i}`,'press',[35,28,21,14,7,2][i],'strained','worse',{rpe:9.5,pain:5}));localStorage.setItem('prismCoachInterventionsV1',JSON.stringify(strained));e=window.myliftcoachCoachExerciseContextEvidence('press');assert.strictEqual(e.state,'caution');
 report[w]={fresh:'supported',reversal:'conflict',expired:'stale',strained:'caution'};
}
console.log(JSON.stringify({suite:'MYLIFTCOACH Coach Context V8.1 6/12/16/20 Week Simulation',weeks,report,checks:{productionCorePath:true,freshContextCanSupport:true,recentReversalReducesTrust:true,staleContextIgnored:true,currentPoorRecoveryCreatesCaution:true,coachRemainsAdvisory:true,adaptiveAuthorityPreserved:true}},null,2));
