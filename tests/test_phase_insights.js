const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../phase-insights.js'),'utf8');
const store={};const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}};
const exercises={chest:{name:'Chest Press'},row:{name:'Seated Row'}};
const context={console,Map,Math,Number,String,Date,localStorage,workoutHistory:[],getExercise:id=>exercises[id]||null,escapeHTML:v=>String(v),canAccessFeature:()=>true,showProPreview:()=>{},confirm:()=>true,alert:()=>{},window:{},document:{getElementById:()=>null,createElement:()=>({})},showOverallProgress:function(){},prismCurrentWeight:()=>200};
vm.createContext(context);vm.runInContext(source,context);
function ex(id,w,r){return {id,name:exercises[id].name,sets:[{weight:w,reps:r}]};}
function session(date,items){return {date,exercises:items};}
// Start phase and prevent overlapping active phases.
assert.equal(context.prismPhaseAdd('cut','2026-09-01',200,12),true);assert.equal(context.prismPhaseAdd('bulk','2026-09-02',199,12),false);let active=context.prismActivePhase();assert.equal(active.type,'cut');assert.equal(active.startWeight,200);assert.equal(active.plannedEndDate,'2026-11-24');
// Only workouts inside the phase are counted and repeated exercise performance is compared chronologically.
context.workoutHistory=[session('2026-08-31',[ex('chest',200,10)]),session('2026-09-02',[ex('chest',100,10),ex('row',100,10)]),session('2026-09-20',[ex('chest',110,10),ex('row',90,10)]),session('2026-10-01',[ex('chest',120,10)])];
let analyzed=context.prismPhaseAnalyze(active);assert.equal(analyzed.training.workouts,3);assert.equal(analyzed.training.sets,5);assert.equal(analyzed.training.volume,1000+1000+1100+900+1200);assert.equal(analyzed.improved[0].id,'chest');assert.ok(analyzed.improved[0].change>19);assert.equal(analyzed.declined[0].id,'row');
// Finish validation rejects a date before the phase start. Finishing on Sep 30 excludes the Oct 1 session.
assert.equal(context.prismPhaseFinish(190,'2026-08-30'),false);assert.ok(context.prismActivePhase());assert.equal(context.prismPhaseFinish(190,'2026-09-30'),true);assert.equal(context.prismActivePhase(),null);let phases=context.prismPhaseRead();assert.equal(phases[0].endWeight,190);assert.equal(phases[0].endDate,'2026-09-30');assert.equal(context.prismPhaseAnalyze(phases[0]).training.workouts,2);assert.equal(context.prismPhaseAnalyze(phases[0]).weightChange,-10);
// A new phase can begin after the prior phase is finished.
assert.equal(context.prismPhaseAdd('bulk','2026-10-01',190,8),true);assert.equal(context.prismActivePhase().type,'bulk');
// Invalid goal types never write data.
const beforeInvalid=JSON.stringify(context.prismPhaseRead());assert.equal(context.prismPhaseAdd('invalid','2026-10-02',190,8),false);assert.equal(JSON.stringify(context.prismPhaseRead()),beforeInvalid);
// Comparison describes differences without mutating phase history.
context.workoutHistory.push(session('2026-10-05',[ex('chest',120,10)]),session('2026-10-20',[ex('chest',125,10)]));context.prismPhaseFinish(195,'2026-10-31');phases=context.prismPhaseRead();const snapshot=JSON.stringify(phases);const comparison=context.prismPhaseCompare(phases[0],phases[1]);assert.equal(comparison.a.label,'Cut');assert.equal(comparison.b.label,'Bulk');assert.equal(JSON.stringify(context.prismPhaseRead()),snapshot);
// Free gating hides phase details.
const host={innerHTML:''};context.document={getElementById:id=>id==='prismPhaseInsights'?host:null,createElement:()=>({})};context.canAccessFeature=()=>false;context.prismPhaseRender();assert.match(host.innerHTML,/PRISM PRO/);assert.doesNotMatch(host.innerHTML,/190/);context.canAccessFeature=()=>true;context.prismPhaseRender();assert.match(host.innerHTML,/Start a new phase/);assert.match(host.innerHTML,/Phase history/);assert.match(host.innerHTML,/Phase comparison/);
console.log('PRISM Goal Phase start/finish, analysis, comparison, gating, and data safety: OK');