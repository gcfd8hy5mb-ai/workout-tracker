/* Run: node --test tests/test_myliftcoach2_progression_preview.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const {suggest}=require('../myliftcoach2/progression-preview.js');
const row=(date,sets)=>({date,exercises:[{id:'press',sets}]});
test('requires two qualifying sessions with at least two top-weight working sets',()=>{
 assert.equal(suggest([row('2026-11-10',[{weight:100,reps:10}])],'press').status,'insufficient');
 const two=[row('2026-11-10',[{weight:100,reps:8},{weight:100,reps:9}]),row('2026-11-09',[{weight:95,reps:8},{weight:95,reps:8}])];
 assert.equal(suggest(two,'press').status,'ready');
});
test('previews increase if all latest working sets reach target maximum',()=>{
 const h=[row('2026-11-10',[{weight:100,reps:10},{weight:100,reps:10}]),row('2026-11-09',[{weight:100,reps:9},{weight:100,reps:8}])];
 assert.deepEqual([suggest(h,'press').action,suggest(h,'press').weight],['increase',105]);
});
test('previews reduction after two low-rep sessions at same top weight',()=>{
 const h=[row('2026-11-10',[{weight:100,reps:5},{weight:100,reps:6}]),row('2026-11-09',[{weight:100,reps:6},{weight:100,reps:7}])];
 assert.deepEqual([suggest(h,'press').action,suggest(h,'press').weight],['reduce',95]);
});
test('holds weight otherwise; leaves input unchanged',()=>{
 const h=[row('2026-11-10',[{weight:100,reps:8},{weight:100,reps:9}]),row('2026-11-09',[{weight:95,reps:8},{weight:95,reps:9}])];
 const snapshot=JSON.stringify(h);assert.equal(suggest(h,'press').action,'hold');assert.equal(JSON.stringify(h),snapshot);
});
