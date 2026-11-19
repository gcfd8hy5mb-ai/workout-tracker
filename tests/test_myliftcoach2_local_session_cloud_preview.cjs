const test=require('node:test'),assert=require('node:assert/strict');
const bridge=require('../myliftcoach2/local-session-cloud-preview.js');
const catalog=[{id:'leg-press',name:'Leg Press'},{id:'seated-leg-curl',name:'Seated Leg Curl'}];
const history=[{id:'old-1',date:'2026-11-15T12:00:00Z',workoutKey:'original',
 workoutTitle:'Original workout',exercises:[{id:'leg-press',name:'Leg Press',sets:[{set:1,weight:90,reps:10}]}]}];
const local={id:'demo-1795147200000',created:'2026-11-20T12:00:00Z',startedAt:Date.parse('2026-11-20T11:32:00Z'),
 title:'My Custom Legs',planId:'custom-legs',readiness:'Tired',
 sets:[{exerciseId:'leg-press',weight:155,reps:9},{exerciseId:'seated-leg-curl',weight:90,reps:10},{exerciseId:'leg-press',weight:155,reps:10}]};
test('stable conversion preserves exact exercise IDs, set order, weights, duration and readiness',async()=>{
 const before=JSON.stringify({history,local}),p=await bridge.validateRoundTrip({
  owner:'account-1',verifiedOwner:'account-1',history,localWorkout:local,catalog});
 assert.equal(p.roundTripVerified,true);assert.equal(p.readyForProduction,false);
 assert.equal(p.sourceKey,'workoutHistoryV52');assert.equal(p.historyBefore,1);assert.equal(p.historyAfter,2);
 assert.equal(p.session.id,'mlc2-demo-1795147200000');assert.equal(p.session.durationMinutes,28);
 assert.equal(p.session.readiness,'Tired');assert.equal(p.session.workoutKey,'custom-legs');
 assert.deepEqual(p.session.exercises.map(x=>x.id),['leg-press','seated-leg-curl']);
 assert.deepEqual(p.session.exercises[0].sets.map(x=>x.reps),[9,10]);
 assert.equal(JSON.stringify({history,local}),before);
});
test('preview ID is deterministic and previous cloud copy cannot be duplicated',()=>{
 const args={owner:'account-1',verifiedOwner:'account-1',history,localWorkout:local,catalog};
 const p=bridge.prepare(args);assert.equal(bridge.prepare(args).proposedId,p.proposedId);
 assert.throws(()=>bridge.prepare({...args,history:[{id:p.proposedId},...history]}),/Duplicate session ID/);
});
test('wrong owner, missing evidence and bad exercise are rejected without changes',()=>{
 const args={owner:'account-1',verifiedOwner:'account-1',history,localWorkout:local,catalog};
 assert.throws(()=>bridge.prepare({...args,verifiedOwner:'account-2'}),/owner/);
 assert.throws(()=>bridge.prepare({...args,history:null}),/history/);
 assert.throws(()=>bridge.prepare({...args,localWorkout:{...local,sets:[{exerciseId:'unknown',weight:100,reps:10}]}}),/Unknown exercise/);
 assert.throws(()=>bridge.prepare({...args,localWorkout:{...local,id:'arbitrary-id'}}),/identifier/);
});
test('invalid completed timestamps, zero or impossible sets never generate cloud candidate',()=>{
 const args={owner:'account-1',verifiedOwner:'account-1',history,localWorkout:local,catalog};
 assert.throws(()=>bridge.prepare({...args,localWorkout:{...local,created:'invalid'}}),/timestamp/);
 assert.throws(()=>bridge.prepare({...args,localWorkout:{...local,sets:[]}}),/sets/);
 assert.throws(()=>bridge.prepare({...args,localWorkout:{...local,sets:[{exerciseId:'leg-press',weight:0,reps:10}]}}),/Invalid completed set/);
});
