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
