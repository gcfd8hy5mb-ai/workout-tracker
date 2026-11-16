const test=require('node:test'),assert=require('node:assert/strict');
const coach=require('../myliftcoach2/coach-review.js');
const row=(id,created,readiness,sets)=>({id,created,readiness,sets});
test('local Coach reports actual seven-day sets, days, workouts and readiness',()=>{
 const now=Date.parse('2026-11-16T18:00:00Z');
 const history=[
  row('one','2026-11-16T12:00:00Z','Great',[{exerciseId:'leg-press',weight:150,reps:10}]),
  row('two','2026-11-15T12:00:00Z','Tired',[{exerciseId:'seated-row',weight:100,reps:8},{exerciseId:'leg-press',weight:0,reps:8}]),
  row('old','2026-10-10T12:00:00Z','Normal',[{exerciseId:'leg-press',weight:100,reps:10}]),
  row('future','2026-11-17T12:00:00Z','Normal',[{exerciseId:'leg-press',weight:200,reps:10}])
 ];
 const before=JSON.stringify(history),result=coach.week(history,now);
 assert.equal(result.sessions,2);assert.equal(result.trainingDays,2);assert.equal(result.sets,2);
 assert.equal(result.volume,2300);assert.equal(result.movements,2);
 assert.deepEqual(result.readiness,{Great:1,Normal:0,Tired:1});
 assert.equal(JSON.stringify(history),before);
});
test('prior set excludes current completion, returns latest eligible local practice',()=>{
 const rows=[
  row('recent','2026-11-16T11:00:00Z','Normal',[{exerciseId:'press',weight:120,reps:9}]),
  row('older','2026-11-14T11:00:00Z','Normal',[{exerciseId:'press',weight:100,reps:10}])
 ];
 assert.equal(coach.priorSet(rows,'press').weight,120);
 assert.equal(coach.priorSet(rows,'press','recent').weight,100);
 assert.equal(coach.priorSet(rows,'row'),null);
});
test('original-style set comparison indicates improvement without overwriting targets',()=>{
 const previous={weight:100,reps:8};
 assert.deepEqual(coach.compare({weight:100,reps:9},previous),{label:'Improved from previous',direction:'up'});
 assert.equal(coach.compare({weight:100,reps:8},previous).direction,'same');
 assert.equal(coach.compare({weight:90,reps:7},previous).direction,'down');
 assert.equal(coach.compare({weight:100,reps:10},null).direction,'new');
 assert.equal(coach.compare({weight:100,reps:0},previous),null);
});
