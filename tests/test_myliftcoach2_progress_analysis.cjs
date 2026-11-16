/* Run with: node --test tests/test_myliftcoach2_progress_analysis.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const {analyze}=require('../myliftcoach2/progress-analysis.js');
test('summarizes original completed sessions and exercise records',()=>{
 const rows=[{id:1,date:'2026-11-10T12:00:00.000Z',exercises:[{id:'press',name:'Chest Press',sets:[{weight:100,reps:8},{weight:110,reps:5}]}]}];
 const result=analyze(rows);assert.equal(result.sessions,1);assert.equal(result.sets,2);assert.equal(result.volume,1350);
 assert.equal(result.records[0].weight,110);assert.equal(result.records[0].reps,8);
 assert.equal(result.records[0].setVolume,800);
});
test('ignores incomplete sets and never mutates input',()=>{
 const rows=[{date:'2026-11-10',exercises:[{id:'press',sets:[{weight:'',reps:'10'},{weight:75,reps:0},{weight:80,reps:12}]}]}];
 const before=JSON.stringify(rows),result=analyze(rows);
 assert.equal(result.sets,1);assert.equal(result.records[0].estimatedOneRepMax,0);assert.equal(JSON.stringify(rows),before);
});
test('does not mix practice data or duplicate exercise records',()=>{
 const result=analyze([{date:'2026-11-10',exercises:[{id:'row',sets:[{weight:50,reps:10}]}]},{date:'2026-11-11',exercises:[{id:'row',sets:[{weight:55,reps:8}]}]}]);
 assert.equal(result.sessions,2);assert.equal(result.exercises,1);assert.equal(result.trainingDays,2);
});
