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

test('verified original volume trend is chronological and excludes incomplete sets',()=>{
 const {volumeSeries}=require('../myliftcoach2/progress-analysis.js');
 const rows=[
  {date:'2026-11-17T12:00:00Z',exercises:[{sets:[{weight:120,reps:5},{weight:0,reps:8}]}]},
  {date:'2026-11-15T12:00:00Z',exercises:[{sets:[{weight:100,reps:10}]}]},
  {date:'invalid',exercises:[{sets:[{weight:200,reps:10}]}]}
 ];
 const original=JSON.stringify(rows),series=volumeSeries(rows,2);
 assert.deepEqual(series.map(x=>x.date),['2026-11-15','2026-11-17']);
 assert.deepEqual(series.map(x=>x.volume),[1000,600]);
 assert.equal(series[1].sets,1);
 assert.equal(JSON.stringify(rows),original);
});
test('original trend is bounded and omits invalid histories',()=>{
 const {volumeSeries}=require('../myliftcoach2/progress-analysis.js');
 const rows=Array.from({length:15},(_,i)=>({date:new Date(Date.UTC(2026,10,i+1)).toISOString(),exercises:[{sets:[{weight:i+1,reps:10}]}]}));
 assert.equal(volumeSeries(rows).length,12);
 assert.equal(volumeSeries(rows,3).length,3);
 assert.deepEqual(volumeSeries([{date:'invalid',exercises:[]}]),[]);
});
