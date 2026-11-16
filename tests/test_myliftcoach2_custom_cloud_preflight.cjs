const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../persistence/storage-model.js'),api=require('../myliftcoach2/custom-cloud-preflight.js');
const owner='test-owner',dates='2026-11-16';
const initial={customWorkoutsV5:JSON.stringify([{id:10,name:'Old Original',exercises:['leg-press']}]),
 dailyTrackingV1:JSON.stringify({water:[{ml:200}],weight:[{lb:205}],food:[{kcal:450}],waterGoal:2500,customSchedule:{},customRecurringSchedule:[{name:'Old Original',exercises:['leg-press'],start:'2026-11-09',end:null}]})};
const edited={plans:[{id:'custom-editor-1',title:'My Monday',ids:['leg-press','leg-curl']}],assigned:['custom-editor-1',null,null,null,null,null,null]};
const opts=()=>({owner,verifiedOwner:owner,baseline:initial,latest:initial,draft:edited,weekStart:dates,validExerciseIds:['leg-press','leg-curl'],selectedDays:[0],token:'saveoperation1'});
test('new custom workout save plan retains all nutrition, hydration and original recurring rules',()=>{
 const p=api.build(opts()),tracking=JSON.parse(p.snapshot.dailyTrackingV1);
 assert.deepEqual(tracking.water,[{ml:200}]);assert.deepEqual(tracking.food,[{kcal:450}]);
 assert.deepEqual(tracking.weight,[{lb:205}]);assert.equal(tracking.customRecurringSchedule[0].start,'2026-11-09');
 assert.equal(tracking.customSchedule['2026-11-16'].name,'My Monday');
 assert.equal(JSON.parse(p.snapshot.customWorkoutsV5)[0].id,10);
 assert.equal(p.readyForProduction,false);
});
test('stale tracking data and account mismatch stop preflight',()=>{
 assert.throws(()=>api.build({...opts(),latest:{...initial,dailyTrackingV1:JSON.stringify({water:[]})}}),/changed on another device/);
 assert.throws(()=>api.build({...opts(),verifiedOwner:'someone-else'}),/owner/);
});
test('existing original date is not silently overwritten',()=>{
 const old={...initial,dailyTrackingV1:JSON.stringify({...JSON.parse(initial.dailyTrackingV1),customSchedule:{'2026-11-16':{name:'Old Original',exercises:['leg-press']}}})};
 assert.throws(()=>api.build({...opts(),baseline:old,latest:old}),/already scheduled/);
});
test('rest days and presets are rejected rather than erasing original schedule',()=>{
 assert.throws(()=>api.build({...opts(),draft:{...edited,assigned:[null,null,null,null,null,null,null]}}),/Rest day/);
 assert.throws(()=>api.build({...opts(),draft:{...edited,assigned:['upper-a',null,null,null,null,null,null]}}),/Only explicit custom/);
});
test('complete normalized legacy cloud rows pass roundtrip preflight without writing',async()=>{
 const originalRows=(await model.normalize(initial)).map(r=>({...r,revision:1,user_id:owner}));
 const prepared=api.build(opts()),result=await api.validateRows({prepared,originalRows});
 assert.equal(result.readyForProduction,false);assert.ok(result.addedRows>0);assert.ok(result.writes>0);
});
test('partial, altered or stale cloud rows fail closed',async()=>{
 const rows=(await model.normalize(initial)).map(r=>({...r,revision:1,user_id:owner}));
 const prepared=api.build(opts());
 await assert.rejects(api.validateRows({prepared,originalRows:rows.slice(1)}),/Incomplete|snapshot|drift/);
 await assert.rejects(api.validateRows({prepared,originalRows:rows.map((r,i)=>i===1?{...r,position:99}:r)}),/drift|corruption/);
});
