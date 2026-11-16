const test=require('node:test'),assert=require('node:assert/strict');
const weekly=require('../myliftcoach2/weekly-schedule.js'),original=require('../myliftcoach2/original-custom-schedule.js'),copy=require('../myliftcoach2/custom-schedule-copy.js');
const presets=[{id:'upper-a',title:'Preset Upper',ids:['press']},{id:'lower-a',title:'Preset Lower',ids:['squat']}];
const allowed=['press','squat','row'];
const w=[{id:41,name:'My Monday',exercises:['row','press']},{id:42,name:'My Friday',exercises:['squat']}];
const legacy=original.normalize(w,{customSchedule:{'2026-11-16':{name:'My Monday',exercises:['row','press']}},customRecurringSchedule:[{name:'My Friday',exercises:['squat'],start:'2026-11-06',end:'2026-12-18'}]},allowed);
function args(){return {original:legacy,existing:weekly.normalize(null,presets,allowed),referenceDate:'2026-11-16',validExerciseIds:allowed}}
test('original Monday assignment wins over preset and opens copied exact exercises',()=>{
 const result=copy.prepare(args());
 const plan=weekly.resolve(result.draft,new Date('2026-11-16T12:00:00Z')).plan;
 assert.equal(plan.title,'My Monday');assert.deepEqual(plan.ids,['row','press']);
 assert.equal(result.readyForCloudWrite,false);
});
test('weekly repeat applies only to matching Friday in current week',()=>{
 const result=copy.prepare(args());
 assert.equal(result.dates[4],'2026-11-20');
 assert.equal(weekly.resolve(result.draft,new Date('2026-11-20T12:00:00Z')).plan.title,'My Friday');
 assert.equal(result.currentWeekOnly,true);
});
test('never mutates source original data or existing preview',()=>{
 const input=args(),before=JSON.stringify({p:input.original.plans,a:input.existing});
 copy.prepare(input);
 assert.equal(JSON.stringify({p:input.original.plans,a:input.existing}),before);
});
test('refuses silent overwrite of an already-edited imported draft',()=>{
 const first=copy.prepare(args());
 assert.throws(()=>copy.prepare({...args(),existing:first.draft}),/already exists/);
});
test('refuses unmatched original assignment rather than showing preset',()=>{
 const bad=original.normalize(w,{customSchedule:{'2026-11-16':{name:'Missing',exercises:['press']}}},allowed);
 assert.throws(()=>copy.prepare({...args(),original:bad}),/cannot be matched/);
});
test('preserves unscheduled preset/rest assignments on copy',()=>{
 const first=copy.prepare(args());
 assert.equal(first.draft.assigned[1],'lower-a');assert.equal(first.draft.assigned[2],null);
});
