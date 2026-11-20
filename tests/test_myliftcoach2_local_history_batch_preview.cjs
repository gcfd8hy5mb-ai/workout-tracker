const test=require('node:test'),assert=require('node:assert/strict');
const batch=require('../myliftcoach2/local-history-batch-preview.js');
const single=require('../myliftcoach2/local-session-cloud-preview.js');
const owner='owner-a',catalog=[{id:'leg-press',name:'Leg Press'},{id:'seated-row',name:'Seated Row'}];
const local=(id,stamp,weight)=>({id:'demo-'+id,created:stamp,startedAt:Date.parse(stamp)-1800000,
 title:'Custom workout',planId:'custom-workout',readiness:'Great',
 sets:[{exerciseId:'leg-press',weight,reps:10},{exerciseId:'seated-row',weight:50,reps:9}]});
const a=local('200','2026-11-20T12:00:00Z',100),b=local('100','2026-11-19T12:00:00Z',90);
const old={id:'original-a',date:'2026-11-10T12:00:00Z',workoutKey:'legacy',
 workoutTitle:'Prior training',exercises:[{id:'leg-press',name:'Leg Press',sets:[{set:1,weight:80,reps:10}]}]};
const input=(changes={})=>({owner,verifiedOwner:owner,history:[old],localWorkouts:[a,b],catalog,...changes});
test('multiple completed local workouts preserve counts and original history without mutation',async()=>{
 const data=input(),before=JSON.stringify(data),r=await batch.inspect(data);
 assert.equal(r.newCount,2);assert.equal(r.alreadySavedCount,0);assert.equal(r.candidateCount,3);
 assert.deepEqual(r.items.map(x=>x.cloudId),['mlc2-demo-200','mlc2-demo-100']);
 assert.deepEqual(r.items.map(x=>x.sets),[2,2]);assert.equal(r.readyForProduction,false);
 assert.equal(JSON.stringify(data),before);
});
test('identical already-imported workout is recognized without duplicate candidate',async()=>{
 const saved=single.prepare({owner,verifiedOwner:owner,history:[],localWorkout:a,catalog}).session;
 const r=await batch.inspect(input({history:[saved,old]}));
 assert.equal(r.alreadySavedCount,1);assert.equal(r.newCount,1);assert.equal(r.candidateCount,3);
 assert.deepEqual(r.items.map(x=>x.status),['already-saved','new']);
});
test('matching ID with changed logged weight fails closed and cannot silently overwrite',async()=>{
 const saved=single.prepare({owner,verifiedOwner:owner,history:[],localWorkout:{...a,sets:[{exerciseId:'leg-press',weight:400,reps:10}]},catalog}).session;
 await assert.rejects(batch.inspect(input({history:[saved,old]})),/differs from the local workout/);
});
test('duplicate local or original identities block the full preview',async()=>{
 await assert.rejects(batch.inspect(input({localWorkouts:[a,a]})),/duplicated/);
 await assert.rejects(batch.inspect(input({history:[old,old]})),/duplicate/);
});
test('other owner and unknown exercise fail before generating candidate',async()=>{
 await assert.rejects(batch.inspect(input({verifiedOwner:'owner-b'})),/owner/);
 await assert.rejects(batch.inspect(input({localWorkouts:[{...a,sets:[{exerciseId:'unknown',weight:100,reps:10}]}]})),/Unknown exercise/);
});
test('no local workouts round-trips existing history without creating a save',async()=>{
 const r=await batch.inspect(input({localWorkouts:[]}));
 assert.equal(r.newCount,0);assert.equal(r.originalCount,1);assert.equal(r.candidateCount,1);
});

test('previously stored workout history above 100 sessions can be reviewed without truncation',async()=>{
 const many=Array.from({length:101},(_,i)=>({
  ...a,id:'demo-'+(1000+i),created:new Date(Date.parse('2026-11-20T12:00:00Z')-i*3600000).toISOString()
 }));
 const r=await batch.inspect(input({localWorkouts:many}));
 assert.equal(r.localCount,101);assert.equal(r.newCount,101);assert.equal(r.candidateCount,102);
 assert.equal(many.length,101);
});
