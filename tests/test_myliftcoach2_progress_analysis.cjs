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

test('incomplete original sets are excluded from records and real-history chart',()=>{
 const {analyze,volumeSeries}=require('../myliftcoach2/progress-analysis.js');
 const history=[{date:'2026-11-11T12:00:00Z',exercises:[{id:'row',name:'Row',sets:[
  {weight:100,reps:10,completed:false},{weight:60,reps:8,completed:true}
 ]}]}];
 const before=JSON.stringify(history),result=analyze(history);
 assert.equal(result.sets,1);
 assert.equal(result.volume,480);
 assert.equal(result.records[0].weight,60);
 assert.deepEqual(volumeSeries(history).map(x=>x.volume),[480]);
 assert.equal(JSON.stringify(history),before);
});

test('original training calendar groups distinct completed sessions by ISO month and day',()=>{
 const {calendarDays}=require('../myliftcoach2/progress-analysis.js');
 const rows=[
  {date:'2026-11-13T12:00:00Z',workoutTitle:'Upper',exercises:[{sets:[{weight:100,reps:8}]}]},
  {date:'2026-11-13T20:00:00Z',workoutTitle:'Cardio & Core',exercises:[{sets:[{weight:20,reps:10}]}]},
  {date:'2026-11-10T12:00:00Z',workoutTitle:'Lower',exercises:[{sets:[{weight:200,reps:5,completed:false},{weight:100,reps:5}]}]},
  {date:'2026-12-01T12:00:00Z',workoutTitle:'December',exercises:[{sets:[{weight:300,reps:4}]}]},
  {date:'2026-11-19T12:00:00Z',workoutTitle:'Not completed',exercises:[{sets:[{weight:300,reps:4,completed:false}]}]}
 ];
 const raw=JSON.stringify(rows),result=calendarDays(rows,'2026-11');
 assert.deepEqual(result.map(x=>x.date),['2026-11-13','2026-11-10']);
 assert.equal(result[0].workouts,2);
 assert.equal(result[0].volume,1000);
 assert.deepEqual(result[0].titles,['Upper','Cardio & Core']);
 assert.equal(result[1].volume,500);
 assert.equal(calendarDays(rows,'2026-13').length,0);
 assert.equal(calendarDays(rows,'2026-12').length,1);
 assert.equal(JSON.stringify(rows),raw);
});

test('original exercise trend uses the selected exercise and completed sets only',()=>{
 const {exerciseTrend}=require('../myliftcoach2/progress-analysis.js');
 const history=[
  {date:'2026-11-15T12:00:00Z',exercises:[{id:'press',sets:[{weight:110,reps:8},{weight:200,reps:10,completed:false}]},{id:'row',sets:[{weight:300,reps:8}]}]},
  {date:'2026-11-12T12:00:00Z',exercises:[{id:'press',sets:[{weight:100,reps:10},{weight:105,reps:8}]}]},
  {date:'2026-11-13T12:00:00Z',exercises:[{id:'press',sets:[{weight:0,reps:10},{weight:130,reps:5,completed:false}]}]},
  {date:'bad',exercises:[{id:'press',sets:[{weight:500,reps:8}]}]}
 ];
 const before=JSON.stringify(history),trend=exerciseTrend(history,'press');
 assert.deepEqual(trend.map(x=>x.date),['2026-11-12','2026-11-15']);
 assert.deepEqual(trend.map(x=>x.bestWeight),[105,110]);
 assert.deepEqual(trend.map(x=>x.volume),[1840,880]);
 assert.equal(trend[0].sets,2);
 assert.equal(exerciseTrend(history,'row').length,1);
 assert.equal(exerciseTrend(history,'unknown').length,0);
 assert.equal(JSON.stringify(history),before);
});
test('original exercise trend caps displayed workout count without modifying stored history',()=>{
 const {exerciseTrend}=require('../myliftcoach2/progress-analysis.js');
 const history=Array.from({length:15},(_,i)=>({date:new Date(Date.UTC(2026,9,i+1)).toISOString(),exercises:[{id:'press',sets:[{weight:i+10,reps:8}]}]}));
 assert.equal(exerciseTrend(history,'press').length,12);
 assert.equal(exerciseTrend(history,'press',3).length,3);
 assert.equal(exerciseTrend(history,'press',3)[0].bestWeight,22);
 assert.deepEqual(exerciseTrend(history,'',3),[]);
});
