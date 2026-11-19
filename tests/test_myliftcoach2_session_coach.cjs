const test=require('node:test');
const assert=require('node:assert/strict');
const coach=require('../myliftcoach2/session-coach.js');
test('original workout warm-ups use 40 60 80 percent with 5 lb rounding',()=>{
 assert.deepEqual(coach.warmups(100),[{weight:40,reps:8},{weight:60,reps:5},{weight:80,reps:3}]);
 assert.deepEqual(coach.warmups(0),[]);
 assert.deepEqual(coach.warmups(''),[]);
 assert.deepEqual(coach.warmups(-5),[]);
});
test('original progressive overload equipment step offers suggestion without mutating history',()=>{
 const sets=[{weight:100,reps:10},{weight:100,reps:10}];
 const history=[{date:'2026-11-14',exercises:[{id:'leg-press',sets}]},{date:'2026-11-13',exercises:[{id:'leg-press',sets}]}];
 const before=JSON.stringify(history);
 const result=coach.coach(history,'leg-press','Leg Press');
 assert.equal(result.status,'ready');
 assert.equal(result.action,'increase');
 assert.equal(result.weight,105);
 assert.equal(JSON.stringify(history),before);
});
test('original metadata ranks same-pattern same-equipment alternatives first',()=>{
 const catalog=[
  {id:'machine-chest-press',name:'Chest Press',muscle:'Chest'},
  {id:'chest-press-cable',name:'Cable Chest Press',muscle:'Chest'},
  {id:'smith-bench-press',name:'Smith Bench Press',muscle:'Chest'},
  {id:'seated-row',name:'Row',muscle:'Back'}
 ];
 const ranked=coach.rankedAlternatives('machine-chest-press',['machine-chest-press'],catalog);
 assert.deepEqual(ranked.map(x=>x.id),['smith-bench-press','chest-press-cable']);
 assert.ok(ranked.every(x=>x.score>=100));
 assert.deepEqual(coach.rankedAlternatives('machine-chest-press',['machine-chest-press','smith-bench-press'],catalog).map(x=>x.id),['chest-press-cable']);
});

test('Coach progression uses real 2.0 completed workouts without requiring legacy account import',()=>{
 const exerciseId='leg-press';
 const rows=[
  {id:'new',created:'2026-11-15T15:00:00Z',sets:[{exerciseId,weight:160,reps:10},{exerciseId,weight:160,reps:10}]},
  {id:'old',created:'2026-11-12T15:00:00Z',sets:[{exerciseId,weight:155,reps:9},{exerciseId,weight:155,reps:10}]}
 ];
 const before=JSON.stringify(rows),result=coach.localProgression(rows,exerciseId,'Leg Press');
 assert.equal(result.status,'ready');assert.equal(result.action,'increase');
 assert.equal(result.weight,165);assert.equal(JSON.stringify(rows),before);
 assert.equal(coach.localProgression(rows,'seated-row','Row').status,'insufficient');
});
test('Coach refuses incomplete local practice evidence rather than inventing a target',()=>{
 const rows=[{id:'only',created:'2026-11-15T15:00:00Z',sets:[{exerciseId:'leg-press',weight:160,reps:10}]}];
 assert.equal(coach.localProgression(rows,'leg-press','Leg Press').status,'insufficient');
});

test('Coach never counts incomplete or malformed sets as qualifying progression evidence',()=>{
 const exerciseId='leg-press';
 const history=[
  {created:'2026-11-15T15:00:00Z',sets:[
   {exerciseId,weight:160,reps:10,completed:false},
   {exerciseId,weight:160,reps:10,completed:false}]},
  {created:'2026-11-12T15:00:00Z',sets:[
   {exerciseId,weight:155,reps:9},{exerciseId,weight:155,reps:10}]}
 ];
 const before=JSON.stringify(history);
 assert.equal(coach.localProgression(history,exerciseId,'Leg Press').status,'insufficient');
 assert.equal(JSON.stringify(history),before);
});
test('Coach rejects non-finite working sets without discarding other valid sessions',()=>{
 const exerciseId='leg-press';
 const history=[
  {created:'2026-11-15T15:00:00Z',sets:[
   {exerciseId,weight:'Infinity',reps:10},
   {exerciseId,weight:160,reps:10},
   {exerciseId,weight:160,reps:10}]},
  {created:'2026-11-12T15:00:00Z',sets:[
   {exerciseId,weight:155,reps:9},{exerciseId,weight:155,reps:10}]}
 ];
 const result=coach.localProgression(history,exerciseId,'Leg Press');
 assert.equal(result.status,'ready');
 assert.equal(result.weight,165);
});
