const test=require('node:test');
const assert=require('node:assert/strict');
const {compare,validSet}=require('../myliftcoach2/coach-activity-trend.js');
const NOW=Date.parse('2026-11-18T12:00:00Z');
const entry=(id,created,sets)=>({id,created,sets});
const valid={exerciseId:'leg-press',weight:100,reps:10};
test('compares actual trailing seven-day windows without inventing readiness',()=>{
 const sessions=[entry('now','2026-11-18T11:00:00Z',[valid,valid]),entry('prior','2026-11-08T11:00:00Z',[valid])];
 const out=compare(sessions,NOW);
 assert.equal(out.current.sessions,1);assert.equal(out.current.sets,2);
 assert.equal(out.previous.sessions,1);assert.equal(out.previous.sets,1);
 assert.equal(out.delta.sets,1);assert.equal(out.delta.volume,1000);
 assert.match(out.notes,/not a recovery/);
});
test('skips future, incomplete, nonfinite, and empty workouts',()=>{
 const data=[entry('future','2099-01-01T00:00:00Z',[valid]),
 entry('incomplete','2026-11-18T11:00:00Z',[{...valid,completed:false}]),
 entry('nan','2026-11-18T11:00:00Z',[{...valid,weight:'Infinity'}]),
 entry('empty','2026-11-18T11:00:00Z',[])];
 const out=compare(data,NOW);
 assert.equal(out.current.sessions,0);assert.equal(out.current.volume,0);
 assert.equal(validSet({...valid,weight:'Infinity'}),false);
});
test('deduplicates repeated session IDs and preserves source data',()=>{
 const data=[entry('copy','2026-11-18T11:00:00Z',[valid]),entry('copy','2026-11-18T11:00:00Z',[valid])];
 const before=JSON.stringify(data),out=compare(data,NOW);
 assert.equal(out.current.sessions,1);assert.equal(out.current.sets,1);
 assert.equal(JSON.stringify(data),before);
});
test('invalid time cannot silently produce a progress report',()=>{
 assert.throws(()=>compare([],NaN),/Invalid comparison time/);
});
