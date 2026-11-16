/* Run: node --test tests/test_myliftcoach2_coach_evidence.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const {summarize}=require('../myliftcoach2/coach-evidence.js');
test('computes factual original-workout evidence without inventing recommendations',()=>{
 const history=[
 {date:'2026-11-10T15:00:00Z',workoutTitle:'Upper',exercises:[{id:'press',name:'Press',sets:[{weight:80,reps:10}]}]},
 {date:'2026-11-11T15:00:00Z',workoutTitle:'Upper',exercises:[{id:'press',name:'Press',sets:[{weight:90,reps:8}]}]}];
 const before=JSON.stringify(history),result=summarize(history);
 assert.equal(result.completedSessions,2);assert.equal(result.trainingDays,2);
 assert.equal(result.loggedSets,2);assert.equal(result.totalVolume,1520);
 assert.equal(result.movements[0].sessions,2);assert.equal(result.movements[0].bestWeight,90);
 assert.equal(result.latestTitle,'Upper');assert.equal(JSON.stringify(history),before);
 assert.equal(Object.hasOwn(result,'recommendation'),false);
});
test('ignores invalid set values and limits evidence to completed training',()=>{
 const out=summarize([{date:'2026-11-10',exercises:[{id:'press',sets:[{weight:0,reps:10},{weight:40,reps:0}]}]}]);
 assert.equal(out.loggedSets,0);assert.equal(out.movements.length,0);
});
test('handles empty training history without fabricating activity',()=>{
 const result=summarize([]);assert.equal(result.completedSessions,0);assert.equal(result.totalVolume,0);assert.equal(result.latestDate,null);
});

test('unfinished sets are excluded and original coach movement search does not mutate evidence',()=>{
 const {filterMovements}=require('../myliftcoach2/coach-evidence.js');
 const history=[{date:'2026-11-15',exercises:[
  {id:'press',name:'Chest Press',sets:[{weight:150,reps:8,completed:false},{weight:75,reps:8,completed:true}]},
  {id:'row',name:'Seated Row',sets:[{weight:200,reps:8,completed:false}]}
 ]}];
 const snapshot=JSON.stringify(history),summary=summarize(history);
 assert.equal(summary.loggedSets,1);
 assert.equal(summary.totalVolume,600);
 assert.equal(summary.movements.length,1);
 assert.equal(summary.movements[0].bestWeight,75);
 assert.deepEqual(filterMovements(summary.movements,' CHEST ').map(x=>x.id),['press']);
 assert.equal(filterMovements(summary.movements,'unmatched').length,0);
 assert.equal(JSON.stringify(history),snapshot);
});
