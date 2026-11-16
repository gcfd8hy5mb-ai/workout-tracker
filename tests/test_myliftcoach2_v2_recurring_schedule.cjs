const test=require('node:test'),assert=require('node:assert/strict');
const mod=require('../myliftcoach2/v2-recurring-schedule.js'),legacy=require('../myliftcoach2/original-custom-schedule.js');
const allowed=['press','row','squat'];
const workouts=[{id:101,name:'Custom Chest',exercises:['press','row']},{id:102,name:'Custom Legs',exercises:['squat']}];
const once={name:'Custom Chest',exercises:['press','row']},repeat={name:'Custom Legs',exercises:['squat'],start:'2026-11-13',end:'2027-02-05',weeks:12};
const original=legacy.normalize(workouts,{customSchedule:{'2026-11-20':once},customRecurringSchedule:[repeat]},allowed);
const weekly={plans:[{id:'upper-a',title:'Default',ids:['press']}],assigned:['upper-a',null,null,null,null,null,null]};
function args(){return {original,weekly,validExerciseIds:allowed}}
test('migrates all future recurring dates and exact one-time exceptions instead of one week',()=>{
 const m=mod.migrate(args());
 assert.equal(m.summary.workouts,2);assert.equal(m.summary.recurring,1);assert.equal(m.summary.oneTime,1);
 assert.equal(m.document.recurring[0].start,'2026-11-13');assert.equal(m.document.recurring[0].end,'2027-02-05');
 assert.equal(m.document.recurring[0].weeks,12);assert.equal(m.readyForCloudWrite,false);
 assert.equal(mod.resolve(m.document,'2026-11-20').plan.title,'Custom Chest');
 assert.equal(mod.resolve(m.document,'2026-11-27').plan.title,'Custom Legs');
 assert.equal(mod.resolve(m.document,'2027-02-12').plan,null);
});
test('one-time wins over overlapping latest repeat, and earlier rules are retained',()=>{
 const t=legacy.normalize(workouts,{customSchedule:{'2026-11-20':once},customRecurringSchedule:[
 {...repeat,start:'2026-11-06',end:null},{...repeat,start:'2026-11-13',end:'2027-02-05'}
 ]},allowed);
 const d=mod.migrate({...args(),original:t}).document;
 assert.equal(d.recurring.length,2);assert.equal(mod.resolve(d,'2026-11-20').source,'one-time');
 assert.equal(mod.resolve(d,'2027-02-12').source,'recurring');
});
test('edits to imported plan carry through to later recurring assignments by stable id',()=>{
 const doc=mod.migrate(args()).document;
 const id=doc.recurring[0].workoutId;
 doc.plans.find(p=>p.id===id).title='Revised Leg Day';
 doc.plans.find(p=>p.id===id).ids=['squat','row'];
 assert.equal(mod.resolve(doc,'2026-12-04').plan.title,'Revised Leg Day');
 assert.deepEqual(mod.resolve(doc,'2026-12-04').plan.ids,['squat','row']);
});
test('original inputs are not changed and JSON round trip preserves recurrence',()=>{
 const before=JSON.stringify({p:original.plans,r:original.recurring,o:original.once,w:weekly});
 const doc=mod.migrate(args()).document;
 const restored=JSON.parse(JSON.stringify(doc));
 assert.equal(mod.resolve(restored,'2026-12-11').plan.title,'Custom Legs');
 assert.equal(JSON.stringify({p:original.plans,r:original.recurring,o:original.once,w:weekly}),before);
});
test('unmatched existing scheduled workout fails closed',()=>{
 const t=legacy.normalize(workouts,{customSchedule:{'2026-11-20':{name:'Missing',exercises:['press']}}},allowed);
 assert.throws(()=>mod.migrate({...args(),original:t}),/no longer matches/);
});
test('bad dates, backwards end, missing exercise and duplicate imported id rejected',()=>{
 const backward=legacy.normalize(workouts,{customRecurringSchedule:[{...repeat,end:'2026-11-01'}]},allowed);
 assert.throws(()=>mod.migrate({...args(),original:backward}),/before start/);
 const impossible=legacy.normalize(workouts,{customSchedule:{'2026-02-30':once}},allowed);
 assert.throws(()=>mod.migrate({...args(),original:impossible}),/Invalid/);
 assert.throws(()=>mod.migrate({...args(),validExerciseIds:['press']}),/Unavailable/);
 assert.throws(()=>mod.migrate({...args(),weekly:{plans:[{id:'custom-import-original-custom-0',title:'Edited',ids:['press']}],assigned:[null,null,null,null,null,null,null]}}),/already exists/);
});
test('fallback weekly assignment works when original has no rule',()=>{
 const doc=mod.migrate(args()).document;
 assert.equal(mod.resolve(doc,'2026-11-16').plan.title,'Default');
 assert.equal(mod.resolve(doc,'2026-11-17').plan,null);
});
