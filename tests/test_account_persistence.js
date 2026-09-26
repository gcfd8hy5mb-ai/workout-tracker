const assert=require('node:assert/strict');
const fs=require('node:fs');
const model=require('../persistence/storage-model.js');
const {plan,assertOwner}=require('../persistence/reconcile.js');
const {migrate}=require('../persistence/account-sync.js');
const asRaw=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,JSON.stringify(v)]));
const fixture={
 prismLocalProfileV1:{displayName:'Tester',avatarId:'blue',userId:null,onboardingComplete:true},
 prismJourneyV1:{status:'complete',draft:{units:'kg'}},
 workoutGoalsV1:{goal:'muscle',days:4},
 prismGoalPhasesV1:[{id:'phase1',type:'cut',startDate:'2026-09-01',endDate:'2026-10-01'}],
 dailyTrackingV1:{water:[{id:'w',amount:250}],food:[],weight:[{id:'b',day:'2026-09-01',value:180}],waterGoal:2000,preferredWeightUnit:'kg',manualTargets:{press:90},calendarNotes:{'2026-09-01':'rest'},futurePreference:'retain'},
 customWorkoutsV5:[{id:1,name:'Upper',exercises:['press','row']}],
 workoutHistoryV52:[{id:1,date:'2026-09-01',recordIds:['press'],durationMinutes:40,exercises:[{id:'press',name:'Press',sets:[{set:1,weight:'100',reps:'10'},{set:2,weight:100,reps:9}]}]}],
 setHistoryV5:{'custom-1-press-set1':{weight:'100',reps:'10',done:true}},
 previousHistoryV51:{'custom-1-press-set1':{weight:'95',reps:'10'}},
 completedExercisesV5:['day1-press'],overloadTargetsV1:{press:105},
 prismActiveWorkoutV1:{key:'custom-1',ids:['press'],index:0,startedAt:123},
 prismAthleteProfileV1:{experience:'intermediate',days:4},
 prismCoachActionsV1:{a:{status:'applied',updatedAt:'2026-09-01'}},
 prismCoachCheckinsV1:[{week:'2026-09-01',energy:'normal'}],
 prismAdaptiveProgrammingV1:{accepted:{a:{proposal:{id:'a',type:'load'},acceptedAt:'2026-09-01'}},dismissed:{}},
 prismSessionFatigueV1:[{at:'2026-09-01T00:00:00Z',exerciseId:'press',fatigue:'high'}],
 prismCoachFeedbackV1:[{at:'2026-09-01T00:00:00Z',exerciseId:'press',response:'followed'}],
 prismCoachInterventionsV1:[{id:'i',kind:'adaptive_set',target:{weight:100},response:{value:'followed',at:'2026-09-01'},outcome:{value:'better',details:{reps:11}}}],
 prismPostWorkoutCoachV1:[{id:1,sets:2,volume:1900}],
 prismCoachSessionReflectionsV1:[{sessionId:1,feel:'good',at:'2026-09-01'}],
 prismSessionReadinessV1:{date:'2026-09-01',energy:3},
 prismAskHistoryV1:[{id:'ask1',question:'Next?',answer:'Hold'}],
 prismMeasurementsV1:[{id:'m1',date:'2026-09-01',weight:180,waist:32}],
 prismProBetaFeedbackV1:{wouldPay:'maybe'},prismDrawerSectionsV1:{training:true}
};
function fakeTransport(){const accounts=new Map();return {accounts,read:async user=>structuredClone(accounts.get(user)||[]),write:async(user,rows)=>{
 const previous=accounts.get(user)||[],next=structuredClone(previous);
 for(const r of rows){const i=next.findIndex(x=>x.table===r.table&&x.id===r.id),old=next[i];assert.equal(old?.revision||0,r.expected_revision);
 const record={...r,user_id:user,revision:(old?.revision||0)+1};delete record.expected_revision;if(i<0)next.push(record);else next[i]=record;
 }accounts.set(user,next);return rows.map(r=>next.find(x=>x.id===r.id&&x.table===r.table));}};}
(async()=>{
 const raw={prismTimerAlertModeV1:'haptic_sound'};assert.deepEqual({...model.restoreSnapshot(await model.normalize(raw))},raw);
 const snapshot=asRaw(fixture),before=JSON.stringify(snapshot),rows=await model.normalize(snapshot);
 const restored=model.restoreSnapshot(rows);for(const [k,v]of Object.entries(fixture))assert.deepEqual(JSON.parse(restored[k]),v,k);
 assert.equal(JSON.stringify(snapshot),before,'normalization never mutates local data');
 assert.deepEqual(await model.normalize(snapshot),rows,'identities stable across reruns');
 // Exclude credentials, entitlements and synthetic settings, even if included in an old snapshot.
 const contaminated={...snapshot,...asRaw({prismSupabaseSessionV1:{access_token:'SECRET'},prismEntitlementV1:{tier:'lifetime_pro'},prismDeveloperTestModeV1:true})};
 assert.deepEqual(await model.normalize(contaminated),rows);
 const transport=fakeTransport();let result=await migrate({snapshot,owner:'A',userId:'A',transport});assert.equal(result.status,'verified');
 const count=(await transport.read('A')).length;
 result=await migrate({snapshot,owner:'A',userId:'A',transport});assert.equal(result.writes,0);assert.equal((await transport.read('A')).length,count);
 // Fresh device reconstructs actual legacy keys, including Coach and Adaptive sources.
 const secondDevice=model.restoreSnapshot(await transport.read('A'));for(const key of Object.keys(fixture))assert.deepEqual(JSON.parse(secondDevice[key]),fixture[key]);
 assert.deepEqual(await transport.read('B'),[]);assert.throws(()=>assertOwner('A','B'),/another user/);assert.throws(()=>assertOwner(null,'A'),/claimed/);
 // Divergent unknown-age cloud values require review, never a timestamp guess.
 const modified=asRaw({...fixture,prismLocalProfileV1:{...fixture.prismLocalProfileV1,displayName:'Changed'}});
 let decision=plan(await model.normalize(modified),await transport.read('A'));assert.equal(decision.ready,false);
 const base=await transport.read('A');decision=plan(await model.normalize(modified),base,base);assert.equal(decision.ready,true);assert.equal(decision.writes.length,1);
 result=await migrate({snapshot:modified,owner:'A',userId:'A',transport,checkpoint:base});assert.equal(result.status,'verified');
 // Old local device must take newer cloud change, not overwrite it.
 decision=plan(rows,await transport.read('A'),base);assert.equal(decision.writes.length,0);assert.equal(decision.ready,true);
 // Log truncation cannot erase the older cloud records.
 const short=asRaw({...fixture,prismCoachFeedbackV1:[]});decision=plan(await model.normalize(short),base);assert.equal(decision.merged.filter(x=>x.table==='coach_feedback').length,1);
 // Switching any tier cannot affect migration data: there is no entitlement gate in the adapter.
 for(const tier of ['pro','free','pro','lifetime_pro','beta'])assert.deepEqual(await model.normalize({...snapshot,prismEntitlementV1:JSON.stringify({tier})}),rows);
 const newFreeWorkout={...fixture,workoutHistoryV52:[...fixture.workoutHistoryV52,{...fixture.workoutHistoryV52[0],id:2,date:'2026-09-02'}]};
 const more=await migrate({snapshot:asRaw(newFreeWorkout),owner:'C',userId:'C',transport});assert.equal(JSON.parse(more.restoreCandidate.workoutHistoryV52).length,2);
 await assert.rejects(()=>migrate({snapshot,owner:'A',userId:'A',transport:{read:async()=>{throw Error('offline')}}}),/offline/);assert.equal(JSON.stringify(snapshot),before);
 await assert.rejects(()=>migrate({snapshot,owner:'A',userId:'A',transport,isCurrent:()=>false}),/Account changed/);
 await assert.rejects(()=>model.normalize({workoutHistoryV52:'broken'}),/Invalid JSON/);
 await assert.rejects(()=>model.normalize(asRaw({customWorkoutsV5:[fixture.customWorkoutsV5[0],fixture.customWorkoutsV5[0]]})),/Ambiguous duplicate/);
 await assert.rejects(()=>model.normalize({prismLocalProfileV1:'{"__proto__":{"polluted":true}}'}),/Unsafe/);
 const sql=fs.readFileSync(require('node:path').join(__dirname,'../supabase/migrations/202609260001_account_records.sql'),'utf8');
 for(const table of model.TABLES){assert.ok(sql.includes(`alter table public.prism_account_${table} force row level security`));assert.ok(sql.includes(`revoke all on public.prism_account_${table}`));}
 assert.match(sql,/security invoker/);assert.doesNotMatch(sql.replace(/--[^\n]*/g,''),/security definer/i);
 console.log('Account adapter: lossless roundtrip, Coach/Adaptive restoration, stable IDs, conflicts, tiers, ownership guard and failure safety OK. Live RLS is a separate deployment gate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
