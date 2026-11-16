const test=require('node:test'),assert=require('node:assert/strict');
const dashboard=require('../myliftcoach2/coach-dashboard.js');
const catalog=[{id:'leg-press',name:'Leg Press',group:'Legs'},{id:'seated-row',name:'Seated Row',group:'Back'}];
const local=[
 {id:'recent',created:'2026-11-15T15:00:00Z',sets:[{exerciseId:'leg-press',weight:150,reps:10},{exerciseId:'leg-press',weight:150,reps:10}]},
 {id:'older',created:'2026-11-12T15:00:00Z',sets:[{exerciseId:'leg-press',weight:145,reps:8},{exerciseId:'leg-press',weight:145,reps:9}]}
];
const original=[
 {date:'2026-11-14T15:00:00Z',exercises:[{id:'seated-row',sets:[{weight:100,reps:10},{weight:100,reps:10}]}]},
 {date:'2026-11-10T15:00:00Z',exercises:[{id:'seated-row',sets:[{weight:95,reps:8},{weight:95,reps:9}]}]}
];
test('Coach uses local sessions for actual recommended weight and never edits original records',()=>{
 const before=JSON.stringify({local,original,catalog});
 const result=dashboard.recommendations({localSessions:local,originalSessions:original,legacyVerified:false,catalog});
 assert.equal(result.length,1);assert.equal(result[0].name,'Leg Press');
 assert.equal(result[0].source,'2.0 completed workouts');assert.equal(result[0].action,'increase');
 assert.equal(result[0].weight,155);
 assert.equal(JSON.stringify({local,original,catalog}),before);
});
test('unverified original sessions are not surfaced or used',()=>{
 const hidden=dashboard.recommendations({originalSessions:original,catalog,legacyVerified:false});
 assert.deepEqual(hidden,[]);
 const verified=dashboard.recommendations({originalSessions:original,catalog,legacyVerified:true});
 assert.equal(verified.length,1);assert.equal(verified[0].source,'Verified original history');
 assert.equal(verified[0].id,'seated-row');assert.equal(verified[0].weight,105);
});
test('mixed local and original history shows separate sources and unknown exercises excluded',()=>{
 const result=dashboard.recommendations({localSessions:local,originalSessions:original,legacyVerified:true,catalog});
 assert.deepEqual(new Set(result.map(x=>x.source)),new Set(['2.0 completed workouts','Verified original history']));
 assert.equal(result.length,2);
});
test('insufficient history does not invent a weight or false progress',()=>{
 const rows=[{id:'single',created:'2026-11-15T12:00:00Z',sets:[{exerciseId:'leg-press',weight:100,reps:10}]}];
 const result=dashboard.recommendations({localSessions:rows,catalog});
 assert.equal(result.length,1);assert.equal(result[0].status,'insufficient');
 assert.equal(result[0].weight,null);assert.equal(result[0].source,null);
});
test('empty or malformed source yields no bogus recommendations',()=>{
 assert.deepEqual(dashboard.recommendations({catalog}),[]);
 assert.deepEqual(dashboard.recommendations({localSessions:[{created:'invalid',sets:[{exerciseId:'leg-press',weight:400,reps:8}]}],catalog}),[]);
});
