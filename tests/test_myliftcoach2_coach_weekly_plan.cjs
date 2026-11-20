const test=require('node:test'),assert=require('node:assert/strict');
const {summarize}=require('../myliftcoach2/coach-weekly-plan.js');
const now=Date.parse('2026-11-19T12:00:00Z');
const record=(id,created)=>({id,created,sets:[{exerciseId:'leg-press',weight:100,reps:10}]});
test('weekly availability is driven by actual check-in and recorded days',()=>{
 const rows=[record('a','2026-11-16T12:00:00Z'),record('b','2026-11-18T12:00:00Z')];
 const r=summarize({sessions:rows,checkin:{days:4,load:'normal'},now});
 assert.equal(r.workouts,2);assert.equal(r.trainingDays,2);assert.equal(r.remaining,2);
});
test('no check-in never invents a training-day goal',()=>{
 const r=summarize({sessions:[],now});assert.equal(r.daysAvailable,null);assert.equal(r.remaining,null);
});
test('duplicate and future/incomplete workouts are excluded',()=>{
 const a=record('a','2026-11-18T12:00:00Z');
 const r=summarize({sessions:[a,a,record('future','2099-01-01T12:00:00Z'),{...record('c','2026-11-17T12:00:00Z'),sets:[]}],now});
 assert.equal(r.workouts,1);assert.equal(r.sets,1);
});
test('low-recovery context does not rewrite schedule or force missed sessions',()=>{
 const p={id:'custom',ids:['leg-press']},before=JSON.stringify(p);
 const r=summarize({sessions:[],checkin:{days:5,load:'conservative'},now});
 assert.equal(r.remaining,5);assert.match(r.note,/caution/);assert.equal(r.noAutomaticScheduleChanges,true);
 assert.equal(JSON.stringify(p),before);
});
