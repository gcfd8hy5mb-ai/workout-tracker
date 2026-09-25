const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../advanced-analytics.js'),'utf8');
const RealDate=Date;
class FixedDate extends RealDate{constructor(...args){super(...(args.length?args:['2026-09-25T12:00:00']));}static now(){return new RealDate('2026-09-25T12:00:00').getTime();}}
const exercises={chest:{id:'chest',name:'Chest Press',muscle:'Chest'},row:{id:'row',name:'Seated Row',muscle:'Back'}};
const host={innerHTML:''};
const context={console,Map,Set,Math,Number,String,Date:FixedDate,workoutHistory:[],getExercise:id=>exercises[id]||null,sessionDay:s=>s.date,escapeHTML:v=>String(v),canAccessFeature:()=>true,showProPreview:()=>{},window:{},document:{getElementById:id=>id==='prismAdvancedAnalytics'?host:null,createElement:()=>({})},showOverallProgress:function(){}};
vm.createContext(context);vm.runInContext(source,context);
function ex(id,sets){return {id,sets:sets.map(([weight,reps])=>({weight,reps}))};}
function session(date,exercises){return {date,exercises};}
context.workoutHistory=[
 session('2026-09-25',[ex('chest',[[100,10],[100,8],[0,10]]),ex('row',[[80,10]])]),
 session('2026-09-01',[ex('chest',[[95,10]])]),
 session('2026-08-26',[ex('chest',[[90,10]]),ex('row',[[75,10]])]),
 session('2026-08-27',[ex('row',[[75,8]])]),
 session('2026-07-01',[ex('chest',[[50,10]])])
];
// Current window is Aug 27-Sep 25 inclusive; previous is Jul 28-Aug 26 inclusive.
const current=context.prismAnalyticsPeriodDays(30);assert.equal(current.length,3);assert.ok(current.some(x=>x.date==='2026-08-27'));assert.ok(!current.some(x=>x.date==='2026-08-26'));
const built=context.prismAnalyticsBuild();assert.equal(built.current.workouts,3);assert.equal(built.previous.workouts,1);assert.equal(built.current.sets,5);assert.equal(built.current.volume,100*10+100*8+80*10+95*10+75*8);
// Zero/invalid sets are excluded.
assert.equal(context.prismAnalyticsTotals([session('2026-09-25',[ex('chest',[[100,10],[0,10],[50,5]])])]).sets,2);
// Muscle totals stay separated and ordered by volume.
const chest=built.muscles.find(x=>x.muscle==='Chest'),back=built.muscles.find(x=>x.muscle==='Back');assert.equal(chest.sets,3);assert.equal(chest.volume,2750);assert.equal(back.sets,2);assert.equal(back.volume,1400);
// Exercise series is chronological even when workoutHistory is newest-first/mixed.
const series=context.prismAnalyticsExerciseSeries('chest');assert.deepEqual(Array.from(series,x=>x.day),['2026-07-01','2026-08-26','2026-09-01','2026-09-25']);
const leader=built.leaders.find(x=>x.id==='chest');assert.ok(leader);assert.ok(leader.change>90);
// Missing/zero previous volume never produces Infinity or NaN.
assert.match(context.prismAnalyticsDelta(1000,0,'volume'),/No previous/);assert.doesNotMatch(context.prismAnalyticsDelta(1000,0,'volume'),/Infinity|NaN/);
// Free gating hides detailed numbers; Pro gets them.
context.canAccessFeature=()=>false;context.prismAnalyticsRender();assert.match(host.innerHTML,/PRISM PRO/);assert.match(host.innerHTML,/Preview Advanced Analytics/);assert.doesNotMatch(host.innerHTML,/2750/);
context.canAccessFeature=()=>true;context.prismAnalyticsRender();assert.match(host.innerHTML,/Last 30 days/);assert.match(host.innerHTML,/Muscle workload/);assert.match(host.innerHTML,/Exercise progression/);assert.match(host.innerHTML,/Chest/);
// Built-in calculation sanity check passes.
const self=context.prismAnalyticsSelfTest();assert.equal(self.ok,true,JSON.stringify(self.failures));
// Analytics must be read-only.
const snapshot=JSON.stringify(context.workoutHistory);context.prismAnalyticsBuild();context.prismAnalyticsExerciseLeaders();context.prismAnalyticsRender();assert.equal(JSON.stringify(context.workoutHistory),snapshot);
console.log('PRISM Advanced Analytics windows, totals, muscles, progression, gating, and data safety: OK');