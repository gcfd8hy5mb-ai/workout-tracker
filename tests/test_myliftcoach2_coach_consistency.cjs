const test=require('node:test'),assert=require('node:assert/strict');
const {review}=require('../myliftcoach2/coach-consistency.js');
const id='leg-press',now=Date.parse('2026-11-18T18:00:00Z');
function session(day,weight,reps,completed=true){return {id:day,created:day+'T12:00:00Z',sets:[{exerciseId:id,weight,reps,completed},{exerciseId:id,weight,reps,completed}]}}
test('three consistent sessions surface repeated-load observation, not a plateau diagnosis',()=>{
 const rows=[session('2026-11-17',150,8),session('2026-11-12',150,8),session('2026-11-06',150,8)];
 const r=review(rows,id,now);assert.equal(r.status,'steady-load');assert.equal(r.sessions,3);assert.match(r.notes,/not a plateau diagnosis/);
});
test('increasing reps and load are distinguishable observations',()=>{
 const reps=[session('2026-11-17',150,10),session('2026-11-12',150,9),session('2026-11-06',150,8)];
 assert.equal(review(reps,id,now).status,'rep-increase');
 const weights=[session('2026-11-17',160,8),session('2026-11-12',155,9),session('2026-11-06',150,8)];
 assert.equal(review(weights,id,now).status,'load-increase');
});
test('ignores future, incomplete, single-set and duplicate records',()=>{
 const data=[session('2026-11-17',150,8),session('2026-11-17',150,8),
  session('2026-11-14',150,8,false),{created:'2026-11-13T12:00:00Z',sets:[{exerciseId:id,weight:150,reps:8}]},session('2099-01-01',150,8)];
 const before=JSON.stringify(data);
 const r=review(data,id,now);
 assert.equal(r.status,'insufficient');assert.equal(r.sessions,1);assert.equal(JSON.stringify(data),before);
});
test('unknown exercises and missing dates fail closed',()=>assert.equal(review([session('2026-11-17',150,8)],'unknown',now).status,'insufficient'));
