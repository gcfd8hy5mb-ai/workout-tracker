const test=require('node:test'),assert=require('node:assert/strict');
const {validate,roundTrip}=require('../myliftcoach2/save-preflight.js');
const catalog=[{id:'machine-chest-press',name:'Machine Chest Press'}];
const preview={title:'Upper A',planId:'upper-a',sets:[{exerciseId:'machine-chest-press',weight:90,reps:10}]};
const fixture={owner:'user-1',verifiedOwner:'user-1',baseline:[],latestHistory:[],previewWorkout:preview,catalog,proposedId:'mlc2-test-1',now:'2026-11-16T18:00:00.000Z'};
test('constructs compatible original format without writes',async()=>{
 const result=validate(fixture);
 assert.equal(result.readyForProduction,false);
 assert.equal(result.session.exercises[0].sets[0].weight,90);
 const checked=await roundTrip(result.candidate);
 assert.equal(checked.verified,true);assert.equal(checked.sessions,1);
});
test('refuses account changes, duplicate sessions or stale baseline',()=>{
 assert.throws(()=>validate({...fixture,verifiedOwner:'user-2'}),/owner/);
 assert.throws(()=>validate({...fixture,baseline:[{id:'prior'}]}),/History changed/);
 assert.throws(()=>validate({...fixture,baseline:[{id:'mlc2-test-1'}],latestHistory:[{id:'mlc2-test-1'}]}),/Duplicate/);
});
test('refuses invalid or unknown sets',()=>{
 assert.throws(()=>validate({...fixture,previewWorkout:{...preview,sets:[{exerciseId:'missing',weight:90,reps:10}]} }),/Unknown/);
 assert.throws(()=>validate({...fixture,previewWorkout:{...preview,sets:[{exerciseId:'machine-chest-press',weight:0,reps:10}]} }),/Invalid/);
});
test('does not mutate original history or preview data',()=>{
 const original=[{id:1,date:'2026-11-15T18:00:00Z',workoutTitle:'Earlier',exercises:[{id:'machine-chest-press',name:'Machine Chest Press',sets:[{set:1,weight:80,reps:10}]}]}];
 const input={...fixture,baseline:original,latestHistory:original};
 const before=JSON.stringify(input),result=validate(input);
 assert.equal(JSON.stringify(input),before);assert.equal(result.candidate.length,2);
});
