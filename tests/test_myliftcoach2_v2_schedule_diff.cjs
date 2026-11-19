const test=require('node:test'),assert=require('node:assert/strict');
const {compare}=require('../myliftcoach2/v2-schedule-diff.js');
const local={version:1,plans:[{id:'custom-a',title:'Custom A',ids:['leg-press']}],
 assigned:['custom-a',null,null,null,null,null,null],
 overrides:{'2026-11-20':'custom-a','2026-11-21':null},
 recurring:[{start:'2026-11-20',end:null,workoutId:'custom-a'}]};
test('identical cloud and local documents verify without issuing any writes',()=>{
 const before=JSON.stringify(local);
 const result=compare({local,cloud:JSON.parse(before)});
 assert.equal(result.state,'same');assert.equal(result.blocked,false);
 assert.equal(JSON.stringify(local),before);
});
test('JSON object key order does not invent a conflict',()=>{
 const cloud={recurring:local.recurring,overrides:local.overrides,assigned:local.assigned,
 plans:[{ids:['leg-press'],title:'Custom A',id:'custom-a'}],version:1};
 assert.equal(compare({local,cloud}).state,'same');
});
test('rest-day edits and repeating rules are counted separately',()=>{
 const cloud={...local,assigned:[null,...local.assigned.slice(1)],overrides:{'2026-11-20':null},
 recurring:[]};
 const r=compare({local,cloud});
 assert.equal(r.state,'different');assert.equal(r.changedDays,1);
 assert.equal(r.changedOverrides,2);assert.equal(r.recurringChanged,true);
});
test('same workout ID with changed exercises is a conflict',()=>{
 const cloud={...local,plans:[{...local.plans[0],ids:['seated-row']}]};
 const r=compare({local,cloud});assert.equal(r.changedPlans,1);assert.equal(r.blocked,true);
});
test('unknown, missing, and duplicated plan IDs fail validation',()=>{
 assert.throws(()=>compare({local:null,cloud:local}));
 assert.throws(()=>compare({local,cloud:{...local,assigned:['missing',null,null,null,null,null,null]}}));
 assert.throws(()=>compare({local,cloud:{...local,plans:[local.plans[0],local.plans[0]]}}));
});
test('missing cloud schedule is distinct from identical empty schedule',()=>{
 const r=compare({local,cloud:null});
 assert.equal(r.state,'cloud-empty');assert.equal(r.blocked,true);assert.equal(r.cloudPlans,0);
});
