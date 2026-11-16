const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../myliftcoach2/session-summary.js');
test('summarizes actual recorded sets, local records, elapsed duration and readiness-linked entry',()=>{
 const earlier=[{id:'older',created:'2026-11-15T11:20:00Z',sets:[{exerciseId:'press',weight:90,reps:10},{exerciseId:'row',weight:70,reps:8}]}];
 const recent={id:'now',created:'2026-11-16T10:40:00Z',startedAt:Date.parse('2026-11-16T10:00:00Z'),sets:[
  {exerciseId:'press',weight:100,reps:9},{exerciseId:'press',weight:100,reps:8},
  {exerciseId:'row',weight:60,reps:10},{exerciseId:'row',weight:0,reps:10}]};
 const before=JSON.stringify({recent,earlier});
 const s=api.summarize(recent,earlier,[{id:'press',name:'Bench Press'},{id:'row',name:'Row'}]);
 assert.equal(s.durationMinutes,40);
 assert.equal(s.sets,3);
 assert.equal(s.volume,2300);
 assert.equal(s.recordCount,1);
 assert.deepEqual(s.movements.map(x=>[x.name,x.sets,x.topWeight,x.newPracticeRecord]),
  [['Bench Press',2,100,true],['Row',1,60,false]]);
 assert.equal(JSON.stringify({recent,earlier}),before);
});
test('older saved sessions without start times are not assigned fictional durations',()=>{
 const s=api.summarize({id:'old',created:'2026-11-16T12:00:00Z',sets:[]},[]);
 assert.equal(s.durationMinutes,null);
 assert.equal(s.volume,0);
 assert.equal(s.recordCount,0);
});
test('corrupt and unfinished sets cannot inflate session volume or records',()=>{
 const s=api.summarize({id:'recent',created:'2026-11-16T12:00:00Z',startedAt:0,sets:[
  {exerciseId:'press',weight:100,reps:0},{exerciseId:'press',weight:100,reps:NaN},
  {exerciseId:'press',weight:0,reps:10},{exerciseId:'press',weight:80,reps:10}]},[]);
 assert.equal(s.sets,1);assert.equal(s.volume,800);assert.equal(s.recordCount,1);
 assert.equal(s.durationMinutes,null);
});
